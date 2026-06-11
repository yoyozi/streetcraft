'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUpload {
  id: string;
  imageUrl: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  name?: string;
  costPrice?: number;
  weight?: number;
  height?: number;
  width?: number;
  depth?: number;
  availability?: number;
  description?: string;
  isUnique?: boolean;
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
  const pendingUploads = uploads.filter((u) => u.status === 'PENDING');
  const rejectedUploads = uploads.filter((u) => u.status === 'REJECTED');

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rejected upload permanently?')) return;
    const res = await fetch(`/api/admin/image-approvals/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      toast.success('Upload deleted');
      mutate();
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  };

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
    <div className='space-y-6'>
      {/* Rejected items alert */}
      {rejectedUploads.length > 0 && (
        <a
          href='#rejected-uploads'
          className='flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 hover:bg-red-100'
        >
          <AlertCircle className='h-4 w-4' />
          {rejectedUploads.length} rejected {rejectedUploads.length === 1 ? 'item' : 'items'} below — tap to review or delete.
        </a>
      )}

      {/* Pending approvals */}
      <div className='space-y-4'>
        {pendingUploads.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No pending image approvals.</p>
        ) : (
          pendingUploads.map((upload) => (
            <ImageApprovalCard key={upload.id} upload={upload} onUpdate={mutate} />
          ))
        )}
      </div>

      {/* Rejected section (last) */}
      {rejectedUploads.length > 0 && (
        <div id='rejected-uploads' className='scroll-mt-20 space-y-3 border-t pt-6'>
          <h2 className='text-lg font-semibold flex items-center gap-2'>
            <Badge variant='destructive'>REJECTED</Badge>
            <span className='text-sm font-normal text-muted-foreground'>({rejectedUploads.length})</span>
          </h2>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
            {rejectedUploads.map((upload) => (
              <div key={upload.id} className='border rounded-lg p-3 space-y-2'>
                <a
                  href={upload.imageUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='relative block aspect-square rounded-md overflow-hidden bg-muted'
                >
                  <Image src={upload.imageUrl} alt='Rejected upload' fill className='object-cover opacity-70' />
                </a>
                <p className='text-xs font-medium'>{upload.crafter.businessName}</p>
                {upload.rejectionReason && (
                  <p className='text-xs text-red-600'>Reason: {upload.rejectionReason}</p>
                )}
                <Button
                  size='sm'
                  variant='destructive'
                  className='w-full'
                  onClick={() => handleDelete(upload.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImageApprovalCard({ upload, onUpdate }: { upload: ImageUpload; onUpdate: () => void }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    costPrice: upload.costPrice?.toString() || '',
    weight: upload.weight?.toString() || '',
    height: upload.height?.toString() || '',
    width: upload.width?.toString() || '',
    depth: upload.depth?.toString() || '',
    availability: upload.availability?.toString() || '3',
    isUnique: upload.isUnique || false,
  });

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/image-approvals/${upload.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'approve',
          formData: formData 
        }),
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{upload.crafter.businessName}</span>
          <Badge variant="outline">{upload.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-6'>
        <div className='flex flex-col lg:flex-row gap-6'>
          <a
            href={upload.imageUrl}
            target='_blank'
            rel='noopener noreferrer'
            title='Click to view full-size image'
            className='relative w-full lg:w-48 h-48 flex-shrink-0 bg-muted rounded-lg overflow-hidden block group'
          >
            <Image
              src={upload.imageUrl}
              alt='Product image'
              fill
              className='object-contain group-hover:opacity-90'
            />
            <span className='absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded'>
              Click to enlarge
            </span>
          </a>

          <div className='flex-1 space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>
                Uploaded: {new Date(upload.createdAt).toLocaleString()}
              </p>
              <p className='text-sm text-muted-foreground'>
                Mobile: {upload.crafter.mobile}
              </p>
            </div>

            {/* Product Fields */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label>Cost Price</Label>
                <Input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  placeholder="0.0"
                />
              </div>
              <div>
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Width (cm)</Label>
                <Input
                  type="number"
                  value={formData.width}
                  onChange={(e) => setFormData({...formData, width: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Depth (cm)</Label>
                <Input
                  type="number"
                  value={formData.depth}
                  onChange={(e) => setFormData({...formData, depth: e.target.value})}
                  placeholder="0"
                />
              </div>
              {!formData.isUnique && (
                <div>
                  <Label>Availability (days)</Label>
                  <Input
                    type="number"
                    value={formData.availability}
                    onChange={(e) => setFormData({...formData, availability: e.target.value})}
                    placeholder="3"
                  />
                </div>
              )}
            </div>

            <label className='flex items-start gap-2 rounded-md border p-2 cursor-pointer'>
              <input
                type='checkbox'
                className='mt-1'
                checked={formData.isUnique}
                onChange={(e) => setFormData({...formData, isUnique: e.target.checked})}
              />
              <span className='text-sm'>
                <span className='font-medium'>Unique item</span>
                <span className='block text-xs text-muted-foreground'>One-of-a-kind (e.g. a painting). Only one will be sold.</span>
              </span>
            </label>

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