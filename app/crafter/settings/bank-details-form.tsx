'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getCrafterBankDetails, updateCrafterBankDetails } from '@/lib/actions/crafter-payment.actions';
import { BadgeCheck, Landmark } from 'lucide-react';

const SA_BANKS = [
  'ABSA',
  'African Bank',
  'Capitec Bank',
  'Discovery Bank',
  'FNB (First National Bank)',
  'Investec',
  'Nedbank',
  'Standard Bank',
  'TymeBank',
  'Bidvest Bank',
  'Other',
];

export default function BankDetailsForm() {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [accountType, setAccountType] = useState('Cheque');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCrafterBankDetails().then((res) => {
      if (res.success && res.data) {
        setBankName(res.data.bankName || '');
        setAccountNumber(res.data.bankAccountNumber || '');
        setBranchCode(res.data.bankBranchCode || '');
        setAccountType(res.data.bankAccountType || 'Cheque');
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const res = await updateCrafterBankDetails({ bankName, bankAccountNumber: accountNumber, bankBranchCode: branchCode, bankAccountType: accountType });
    if (res.success) {
      toast.success(res.message || 'Banking details saved');
      setSaved(true);
    } else {
      toast.error(res.error || 'Failed to save');
    }
    setSaving(false);
  };

  if (loading) return <div className="text-sm text-muted-foreground py-6">Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Banking Details</CardTitle>
        </div>
        <CardDescription>
          These details are used by the admin to process your earnings via EFT. They are kept private and never shown to buyers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="bankName">Bank</Label>
          <Select value={bankName} onValueChange={setBankName}>
            <SelectTrigger id="bankName">
              <SelectValue placeholder="Select your bank" />
            </SelectTrigger>
            <SelectContent>
              {SA_BANKS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="accountType">Account Type</Label>
          <Select value={accountType} onValueChange={setAccountType}>
            <SelectTrigger id="accountType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cheque">Cheque</SelectItem>
              <SelectItem value="Savings">Savings</SelectItem>
              <SelectItem value="Current">Current</SelectItem>
              <SelectItem value="Transmission">Transmission</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="e.g. 1234567890"
            maxLength={20}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="branchCode">Branch Code</Label>
          <Input
            id="branchCode"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
            placeholder="e.g. 632005"
            maxLength={10}
          />
          <p className="text-xs text-muted-foreground">Most South African banks use a universal branch code.</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving || !bankName || !accountNumber || !branchCode}>
            {saving ? 'Saving...' : 'Save Banking Details'}
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <BadgeCheck className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
