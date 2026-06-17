import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';
import { updateOrderToPaid } from '@/lib/actions/order.actions';
import { verifyYocoPayment } from '@/lib/yoco';

const YOCO_WEBHOOK_SECRET = process.env.YOCO_WEBHOOK_SECRET || '';

/** Yoco webhook successful payment event types */
const SUCCESS_EVENTS = new Set(['payment.succeeded', 'checkout.complete', 'checkout.completed']);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Validate HMAC-SHA256 signature if secret is configured
    if (YOCO_WEBHOOK_SECRET) {
      const signature = req.headers.get('x-yoco-signature') || '';
      const expected = createHmac('sha256', YOCO_WEBHOOK_SECRET).update(rawBody).digest('hex');
      if (signature !== expected) {
        console.warn('[Yoco webhook] Invalid signature — rejecting');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const event: string = body?.type || body?.event || '';

    console.log(`[Yoco webhook] event: ${event}`);

    if (!SUCCESS_EVENTS.has(event)) {
      return NextResponse.json({ received: true, ignored: event });
    }

    // Yoco sends payload under body.payload or body.data
    const payload = body?.payload || body?.data || body;
    const checkoutId: string = payload?.id || '';
    // orderId stored in metadata during createYocoCheckout
    const orderId: string = payload?.metadata?.orderId || payload?.metadata?.orderNumber || '';

    if (!orderId && !checkoutId) {
      console.warn('[Yoco webhook] No order reference in payload');
      return NextResponse.json({ received: true, warning: 'No order reference' });
    }

    // Look up order — first by metadata orderId, fallback by stored checkout ID
    let order = orderId
      ? await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, isPaid: true } })
      : null;

    if (!order && checkoutId) {
      // Fallback: find unpaid order where paymentResult.id === checkoutId
      const orders = await prisma.order.findMany({
        where: { isPaid: false },
        select: { id: true, isPaid: true, paymentResult: true },
        take: 50,
      });
      const match = orders.find((o) => (o.paymentResult as any)?.id === checkoutId);
      if (match) order = match;
    }

    if (!order) {
      console.warn(`[Yoco webhook] Order not found for checkoutId ${checkoutId} / orderId ${orderId}`);
      return NextResponse.json({ received: true, warning: 'Order not found' });
    }

    if (order.isPaid) {
      return NextResponse.json({ received: true, note: 'Order already paid' });
    }

    // Verify with Yoco API and update order
    if (checkoutId) {
      const verification = await verifyYocoPayment(checkoutId);
      if (verification.success && verification.data) {
        const d = verification.data;
        await updateOrderToPaid({
          orderId: order.id,
          paymentResult: {
            id: d.id,
            status: d.status,
            email_address: '',
            pricePaid: d.amount.toString(),
            currency: d.currency || 'ZAR',
          },
        });
        console.log(`[Yoco webhook] Order ${order.id} marked as PAID`);
      }
    } else {
      // No checkoutId to verify against — trust the webhook event directly
      await updateOrderToPaid({
        orderId: order.id,
        paymentResult: {
          id: payload?.id || `yoco_${order.id}`,
          status: 'succeeded',
          email_address: '',
          pricePaid: ((payload?.amount || 0) / 100).toString(),
          currency: payload?.currency || 'ZAR',
        },
      });
      console.log(`[Yoco webhook] Order ${order.id} marked as PAID (no checkout verification)`);
    }

    return NextResponse.json({ received: true, orderId: order.id });
  } catch (error) {
    console.error('[Yoco webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'Yoco webhook receiver' });
}
