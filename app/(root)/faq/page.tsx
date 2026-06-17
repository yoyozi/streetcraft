import { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = { title: 'FAQ' };

const faqs = [
  {
    q: 'What is StreetCraft?',
    a: `${APP_NAME} is an online marketplace showcasing handcrafted products made by independent South African crafters. Every item is made with care and many are one-of-a-kind pieces.`,
  },
  {
    q: 'How do I place an order?',
    a: 'Browse the shop, add items to your cart, and proceed to checkout. You can pay securely via EFT, Yoco, or Paystack.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept EFT (bank transfer), Yoco card payments, and Paystack card payments. All card transactions are secured and encrypted.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Orders are dispatched within 2–3 business days of confirmed payment. Delivery via The Courier Guy typically takes 1–3 business days depending on your location.',
  },
  {
    q: 'Do you deliver nationwide?',
    a: 'Yes, we deliver throughout South Africa via The Courier Guy courier service.',
  },
  {
    q: 'Can I track my order?',
    a: 'Yes. Once your order is dispatched you will receive a tracking number via email that you can use on The Courier Guy website.',
  },
  {
    q: 'What are "One of a Kind" items?',
    a: 'These are unique, hand-crafted pieces that exist in a single quantity. Once sold, they are gone. Each listing is clearly marked.',
  },
  {
    q: 'Can I return or get a refund?',
    a: 'Yes. Please see our Refund Policy for full details. In summary, refunds are available within 7 days of receiving a damaged or incorrect item.',
  },
  {
    q: 'How do I become a crafter on StreetCraft?',
    a: 'Register an account and apply to become a crafter from your profile. Our team reviews applications and will be in touch.',
  },
  {
    q: 'How do I contact support?',
    a: 'Email us at info@streetcraft.co.za or call 063 731 7733. We aim to respond within 1 business day.',
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>

      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="border-b pb-6 last:border-0">
            <h2 className="font-semibold text-lg mb-2">{faq.q}</h2>
            <p className="text-muted-foreground">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-muted/50 p-6 text-sm text-muted-foreground">
        Still have questions? Email us at{' '}
        <a href="mailto:info@streetcraft.co.za" className="underline text-foreground">
          info@streetcraft.co.za
        </a>{' '}
        or call <a href="tel:+27637317733" className="underline text-foreground">063 731 7733</a>.
      </div>
    </div>
  );
}
