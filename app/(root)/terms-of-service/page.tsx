import { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground text-sm">Last updated: June 2025</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
        <p>By accessing or using {APP_NAME}, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. The Platform</h2>
        <p>{APP_NAME} is a marketplace connecting buyers with independent South African crafters. Products are priced by {APP_NAME} and we act as the seller of record. Crafters are responsible for the quality and accuracy of their product listings.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Orders and Payment</h2>
        <p>All prices are displayed in South African Rand (ZAR). Orders are confirmed once payment is received. We reserve the right to cancel any order in the event of a pricing error or stock unavailability.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Unique Items</h2>
        <p>Some products are marked as &ldquo;One of a Kind&rdquo;. These items are hand-crafted and one-off pieces. Once sold, they are no longer available.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
        <p>All content on {APP_NAME}, including product images, logos, and text, is owned by {APP_NAME} or its crafters. Unauthorised use is prohibited.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Limitation of Liability</h2>
        <p>{APP_NAME} is not liable for indirect, incidental, or consequential damages arising from the use of the platform or products purchased through it.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Governing Law</h2>
        <p>These terms are governed by the laws of the Republic of South Africa.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Contact</h2>
        <p>Questions about these terms? Contact us at <a href="mailto:info@streetcraft.co.za" className="underline">info@streetcraft.co.za</a>.</p>
      </section>
    </div>
  );
}
