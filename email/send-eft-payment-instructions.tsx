// email/send-eft-payment-instructions.ts
import { Order } from "@/types";
import { SendEmail } from "./index";
import EftPaymentInstructionsEmail from "./eft-payment-instructions-email";
import { getPaymentSettings } from "@/lib/actions/settings.actions";

export const sendEftPaymentInstructions = async ({ order }: { order: Order }) => {
  const settings = await getPaymentSettings();
  const emailComponent = (
    <EftPaymentInstructionsEmail
      order={order}
      bankDetails={{
        bankName: settings.eftBankName,
        accountHolder: settings.eftAccountHolder,
        accountNumber: settings.eftAccountNumber,
        branchCode: settings.eftBranchCode,
      }}
    />
  );
  
  return SendEmail({
    to: order.user.email,
    subject: `EFT Payment Instructions - Order ${order.id.substring(0, 8).toUpperCase()}`,
    react: emailComponent,
  });
};
