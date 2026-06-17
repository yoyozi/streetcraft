import { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = { title: 'Cancellation Policy' };

export default function CancellationPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <h1 className="text-3xl font-bold">Cancellation Policy</h1>
      <p className="text-muted-foreground text-sm">Last updated: June 2025</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Cancelling an Order</h2>
        <p>You may request to cancel your order within <strong>24 hours</strong> of placing it, provided the order has not yet been dispatched by the crafter.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. How to Cancel</h2>
        <p>To cancel an order, contact us immediately at <a href="mailto:info@streetcraft.co.za" className="underline">info@streetcraft.co.za</a> with your order number. We will confirm whether cancellation is still possible.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Orders Already Dispatched</h2>
        <p>Once an order has been collected by the courier, it can no longer be cancelled. In this case, please refer to our <a href="/refund-policy" className="underline">Refund Policy</a> once the item is delivered.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Custom and Made-to-Order Items</h2>
        <p>Custom or made-to-order items cannot be cancelled once production has begun. Please contact us as soon as possible if you need to cancel such an order.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Refund on Cancellation</h2>
        <p>If a cancellation is approved, a full refund will be issued to your original payment method within <strong>5–10 business days</strong>.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Contact</h2>
        <p>For cancellation requests, contact us at <a href="mailto:info@streetcraft.co.za" className="underline">info@streetcraft.co.za</a> or call 063 731 7733.</p>
      </section>
    </div>
  );
}
