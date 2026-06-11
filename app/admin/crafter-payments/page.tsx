import { Metadata } from 'next';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import AdminCrafterPaymentsList from './admin-crafter-payments-list';

export const metadata: Metadata = {
  title: 'Crafter Payments',
};

export default async function AdminCrafterPaymentsPage() {
  await verifyAdmin();

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>Crafter Payments</h1>
      <AdminCrafterPaymentsList />
    </div>
  );
}