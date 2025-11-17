//We need some hooks so needs to be a client
'use client'

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTransition } from "react";
import { ShippingAddress } from "@/types";
import { ShippingAddressSchema } from "@/lib/validators";
import { shippingAddressDefaultValues } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { ControllerRenderProps, useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { FormField, FormItem } from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { FormControl } from "@/components/ui/form";
import { FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ArrowBigRight, Loader } from "lucide-react";
import { updateUserAddress } from "@/lib/actions/user.actions";


const ShippingAddressForm = ({ address }: { address: ShippingAddress }) => {

    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // we use the default values if user had values
    const form = useForm<z.infer<typeof ShippingAddressSchema>>({
        resolver: zodResolver(ShippingAddressSchema),
        defaultValues: address || shippingAddressDefaultValues,
    });

    const onSubmit: SubmitHandler<z.infer<typeof ShippingAddressSchema>> = async (values: z.infer<typeof ShippingAddressSchema>) => {
        startTransition(async () => {
            const res = await updateUserAddress(values);
            
            if (!res.success) {
                toast.error(res.message || 'Failed to update address');
                return
            } 

            toast.success('Shipping address updated successfully');
            router.push('/payment-method');
        });
    }

    return (
        <>
            <div className="max-w-md mx-auto space-y-4">
                <h1 className="h2-bold mt-4">Shipping Address</h1>
                <p className="text-sm text-muted-foreground">Please enter an address to ship to</p>
                <Form {...form}>
                    <form method="post" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="flex flex-col md:flex-row gap-5">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof ShippingAddressSchema>, 'fullName'> }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your full name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />           
                        </div>
                        <div className="flex flex-col md:flex-row gap-5">
                            <FormField
                                control={form.control}
                                name="streetAddress"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof ShippingAddressSchema>, 'streetAddress'> }) => (
                                    <FormItem>
                                        <FormLabel>Street Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your street address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />           
                        </div>
                        <div className="flex flex-col md:flex-row gap-5">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof ShippingAddressSchema>, 'city'> }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your city" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />           
                        </div>
                        <div className="flex flex-col md:flex-row gap-5">
                            <FormField
                                control={form.control}
                                name="postalCode"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof ShippingAddressSchema>, 'postalCode'> }) => (
                                    <FormItem>
                                        <FormLabel>Postal Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your postal code" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />           
                        </div>
                        <div className="flex flex-col md:flex-row gap-5">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }: { field: ControllerRenderProps<z.infer<typeof ShippingAddressSchema>, 'country'> }) => (
                                    <FormItem>
                                        <FormLabel>Country</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your country" {...field} />
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

export default ShippingAddressForm;