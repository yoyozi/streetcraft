'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { markCrafterPaymentsPaid } from '@/lib/actions/crafter-payment.actions';
import { toast } from 'sonner';

interface CrafterPayment {
  id: string;
  amount: number;
  status: string;
  paymentDate: string | null;
  paymentMethod: string | null;
  reference: string | null;
  orderId: string;
  createdAt: string;
  payout?: {
    id: string;
    reference: string | null;
    processedAt: string | null;
    status: string;
  };
}

interface CrafterInfo {
  businessName: string;
  mobile: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankBranchCode: string | null;
  bankAccountType: string | null;
  user: { name: string; email: string };
}

interface CrafterPaymentDetailsProps {
  crafterId: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch payment history');
  }
  return res.json();
};

export default function AdminCrafterPaymentDetails({
  crafterId,
}: CrafterPaymentDetailsProps) {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: CrafterPayment[]; crafter: CrafterInfo | null }>(
    `/api/admin/crafter-payments/${crafterId}`,
    fetcher
  );

  const payments = data?.data || [];
  const crafter = data?.crafter || null;
  const [paymentMethod, setPaymentMethod] = useState('EFT');
  const [reference, setReference] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleMarkPaid = async () => {
    if (!paymentMethod.trim()) {
      toast.error('Enter a payment method');
      return;
    }
    setProcessing(true);
    const res = await markCrafterPaymentsPaid(crafterId, { paymentMethod, reference });
    if (res.success) {
      toast.success(res.message || 'Payments marked as paid');
      setReference('');
      mutate();
    } else {
      toast.error(res.error || 'Failed to mark as paid');
    }
    setProcessing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'PROCESSING':
        return <Badge variant="default">Processing</Badge>;
      case 'PAID':
        return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPending = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalProcessing = payments
    .filter(p => p.status === 'PROCESSING')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive">Failed to load payment history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading payment history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Crafter Banking Details */}
      {crafter && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {crafter.businessName} — {crafter.user.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <div><span className="text-muted-foreground">Mobile:</span> {crafter.mobile}</div>
              <div><span className="text-muted-foreground">Email:</span> {crafter.user.email}</div>
            </div>
            {crafter.bankName ? (
              <div className="mt-3 p-3 bg-muted rounded-md grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div><span className="text-muted-foreground">Bank:</span> <strong>{crafter.bankName}</strong></div>
                <div><span className="text-muted-foreground">Account type:</span> {crafter.bankAccountType}</div>
                <div><span className="text-muted-foreground">Account no:</span> <strong className="font-mono">{crafter.bankAccountNumber}</strong></div>
                <div><span className="text-muted-foreground">Branch code:</span> <span className="font-mono">{crafter.bankBranchCode}</span></div>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                ⚠ Banking details not yet provided by this crafter. Ask them to add their details via their dashboard → Settings.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{totalPending.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{totalProcessing.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R{totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Record Payout — mark all pending as paid */}
      {totalPending > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Record Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Pay the crafter the pending total of <span className="font-semibold">R{totalPending.toFixed(2)}</span>,
              then record it here to mark all pending payments as <strong>Paid</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="space-y-1">
                <Label htmlFor="method">Payment Method</Label>
                <Input id="method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="EFT" className="w-40" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. EFT ref / date" className="w-56" />
              </div>
              <Button onClick={handleMarkPaid} disabled={processing} className="bg-green-600 hover:bg-green-700">
                {processing ? 'Recording...' : `Mark R${totalPending.toFixed(2)} as Paid`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">No payments found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.orderId.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-semibold">
                      R{payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {payment.paymentDate
                        ? new Date(payment.paymentDate).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {payment.payout?.reference || payment.reference || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}