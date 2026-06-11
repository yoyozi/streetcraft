import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CrafterPaymentList from './crafter-payment-list';

export default async function CrafterPaymentsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'craft') {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Payment History</h1>
      <CrafterPaymentList />
    </div>
  );
}