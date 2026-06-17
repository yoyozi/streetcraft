/**
 * The Courier Guy (Shiplogic) API client — delivery rate quotes and shipment booking.
 *
 * The Courier Guy exposes the Shiplogic API. This module wraps:
 *  - POST /v2/rates       — realtime delivery price for a cart/order
 *  - POST /v2/shipments   — book a shipment after payment (generates waybill + tracking)
 *
 * ⚠️ VERIFY AGAINST YOUR LIVE DOCS / KEY (https://thecourierguy.co.za/api-docs/):
 *  - Base URL and endpoint path
 *  - Auth header (assumed: `Authorization: Bearer <API_KEY>`)
 *  - Exact request/response field names (based on the Shiplogic schema)
 * The shapes below match the documented Shiplogic API; adjust if your account differs.
 *
 * Config (env):
 *  - COURIERGUY_API_URL   (default https://api.shiplogic.com)
 *  - COURIERGUY_API_KEY   (required)
 */

const COURIER_API_URL = process.env.COURIERGUY_API_URL || 'https://api.shiplogic.com';
const COURIER_API_KEY = process.env.COURIERGUY_API_KEY || '';

export interface CourierAddress {
  /** e.g. "business" | "residential" */
  type?: string;
  company?: string;
  streetAddress: string;
  /** suburb / local area */
  localArea?: string;
  city: string;
  /** province / zone */
  zone?: string;
  country: string; // ISO-2, e.g. "ZA"
  /** postal code */
  code: string;
  phone?: string;
}

export interface CourierParcel {
  /** cm */
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  /** kg */
  weightKg: number;
}

export interface CourierRateRequest {
  collectionAddress: CourierAddress;
  deliveryAddress: CourierAddress;
  parcels: CourierParcel[];
  declaredValue?: number;
}

/** Normalised rate option returned to the rest of the app. */
export interface CourierRate {
  /** service level code, e.g. "ECO" / "OVN" */
  code: string;
  name: string;
  /** human-readable estimate, e.g. "Delivered within 2-3 days" */
  description?: string;
  /** delivery charge in ZAR (incl VAT) */
  amount: number;
  deliveryDateFrom?: string | null;
  deliveryDateTo?: string | null;
  raw?: unknown;
}

export interface CourierRatesResult {
  success: boolean;
  rates: CourierRate[];
  error?: string;
}

function toShiplogicAddress(a: CourierAddress) {
  return {
    type: a.type || 'business',
    company: a.company || '',
    street_address: a.streetAddress,
    local_area: a.localArea || '',
    city: a.city,
    zone: a.zone || '',
    country: a.country || 'ZA',
    code: a.code,
    phone: a.phone || '',
  };
}

function toShiplogicParcel(p: CourierParcel) {
  return {
    submitted_length_cm: p.lengthCm,
    submitted_width_cm: p.widthCm,
    submitted_height_cm: p.heightCm,
    submitted_weight_kg: p.weightKg,
  };
}

/**
 * Get delivery rate options for a shipment. Returns a normalised list of rates
 * (cheapest first). Never throws — returns { success:false, error } on failure
 * so checkout can fall back to a default/flat rate.
 */
export async function getCourierRates(req: CourierRateRequest): Promise<CourierRatesResult> {
  if (!COURIER_API_KEY) {
    return { success: false, rates: [], error: 'COURIERGUY_API_KEY is not configured' };
  }

  try {
    const body = {
      collection_address: toShiplogicAddress(req.collectionAddress),
      delivery_address: toShiplogicAddress(req.deliveryAddress),
      parcels: req.parcels.map(toShiplogicParcel),
      declared_value: req.declaredValue ?? 0,
    };

    const res = await fetch(`${COURIER_API_URL}/v2/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${COURIER_API_KEY}`,
      },
      body: JSON.stringify(body),
      // Avoid Next caching a live quote
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { success: false, rates: [], error: `Courier API ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = await res.json();

    // Shiplogic returns { rates: [{ rate, service_level: { code, name }, ... }] }
    const rawRates: any[] = Array.isArray(data?.rates) ? data.rates : [];
    const rates: CourierRate[] = rawRates
      .map((r) => ({
        code: r?.service_level?.code ?? 'STD',
        name: r?.service_level?.name ?? 'Standard',
        description: r?.service_level?.description ?? undefined,
        amount: Number(r?.rate ?? 0),
        deliveryDateFrom: r?.service_level?.delivery_date_from ?? null,
        deliveryDateTo: r?.service_level?.delivery_date_to ?? null,
        raw: r,
      }))
      .filter((r) => r.amount > 0)
      .sort((a, b) => a.amount - b.amount);

    return { success: true, rates };
  } catch (error) {
    console.error('Courier rate request failed:', error);
    return { success: false, rates: [], error: 'Failed to reach courier API' };
  }
}

export interface CourierContact {
  name: string;
  phone: string;
  email?: string;
}

export interface ShipmentRequest {
  collectionAddress: CourierAddress;
  collectionContact: CourierContact;
  deliveryAddress: CourierAddress;
  deliveryContact: CourierContact;
  parcels: CourierParcel[];
  serviceLevelCode: string;
  declaredValue?: number;
  customerReference?: string;
  specialInstructionsCollection?: string;
  specialInstructionsDelivery?: string;
}

export interface ShipmentResult {
  success: boolean;
  shipmentId?: string;
  waybillNumber?: string;
  trackingNumber?: string;
  error?: string;
  raw?: unknown;
}

/**
 * Book a shipment with Shiplogic after payment is confirmed.
 * Returns waybill and tracking numbers to store on the order.
 * Never throws — returns { success:false, error } on failure.
 */
export async function createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
  if (!COURIER_API_KEY) {
    return { success: false, error: 'COURIERGUY_API_KEY is not configured' };
  }

  try {
    const body = {
      collection_address: toShiplogicAddress(req.collectionAddress),
      collection_contact: {
        name: req.collectionContact.name,
        mobile_number: req.collectionContact.phone,
        email: req.collectionContact.email ?? '',
      },
      delivery_address: toShiplogicAddress(req.deliveryAddress),
      delivery_contact: {
        name: req.deliveryContact.name,
        mobile_number: req.deliveryContact.phone,
        email: req.deliveryContact.email ?? '',
      },
      parcels: req.parcels.map(toShiplogicParcel),
      service_level_code: req.serviceLevelCode,
      declared_value: req.declaredValue ?? 0,
      customer_reference: req.customerReference ?? '',
      special_instructions_collection: req.specialInstructionsCollection ?? '',
      special_instructions_delivery: req.specialInstructionsDelivery ?? '',
    };

    const res = await fetch(`${COURIER_API_URL}/v2/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${COURIER_API_KEY}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { success: false, error: `Courier API ${res.status}: ${text.slice(0, 300)}` };
    }

    const data = await res.json();

    return {
      success: true,
      shipmentId: data?.id ?? undefined,
      waybillNumber: data?.waybill_number ?? data?.short_tracking_reference ?? undefined,
      trackingNumber: data?.tracking_reference ?? data?.short_tracking_reference ?? undefined,
      raw: data,
    };
  } catch (error) {
    console.error('Courier shipment booking failed:', error);
    return { success: false, error: 'Failed to reach courier API' };
  }
}
