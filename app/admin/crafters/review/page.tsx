import { Metadata } from 'next';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import { getPendingCrafters } from '@/lib/actions/crafter.actions';
import ReviewPageClient from './review-page-client';

export const metadata: Metadata = {
  title: 'Review Crafter Applications',
};

export default async function ReviewCraftersPage() {
  await verifyAdmin();
  const result = await getPendingCrafters();
  const crafters = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex-between">
        <h2 className="h2-bold">Review Applications</h2>
        <span className="text-sm text-muted-foreground">
          {crafters.length} pending
        </span>
      </div>
      <ReviewPageClient crafters={crafters} />
    </div>
  );
}
