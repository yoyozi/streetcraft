// Webhook payload types for payment gateways

export interface YocoWebhookPayload {
  type: 'payment.succeeded' | 'payment.failed' | 'checkout.completed' | string;
  id?: string;
  createdDate?: string;
  // Nested payload structure from Svix
  payload?: {
    id: string;
    type?: string;
    status: string;
    amount?: number;
    currency?: string;
    mode?: string;
    createdDate?: string;
    metadata?: {
      orderId: string;
      orderNumber?: string;
      checkoutId?: string;
      productType?: string;
    };
    paymentMethodDetails?: {
      type: string;
      card?: {
        scheme: string;
        maskedCard: string;
        expiryMonth: number;
        expiryYear: number;
      };
    };
  };
  // Legacy structure (for backwards compatibility)
  data?: {
    id: string;
    status: string;
    metadata?: {
      orderId: string;
      orderNumber?: string;
      checkoutId?: string;
    };
  };
  metadata?: {
    orderId: string;
    orderNumber?: string;
    checkoutId?: string;
  };
}

export interface PayPalWebhookPayload {
  event_type: 'PAYMENT.CAPTURE.COMPLETED' | 'PAYMENT.CAPTURE.DENIED' | 'CHECKOUT.ORDER.APPROVED' | string;
  resource?: {
    id: string;
    status?: string;
    amount?: {
      value: string;
      currency_code: string;
    };
    payer?: {
      email_address?: string;
    };
    supplementary_data?: {
      related_ids?: {
        order_id: string;
      };
    };
  };
}

export interface PaystackWebhookPayload {
  event: 'charge.success' | 'charge.failed' | 'transfer.success' | 'transfer.failed' | string;
  data?: {
    id: number;
    reference: string;
    status: string;
    amount: number;
    currency?: string;
    customer?: {
      email: string;
    };
    metadata?: Record<string, unknown>;
  };
}
