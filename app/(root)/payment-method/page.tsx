import { Metadata } from "next";
import { auth } from "@/auth";
import { getUserById } from "@/lib/actions/user.actions";
import PaymentMethodForm from "./payment-method-form";
import CheckoutSteps from "@/components/shared/checkout-steps";

export const metadata: Metadata = {
  title: "Select Payment Method",
  description: "Select Payment Method",
};

const PaymentMethodPage = async() => {
  const session = await auth();
  const sessionUserId = session?.user?.id as string | undefined;

  if (!sessionUserId) throw new Error("User not found");

  const user = await getUserById(sessionUserId);

  if (!user) throw new Error("User not found");

  return (
    <div>
      <CheckoutSteps current={2} />
      <PaymentMethodForm preferredPaymentMethod={user.paymentMethod as string | null} />
    </div>
  );
};

export default PaymentMethodPage;