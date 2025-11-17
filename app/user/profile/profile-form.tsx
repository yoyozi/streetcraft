'use client';

import { updateProfileSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form as FormUI } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/lib/actions/user.actions";
import { useEffect } from "react";

const Profileform = () => {
    const { data: session, update } = useSession();
    const form = useForm<z.infer<typeof updateProfileSchema>>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
        name: session?.user?.name ?? '',
        email: session?.user?.email ?? ''
        },
    });

    // Keep form values in sync when session updates (e.g., after profile update)
    useEffect(() => {
        form.reset({
            name: session?.user?.name ?? '',
            email: session?.user?.email ?? '',
        });
    }, [session?.user?.name, session?.user?.email, form]);

    const onSubmit = async (values: z.infer<typeof updateProfileSchema>) => {
        const res = await updateProfile(values)

        if(!res.success) {
            return toast.error(res.message);
        }

        // Send updated fields so JWT callback (trigger: 'update') can sync token
        await update({ user: { name: values.name } });

        toast.success(res.message);
    }

    return (
        <FormUI {...form}>
            <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)} >
                <div className="flex flex-col gap-5">

                    <FormField 
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input disabled placeholder="Email" className='input-field' {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField 
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Name" className='input-field' {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>

                <Button 
                    type='submit' 
                    size='lg' 
                    className='button col-span-2 w-full' 
                    disabled={ form.formState.isSubmitting }>
                        { form.formState.isSubmitting ? 'Submitting...' : 'Update Profile'}
                </Button>
            
            </form>
        </FormUI>
    );
};

export default Profileform;