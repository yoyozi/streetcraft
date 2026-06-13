'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updatePaymentSettings, PaymentSettings } from '@/lib/actions/settings.actions';

export default function PaymentSettingsForm({ settings }: { settings: PaymentSettings }) {
  const [form, setForm] = useState<PaymentSettings>(settings);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await updatePaymentSettings(form);
    if (result.success) {
      toast.success('Payment settings saved');
    } else {
      toast.error(result.error || 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Gateways</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-3'>
            <p className='text-sm text-muted-foreground'>Enable the payment methods customers can use at checkout.</p>

            <div className='flex items-center gap-3'>
              <Checkbox id='eft' checked={form.eftEnabled} onCheckedChange={(c) => set('eftEnabled', c === true)} />
              <Label htmlFor='eft'>EFT (bank transfer)</Label>
            </div>
            <div className='flex items-center gap-3'>
              <Checkbox id='paystack' checked={form.paystackEnabled} onCheckedChange={(c) => set('paystackEnabled', c === true)} />
              <Label htmlFor='paystack'>Paystack</Label>
            </div>
            <div className='flex items-center gap-3'>
              <Checkbox id='yoco' checked={form.yocoEnabled} onCheckedChange={(c) => set('yocoEnabled', c === true)} />
              <Label htmlFor='yoco'>Yoco</Label>
            </div>
            <p className='text-xs text-muted-foreground'>
              If none are enabled, EFT is used as a fallback so checkout always has an option.
            </p>
          </div>

          {form.eftEnabled && (
            <div className='space-y-4 border-t pt-4'>
              <p className='text-sm font-medium'>EFT Banking Details (shown to customers paying by EFT)</p>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='bankName'>Bank Name</Label>
                  <Input id='bankName' value={form.eftBankName} onChange={(e) => set('eftBankName', e.target.value)} />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='accountHolder'>Account Holder</Label>
                  <Input id='accountHolder' value={form.eftAccountHolder} onChange={(e) => set('eftAccountHolder', e.target.value)} />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='accountNumber'>Account Number</Label>
                  <Input id='accountNumber' value={form.eftAccountNumber} onChange={(e) => set('eftAccountNumber', e.target.value)} />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='branchCode'>Branch Code</Label>
                  <Input id='branchCode' value={form.eftBranchCode} onChange={(e) => set('eftBranchCode', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <Button type='submit' disabled={saving}>
            {saving ? 'Saving...' : 'Save Payment Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
