import { getAllOrders } from '@/lib/actions/order.actions';
import { Metadata } from 'next';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Pagination from '@/components/shared/pagination';
import OrdersTable from './orders-table';

export const metadata: Metadata = {
  title: 'Admin Orders',
};

const AdminOrdersPage = async (props: { searchParams: Promise<{ page: string; query: string }>;}) => {

  await verifyAdmin();

  const { page = '1', query:searchText } = await props.searchParams;

  const orders = await getAllOrders({
    page: Number(page),
    query: searchText,
  });

  // Serialize orders data for client component
  const serializedOrders = orders.data.map((order) => ({
    id: order.id,
    createdAt: order.createdAt,
    user: { name: order.userId?.name || 'Unknown' },
    totalPrice: Number(order.totalPrice),
    isPaid: order.isPaid,
    paidAt: order.paidAt,
    isDelivered: order.isDelivered,
    deliveredAt: order.deliveredAt,
    paymentMethod: order.paymentMethod,
    paymentResult: order.paymentResult,
  }));

  return (
    <div className='space-y-2'>
      <div className="flex items-center gap-3">
        <h1 className="h2-bold">Orders</h1>
        {/* if searchText exists allow us to see a function to clear it */}
        { searchText && (
          <div>Filtered by <i>&quot;{searchText}&quot;</i>{' '}
            <Link href='/admin/orders'>
              <Button variant='outline' size='sm'>Remove filter</Button>
            </Link>
          </div>
        )}
      </div>
      <div className='overflow-x-auto'>
        <OrdersTable orders={serializedOrders} />
        {orders.totalPages > 1 && (
          <Pagination page={Number(page) || 1} totalPages={orders?.totalPages} />
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;