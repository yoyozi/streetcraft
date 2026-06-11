'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateUploaderSettings, UploaderSettings } from '@/lib/actions/settings.actions';

export default function UploaderSettingsForm({ settings }: { settings: UploaderSettings }) {
  const [dailyUploadLimit, setDailyUploadLimit] = useState(settings.dailyUploadLimit);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await updateUploaderSettings({
      dailyUploadLimit,
    });

    if (result.success) {
      toast.success('Uploader settings saved');
    } else {
      toast.error(result.error || 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crafter Upload Limits</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='daily-limit'>Daily Upload Limit</Label>
            <Input
              id='daily-limit'
              type='number'
              min='1'
              max='50'
              value={dailyUploadLimit}
              onChange={(e) => setDailyUploadLimit(parseInt(e.target.value) || 5)}
            />
            <p className='text-sm text-muted-foreground'>
              Maximum number of product image uploads a crafter can submit per day for admin approval.
            </p>
          </div>

          <Button type='submit' disabled={saving}>
            {saving ? 'Saving...' : 'Save Upload Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}