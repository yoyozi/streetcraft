import { Metadata } from 'next';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import { getDealSettings, getUploaderSettings, getDigestSettings, getPaymentSettings } from '@/lib/actions/settings.actions';
import DealSettingsForm from './deal-settings-form';
import UploaderSettingsForm from './uploader-settings-form';
import DigestSettingsForm from './digest-settings-form';
import PaymentSettingsForm from './payment-settings-form';
import StorageCleanupSection from './storage-cleanup-section';

export const metadata: Metadata = {
  title: 'Site Settings',
};

export default async function AdminSettingsPage() {
  await verifyAdmin();
  const dealSettings = await getDealSettings();
  const uploaderSettings = await getUploaderSettings();
  const digestSettings = await getDigestSettings();
  const paymentSettings = await getPaymentSettings();

  return (
    <div className='space-y-8 max-w-3xl mx-auto'>
      <h1 className='text-2xl font-bold'>Site Settings</h1>
      <StorageCleanupSection />
      <PaymentSettingsForm settings={paymentSettings} />
      <UploaderSettingsForm settings={uploaderSettings} />
      <DigestSettingsForm settings={digestSettings} />
      <DealSettingsForm settings={dealSettings} />
    </div>
  );
}
