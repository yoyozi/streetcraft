'use client';

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CrafterPayment {
  id: string;
  amount: number;
  status: string;
  paymentDate: string | null;
  paymentMethod: string | null;
  reference: string | null;
  createdAt: string;
  payout?: {
    id: string;
    reference: string | null;
    processedAt: string | null;
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch payments');
  }
  return res.json();
};

export default function CrafterPaymentList() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: CrafterPayment[] }>(
    '/api/crafter/payments?type=history',
    fetcher
  );

  const payments = data?.data || [];

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

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive">Failed to load payments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading payments...</div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">No payments found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
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
  );
}