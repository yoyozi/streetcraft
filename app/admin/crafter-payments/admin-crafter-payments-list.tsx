'use client';

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CrafterSummary {
  id: string;
  businessName: string;
  name: string;
  email: string;
  mobile: string;
  totalPending: number;
  totalProcessing: number;
  totalOwed: number;
  pendingPaymentCount: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch payment summaries');
  }
  return res.json();
};

export default function AdminCrafterPaymentsList() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: CrafterSummary[] }>(
    '/api/admin/crafter-payments',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  const summaries = data?.data || [];

  const totalPendingAll = summaries.reduce((sum, s) => sum + s.totalPending, 0);
  const totalProcessingAll = summaries.reduce((sum, s) => sum + s.totalProcessing, 0);
  const totalOwedAll = summaries.reduce((sum, s) => sum + s.totalOwed, 0);

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive">Failed to load payment summaries</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading payment summaries...</div>
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
            <div className="text-2xl font-bold">R{totalPendingAll.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{totalProcessingAll.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Owed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{totalOwedAll.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Crafter List */}
      {summaries.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">No crafters with pending payments</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Crafter Payment Summaries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crafter</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Processing</TableHead>
                  <TableHead>Total Owed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((summary) => (
                  <TableRow key={summary.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{summary.businessName}</div>
                        <div className="text-sm text-muted-foreground">{summary.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{summary.mobile}</div>
                        <div className="text-sm text-muted-foreground">{summary.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">R{summary.totalPending.toFixed(2)}</div>
                      <Badge variant="secondary" className="mt-1">
                        {summary.pendingPaymentCount} pending
                      </Badge>
                    </TableCell>
                    <TableCell>
                      R{summary.totalProcessing.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      R{summary.totalOwed.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/crafter-payments/${summary.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
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