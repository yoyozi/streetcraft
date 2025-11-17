declare module 'paystack' {
  interface PaystackConstructor {
    new (secretKey: string): PaystackInstance;
  }

  interface PaystackInstance {
    transaction: {
      initialize(params: InitializeParams): Promise<InitializeResponse>;
      verify(reference: string): Promise<VerifyResponse>;
    };
  }

  interface InitializeParams {
    email: string;
    amount: number;
    reference: string;
    currency?: string;
    callback_url?: string;
    metadata?: Record<string, unknown>;
  }

  interface InitializeResponse {
    status: boolean;
    message: string;
    data: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  }

  interface VerifyResponse {
    status: boolean;
    message: string;
    data: {
      id: number;
      domain: string;
      status: string;
      reference: string;
      amount: number;
      message: string | null;
      gateway_response: string;
      paid_at: string;
      created_at: string;
      channel: string;
      currency: string;
      ip_address: string;
      metadata: Record<string, unknown>;
      log: unknown;
      fees: number;
      fees_split: unknown;
      authorization: {
        authorization_code: string;
        bin: string;
        last4: string;
        exp_month: string;
        exp_year: string;
        channel: string;
        card_type: string;
        bank: string;
        country_code: string;
        brand: string;
        reusable: boolean;
        signature: string;
        account_name: string | null;
      };
      customer: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        email: string;
        customer_code: string;
        phone: string | null;
        metadata: Record<string, unknown>;
        risk_action: string;
      };
      plan: unknown;
      order_id: string | null;
      paidAt: string;
      createdAt: string;
      requested_amount: number;
      pos_transaction_data: unknown;
      source: unknown;
      fees_breakdown: unknown;
      transaction_date: string;
      plan_object: unknown;
      subaccount: unknown;
    };
  }

  const Paystack: PaystackConstructor;
  export default Paystack;
}
