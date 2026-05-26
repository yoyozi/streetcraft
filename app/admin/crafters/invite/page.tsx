import { Metadata } from 'next';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import { getAllInvites } from '@/lib/actions/invite.actions';
import InvitePageClient from './invite-page-client';

export const metadata: Metadata = {
  title: 'Invite Crafter',
};

const InviteCrafterPage = async () => {
  await verifyAdmin();
  const result = await getAllInvites();
  const invites = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <h2 className="h2-bold">Invite Crafter</h2>
      <InvitePageClient invites={invites} />
    </div>
  );
};

export default InviteCrafterPage;
