import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Order } from '@/lib/mongodb/models';
import { revalidatePath } from 'next/cache';
import { PayPalWebhookPayload } from '@/types/webhooks';

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_APP_SECRET = process.env.PAYPAL_APP_SECRET;
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

/**
 * Verify PayPal webhook signature
 * Uses PayPal's webhook verification API
 */
async function verifyPayPalWebhook(
  headers: Headers,
  body: string
): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    console.error('[PAYPAL WEBHOOK] Missing PAYPAL_WEBHOOK_ID');
    return false;
  }

  try {
    // Get access token
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString('base64');
    const tokenResponse = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const { access_token } = await tokenResponse.json();

    // Verify webhook signature
    const verifyResponse = await fetch(
      `${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          transmission_id: headers.get('paypal-transmission-id'),
          transmission_time: headers.get('paypal-transmission-time'),
          cert_url: headers.get('paypal-cert-url'),
          auth_algo: headers.get('paypal-auth-algo'),
          transmission_sig: headers.get('paypal-transmission-sig'),
          webhook_id: PAYPAL_WEBHOOK_ID,
          webhook_event: JSON.parse(body),
        }),
      }
    );

    const verification = await verifyResponse.json();
    return verification.verification_status === 'SUCCESS';

  } catch (error) {
    console.error('[PAYPAL WEBHOOK] Verification error:', error);
    return false;
  }
}

/**
 * PayPal Webhook Handler
 * Receives payment notifications from PayPal
 * 
 * Events:
 * - PAYMENT.CAPTURE.COMPLETED
 * - PAYMENT.CAPTURE.DENIED
 * - CHECKOUT.ORDER.APPROVED
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[PAYPAL WEBHOOK] Received webhook');

    // Get raw body for signature verification
    const rawBody = await req.text();

    // Verify webhook signature
    const isValid = await verifyPayPalWebhook(req.headers, rawBody);
    if (!isValid) {
      console.error('[PAYPAL WEBHOOK] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(rawBody);
    console.log('[PAYPAL WEBHOOK] Event type:', payload.event_type);

    // Handle different event types
    switch (payload.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptured(payload);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentDenied(payload);
        break;

      case 'CHECKOUT.ORDER.APPROVED':
        console.log('[PAYPAL WEBHOOK] Order approved, waiting for capture');
        break;

      default:
        console.log('[PAYPAL WEBHOOK] Unhandled event type:', payload.event_type);
    }

    // Acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('[PAYPAL WEBHOOK] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle payment capture completed
 */
async function handlePaymentCaptured(payload: PayPalWebhookPayload) {
  try {
    const captureId = payload.resource?.id;
    const paypalOrderId = payload.resource?.supplementary_data?.related_ids?.order_id;

    console.log('[PAYPAL WEBHOOK] Payment captured:', {
      captureId,
      paypalOrderId,
    });

    if (!paypalOrderId) {
      console.error('[PAYPAL WEBHOOK] No PayPal order ID in webhook');
      return;
    }

    // Find order by PayPal order ID in payment result
    await connectDB();
    const order = await Order.findOne({
      'paymentResult.id': paypalOrderId,
    })
      .populate('orderitems')
      .exec();

    if (!order) {
      console.error('[PAYPAL WEBHOOK] Order not found for PayPal ID:', paypalOrderId);
      return;
    }

    if (order.isPaid) {
      console.log('[PAYPAL WEBHOOK] Order already paid:', order.id);
      return;
    }

    // Extract payment details
    const amount = payload.resource?.amount?.value;
    const currency = payload.resource?.amount?.currency_code;
    const payerEmail = payload.resource?.payer?.email_address;

    // Update order to paid
    // Note: MongoDB transactions not available in standalone mode
    // Update product stock first
    for (const item of order.orderitems) {
      // Note: Stock management would need Product model - skipping for now
      // await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
    }
    
    // Mark order as paid
    await Order.findByIdAndUpdate(order._id, {
      isPaid: true,
      paidAt: new Date(),
      paymentResult: {
        ...order.paymentResult,
        status: 'COMPLETED',
        email_address: payerEmail || '',
        pricePaid: amount || '0',
        currency: currency || 'USD',
        verifiedAt: new Date(),
        verificationMethod: 'webhook',
        rawResponse: JSON.stringify(payload),
      },
    });

    console.log('[PAYPAL WEBHOOK] Order marked as paid:', order.id);

    // Revalidate order page
    revalidatePath(`/order/${order.id}`);

    // TODO: Send purchase receipt email here
    // await sendPurchaseReceipt({ order });

  } catch (error) {
    console.error('[PAYPAL WEBHOOK] Error handling payment capture:', error);
    throw error;
  }
}

/**
 * Handle payment denied
 */
async function handlePaymentDenied(payload: PayPalWebhookPayload) {
  try {
    const paypalOrderId = payload.resource?.supplementary_data?.related_ids?.order_id;

    console.log('[PAYPAL WEBHOOK] Payment denied for PayPal order:', paypalOrderId);

    // You might want to update order status or send notification
    // For now, just log it
    console.log('[PAYPAL WEBHOOK] Payment denial logged');

  } catch (error) {
    console.error('[PAYPAL WEBHOOK] Error handling payment denial:', error);
  }
}
