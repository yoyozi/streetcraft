'use client';

import { useState, useTransition } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import DeleteDialog from '@/components/shared/delete-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { deleteOrder } from '@/lib/actions/order.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

type Order = {
  id: string;
  createdAt: Date;
  user: { name: string };
  totalPrice: number;
  isPaid: boolean;
  paidAt: Date | null;
  isDelivered: boolean;
  deliveredAt: Date | null;
  paymentMethod: string;
  paymentResult: unknown;
};

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Toggle individual order selection
  const toggleOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Toggle all orders selection
  const toggleAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((order) => order.id));
    }
  };

  // Delete selected orders
  const handleDeleteSelected = () => {
    if (selectedOrders.length === 0) {
      toast.error('No orders selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedOrders.length} order(s)?`)) {
      return;
    }

    startTransition(async () => {
      let successCount = 0;
      let errorCount = 0;

      for (const orderId of selectedOrders) {
        try {
          const result = await deleteOrder(orderId);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} order(s)`);
        setSelectedOrders([]);
        router.refresh();
      }

      if (errorCount > 0) {
        toast.error(`Failed to delete ${errorCount} order(s)`);
      }
    });
  };

  return (
    <div className="space-y-4">
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedOrders.length} order(s) selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedOrders([])}
            disabled={isPending}
          >
            Clear Selection
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onCheckedChange={toggleAll}
                aria-label="Select all orders"
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>DATE</TableHead>
            <TableHead>BUYER</TableHead>
            <TableHead>TOTAL</TableHead>
            <TableHead>PAID</TableHead>
            <TableHead>DELIVERED</TableHead>
            <TableHead>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Checkbox
                  checked={selectedOrders.includes(order.id)}
                  onCheckedChange={() => toggleOrder(order.id)}
                  aria-label={`Select order ${formatId(order.id)}`}
                />
              </TableCell>
              <TableCell>{formatId(order.id)}</TableCell>
              <TableCell>{formatDateTime(order.createdAt).dateTime}</TableCell>
              <TableCell>{order.user.name}</TableCell>
              <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
              <TableCell>
                {order.isPaid && order.paidAt
                  ? `${
                      order.paymentResult &&
                      typeof order.paymentResult === 'object' &&
                      'id' in order.paymentResult &&
                      typeof order.paymentResult.id === 'string' &&
                      order.paymentResult.id.startsWith('cod_')
                        ? 'byAdmin'
                        : order.paymentMethod
                    } - ${formatDateTime(order.paidAt).dateTime}`
                  : 'Not Paid'}
              </TableCell>
              <TableCell>
                {order.isDelivered && order.deliveredAt
                  ? formatDateTime(order.deliveredAt).dateTime
                  : 'Not Delivered'}
              </TableCell>
              <TableCell className="flex gap-1">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/order/${order.id}`}>Details</Link>
                </Button>
                <DeleteDialog id={order.id} action={deleteOrder} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
