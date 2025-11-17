import { Metadata } from "next";
import { getOrderById } from "@/lib/actions/order.actions";
import { notFound } from "next/navigation";
import OrderDetailsTable from "./order-details-table";
import { ShippingAddress } from "@/types";
import { auth } from "@/auth";

export const metadata: Metadata = {
    title: "Order Details",
    description: "Order Details",
}

// Force dynamic rendering to prevent caching of order status
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// With Next 15 to get the item in the url we use props
const OrderDetailsPage = async (props: { 
    params: Promise<{ 
        id: string 
    }>
}) => {

    // destructure the id
    const { id } = await props.params;

    const order = await getOrderById(id);

    if(!order) notFound();

    // To enable us to determine if user is admin or not we need the client item below to 
    // have these details and show or not show the det paid/delivered buttons if admin or not
    // so we pass it in as a prop
    const session = await auth();

  return (
      <OrderDetailsTable 
      
        order={{
            ...order,
            shippingAddress: order.shippingAddress as ShippingAddress,
            }} paypalClientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb'
        }

        isAdmin={ session?.user?.role === 'admin' || false }
      />
  );
};

export default OrderDetailsPage;