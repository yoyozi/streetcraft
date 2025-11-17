import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyYocoPayment } from '@/lib/yoco';
import { updateOrderToPaid } from '@/lib/actions/order.actions';
import { connectDB, Order } from '@/lib/mongodb/models';
import { revalidatePath } from 'next/cache';
import { YocoWebhookPayload } from '@/types/webhooks';

const YOCO_WEBHOOK_SECRET = process.env.YOCO_WEBHOOK_SECRET;

/**
 * Verify Yoco webhook signature
 * Yoco uses Svix for webhook delivery, which signs with HMAC SHA256
 * Format: v1,<base64_signature>
 */
function verifyYocoSignature(
  payload: string, 
  signature: string | null, 
  timestamp: string | null,
  webhookId: string | null
): boolean {
  if (!YOCO_WEBHOOK_SECRET || !signature || !timestamp || !webhookId) {
    // console.error('[YOCO WEBHOOK] Missing required webhook data');
    // console.error('[YOCO WEBHOOK] YOCO_WEBHOOK_SECRET exists:', !!YOCO_WEBHOOK_SECRET);
    // console.error('[YOCO WEBHOOK] Signature exists:', !!signature);
    // console.error('[YOCO WEBHOOK] Timestamp exists:', !!timestamp);
    // console.error('[YOCO WEBHOOK] Webhook ID exists:', !!webhookId);
    return false;
  }

  try {
    // Svix signature format: v1,<signature>
    const signatures = signature.split(',');
    if (signatures.length < 2) {
      // console.error('[YOCO WEBHOOK] Invalid signature format');
      return false;
    }

    const version = signatures[0];
    const signatureToVerify = signatures[1];

    if (version !== 'v1') {
      // console.error('[YOCO WEBHOOK] Unsupported signature version:', version);
      return false;
    }

    // Svix signed data format: <webhook-id>.<timestamp>.<payload>
    const signedContent = `${webhookId}.${timestamp}.${payload}`;
    
    // Svix webhook secrets start with 'whsec_' and are base64 encoded
    // We need to decode the secret first
    let secretKey = YOCO_WEBHOOK_SECRET;
    if (secretKey.startsWith('whsec_')) {
      // Remove the 'whsec_' prefix and decode from base64
      const base64Secret = secretKey.substring(6);
      secretKey = Buffer.from(base64Secret, 'base64').toString('utf-8');
      // console.log('[YOCO WEBHOOK] Decoded secret key (first 10 chars):', secretKey.substring(0, 10));
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(signedContent)
      .digest('base64');

    // console.log('[YOCO WEBHOOK] Expected signature:', expectedSignature);
    // console.log('[YOCO WEBHOOK] Received signature:', signatureToVerify);

    return crypto.timingSafeEqual(
      Buffer.from(signatureToVerify),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    // console.error('[YOCO WEBHOOK] Signature verification error:', error);
    return false;
  }
}

/**
 * Yoco Webhook Handler
 * Receives payment notifications from Yoco
 * 
 * Events:
 * - payment.succeeded
 * - payment.failed
 * - checkout.completed
 */
export async function POST(req: NextRequest) {
  try {
    // console.log('[YOCO WEBHOOK] Received webhook');
    // console.log('[YOCO WEBHOOK] YOCO_WEBHOOK_SECRET loaded:', !!YOCO_WEBHOOK_SECRET);
    // console.log('[YOCO WEBHOOK] All headers:', Object.fromEntries(req.headers.entries()));

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('webhook-signature');
    const timestamp = req.headers.get('webhook-timestamp');
    const webhookId = req.headers.get('webhook-id');
    
    // console.log('[YOCO WEBHOOK] Signature from header:', signature);
    // console.log('[YOCO WEBHOOK] Timestamp from header:', timestamp);
    // console.log('[YOCO WEBHOOK] Webhook ID from header:', webhookId);

    // Verify webhook signature
    if (!verifyYocoSignature(rawBody, signature, timestamp, webhookId)) {
      // console.error('[YOCO WEBHOOK] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(rawBody);
    // console.log('[YOCO WEBHOOK] Event type:', payload.type);
    // console.log('[YOCO WEBHOOK] Full payload:', JSON.stringify(payload, null, 2));

    // Handle different event types
    switch (payload.type) {
      case 'payment.succeeded':
      case 'checkout.completed':
        await handlePaymentSuccess(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailure(payload);
        break;

      default:
        // console.log('[YOCO WEBHOOK] Unhandled event type:', payload.type);
    }

    // Acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    // console.error('[YOCO WEBHOOK] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(payload: YocoWebhookPayload) {
  try {
    // Extract data from nested payload structure
    const paymentData = payload.payload || payload.data || payload;
    const checkoutId = paymentData.metadata?.checkoutId || paymentData.id || payload.id;
    const orderId = paymentData.metadata?.orderId;

    // console.log('[YOCO WEBHOOK] Processing successful payment:', {
    //   checkoutId,
    //   orderId,
    // });

    if (!orderId) {
      // console.error('[YOCO WEBHOOK] No order ID in webhook payload');
      return;
    }

    if (!checkoutId) {
      // console.error('[YOCO WEBHOOK] No checkout ID in webhook payload');
      return;
    }

    // Check if order exists and is not already paid
    await connectDB();
    const order = await Order.findById(orderId);

    if (!order) {
      // console.error('[YOCO WEBHOOK] Order not found:', orderId);
      return;
    }

    if (order.isPaid) {
      // console.log('[YOCO WEBHOOK] Order already paid:', orderId);
      return;
    }

    // Verify payment with Yoco API
    const verification = await verifyYocoPayment(checkoutId);

    if (!verification.success || !verification.data) {
      // console.error('[YOCO WEBHOOK] Payment verification failed');
      return;
    }

    // Update order to paid with webhook audit trail
    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: verification.data.id,
        status: verification.data.status,
        email_address: '',
        pricePaid: verification.data.amount.toString(),
        currency: 'ZAR',
        verifiedAt: new Date(),
        verificationMethod: 'webhook', // Payment verified via webhook
        rawResponse: JSON.stringify(verification.data), // Store full Yoco response
      },
    });

    // console.log('[YOCO WEBHOOK] Order marked as paid:', orderId);

    // Revalidate order page
    revalidatePath(`/order/${orderId}`);

    // TODO: Send purchase receipt email here
    // await sendPurchaseReceipt({ order });

  } catch (error) {
    // console.error('[YOCO WEBHOOK] Error handling payment success:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(payload: YocoWebhookPayload) {
  try {
    const orderId = payload.data?.metadata?.orderId || payload.metadata?.orderId;

    // console.log('[YOCO WEBHOOK] Payment failed for order:', orderId);

    if (!orderId) {
      return;
    }

    // You might want to update order status or send notification
    // For now, just log it
    // console.log('[YOCO WEBHOOK] Payment failure logged');

  } catch (error) {
    // console.error('[YOCO WEBHOOK] Error handling payment failure:', error);
  }
}
