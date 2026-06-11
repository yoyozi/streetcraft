import { Metadata } from 'next';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import { getDealSettings, getUploaderSettings } from '@/lib/actions/settings.actions';
import DealSettingsForm from './deal-settings-form';
import UploaderSettingsForm from './uploader-settings-form';
import StorageCleanupSection from './storage-cleanup-section';

export const metadata: Metadata = {
  title: 'Site Settings',
};

export default async function AdminSettingsPage() {
  await verifyAdmin();
  const dealSettings = await getDealSettings();
  const uploaderSettings = await getUploaderSettings();

  return (
    <div className='space-y-8 max-w-3xl mx-auto'>
      <h1 className='text-2xl font-bold'>Site Settings</h1>
      <StorageCleanupSection />
      <UploaderSettingsForm settings={uploaderSettings} />
      <DealSettingsForm settings={dealSettings} />
    </div>
  );
}
