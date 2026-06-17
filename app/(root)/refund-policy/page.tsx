import { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = { title: 'Refund Policy' };

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <h1 className="text-3xl font-bold">Refund Policy</h1>
      <p className="text-muted-foreground text-sm">Last updated: June 2025</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Our Commitment</h2>
        <p>We want you to be completely satisfied with your purchase. If something is not right, we are here to help.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Eligibility for Refunds</h2>
        <p>Refunds may be requested within <strong>7 days</strong> of receiving your order if:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
          <li>The item arrived damaged or defective.</li>
          <li>The item received is significantly different from the product description.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Non-Refundable Items</h2>
        <p>The following are not eligible for refunds:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
          <li>Custom-made or personalised items.</li>
          <li>Items that have been used or are no longer in their original condition.</li>
          <li>Digital products once downloaded.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Refund Process</h2>
        <p>To request a refund, email <a href="mailto:info@streetcraft.co.za" className="underline">info@streetcraft.co.za</a> with your order number and a description of the issue. We will respond within 2 business days.</p>
        <p>Approved refunds are processed back to the original payment method within <strong>5–10 business days</strong>.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Return Shipping</h2>
        <p>If a return is required, we will provide a return courier label. Items must be securely packaged in their original packaging where possible.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Contact</h2>
        <p>For refund queries, contact us at <a href="mailto:info@streetcraft.co.za" className="underline">info@streetcraft.co.za</a> or call 063 731 7733.</p>
      </section>
    </div>
  );
}
