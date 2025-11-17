// email/send-eft-payment-instructions.ts
import { Order } from "@/types";
import { SendEmail } from "./index";
import EftPaymentInstructionsEmail from "./eft-payment-instructions-email";

export const sendEftPaymentInstructions = async ({ order }: { order: Order }) => {
  const emailComponent = <EftPaymentInstructionsEmail order={order} />;
  
  return SendEmail({
    to: order.user.email,
    subject: `EFT Payment Instructions - Order ${order.id.substring(0, 8).toUpperCase()}`,
    react: emailComponent,
  });
};
