import { Metadata } from "next";
import { getOrderSummary } from "@/lib/actions/order.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign, Barcode, CreditCard, User } from "lucide-react";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { Table, TableHeader, TableRow, TableBody, TableCell, TableHead } from "@/components/ui/table";
import Link from "next/link";
import Charts from "./charts";
import { verifyAdmin } from '@/lib/actions/auth-actions';

export const metadata: Metadata = {
    title: "Admin Dashboard",
    description: "Admin Dashboard",
};

const AdminOverviewPage = async() => {
    // Single guard call handles authorization (redirects if not admin)
    await verifyAdmin();

    const summary = await getOrderSummary();

  return (
    <div className="space-y-2">
        <h1 className="h2-bold">Admin dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <Card>
                <CardHeader className='flex.flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
                    <BadgeDollarSign />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(summary.totalSales.toString()) || 0}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='flex.flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Sales</CardTitle>
                    <CreditCard />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatNumber(summary.ordersCount) || 0}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='flex.flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Customers</CardTitle>
                    <User />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatNumber(summary.usersCount) || 0}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-red-50">
                <CardHeader className='flex.flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Products</CardTitle>
                    <Barcode />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatNumber(summary.productsCount) || 0} / {formatNumber(summary.productsNeedingReview) || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {summary.productsNeedingReview > 0 ? `${summary.productsNeedingReview} need${summary.productsNeedingReview === 1 ? 's' : ''} review` : 'All reviewed'}
                    </p>
                </CardContent>
            </Card>

        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className='col-span-4'>
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
                    <CreditCard />
                </CardHeader>
                <CardContent>
                    <Charts data={{ 
                        salesData: summary.salesData,
                    }}/>
                </CardContent>
            </Card>

            <Card className='col-span-3'>
                <CardHeader>
                    <CardTitle>Recent sales</CardTitle>
                    <CreditCard />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>BUYER</TableHead>
                                <TableHead>DATE</TableHead>
                                <TableHead>TOTAL</TableHead>
                                <TableHead>ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary.latestOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>{ order?.user?.name ? order.user.name : 'Deleted user' }</TableCell>
                                    <TableCell>{ formatDateTime(order.createdAt).dateOnly }</TableCell>
                                    <TableCell>{ formatCurrency(order.totalPrice) }</TableCell>
                                    <TableCell>
                                        <Link href={`/order/${order.id}`}>
                                            Details
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

    </div>
  );
};

export default AdminOverviewPage;