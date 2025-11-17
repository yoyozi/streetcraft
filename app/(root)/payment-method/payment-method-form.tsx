'use client'

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PaymentMethodSchema } from "@/lib/validators";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from "@/lib/constants";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormLabel,
        FormField,
        Form,
        FormControl,
        FormMessage,
        FormItem } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ArrowBigRight, Loader } from "lucide-react";
import { updateUserPaymentMethod } from "@/lib/actions/user.actions";
import { toast } from "sonner";

const PaymentMethodForm = ({ preferredPaymentMethod }: { preferredPaymentMethod: string | null }) => {

    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof PaymentMethodSchema>>({
            resolver: zodResolver(PaymentMethodSchema),
            defaultValues: {
                type: preferredPaymentMethod || DEFAULT_PAYMENT_METHOD
            }
        }
    );

    const onSubmit = async (values: z.infer<typeof PaymentMethodSchema>) => {
        startTransition(async () => {
            const res = await updateUserPaymentMethod(values);
            
            if (!res.success) {
                toast.error(res.message || 'Failed to update payment method');
                return
            } 
            toast.success('Payment method updated successfully');
            router.push('/place-order');
        });
    }   

   return (
          <>
              <div className="max-w-md mx-auto space-y-4">
                  <h1 className="h2-bold mt-4">Payment Method</h1>
                  <p className="text-sm text-muted-foreground">Please select a payment method</p>
                  <Form {...form}>
                      <form method="post" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="flex flex-col md:flex-row gap-5">
                                <FormField 
                                    control={form.control}
                                    name="type"
                                    render={({field}) => (
                                        <FormItem className="space-y-3" > 

                                            <FormControl>

                                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">

                                                    {PAYMENT_METHODS.map((paymentMethod) => (
                                                        <FormItem key={paymentMethod} className="flex items-center space-x-3">
                                                            <RadioGroupItem value={paymentMethod} />
                                                            <FormLabel className="font-normal">{paymentMethod}</FormLabel>
                                                        </FormItem>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>      
                                    )}
                                />
                          </div>
                          <div className="flex gap-2">
                              <Button
                                  type="submit"
                                  disabled={isPending}
                                  className="btn btn-primary cursor-pointer hover:bg-primary/90 transition-colors"
                              >
                                  {isPending ? (
                                      <Loader className="h-4 w-4 animate-spin" />
                                  ) : (
                                      <ArrowBigRight className="h-4 w-4" />
                                  )}{" "}Continue
                              </Button>
                          </div>
                      </form>
                  </Form>
              </div>
          </>
      );
};

export default PaymentMethodForm;