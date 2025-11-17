import { Metadata } from "next";
import { getMyOrders } from "@/lib/actions/order.actions";
import { 
  Table, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableBody,
  TableCell } from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";
import Link from "next/link";
import Pagination from "@/components/shared/pagination";

export const metadata: Metadata = {
    title: "My Orders",
    description: "Users Orders",
}
const OrdersPage = async (
  props: { searchParams: Promise<{ page?: string }> }
) => {
    const { page: pageParam } = await props.searchParams;
    const page = Number(pageParam) || 1;

    // get the orders
    const orders = await getMyOrders({
      page,  
    });

    //console.log(orders)

    return (
      <div className="space-y-2">
        <h2 className="h2-bold">Orders</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>TOTAL</TableHead>
              <TableHead>PAID</TableHead>
              <TableHead>DELIVERED</TableHead>
              <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{formatId(order.id)}</TableCell>
                  <TableCell>{formatDateTime(order.createdAt).dateTime}</TableCell>
                  <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                  <TableCell>{order.isPaid && order.paidAt ? formatDateTime(order.paidAt).dateTime : 'Not paid'}</TableCell>
                  <TableCell>{order.isDelivered && order.deliveredAt ? formatDateTime(order.deliveredAt).dateTime : 'Not delivered'}</TableCell>
                  <TableCell>
                    <Link href={`/order/${order.id}`}><span className="px-2">Details</span></Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {
            orders.totalPages > 1 && (
              <Pagination page={Number(page)} totalPages={orders?.totalPages}></Pagination>
            )
          }
        </div>
      </div>
    );
};

export default OrdersPage;