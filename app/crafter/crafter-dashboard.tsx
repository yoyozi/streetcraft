'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CrafterProductsList from './crafter-products-list';
import ImageUploadSection from './image-upload-section';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CrafterDashboardProps {
  crafterName: string;
}

interface DashboardStats {
  registeredItems: number;
  approvedItems: number;
  soldItems: number;
  fundsDue: number;
}

interface PaymentSummary {
  totalPending: number;
  totalProcessing: number;
  totalPaid: number;
  paymentCount: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch stats');
  }
  return res.json();
};

export default function CrafterDashboard({ crafterName }: CrafterDashboardProps) {
  const { data: statsData, error: statsError } = useSWR<{ success: boolean; data: DashboardStats }>(
    '/api/crafter/dashboard/stats',
    fetcher
  );

  const { data: paymentData } = useSWR<{ success: boolean; data: PaymentSummary }>(
    '/api/crafter/payments',
    fetcher
  );

  const stats = statsData?.data;
  const payments = paymentData?.data;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">{crafterName} Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {stats && (
          <>
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Products Approved
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">{stats.approvedItems}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Funds Due
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">R{stats.fundsDue.toFixed(2)}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Image Upload Section */}
      <ImageUploadSection />

      {/* Products List */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Products</h2>
        <CrafterProductsList crafterName={crafterName} />
      </div>
    </div>
  );
}