'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useSWR from 'swr';
import { toast } from 'sonner';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch stats');
  }
  return res.json();
};

export default function StorageCleanupSection() {
  const { data, error, isLoading } = useSWR<{
    success: boolean;
    data?: {
      totalFiles: number;
      referencedFiles: number;
      unreferencedFiles: number;
      estimatedSizeMB: number;
    };
    disabled?: boolean;
    error?: string;
  }>('/api/admin/cleanup-images', fetcher, {
    refreshInterval: 60000, // Refresh every minute
  });

  const stats = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-sm">Loading storage statistics...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-destructive">Failed to load storage statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Images in DB</p>
            <p className="text-2xl font-bold">{stats?.totalFiles || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Referenced</p>
            <p className="text-2xl font-bold text-green-600">{stats?.referencedFiles || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Est. Size</p>
            <p className="text-2xl font-bold">{stats?.estimatedSizeMB || 0} MB</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="text-2xl font-bold">
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                Active
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline">Database Only</Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          This shows images stored in the database (products, crafter work samples, profile images, etc.).
          Automatic cleanup is performed when crafters are rejected or product image uploads are rejected.
          Manual cleanup requires UploadThing admin API access.
        </p>
      </CardContent>
    </Card>
  );
}