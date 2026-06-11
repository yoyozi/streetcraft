'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateDigestSettings, DigestSettings } from '@/lib/actions/settings.actions';

export default function DigestSettingsForm({ settings }: { settings: DigestSettings }) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await updateDigestSettings({ enabled });

    if (result.success) {
      toast.success('Digest settings saved');
    } else {
      toast.error(result.error || 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Admin Email Digest</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='flex items-start gap-3'>
            <Checkbox
              id='digest-enabled'
              checked={enabled}
              onCheckedChange={(checked) => setEnabled(checked === true)}
            />
            <div className='space-y-1'>
              <Label htmlFor='digest-enabled'>Send the daily digest email</Label>
              <p className='text-sm text-muted-foreground'>
                When enabled, admins receive one daily email summarising products awaiting approval
                and products a crafter changed that need review. When disabled, no digest is sent
                even if the scheduler runs.
              </p>
            </div>
          </div>

          <Button type='submit' disabled={saving}>
            {saving ? 'Saving...' : 'Save Digest Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
