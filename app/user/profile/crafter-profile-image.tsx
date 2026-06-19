'use client';

import { useRef, useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUploadThing } from '@/lib/uploadthing';
import { optimizeImage } from '@/lib/image-optimizer';
import { toast } from 'sonner';
import { updateCrafterProfileImage } from '@/lib/actions/crafter.actions';
import { User } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ProfileImageData {
  success: boolean;
  profileImage: string | null;
  fallbackImage: string | null;
}

export default function CrafterProfileImage() {
  const { data, mutate } = useSWR<ProfileImageData>('/api/crafter/profile-image', fetcher);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayImage = data?.profileImage ?? data?.fallbackImage ?? null;
  const isFallback = !data?.profileImage && !!data?.fallbackImage;

  const { startUpload } = useUploadThing('crafterProfileImage', {
    onUploadBegin: () => setUploading(true),
    onClientUploadComplete: async (res) => {
      setUploading(false);
      const url = res[0]?.url;
      if (!url) return;
      const result = await updateCrafterProfileImage(url);
      if (result.success) {
        toast.success('Profile image updated');
        mutate();
      } else {
        toast.error(result.error ?? 'Failed to save image');
      }
    },
    onUploadError: (err) => {
      setUploading(false);
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const optimized = await optimizeImage(file);
      startUpload([optimized]);
    }
    e.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Image</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
          {displayImage ? (
            <Image src={displayImage} alt="Profile" fill className="object-cover" />
          ) : (
            <User className="w-10 h-10 text-muted-foreground" />
          )}
        </div>

        {isFallback && (
          <p className="text-xs text-muted-foreground text-center">
            Showing your first product image. Upload a profile photo to personalise it.
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : displayImage ? 'Change Photo' : 'Upload Photo'}
        </Button>
      </CardContent>
    </Card>
  );
}
