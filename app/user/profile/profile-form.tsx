'use client';

import { updateProfileSchema, changePasswordSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form as FormUI } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInputFormField } from "@/components/ui/password-input";
import { updateProfile, changePassword } from "@/lib/actions/user.actions";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CrafterProfileImage from './crafter-profile-image';

const Profileform = () => {
    const { data: session, status, update } = useSession();
    const isCrafter = status === 'authenticated' && session?.user?.role === 'craft';
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    
    // Profile update form
    const profileForm = useForm<z.infer<typeof updateProfileSchema>>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
        name: session?.user?.name ?? '',
        email: session?.user?.email ?? ''
        },
    });

    // Password change form
    const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
        },
    });

    // Keep form values in sync when session updates (e.g., after profile update)
    useEffect(() => {
        profileForm.reset({
            name: session?.user?.name ?? '',
            email: session?.user?.email ?? '',
        });
    }, [session?.user?.name, session?.user?.email, profileForm]);

    const onProfileSubmit = async (values: z.infer<typeof updateProfileSchema>) => {
        const res = await updateProfile(values)

        if(!res.success) {
            return toast.error(res.message);
        }

        // Send updated fields so JWT callback (trigger: 'update') can sync token
        await update({ user: { name: values.name } });

        toast.success(res.message);
    }

    const onPasswordSubmit = async (values: z.infer<typeof changePasswordSchema>) => {
        const res = await changePassword(values)

        if(!res.success) {
            return toast.error(res.message);
        }

        toast.success(res.message);
        passwordForm.reset();
        setShowPasswordForm(false);
    }

    return (
        <div className="space-y-6">
            {isCrafter && <CrafterProfileImage />}
            {/* Profile Update Card — hidden for crafters (their details are managed via admin) */}
            {!isCrafter && <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormUI {...profileForm}>
                        <form className="flex flex-col gap-5" onSubmit={profileForm.handleSubmit(onProfileSubmit)} >
                            <div className="flex flex-col gap-5">

                                <FormField 
                                    control={profileForm.control}
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
                                    control={profileForm.control}
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
                                disabled={ profileForm.formState.isSubmitting }>
                                { profileForm.formState.isSubmitting ? 'Submitting...' : 'Update Profile'}
                            </Button>
                        
                        </form>
                    </FormUI>
                </CardContent>
            </Card>}

            {/* Password Change Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                        >
                            {showPasswordForm ? 'Cancel' : 'Change Password'}
                        </Button>
                    </div>
                </CardHeader>
                {showPasswordForm && (
                    <CardContent>
                        <FormUI {...passwordForm}>
                            <form className="flex flex-col gap-5" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} >
                                <div className="flex flex-col gap-5">

                                    <FormField 
                                        control={passwordForm.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current Password</FormLabel>
                                                <FormControl>
                                                    <PasswordInputFormField placeholder="Current password" className='input-field' {...field} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField 
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New Password</FormLabel>
                                                <FormControl>
                                                    <PasswordInputFormField placeholder="New password" className='input-field' {...field} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField 
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm New Password</FormLabel>
                                                <FormControl>
                                                    <PasswordInputFormField placeholder="Confirm new password" className='input-field' {...field} />
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
                                    disabled={ passwordForm.formState.isSubmitting }>
                                    { passwordForm.formState.isSubmitting ? 'Updating...' : 'Update Password'}
                                </Button>
                            
                            </form>
                        </FormUI>
                    </CardContent>
                )}
            </Card>
        </div>
    );
};

export default Profileform;