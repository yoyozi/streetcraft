// lib/paystack.ts
import Paystack from 'paystack';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY is not defined in environment variables');
}

// Initialize Paystack
const paystack = new Paystack(PAYSTACK_SECRET_KEY);

/**
 * Initialize a Paystack transaction
 * @param email - Customer email
 * @param amount - Amount in ZAR (will be converted to kobo)
 * @param reference - Unique transaction reference
 * @param orderId - Order ID for callback URL
 */
export async function initializePaystackTransaction({
  email,
  amount,
  reference,
  orderId,
}: {
  email: string;
  amount: number;
  reference: string;
  orderId?: string;
}) {
  try {
    console.log('[PAYSTACK] Initializing transaction:', { email, amount, reference, orderId });
    
    // Use orderId for callback if provided, otherwise use reference
    const callbackOrderId = orderId || reference;
    
    const response = await paystack.transaction.initialize({
      email,
      amount: Math.round(amount * 100), // Convert ZAR to kobo (cents)
      reference,
      currency: 'ZAR',
      callback_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/order/${callbackOrderId}`,
      metadata: {
        order_id: callbackOrderId,
        custom_fields: [
          {
            display_name: 'Order ID',
            variable_name: 'order_id',
            value: callbackOrderId,
          },
        ],
      },
    });

    console.log('[PAYSTACK] Response:', JSON.stringify(response, null, 2));

    if (response.status) {
      return {
        success: true,
        authorization_url: response.data.authorization_url,
        access_code: response.data.access_code,
        reference: response.data.reference,
      };
    }

    console.error('[PAYSTACK] Response status is false:', response);
    throw new Error('Failed to initialize Paystack transaction');
  } catch (error) {
    console.error('[PAYSTACK] Initialize transaction error:', error);
    throw error;
  }
}

/**
 * Verify a Paystack transaction
 * @param reference - Transaction reference to verify
 */
export async function verifyPaystackTransaction(reference: string) {
  try {
    const response = await paystack.transaction.verify(reference);

    if (response.status && response.data.status === 'success') {
      return {
        success: true,
        data: {
          id: response.data.id.toString(),
          reference: response.data.reference,
          amount: response.data.amount / 100, // Convert kobo back to ZAR
          currency: response.data.currency,
          status: response.data.status,
          paid_at: response.data.paid_at,
          customer: response.data.customer,
        },
      };
    }

    return {
      success: false,
      message: 'Payment verification failed',
    };
  } catch (error) {
    console.error('[PAYSTACK] Verify transaction error:', error);
    throw error;
  }
}

export { paystack };