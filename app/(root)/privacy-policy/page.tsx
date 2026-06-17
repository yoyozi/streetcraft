import { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">Last updated: June 2025</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p>When you use {APP_NAME}, we may collect personal information including your name, email address, phone number, shipping address, and payment information necessary to process your orders.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <p>We use your information to process orders, arrange delivery, send purchase receipts and order updates, and improve our services. We do not sell your personal data to third parties.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Payment Security</h2>
        <p>Payments are processed securely through Paystack and Yoco. {APP_NAME} does not store your card details. All transactions are encrypted.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Cookies</h2>
        <p>We use session cookies to maintain your login and cart state. We do not use third-party tracking cookies.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Your Rights</h2>
        <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:info@streetcraft.co.za" className="underline">info@streetcraft.co.za</a>.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Contact</h2>
        <p>For any privacy-related queries, contact us at <a href="mailto:info@streetcraft.co.za" className="underline">info@streetcraft.co.za</a> or call 063 731 7733.</p>
      </section>
    </div>
  );
}
