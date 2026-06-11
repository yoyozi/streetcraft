'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadDropzone } from '@/lib/uploadthing';
import { optimizeImages } from '@/lib/image-optimizer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';

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

interface UploadData {
  id: string;
  imageUrl: string;
  status: string;
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
}

export default function ImageUploadSection({ onUpdate }: ImageUploadSectionProps) {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; canUpload: boolean; remaining: number; limit: number; pendingCount: number; uploads?: UploadData[] }>(
    '/api/crafter/image-uploads',
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  const uploadStatus = data;
  const [uploadedThumbnail, setUploadedThumbnail] = useState<string | null>(null);
  const [formDataMap, setFormDataMap] = useState<Record<string, {
    costPrice: string;
    weight: string;
    height: string;
    width: string;
    depth: string;
    availability: string;
    isUnique: boolean;
    submitted: boolean;
  }>>({});

  const uploads = uploadStatus?.uploads || [];
  const pendingUploads = uploads.filter(u => u.status === 'PENDING');
  const needsDetails = pendingUploads.filter(u => u.costPrice === null || u.costPrice === undefined || u.weight === null || u.weight === undefined || u.height === null || u.height === undefined || u.width === null || u.width === undefined || u.depth === null || u.depth === undefined);
  const submittedForApproval = pendingUploads.filter(u => u.costPrice !== null && u.costPrice !== undefined && u.weight !== null && u.weight !== undefined && u.height !== null && u.height !== undefined && u.width !== null && u.width !== undefined && u.depth !== null && u.depth !== undefined);
  
  const rejectedUploads = uploads.filter(u => u.status === 'REJECTED');

  // Initialize formDataMap with existing upload values
  useEffect(() => {
    if (uploads) {
      const initialMap: Record<string, {
        costPrice: string;
        weight: string;
        height: string;
        width: string;
        depth: string;
        availability: string;
        isUnique: boolean;
        submitted: boolean;
      }> = {};
      
      uploads.forEach(upload => {
        if (upload.costPrice || upload.weight || upload.height || upload.width || upload.depth) {
          initialMap[upload.id] = {
            costPrice: upload.costPrice?.toString() || '',
            weight: upload.weight?.toString() || '',
            height: upload.height?.toString() || '',
            width: upload.width?.toString() || '',
            depth: upload.depth?.toString() || '',
            availability: upload.availability?.toString() || '3',
            isUnique: upload.isUnique || false,
            submitted: false,
          };
        }
      });
      
      setFormDataMap(initialMap);
    }
  }, [uploads]);

  const handleUploadComplete = async (res: { url: string }[]) => {
    const imageUrl = res[0].url;
    setUploadedThumbnail(imageUrl);
    
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
        
        setTimeout(() => {
          setUploadedThumbnail(null);
        }, 5000);
      } else {
        toast.error(result.error || 'Failed to submit image');
        setUploadedThumbnail(null);
      }
    } catch (error) {
      toast.error('Failed to submit image');
      setUploadedThumbnail(null);
    }
  };

  const handleDeleteUpload = async (uploadId: string) => {
    if (!confirm('Are you sure you want to delete this upload?')) return;

    try {
      const response = await fetch(`/api/crafter/image-uploads/${uploadId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Upload deleted successfully');
        mutate();
        if (onUpdate) onUpdate();
      } else {
        toast.error(result.error || 'Failed to delete upload');
      }
    } catch (error) {
      toast.error('Failed to delete upload');
    }
  };

  const handleSubmitForApproval = async (uploadId: string) => {
    try {
      const formData = formDataMap[uploadId];
      if (!formData) {
        toast.error('Please fill in all fields');
        return;
      }

      const response = await fetch(`/api/crafter/image-uploads/${uploadId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Submitted for approval');
        setFormDataMap(prev => ({
          ...prev,
          [uploadId]: { ...prev[uploadId], submitted: true }
        }));
        // Force a refresh
        await mutate();
        if (onUpdate) onUpdate();
      } else {
        toast.error(result.error || result.message || 'Failed to submit');
      }
    } catch (error) {
      toast.error('Network error: Failed to submit');
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle>Upload Product Images</CardTitle>
          <Badge variant="outline">
            {uploadStatus?.remaining ?? 0} of {uploadStatus?.limit ?? 5} remaining today
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Upload product images and fill in the details. Submit for admin approval to create products.
        </p>

        {rejectedUploads.length > 0 && (
          <a
            href="#rejected-uploads"
            className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            You have {rejectedUploads.length} rejected {rejectedUploads.length === 1 ? 'image' : 'images'}. Tap to review and remove.
          </a>
        )}
        
        {uploadStatus?.canUpload ? (
        <div className="bg-chart-2 rounded-2xl">
          <UploadDropzone
            endpoint="crafterProductImage"
            onBeforeUploadBegin={(files) => optimizeImages(files)}
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error: Error) => {
              toast.error(`Upload failed: ${error.message}`);
            }}
            config={{
              mode: 'auto',
              maxFileCount: 1,
            }}
          />
        </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              You have reached your daily upload limit of {uploadStatus?.limit || 5} images. You can upload more tomorrow.
            </p>
            <p className="text-sm font-medium">
              You can still fill in the details for your uploaded images below.
            </p>
          </div>
        )}

        {uploadedThumbnail && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Uploaded Image:</p>
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <Image 
                src={uploadedThumbnail} 
                alt="Uploaded" 
                fill 
                className="object-cover"
              />
            </div>
            <p className="text-xs text-green-600 mt-2">✓ Submitted for approval</p>
          </div>
        )}

        {needsDetails.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              ⚠️ Please fill in the fields below each image to submit for approval
            </p>
          </div>
        )}

        {/* PENDING Section */}
        {needsDetails.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="secondary">NEEDS DETAILS</Badge>
              <span className="text-sm font-normal text-muted-foreground">({needsDetails.length})</span>
            </h3>
            <div className="space-y-4">
              {needsDetails.map((upload) => (
                <div key={upload.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <Image src={upload.imageUrl} alt="Upload" fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="space-y-3">
                        <div>
                          <Label>Cost Price</Label>
                          <Input
                            type="number"
                            value={formDataMap[upload.id]?.costPrice || upload.costPrice?.toString() || ''}
                            onChange={(e) => setFormDataMap({
                              ...formDataMap,
                              [upload.id]: { ...formDataMap[upload.id], costPrice: e.target.value, submitted: false }
                            })}
                            placeholder="0.00"
                            disabled={formDataMap[upload.id]?.submitted}
                          />
                        </div>
                        <div>
                          <Label>Weight (kg)</Label>
                          <Input
                            type="number"
                            value={formDataMap[upload.id]?.weight || upload.weight?.toString() || ''}
                            onChange={(e) => setFormDataMap({
                              ...formDataMap,
                              [upload.id]: { ...formDataMap[upload.id], weight: e.target.value, submitted: false }
                            })}
                            placeholder="0.0"
                            disabled={formDataMap[upload.id]?.submitted}
                          />
                        </div>
                        <div>
                          <Label>Height (cm)</Label>
                          <Input
                            type="number"
                            value={formDataMap[upload.id]?.height || upload.height?.toString() || ''}
                            onChange={(e) => setFormDataMap({
                              ...formDataMap,
                              [upload.id]: { ...formDataMap[upload.id], height: e.target.value, submitted: false }
                            })}
                            placeholder="0"
                            disabled={formDataMap[upload.id]?.submitted}
                          />
                        </div>
                        <div>
                          <Label>Width (cm)</Label>
                          <Input
                            type="number"
                            value={formDataMap[upload.id]?.width || upload.width?.toString() || ''}
                            onChange={(e) => setFormDataMap({
                              ...formDataMap,
                              [upload.id]: { ...formDataMap[upload.id], width: e.target.value, submitted: false }
                            })}
                            placeholder="0"
                            disabled={formDataMap[upload.id]?.submitted}
                          />
                        </div>
                        <div>
                          <Label>Depth (cm)</Label>
                          <Input
                            type="number"
                            value={formDataMap[upload.id]?.depth || upload.depth?.toString() || ''}
                            onChange={(e) => setFormDataMap({
                              ...formDataMap,
                              [upload.id]: { ...formDataMap[upload.id], depth: e.target.value, submitted: false }
                            })}
                            placeholder="0"
                            disabled={formDataMap[upload.id]?.submitted}
                          />
                        </div>
                        {!formDataMap[upload.id]?.isUnique && (
                          <div>
                            <Label>Availability (days)</Label>
                            <Input
                              type="number"
                              value={formDataMap[upload.id]?.availability || upload.availability?.toString() || '3'}
                              onChange={(e) => setFormDataMap({
                                ...formDataMap,
                                [upload.id]: { ...formDataMap[upload.id], availability: e.target.value, submitted: false }
                              })}
                              placeholder="3"
                              disabled={formDataMap[upload.id]?.submitted}
                            />
                          </div>
                        )}
                        <label className="flex items-start gap-2 rounded-md border p-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={formDataMap[upload.id]?.isUnique || false}
                            onChange={(e) => setFormDataMap({
                              ...formDataMap,
                              [upload.id]: { ...formDataMap[upload.id], isUnique: e.target.checked, submitted: false }
                            })}
                            disabled={formDataMap[upload.id]?.submitted}
                          />
                          <span className="text-sm">
                            <span className="font-medium">Unique item</span>
                            <span className="block text-xs text-muted-foreground">One-of-a-kind (e.g. a painting). Only one will be sold.</span>
                          </span>
                        </label>
                      </div>
                      <Button 
                        onClick={() => handleSubmitForApproval(upload.id)} 
                        className="w-full mt-3"
                        disabled={formDataMap[upload.id]?.submitted}
                      >
                        {formDataMap[upload.id]?.submitted ? 'Awaiting Approval' : 'Submit for Approval'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submitted for Approval Section */}
        {submittedForApproval.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge className="bg-yellow-600">SUBMITTED FOR APPROVAL</Badge>
              <span className="text-sm font-normal text-muted-foreground">({submittedForApproval.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {submittedForApproval.map((upload) => (
                <div key={upload.id} className="relative">
                  <div className="relative aspect-square rounded-lg overflow-hidden border">
                    <Image src={upload.imageUrl} alt="Upload" fill className="object-cover" />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-yellow-600 text-xs">SUBMITTED</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cost: R{upload.costPrice}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(upload.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved uploads are removed from here — they now appear in the Products section */}

        {/* REJECTED Section */}
        {rejectedUploads.length > 0 && (
          <div id="rejected-uploads" className="scroll-mt-20">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Badge variant="destructive">REJECTED</Badge>
              <span className="text-sm font-normal text-muted-foreground">({rejectedUploads.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rejectedUploads.map((upload) => (
                <div key={upload.id} className="relative">
                  <div className="relative aspect-square rounded-lg overflow-hidden border opacity-60">
                    <Image src={upload.imageUrl} alt="Upload" fill className="object-cover" />
                  </div>
                  <div className="mt-1 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-2">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">Reason for rejection:</p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {upload.rejectionReason || 'No reason provided'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="mt-2 w-full"
                    onClick={() => handleDeleteUpload(upload.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}