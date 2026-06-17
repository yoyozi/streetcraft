'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCourierRates, createShipment, CourierAddress, CourierParcel, CourierRate } from '@/lib/courier/the-courier-guy';
import { getMyCart } from '@/lib/actions/cart.actions';
import { getUserById } from '@/lib/actions/user.actions';
import type { ShippingAddress } from '@/lib/validations/order';

/**
 * Store collection (origin) address — where parcels are collected from.
 * Configure via env; can later move into Site Settings.
 */
function getCollectionAddress(): CourierAddress {
  return {
    type: 'business',
    company: process.env.COURIERGUY_COLLECTION_COMPANY || 'StreetCraft',
    streetAddress: process.env.COURIERGUY_COLLECTION_STREET || '',
    localArea: process.env.COURIERGUY_COLLECTION_SUBURB || '',
    city: process.env.COURIERGUY_COLLECTION_CITY || '',
    zone: process.env.COURIERGUY_COLLECTION_PROVINCE || '',
    country: process.env.COURIERGUY_COLLECTION_COUNTRY || 'ZA',
    code: process.env.COURIERGUY_COLLECTION_POSTCODE || '',
  };
}

function shippingToCourierAddress(a: ShippingAddress): CourierAddress {
  return {
    type: 'residential',
    streetAddress: a.streetAddress,
    localArea: a.suburb || '',
    city: a.city,
    zone: a.province || '',
    country: a.country?.length === 2 ? a.country : 'ZA',
    code: a.postalCode,
    phone: a.phone || '',
  };
}

/**
 * Build courier parcels from a set of cart/order items using each product's
 * stored dimensions and weight. One parcel per unit (qty) — a reasonable
 * default; can be refined to pack multiple items per parcel later.
 */
async function buildParcelsFromItems(items: { productId: string; qty: number }[]): Promise<CourierParcel[]> {
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, weight: true, height: true, width: true, depth: true },
  });
  const map = new Map(products.map((p) => [p.id, p]));

  const parcels: CourierParcel[] = [];
  for (const item of items) {
    const p = map.get(item.productId);
    if (!p) continue;
    for (let i = 0; i < item.qty; i++) {
      parcels.push({
        // Fall back to small defaults so a quote can still be produced
        lengthCm: p.depth || 10,
        widthCm: p.width || 10,
        heightCm: p.height || 10,
        weightKg: p.weight || 0.5,
      });
    }
  }
  return parcels;
}

export interface DeliveryQuoteResult {
  success: boolean;
  rates: CourierRate[];
  error?: string;
}

/**
 * Get realtime delivery rate options for a list of items going to a destination.
 * Framework entry point — call this from checkout once the buyer's address is known.
 */
export async function getDeliveryQuote(params: {
  deliveryAddress: ShippingAddress;
  items: { productId: string; qty: number }[];
  declaredValue?: number;
}): Promise<DeliveryQuoteResult> {
  try {
    if (!params.items?.length) {
      return { success: false, rates: [], error: 'No items to quote' };
    }

    const parcels = await buildParcelsFromItems(params.items);
    if (parcels.length === 0) {
      return { success: false, rates: [], error: 'No deliverable items found' };
    }

    const result = await getCourierRates({
      collectionAddress: getCollectionAddress(),
      deliveryAddress: shippingToCourierAddress(params.deliveryAddress),
      parcels,
      declaredValue: params.declaredValue,
    });

    return result;
  } catch (error) {
    console.error('getDeliveryQuote failed:', error);
    return { success: false, rates: [], error: 'Failed to get delivery quote' };
  }
}

/**
 * Convenience: get delivery quotes for the current signed-in user's cart,
 * delivered to their saved shipping address. Used on the checkout page.
 */
export async function getCartDeliveryQuotes(): Promise<DeliveryQuoteResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, rates: [], error: 'Not signed in' };

  const user = await getUserById(session.user.id);
  if (!user?.address) return { success: false, rates: [], error: 'No shipping address set' };

  const cart = await getMyCart();
  if (!cart || cart.items.length === 0) return { success: false, rates: [], error: 'Cart is empty' };

  const items = cart.items.map((i) => ({ productId: i.productId, qty: i.qty }));
  return getDeliveryQuote({
    deliveryAddress: user.address as ShippingAddress,
    items,
    declaredValue: Number(cart.itemsPrice),
  });
}

/**
 * Apply a chosen delivery rate to the current cart (updates shipping + total + service code).
 */
export async function setCartShippingRate(amount: number, serviceCode: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    const session = await auth();
    const userId = session?.user?.id as string | undefined;

    const cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionCartId },
    });
    if (!cart) return { success: false, error: 'Cart not found' };

    const shipping = Math.round(amount * 100) / 100;
    const total = Math.round((Number(cart.itemsPrice) + shipping + Number(cart.taxPrice)) * 100) / 100;

    await prisma.cart.update({
      where: { id: cart.id },
      data: { shippingPrice: shipping, shippingServiceCode: serviceCode, totalPrice: total },
    });

    revalidatePath('/place-order');
    return { success: true };
  } catch (error) {
    console.error('setCartShippingRate failed:', error);
    return { success: false, error: 'Failed to set shipping rate' };
  }
}

/**
 * Book a shipment with Shiplogic after an order is paid.
 * Stores waybill and tracking number on the order.
 * Called from updateOrderToPaid — never throws.
 */
export async function bookOrderShipment(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { select: { productId: true, qty: true } } },
    });
    if (!order) return { success: false, error: 'Order not found' };
    if (!order.shippingServiceCode) return { success: false, error: 'No service level code on order' };

    const parcels = await buildParcelsFromItems(order.orderItems);
    if (parcels.length === 0) return { success: false, error: 'No parcels to ship' };

    const deliveryAddress = order.shippingAddress as unknown as import('@/lib/validations/order').ShippingAddress;

    const result = await createShipment({
      collectionAddress: getCollectionAddress(),
      collectionContact: {
        name: process.env.COURIERGUY_CONTACT_NAME || 'StreetCraft',
        phone: process.env.COURIERGUY_CONTACT_PHONE || '',
        email: process.env.COURIERGUY_CONTACT_EMAIL || '',
      },
      deliveryAddress: {
        type: 'residential',
        streetAddress: deliveryAddress.streetAddress,
        localArea: deliveryAddress.suburb || '',
        city: deliveryAddress.city,
        zone: deliveryAddress.province || '',
        country: deliveryAddress.country?.length === 2 ? deliveryAddress.country : 'ZA',
        code: deliveryAddress.postalCode,
        phone: deliveryAddress.phone || '',
      },
      deliveryContact: {
        name: (deliveryAddress as any).fullName || 'Customer',
        phone: deliveryAddress.phone || '',
      },
      parcels,
      serviceLevelCode: order.shippingServiceCode,
      declaredValue: Number(order.itemsPrice),
      customerReference: orderId.substring(0, 8).toUpperCase(),
    });

    if (!result.success) {
      console.error('bookOrderShipment failed:', result.error);
      return { success: false, error: result.error };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        waybillNumber: result.waybillNumber ?? null,
        trackingNumber: result.trackingNumber ?? null,
      },
    });

    console.log(`[Courier] Shipment booked for order ${orderId} — waybill: ${result.waybillNumber} | tracking: ${result.trackingNumber}`);
    return { success: true };
  } catch (error) {
    console.error('bookOrderShipment failed:', error);
    return { success: false, error: 'Failed to book shipment' };
  }
}
