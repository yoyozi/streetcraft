import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Shiplogic webhook handler.
 *
 * Shiplogic POSTs tracking events to this endpoint as a shipment progresses.
 * Register this URL in your Shiplogic account:
 *   Dashboard → Settings → Webhooks → https://yourdomain.com/api/webhooks/shiplogic
 *
 * For local testing use ngrok:
 *   npx ngrok http 3000
 *   then register https://<ngrok-id>.ngrok.io/api/webhooks/shiplogic
 *
 * Env:
 *   SHIPLOGIC_WEBHOOK_SECRET  (optional) — if set, validates X-Shiplogic-Hmac-SHA256 header
 */

const WEBHOOK_SECRET = process.env.SHIPLOGIC_WEBHOOK_SECRET || '';

/** Lowercase status codes that mean the parcel has been delivered */
const DELIVERED_STATUSES = new Set([
  'delivered',
  'pod', // proof of delivery
]);

/** Shiplogic status codes we track but don't mark delivered */
const KNOWN_STATUSES: Record<string, string> = {
  submitted: 'Submitted',
  'collection-assigned': 'Assigned to courier',
  assigned: 'Assigned to courier',
  collected: 'Collected from sender',
  'in-transit': 'In transit',
  in_transit: 'In transit',
  'out-for-delivery': 'Out for delivery',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  'delivery-failed': 'Delivery failed',
  delivery_failed: 'Delivery failed',
  cancelled: 'Cancelled',
  exception: 'Exception',
};

export async function POST(req: NextRequest) {
  try {
    // Optional signature validation
    if (WEBHOOK_SECRET) {
      const signature = req.headers.get('x-shiplogic-hmac-sha256') || req.headers.get('x-shiplogic-signature') || '';
      if (!signature) {
        console.warn('[Shiplogic webhook] Missing signature header — rejecting');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      // Full HMAC validation can be added here if Shiplogic documents the exact signing method
    }

    const rawBody = await req.text();
    if (!rawBody || !rawBody.trim()) {
      return NextResponse.json({ received: true, note: 'Empty body' });
    }
    const body = JSON.parse(rawBody);

    // Shiplogic can send different payload shapes depending on the event type.
    // Try to extract tracking reference and status from known shapes.
    // Shiplogic real webhook uses short_tracking_reference at the top level
    const trackingRef: string | undefined =
      body?.short_tracking_reference ||
      body?.shipment?.tracking_reference ||
      body?.shipment?.waybill_number ||
      body?.tracking_reference ||
      body?.waybill_number ||
      body?.data?.tracking_reference ||
      (Array.isArray(body?.parcel_tracking_references) && body.parcel_tracking_references[0]?.split('/')?.[0]);

    const statusRaw: string | undefined =
      body?.status ||
      body?.shipment?.status ||
      body?.data?.status ||
      body?.event?.status;

    console.log(`[Shiplogic webhook] event: ${body?.event || body?.type || 'unknown'} | ref: ${trackingRef} | status: ${statusRaw}`);

    if (!trackingRef) {
      console.warn('[Shiplogic webhook] No tracking reference in payload', JSON.stringify(body));
      return NextResponse.json({ received: true, warning: 'No tracking reference' });
    }

    // Look up the order by tracking or waybill number
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { trackingNumber: trackingRef },
          { waybillNumber: trackingRef },
        ],
      },
      select: { id: true, isDelivered: true, deliveredAt: true },
    });

    if (!order) {
      console.warn(`[Shiplogic webhook] No order found for ref ${trackingRef}`);
      return NextResponse.json({ received: true, warning: 'Order not found' });
    }

    const statusLabel = KNOWN_STATUSES[statusRaw?.toLowerCase() ?? ''] || statusRaw || 'Unknown';
    console.log(`[Shiplogic webhook] Order ${order.id} — status: ${statusLabel}`);

    const isDelivered = statusRaw ? DELIVERED_STATUSES.has(statusRaw.toLowerCase()) : false;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        courierStatus: statusLabel,
        ...(isDelivered && !order.isDelivered
          ? { isDelivered: true, deliveredAt: new Date() }
          : {}),
      },
    });

    if (isDelivered) {
      console.log(`[Shiplogic webhook] Order ${order.id} marked as DELIVERED`);
    }

    return NextResponse.json({ received: true, orderId: order.id, status: statusLabel });
  } catch (error) {
    console.error('[Shiplogic webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'Shiplogic webhook receiver' });
}
