'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { approveCrafter, rejectCrafter } from '@/lib/actions/crafter.actions';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface PendingCrafter {
  id: string;
  businessName: string;
  description: string | null;
  location: string;
  mobile: string;
  workSamples: string[];
  createdAt: Date;
  user: { name: string | null; phoneNumber: string | null };
}

export default function ReviewPageClient({ crafters: initial }: { crafters: PendingCrafter[] }) {
  const [crafters, setCrafters] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approveCrafter(id);
      if (result.success) {
        toast.success('Crafter approved! SMS sent.');
        setCrafters((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error(result.error || 'Failed to approve');
      }
    });
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a reason for rejection');
      return;
    }
    startTransition(async () => {
      const result = await rejectCrafter(id, rejectReason.trim());
      if (result.success) {
        toast.success('Crafter rejected. SMS sent.');
        setCrafters((prev) => prev.filter((c) => c.id !== id));
        setRejectId(null);
        setRejectReason('');
      } else {
        toast.error(result.error || 'Failed to reject');
      }
    });
  };

  if (crafters.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No pending applications</p>
        <p className="text-sm mt-2">New applications will appear here when crafters register via invite.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin/crafters">Back to Crafters</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh] w-full">
            <Image
              src={selectedImage}
              alt="Work sample"
              width={1200}
              height={800}
              className="object-contain w-full h-full rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {crafters.map((crafter) => (
          <Card key={crafter.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{crafter.businessName}</CardTitle>
                  <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{crafter.location}</span>
                    <span>{crafter.mobile}</span>
                    <span>{new Date(crafter.createdAt).toLocaleDateString('en-ZA')}</span>
                  </div>
                </div>
                <Badge variant="secondary">PENDING</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Craft description */}
              {crafter.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Their craft:</p>
                  <p className="text-sm text-muted-foreground">{crafter.description}</p>
                </div>
              )}

              {/* Work samples */}
              {crafter.workSamples.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Work samples:</p>
                  <div className="flex gap-3 flex-wrap">
                    {crafter.workSamples.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(url)}
                        className="relative w-32 h-32 rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                      >
                        <Image
                          src={url}
                          alt={`Work sample ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t">
                {rejectId === crafter.id ? (
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Reason for rejection (internal note)..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(crafter.id)}
                        disabled={isPending}
                      >
                        {isPending ? 'Rejecting...' : 'Confirm Reject'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setRejectId(null); setRejectReason(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={() => handleApprove(crafter.id)}
                      disabled={isPending}
                    >
                      {isPending ? 'Approving...' : 'Approve'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRejectId(crafter.id)}
                      disabled={isPending}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
