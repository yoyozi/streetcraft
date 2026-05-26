'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { createCrafterInvite, resendInviteSms, deleteInvite } from '@/lib/actions/invite.actions';
import { Send, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Invite {
  id: string;
  mobile: string;
  name: string;
  inviteCode: string;
  status: string;
  smsSentAt: Date | null;
  registeredAt: Date | null;
  createdAt: Date;
}

export default function InvitePageClient({ invites: initialInvites }: { invites: Invite[] }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isPending, startTransition] = useTransition();
  const [invites, setInvites] = useState(initialInvites);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !mobile.trim()) {
      toast.error('Name and mobile number are required');
      return;
    }

    startTransition(async () => {
      const result = await createCrafterInvite({ name: name.trim(), mobile: mobile.trim() });

      if (result.success) {
        toast.success(
          result.data?.smsSent
            ? `Invite sent to ${result.data.mobile}`
            : `Invite created but SMS failed: ${result.data?.smsError}`
        );
        setName('');
        setMobile('');
        // Refresh invites list
        const { getAllInvites } = await import('@/lib/actions/invite.actions');
        const refreshed = await getAllInvites();
        if (refreshed.success) setInvites(refreshed.data);
      } else {
        toast.error(result.error || 'Failed to create invite');
      }
    });
  };

  const handleResend = (inviteId: string) => {
    startTransition(async () => {
      const result = await resendInviteSms(inviteId);
      if (result.success && result.smsSent) {
        toast.success('SMS resent successfully');
        const { getAllInvites } = await import('@/lib/actions/invite.actions');
        const refreshed = await getAllInvites();
        if (refreshed.success) setInvites(refreshed.data);
      } else {
        toast.error(result.error || result.smsError || 'Failed to resend SMS');
      }
    });
  };

  const handleDelete = (inviteId: string) => {
    startTransition(async () => {
      const result = await deleteInvite(inviteId);
      if (result.success) {
        toast.success('Invite deleted');
        setInvites(invites.filter((i) => i.id !== inviteId));
      } else {
        toast.error(result.error || 'Failed to delete invite');
      }
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'REGISTERED': return 'default';
      case 'PENDING': return 'secondary';
      case 'EXPIRED': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      {/* Invite Form */}
      <div className="rounded-lg border p-6 max-w-lg">
        <h3 className="text-lg font-semibold mb-4">Send Invite SMS</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Crafter Name
            </label>
            <Input
              id="name"
              placeholder="e.g. John Mkhize"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div>
            <label htmlFor="mobile" className="text-sm font-medium">
              Mobile Number
            </label>
            <Input
              id="mobile"
              placeholder="e.g. 0821234567 or +27821234567"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground mt-1">
              SA mobile number. Will receive an SMS with a registration link.
            </p>
          </div>
          <Button type="submit" disabled={isPending} className="gap-2">
            <Send className="h-4 w-4" />
            {isPending ? 'Sending...' : 'Send Invite'}
          </Button>
        </form>
      </div>

      {/* Invites Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Sent Invites</h3>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/crafters">Back to Crafters</Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NAME</TableHead>
              <TableHead>MOBILE</TableHead>
              <TableHead>CODE</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>SMS SENT</TableHead>
              <TableHead className="w-[120px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="font-medium">{invite.name}</TableCell>
                <TableCell>{invite.mobile}</TableCell>
                <TableCell className="font-mono text-xs">{invite.inviteCode}</TableCell>
                <TableCell>
                  <Badge variant={statusColor(invite.status) as any}>
                    {invite.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {invite.smsSentAt
                    ? new Date(invite.smsSentAt).toLocaleDateString('en-ZA', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Not sent'}
                </TableCell>
                <TableCell className="flex gap-1">
                  {invite.status === 'PENDING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResend(invite.id)}
                      disabled={isPending}
                      title="Resend SMS"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(invite.id)}
                    disabled={isPending}
                    title="Delete invite"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {invites.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No invites sent yet. Use the form above to invite a crafter.
          </div>
        )}
      </div>
    </div>
  );
}
