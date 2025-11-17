// lib/yoco.ts
const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;

if (!YOCO_SECRET_KEY) {
  console.warn('[YOCO] YOCO_SECRET_KEY is not defined in environment variables');
}

export async function createYocoCheckout({
  amount,
  currency = 'ZAR',
  metadata,
}: {
  amount: number;
  currency?: string;
  metadata: Record<string, string>;
}) {
  try {
    // Check if API key is configured
    if (!YOCO_SECRET_KEY) {
      throw new Error('Yoco payment is not configured. Please contact support.');
    }

    // Yoco API endpoint - using the correct payments API
    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert ZAR to cents
        currency,
        cancelUrl: `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/cart`,
        successUrl: `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/order/${metadata.orderId}`,
        failureUrl: `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/order/${metadata.orderId}`,
        metadata,
      }),
    });

    if (!response.ok) {
      // Try to get error text (might be HTML or JSON)
      const errorText = await response.text();
      let errorMessage = 'Failed to create Yoco checkout';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // If not JSON, use the status text
        errorMessage = `Yoco API Error (${response.status}): ${response.statusText}`;
        console.error('[YOCO] API returned HTML error:', errorText.substring(0, 200));
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    return {
      success: true,
      checkoutId: data.id,
      redirectUrl: data.redirectUrl,
    };
  } catch (error) {
    console.error('[YOCO] Create checkout error:', error);
    throw error;
  }
}

/**
 * Verify a Yoco payment
 * @param checkoutId - The checkout ID to verify
 */
export async function verifyYocoPayment(checkoutId: string) {
  try {
    // Check if API key is configured
    if (!YOCO_SECRET_KEY) {
      throw new Error('Yoco payment is not configured. Please contact support.');
    }

    const response = await fetch(
      `https://payments.yoco.com/api/checkouts/${checkoutId}`,
      {
        headers: {
          'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to verify Yoco payment');
    }

    const data = await response.json();
    
    console.log('[YOCO] Verification response:', JSON.stringify(data, null, 2));

    // Yoco uses various status values for successful payments
    const isSuccessful = data.status === 'successful' || 
                        data.status === 'complete' || 
                        data.status === 'completed' || 
                        data.status === 'succeeded';
    
    if (isSuccessful) {
      return {
        success: true,
        data: {
          id: data.id,
          status: data.status,
          amount: data.amount / 100, // Convert cents back to ZAR
          currency: data.currency,
          metadata: data.metadata,
          createdDate: data.createdDate,
        },
      };
    }

    console.log('[YOCO] Payment not successful. Status:', data.status);
    return {
      success: false,
      message: `Payment status: ${data.status}`,
    };
  } catch (error) {
    console.error('[YOCO] Verify payment error:', error);
    throw error;
  }
}

/**
 * Get payment details by ID
 * @param paymentId - The payment ID
 */
export async function getYocoPayment(paymentId: string) {
  try {
    // Check if API key is configured
    if (!YOCO_SECRET_KEY) {
      throw new Error('Yoco payment is not configured. Please contact support.');
    }

    const response = await fetch(
      `https://payments.yoco.com/api/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get Yoco payment');
    }

    return await response.json();
  } catch (error) {
    console.error('[YOCO] Get payment error:', error);
    throw error;
  }
}