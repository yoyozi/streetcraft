import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import { getCrafterById } from '@/lib/actions/crafter.actions';
import { getAllCrafters } from '@/lib/actions/crafter.actions';
import EditPageClient from './edit-page-client';

export const metadata: Metadata = {
  title: 'Edit Crafter',
};

const EditCrafterPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  await verifyAdmin();
  const params = await props.params;
  
  // Get basic crafter info for the form
  const result = await getCrafterById(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  // Get full crafter details with linked user for allocation
  const craftersResult = await getAllCrafters();
  const crafters = craftersResult.success ? craftersResult.data : [];
  const currentCrafter = crafters.find(c => c._id === params.id);

  return <EditPageClient crafter={result.data} currentCrafter={currentCrafter} />;
};

export default EditCrafterPage;
