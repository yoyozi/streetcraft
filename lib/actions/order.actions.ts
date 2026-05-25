'use server'

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { formatError, round2 } from "../utils";
import { auth } from "@/auth";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.actions";
import { insertOrderSchema } from "@/lib/validations/order";
import { prisma } from '@/lib/prisma';
import { CartItem, Order as OrderType, ShippingAddress, PaymentResult } from "@/types";
import { paypal } from "../paypal";
import { initializePaystackTransaction, verifyPaystackTransaction } from "../paystack";
import { revalidatePath } from 'next/cache';  
import { PAGE_SIZE } from "../constants";
import { sendPurchaseReceipt } from "@/email/send-purchase-receipts";
import { sendEftPaymentInstructions } from "@/email/send-eft-payment-instructions";
import { createYocoCheckout, verifyYocoPayment } from "../yoco";

/**
 * Fetches the current USD/ZAR exchange rate from ExchangeRate-API
 * @returns The exchange rate (how many ZAR per 1 USD)
 * Falls back to 17.3 if API call fails
 */
async function getRandDolarRate(): Promise<number> {
  try {
    // Using ExchangeRate-API (free tier: 1,500 requests/month)
    // Alternative: https://api.exchangerate-api.com/v4/latest/USD
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      // console.error('[EXCHANGE_RATE] API request failed:', response.status);
      return 17.3; // Fallback rate
    }

    const data = await response.json();
    const zarRate = data.rates?.ZAR;

    if (!zarRate || typeof zarRate !== 'number') {
      // console.error('[EXCHANGE_RATE] Invalid ZAR rate in response:', data);
      return 17.3; // Fallback rate
    }

    // console.log('[EXCHANGE_RATE] Current USD to ZAR rate:', zarRate);
    return zarRate;

  } catch (error) {
    // console.error('[EXCHANGE_RATE] Error fetching exchange rate:', error);
    return 17.3; // Fallback rate
  }
}

// Creates the order and the order items (items in the order)
export async function createOrder() {
    try {
        const session = await auth();
        if(!session) throw new Error("User not Authenticated");
            
        const userId = session?.user?.id;
        if(!userId) throw new Error("User id not found");

        const user = await getUserById(userId);
        if(!user) throw new Error("User not found");

        const cart = await getMyCart();

        if(!cart || cart.items.length === 0) {
            return {success: false, message: "Your cart is empty", redirectTo: '/cart'};
        }

        if(!user.address) {
            return {success: false, message: "No shipping address", redirectTo: '/shipping-address'};
        }

        if(!user.paymentMethod) {
            return {success: false, message: "No payment method", redirectTo: '/payment-method'};
        }

        // create the order object
        const order = insertOrderSchema.parse({
          userId: user.id,
          shippingAddress: user.address,
          paymentMethod: user.paymentMethod,
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,
        });

        // Use Prisma transaction for atomic order creation
        const insertedOrder = await prisma.$transaction(async (tx) => {
            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    userId: order.userId,
                    shippingAddress: order.shippingAddress as any,
                    paymentMethod: order.paymentMethod,
                    itemsPrice: Number(order.itemsPrice),
                    shippingPrice: Number(order.shippingPrice),
                    taxPrice: Number(order.taxPrice),
                    totalPrice: Number(order.totalPrice),
                },
            });

            // Create the order items from the cart items
            for (const item of cart.items as CartItem[]) {
                await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        productId: item.productId,
                        name: item.name,
                        slug: item.slug,
                        image: item.image,
                        price: Number(item.price),
                        qty: item.qty,
                    },
                });
            }

            // Clear the cart items and reset prices
            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            await tx.cart.update({
                where: { id: cart.id },
                data: {
                    totalPrice: 0,
                    taxPrice: 0,
                    shippingPrice: 0,
                    itemsPrice: 0,
                },
            });

            return newOrder;
        });

        // Send EFT payment instructions email immediately after order creation
        if(user.paymentMethod === 'EFT') {
          try {
            const fullOrder = await getOrderById(insertedOrder.id);
            
            if (fullOrder) {
              await sendEftPaymentInstructions({ order: fullOrder });
              
              await prisma.order.update({
                where: { id: insertedOrder.id },
                data: { eftEmailSent: true, eftEmailSentAt: new Date() },
              });
            }
          } catch {
            // Don't throw - we don't want email failures to break the order creation
          }
        }

        return {success: true, message: "Order created", redirectTo: `/order/${insertedOrder.id}`};

    } catch (error) {
      if (isRedirectError(error)) throw error;
      return { success: false, message: "An error occurred while creating the order" };
    }
}



