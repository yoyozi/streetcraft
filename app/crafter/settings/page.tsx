import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import BankDetailsForm from './bank-details-form';

export default async function CrafterSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'craft') redirect('/sign-in');

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <BankDetailsForm />
    </div>
  );
}
