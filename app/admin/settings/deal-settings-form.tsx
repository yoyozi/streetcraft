'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateDealSettings, DealSettings } from '@/lib/actions/settings.actions';
import { UploadButton } from '@/lib/uploadthing';

import Image from 'next/image';

export default function DealSettingsForm({ settings }: { settings: DealSettings }) {
  const [isActive, setIsActive] = useState(settings.isActive);
  const [targetDate, setTargetDate] = useState(settings.targetDate);
  const [title, setTitle] = useState(settings.title);
  const [description, setDescription] = useState(settings.description);
  const [image, setImage] = useState(settings.image);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await updateDealSettings({
      isActive,
      targetDate,
      title,
      description,
      image,
    });

    if (result.success) {
      toast.success('Deal settings saved');
    } else {
      toast.error(result.error || 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal of the Month</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='deal-active'
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(!!checked)}
            />
            <Label htmlFor='deal-active'>Show deal on homepage</Label>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='deal-title'>Title</Label>
            <Input
              id='deal-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Deal Of The Month'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='deal-date'>Target Date</Label>
            <Input
              id='deal-date'
              type='datetime-local'
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <p className='text-sm text-muted-foreground'>
              The countdown will count down to this date. Once passed, the deal section hides automatically.
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='deal-description'>Description</Label>
            <Textarea
              id='deal-description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder='Describe the deal...'
            />
          </div>

          <div className='space-y-2'>
            <Label>Deal Image</Label>
            {image ? (
              <div className='flex items-center gap-4'>
                <Image
                  src={image}
                  alt='Deal image'
                  width={200}
                  height={200}
                  className='rounded-md object-cover'
                />
                <Button
                  type='button'
                  variant='destructive'
                  size='sm'
                  onClick={() => setImage('')}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <UploadButton
                endpoint='imageUploader'
                onClientUploadComplete={(res: { url: string }[]) => {
                  const imageUrl = res[0].url;
                  setImage(imageUrl);
                  toast.success('Image uploaded');
                  
                  // Optimize in background and update state with new URL
                  optimizeImageInBackground(imageUrl);
                }}
                onUploadError={(error: Error) => {
                  toast.error(`Upload failed: ${error.message}`);
                }}
              />
            )}
          </div>

          <Button type='submit' disabled={saving}>
            {saving ? 'Saving...' : 'Save Deal Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  // Background optimization function
  const optimizeImageInBackground = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/optimize-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      
      const result = await response.json();
      if (result.success && result.newUrl) {
        // Update the state with the new optimized URL
        if (image === result.oldUrl) {
          setImage(result.newUrl);
          console.log('Deal image optimized and URL updated:', result);
        }
      }
    } catch (error) {
      console.warn('Background optimization failed:', error);
    }
  };
}
