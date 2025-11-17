/*
// PAYSTACK WEBHOOK - COMMENTED OUT DUE TO BUILD ISSUES
// Uncomment when environment variables are properly configured

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB, Order } from '@/lib/mongodb/models';
import { revalidatePath } from 'next/cache';
import { PaystackWebhookPayload } from '@/types/webhooks';

// const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * Verify Paystack webhook signature
 * Paystack signs webhooks with HMAC SHA512
 */
function verifyPaystackSignature(payload: string, signature: string | null): boolean {
  if (!PAYSTACK_SECRET_KEY || !signature) {
    console.error('[PAYSTACK WEBHOOK] Missing secret key or signature');
    return false;
  }

  try {
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(hash)
    );
  } catch (error) {
    console.error('[PAYSTACK WEBHOOK] Signature verification error:', error);
    return false;
  }
}

/**
 * Paystack Webhook Handler
 * Receives payment notifications from Paystack
 * 
 * Events:
 * - charge.success
 * - charge.failed
 * - transfer.success
 * - transfer.failed
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[PAYSTACK WEBHOOK] Received webhook');

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    if (!verifyPaystackSignature(rawBody, signature)) {
      console.error('[PAYSTACK WEBHOOK] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(rawBody);
    console.log('[PAYSTACK WEBHOOK] Event type:', payload.event);

    // Handle different event types
    switch (payload.event) {
      case 'charge.success':
        await handleChargeSuccess(payload);
        break;

      case 'charge.failed':
        await handleChargeFailed(payload);
        break;

      case 'transfer.success':
        console.log('[PAYSTACK WEBHOOK] Transfer successful');
        break;

      case 'transfer.failed':
        console.log('[PAYSTACK WEBHOOK] Transfer failed');
        break;

      default:
        console.log('[PAYSTACK WEBHOOK] Unhandled event type:', payload.event);
    }

    // Acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('[PAYSTACK WEBHOOK] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful charge
 */
async function handleChargeSuccess(payload: PaystackWebhookPayload) {
  try {
    const reference = payload.data?.reference;
    const status = payload.data?.status;

    console.log('[PAYSTACK WEBHOOK] Charge successful:', {
      reference,
      status,
    });

    if (!reference) {
      console.error('[PAYSTACK WEBHOOK] No reference in webhook payload');
      return;
    }

    // Extract order ID from reference (format: orderId-timestamp)
    const orderId = reference.split('-').slice(0, 5).join('-'); // Get first 5 parts (UUID format)

    // Check if order exists and is not already paid
    await connectDB();
    const order = await Order.findById(orderId)
      .populate('orderitems')
      .exec();

    if (!order) {
      console.error('[PAYSTACK WEBHOOK] Order not found:', orderId);
      return;
    }

    if (order.isPaid) {
      console.log('[PAYSTACK WEBHOOK] Order already paid:', orderId);
      return;
    }

    // Verify payment status
    if (status !== 'success') {
      console.error('[PAYSTACK WEBHOOK] Payment status not success:', status);
      return;
    }

    // Extract payment details
    const amount = (payload.data?.amount || 0) / 100; // Convert kobo to ZAR
    const customerEmail = payload.data?.customer?.email;
    const transactionId = payload.data?.id;

    // Update order to paid
    // Note: MongoDB transactions not available in standalone mode
    // Update product stock first (placeholder for future implementation)
    const populatedOrder = order as typeof order & { orderitems: any[] };
    if (populatedOrder.orderitems && populatedOrder.orderitems.length > 0) {
      // Stock management would need Product model - skipping for now
    }
    
    // Update order to paid
    await Order.findByIdAndUpdate(orderId, {
      isPaid: true,
      paidAt: new Date(),
      paymentResult: {
        id: transactionId,
        status: 'success',
        email_address: customerEmail || '',
        pricePaid: amount.toString(),
        currency: 'ZAR',
        verifiedAt: new Date(),
        verificationMethod: 'webhook',
        rawResponse: JSON.stringify(payload),
      },
    });

    console.log('[PAYSTACK WEBHOOK] Order marked as paid:', orderId);

    // Revalidate order page
    revalidatePath(`/order/${orderId}`);

    // TODO: Send purchase receipt email here
    // await sendPurchaseReceipt({ order });

  } catch (error) {
    console.error('[PAYSTACK WEBHOOK] Error handling charge success:', error);
    throw error;
  }
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(payload: PaystackWebhookPayload) {
  try {
    const reference = payload.data?.reference;

    console.log('[PAYSTACK WEBHOOK] Charge failed for order:', reference);

    // You might want to update order status or send notification
    // For now, just log it
    console.log('[PAYSTACK WEBHOOK] Charge failure logged');

  } catch (error) {
    console.error('[PAYSTACK WEBHOOK] Error handling charge failure:', error);
  }
}

*/
