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
  orderId: string;
  createdAt: string;
  payout?: {
    id: string;
    reference: string | null;
    processedAt: string | null;
    status: string;
  };
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
  const { data, error, isLoading } = useSWR<{ success: boolean; data: CrafterPayment[] }>(
    `/api/admin/crafter-payments/${crafterId}`,
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