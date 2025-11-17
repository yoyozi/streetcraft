// email/purchase-receipt.ts
import { Order } from "@/types";
import { SendEmail } from "./index";
import PurchaseReceiptEmail from "./purchase-reciept-email";

export const sendPurchaseReceipt = async ({ order }: { order: Order }) => {
  const emailComponent = <PurchaseReceiptEmail order={order} />;
  
  return SendEmail({
    to: order.user.email,
    subject: `Order confirmation ${order.id}`,
    react: emailComponent,
  });
};