// Get the order by ID
export async function getOrderById(orderId: string): Promise<OrderType | null> {
    const data = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            orderItems: true,
            user: { select: { name: true, email: true } },
        },
    });

    if (!data) return null;

    const normalized: OrderType = {
        id: data.id,
        createdAt: data.createdAt,
        isPaid: data.isPaid,
        paidAt: data.paidAt,
        isDelivered: data.isDelivered,
        deliveredAt: data.deliveredAt,
        user: { name: data.user?.name ?? "", email: data.user?.email ?? "" },
        orderItems: data.orderItems.map((oi) => ({
            productId: oi.productId,
            slug: oi.slug,
            image: oi.image,
            name: oi.name,
            price: oi.price.toString(),
            qty: oi.qty,
        })),
        userId: data.userId,
        itemsPrice: data.itemsPrice.toString(),
        shippingPrice: data.shippingPrice.toString(),
        taxPrice: data.taxPrice.toString(),
        totalPrice: data.totalPrice.toString(),
        totalPriceUsd: data.totalPriceUsd?.toString(),
        exchangeRate: data.exchangeRate?.toString(),
        eftEmailSent: data.eftEmailSent,
        eftEmailSentAt: data.eftEmailSentAt,
        paymentMethod: data.paymentMethod,
        shippingAddress: data.shippingAddress as unknown as ShippingAddress,
        paymentResult: data.paymentResult as unknown as PaymentResult,
    };

    return JSON.parse(JSON.stringify(normalized));
}



// Create a new Paypal order
// Narrow return type so data is guaranteed when success is true
type CreatePayPalOrderResponse =
  | { success: true; message: string; data: string }
  | { success: false; message: string };

export async function createPayPalOrder(orderId: string): Promise<CreatePayPalOrderResponse> {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error('Order not found');

      // Get the R $ rate
      const rate = await getRandDolarRate();

      // Get amount in dollars
      const totalPriceInUsd = round2(Number(order.totalPrice) / rate);

      // Create a paypal order
      const paypalOrder = await paypal.createOrder(totalPriceInUsd);

      // Update the order with the paypal order id, USD amount, and exchange rate
      await prisma.order.update({
        where: { id: orderId },
        data: {
          totalPriceUsd: totalPriceInUsd,
          exchangeRate: rate,
          paymentResult: {
            id: paypalOrder.id,
            email_address: '',
            status: '',
            pricePaid: '0',
            currency: 'USD',
          },
        },
      });

      return {
        success: true,
        message: 'PayPal order created successfully',
        data: paypalOrder.id,
      };
    } catch (err) {
      return { success: false, message: formatError(err).message };
    }
}



// Approve Paypal Order
export async function approvePayPalOrder(
    orderId: string,
    data: { orderID: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error('Order not found')
  
      const captureData = await paypal.capturePayment(data.orderID)
      if (
        !captureData ||
        captureData.id !== (order.paymentResult as any)?.id ||
        captureData.status !== 'COMPLETED'
      )
    throw new Error('Error in paypal payment')
  
    await updateOrderToPaid({
        orderId,
        paymentResult: {
        id: captureData.id,
        status: captureData.status,
        email_address: captureData.payer.email_address,
        pricePaid: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
        currency: 'USD',
        },
    });
  
    revalidatePath(`/order/${orderId}`)

    return {
      success: true,
      message: 'Your order has been successfully paid by PayPal',
    }
  } catch (err) {
    return { success: false, message: formatError(err).message };
  }
}


// ============================================
// PAYSTACK PAYMENT FUNCTIONS
// ============================================

type CreatePaystackOrderResponse =
  | { success: true; message: string; authorization_url: string }
  | { success: false; message: string };

/**
 * Initialize Paystack payment for an order
 */
