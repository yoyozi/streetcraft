'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { toast } from 'sonner';

interface ImageUpload {
  id: string;
  imageUrl: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  crafter: {
    id: string;
    businessName: string;
    mobile: string;
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch uploads');
  }
  return res.json();
};

export default function ImageApprovalList() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: ImageUpload[] }>(
    '/api/admin/image-approvals',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  const uploads = data?.data || [];

  if (error) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <p className='text-destructive'>Failed to load uploads</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-lg'>Loading uploads...</div>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <p className='text-muted-foreground'>No pending image approvals</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {uploads.map((upload) => (
        <ImageApprovalCard key={upload.id} upload={upload} onUpdate={mutate} />
      ))}
    </div>
  );
}

function ImageApprovalCard({ upload, onUpdate }: { upload: ImageUpload; onUpdate: () => void }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/image-approvals/${upload.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Image approved');
        onUpdate();
      } else {
        toast.error(data.error || 'Failed to approve');
      }
    } catch (error) {
      toast.error('Failed to approve');
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/image-approvals/${upload.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectionReason }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Image rejected');
        onUpdate();
      } else {
        toast.error(data.error || 'Failed to reject');
      }
    } catch (error) {
      toast.error('Failed to reject');
    }
    setProcessing(false);
  };

  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex gap-6'>
          <div className='relative w-48 h-48 flex-shrink-0 bg-muted rounded-lg overflow-hidden'>
            <Image
              src={upload.imageUrl}
              alt='Product image'
              fill
              className='object-contain'
            />
          </div>

          <div className='flex-1 space-y-4'>
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <h3 className='font-semibold'>{upload.crafter.businessName}</h3>
                <Badge variant='outline'>{upload.crafter.mobile}</Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                Uploaded: {new Date(upload.createdAt).toLocaleString()}
              </p>
            </div>

            <div className='flex gap-2'>
              <Button
                onClick={handleApprove}
                disabled={processing}
                className='bg-green-600 hover:bg-green-700'
              >
                {processing ? 'Processing...' : 'Approve'}
              </Button>
              <Button
                onClick={handleReject}
                disabled={processing}
                variant='destructive'
              >
                {processing ? 'Processing...' : 'Reject'}
              </Button>
            </div>

            <div className='space-y-2'>
              <Label htmlFor={`rejection-${upload.id}`}>Rejection Reason</Label>
              <Textarea
                id={`rejection-${upload.id}`}
                placeholder='Provide a reason for rejection...'
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}