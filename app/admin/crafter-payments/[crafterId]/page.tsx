import { Metadata } from 'next';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import AdminCrafterPaymentDetails from './admin-crafter-payment-details';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Crafter Payment Details',
};

export default async function AdminCrafterPaymentDetailsPage({
  params,
}: {
  params: { crafterId: string };
}) {
  await verifyAdmin();

  return (
    <div className='space-y-6'>
      <div className="flex items-center gap-4">
        <Link href="/admin/crafter-payments">
          <Button variant="outline" size="sm">
            ← Back to Summaries
          </Button>
        </Link>
        <h1 className='text-2xl font-bold'>Payment Details</h1>
      </div>
      <AdminCrafterPaymentDetails crafterId={params.crafterId} />
    </div>
  );
}