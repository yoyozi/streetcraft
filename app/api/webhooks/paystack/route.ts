import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';
import { updateOrderToPaid } from '@/lib/actions/order.actions';
import { verifyPaystackTransaction } from '@/lib/paystack';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Validate HMAC-SHA512 signature
    if (PAYSTACK_SECRET_KEY) {
      const signature = req.headers.get('x-paystack-signature') || '';
      const expected = createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
      if (signature !== expected) {
        console.warn('[Paystack webhook] Invalid signature — rejecting');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const event: string = body?.event || '';

    console.log(`[Paystack webhook] event: ${event}`);

    if (event !== 'charge.success') {
      return NextResponse.json({ received: true, ignored: event });
    }

    const data = body?.data;
    const reference: string = data?.reference || '';
    // orderId stored in metadata.order_id during transaction initialization
    const orderId: string = data?.metadata?.order_id || '';

    if (!orderId && !reference) {
      console.warn('[Paystack webhook] No order reference in payload');
      return NextResponse.json({ received: true, warning: 'No order reference' });
    }

    // Look up order — first by metadata orderId, fallback by stored paymentResult reference
    let order = orderId
      ? await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, isPaid: true } })
      : null;

    if (!order && reference) {
      // Fallback: find order where paymentResult.id === reference
      const orders = await prisma.order.findMany({
        where: { isPaid: false },
        select: { id: true, isPaid: true, paymentResult: true },
        take: 50,
      });
      const match = orders.find((o) => (o.paymentResult as any)?.id === reference);
      if (match) order = match;
    }

    if (!order) {
      console.warn(`[Paystack webhook] Order not found for ref ${reference} / orderId ${orderId}`);
      return NextResponse.json({ received: true, warning: 'Order not found' });
    }

    if (order.isPaid) {
      return NextResponse.json({ received: true, note: 'Order already paid' });
    }

    // Verify with Paystack and update order (calls updateOrderToPaid internally)
    const verification = await verifyPaystackTransaction(reference);
    if (verification.success && verification.data) {
      const d = verification.data;
      await updateOrderToPaid({
        orderId: order.id,
        paymentResult: {
          id: d.id,
          status: d.status,
          email_address: d.customer.email,
          pricePaid: d.amount.toString(),
          currency: 'ZAR',
        },
      });
      console.log(`[Paystack webhook] Order ${order.id} marked as PAID`);
    }

    return NextResponse.json({ received: true, orderId: order.id });
  } catch (error) {
    console.error('[Paystack webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'Paystack webhook receiver' });
}