export async function createPaystackOrder(orderId: string): Promise<CreatePaystackOrderResponse> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } } },
    });

    if (!order) return { success: false, message: 'Order not found' };
    if (order.isPaid) return { success: false, message: 'Order is already paid' };

    const uniqueReference = `${orderId}-${Date.now()}`;
    
    const paystackResponse = await initializePaystackTransaction({
      email: order.user?.email || '',
      amount: Number(order.totalPrice),
      reference: uniqueReference,
      orderId: orderId,
    });

    if (paystackResponse.success) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentResult: {
            id: uniqueReference,
            status: 'pending',
            email_address: order.user?.email || '',
          },
        },
      });

      return {
        success: true,
        message: 'Paystack payment initialized',
        authorization_url: paystackResponse.authorization_url,
      };
    }

    return { success: false, message: 'Failed to initialize Paystack payment' };
  } catch (err) {
    return { success: false, message: formatError(err).message };
  }
}

/**
 * Verify Paystack payment and update order
 */
export async function verifyPaystackPayment(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) return { success: false, message: 'Order not found' };
    if (order.isPaid) return { success: true, message: 'Payment already verified' };

    const paymentResult = order.paymentResult as { status?: string; id?: string } | null;
    const paystackReference = (paymentResult?.status === 'pending' 
      ? paymentResult.id 
      : orderId) || orderId;

    const verificationResponse = await verifyPaystackTransaction(paystackReference);

    if (!verificationResponse.success || !verificationResponse.data) {
      return { success: false, message: 'Payment verification failed' };
    }

    const { data } = verificationResponse;

    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: data.id,
        status: data.status,
        email_address: data.customer.email,
        pricePaid: data.amount.toString(),
        currency: 'ZAR',
      },
    });

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: 'Your order has been successfully paid via Paystack',
    };
  } catch (err) {
    return { success: false, message: formatError(err).message };
  }
}


// ============================================
// YOCO PAYMENT FUNCTIONS
// ============================================

type CreateYocoOrderResponse =
  | { success: true; message: string; redirectUrl: string }
  | { success: false; message: string };

/**
 * Initialize Yoco payment for an order
 */
export async function createYocoOrder(orderId: string): Promise<CreateYocoOrderResponse> {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) return { success: false, message: 'Order not found' };
    if (order.isPaid) return { success: false, message: 'Order is already paid' };

    const yocoResponse = await createYocoCheckout({
      amount: Number(order.totalPrice),
      metadata: {
        orderId: orderId,
        orderNumber: order.id,
      },
    });

    if (yocoResponse.success) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentResult: {
            id: yocoResponse.checkoutId,
            status: 'pending',
            email_address: '',
            pricePaid: '0',
            currency: 'ZAR',
          },
        },
      });

      return {
        success: true,
        message: 'Yoco checkout created',
        redirectUrl: yocoResponse.redirectUrl,
      };
    }

    return { success: false, message: 'Failed to create Yoco checkout' };
  } catch (err) {
    return { success: false, message: formatError(err).message };
  }
}

/**
 * Verify Yoco payment and update order
 */
export async function verifyYocoOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) return { success: false, message: 'Order not found' };
    if (order.isPaid) return { success: true, message: 'Order is already paid' };

    const paymentResult = order.paymentResult as { id: string } | null;
    const checkoutId = paymentResult?.id;

    if (!checkoutId) {
      return { success: false, message: 'No checkout ID found. Please try creating the payment again.' };
    }

    const verificationResponse = await verifyYocoPayment(checkoutId);

    if (!verificationResponse.success || !verificationResponse.data) {
      return { success: false, message: verificationResponse.message || 'Payment verification failed' };
    }

    const { data } = verificationResponse;

    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: data.id,
        status: data.status,
        email_address: '',
        pricePaid: data.amount.toString(),
        currency: 'ZAR',
      },
    });

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: 'Your order has been successfully paid via Yoco',
    };
  } catch (err) {
    return { success: false, message: formatError(err).message };
  }
}


