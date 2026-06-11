'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadButton } from '@/lib/uploadthing';

import { toast } from 'sonner';
import useSWR from 'swr';
import Image from 'next/image';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch upload status');
  }
  return res.json();
};

interface ImageUploadSectionProps {
  onUpdate?: () => void;
}

export default function ImageUploadSection({ onUpdate }: ImageUploadSectionProps) {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; canUpload: boolean; remaining: number; limit: number; pendingCount: number }>(
    '/api/crafter/image-uploads',
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  const uploadStatus = data;

  const handleUploadComplete = async (res: { url: string }[]) => {
    const imageUrl = res[0].url;
    
    // Submit immediately without waiting for optimization
    try {
      const response = await fetch('/api/crafter/image-uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || 'Image submitted for approval');
        mutate();
        if (onUpdate) onUpdate();
        
        // Optimize in background after upload and update database with new URL
        if (result.data?.id) {
          optimizeImageInBackground(imageUrl, result.data.id);
        }
      } else {
        toast.error(result.error || 'Failed to submit image');
      }
    } catch (error) {
      toast.error('Failed to submit image');
    }
  };

  const optimizeImageInBackground = async (imageUrl: string, uploadId: string) => {
    try {
      const response = await fetch('/api/optimize-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl, 
          entityType: 'productImageUpload',
          entityId: uploadId 
        }),
      });

      const result = await response.json();
      
      if (result.success && result.newUrl) {
        // Update the database with the new optimized URL
        await fetch('/api/crafter/image-uploads/update-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            uploadId, 
            newUrl: result.newUrl,
            oldUrl: result.oldUrl 
          }),
        });
      }
    } catch (error) {
      console.warn('Background optimization failed:', error);
      // Don't show error to user - optimization is optional
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-sm">Loading upload status...</div>
        </CardContent>
      </Card>
    );
  }

  if (!uploadStatus?.canUpload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload Product Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              You have reached your daily upload limit of {uploadStatus?.limit || 5} images.
            </p>
            <p className="text-sm text-muted-foreground">
              You can upload more images tomorrow.
            </p>
            {(uploadStatus?.pendingCount ?? 0) > 0 && (
              <Badge variant="secondary">
                {uploadStatus?.pendingCount} pending approval
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upload Product Images</CardTitle>
          <Badge variant="outline">
            {uploadStatus?.remaining ?? 0} of {uploadStatus?.limit ?? 5} remaining today
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload product images for admin approval. Once approved, you can add them to your products.
        </p>
        
        <UploadButton
          endpoint="crafterProductImage"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={(error: Error) => {
            toast.error(`Upload failed: ${error.message}`);
          }}
        />

        {(uploadStatus?.pendingCount ?? 0) > 0 && (
          <div className="text-sm text-muted-foreground">
            You have {uploadStatus?.pendingCount ?? 0} image{(uploadStatus?.pendingCount ?? 0) > 1 ? 's' : ''} pending approval.
          </div>
        )}
      </CardContent>
    </Card>
  );
}