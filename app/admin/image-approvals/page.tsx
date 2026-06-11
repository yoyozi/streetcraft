import { Metadata } from 'next';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import ImageApprovalList from './image-approval-list';

export const metadata: Metadata = {
  title: 'Product Approvals',
};

export default async function AdminImageApprovalsPage() {
  await verifyAdmin();

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>Product Approvals</h1>
      <ImageApprovalList />
    </div>
  );
}