// Update Order to Paid in Database
export async function updateOrderToPaid({
  orderId,
  paymentResult,
}: {
  orderId: string;
  paymentResult: PaymentResult;
}): Promise<void> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
  
    if (!order) throw new Error('Order not found');
  
    // If order is already paid, just return (webhook may have already processed it)
    if (order.isPaid) return;
  
    // Set the order to paid
    await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentResult: paymentResult as any,
      },
    });
  
    // Get the updated order with items and user for email
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
        user: { select: { name: true, email: true } },
      },
    });
  
    if (!updatedOrder) throw new Error('Order not found');

    // Send purchase receipt email
    try {
      await sendPurchaseReceipt({ 
        order: {
          ...updatedOrder,
          itemsPrice: updatedOrder.itemsPrice.toString(),
          shippingPrice: updatedOrder.shippingPrice.toString(),
          taxPrice: updatedOrder.taxPrice.toString(),
          totalPrice: updatedOrder.totalPrice.toString(),
          totalPriceUsd: updatedOrder.totalPriceUsd?.toString(),
          exchangeRate: updatedOrder.exchangeRate?.toString(),
          orderItems: updatedOrder.orderItems.map((oi) => ({
            productId: oi.productId,
            slug: oi.slug,
            image: oi.image,
            name: oi.name,
            price: oi.price.toString(),
            qty: oi.qty,
          })),
          shippingAddress: updatedOrder.shippingAddress as unknown as ShippingAddress,
          paymentResult: updatedOrder.paymentResult as unknown as PaymentResult,
        },
      });
    } catch {
      // Don't throw - we don't want email failures to break the payment process
    }
};



// Get the users orders
export async function getMyOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const session = await auth();
  if (!session) throw new Error('User is not authenticated');

  const [data, dataCount] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id! },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.order.count({ where: { userId: session.user.id! } })
  ]);

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
};

// SALES DATA for for the admin/overview page
type SalesDataType = {
  month: string;
  totalSales: number;
}[]



// Get sales data and order summary for the overview page for the admin section
export async function getOrderSummary() {
    // get the counts for the 4 resources
    const [ordersCount, usersCount, productsCount, productsNeedingReview] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: 'user' } }),
      prisma.product.count(),
      prisma.product.count({ where: { priceNeedsReview: true } })
    ]);

    // calc total sales using Prisma aggregate
    const totalSalesResult = await prisma.order.aggregate({
      _sum: { totalPrice: true },
    });
    const totalSalesAmount = totalSalesResult._sum.totalPrice || 0;

    // get all orders for monthly grouping
    const allOrders = await prisma.order.findMany({
      select: { createdAt: true, totalPrice: true },
    });

    // Group by month manually (Prisma doesn't have dateToString like Mongo)
    const monthlyMap = new Map<string, number>();
    allOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const month = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(o.totalPrice));
    });

    const salesData: SalesDataType = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, totalSales]) => ({ month, totalSales }));

    // get latest sales
    const latestOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, createdAt: true, totalPrice: true, userId: true, user: { select: { name: true } } },
    });

    return {
      ordersCount,
      productsCount,
      productsNeedingReview,
      usersCount,
      totalSales: totalSalesAmount,
      latestOrders,
      salesData,
    };
};



// Get All Orders (Admin)
export async function getAllOrders({
    limit = PAGE_SIZE,
    page,
    query,
  }: {
    limit?: number;
    page: number;
    query?: string 
  }) {
    // Build filter: search by user name
    const where = query && query !== 'all'
      ? { user: { name: { contains: query, mode: 'insensitive' as const } } }
      : {};

    const [data, dataCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: { user: { select: { name: true } } },
      }),
      prisma.order.count({ where })
    ]);

    return {
      data,
      totalPages: Math.ceil(dataCount / limit),
    };
  };



// Delete an order as an admin
export async function deleteOrder(id: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('Order not found');

    // Delete order items first, then the order
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });

    revalidatePath('/admin/orders');

    return {
      success: true,
      message: 'Order deleted successfully',
    };

  } catch (error) {
    return { success: false, message: formatError(error).message };
  }
};



// Update Order to Paid by Cash on Delivery
export async function updateOrderToPaidByCOD(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } } },
    });
    if (!order) throw new Error('Order not found');

    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: `cod_${orderId}`,
        status: 'CASH_ON_DELIVERY',
        email_address: (order.paymentResult as any)?.email_address ?? order.user?.email ?? '',
        pricePaid: order.totalPrice.toString(),
        currency: 'ZAR',
      },
    });
    revalidatePath(`/order/${orderId}`);
    return { success: true, message: 'Order paid successfully' };
  } catch (err) {
    return { success: false, message: formatError(err).message };
  }
}

// Update Order To Delivered
export async function deliverOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) throw new Error('Order not found');
    if (!order.isPaid) throw new Error('Order is not paid');

    await prisma.order.update({
      where: { id: orderId },
      data: { isDelivered: true, deliveredAt: new Date() },
    });

    revalidatePath(`/order/${orderId}`);

    return { success: true, message: 'Order delivered successfully' };
  } catch (err) {
    return { success: false, message: formatError(err).message };
  }
}