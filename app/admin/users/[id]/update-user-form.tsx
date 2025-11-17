'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { USER_ROLES } from '@/lib/constants';
import { updateUserSchema } from '@/lib/validators';
//import { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { updateUser } from '@/lib/actions/user.actions';



export interface UpdateUserFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: typeof USER_ROLES[number];
    isActive?: boolean;
    password?: string;
    requirePasswordReset?: boolean;
  };
}

const UpdateUserForm = ({ user }: UpdateUserFormProps) => {

 
  const router = useRouter();

    // Define the form values type from the schema
  type FormValues = z.infer<typeof updateUserSchema>;


  const form = useForm<FormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      isActive: user.isActive ?? true,
      password: '',
      requirePasswordReset: true,
    }
  });

  // Watch password field to auto-set requirePasswordReset
  const passwordValue = form.watch('password');
  
  React.useEffect(() => {
    // If password is entered, automatically check requirePasswordReset
    if (passwordValue && passwordValue.trim().length > 0) {
      form.setValue('requirePasswordReset', true);
    }
  }, [passwordValue, form]);




  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (values: z.infer<typeof updateUserSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Prepare update data
      const updateData: Partial<z.infer<typeof updateUserSchema>> = {
        id: user.id,
        name: values.name,
        email: values.email,
        role: values.role,
        isActive: values.isActive,
        requirePasswordReset: values.requirePasswordReset, // Always include this
      };
      
      // Only include password if it's not empty
      if (values.password && values.password.trim() !== '') {
        updateData.password = values.password;
      }
      
      console.log('Form submitting with data:', updateData);
      
      const res = await updateUser(updateData as z.infer<typeof updateUserSchema>);

      if (!res.success) {
        toast.error(res.message || 'Failed to update user');
        return;
      }

      toast.success('User updated successfully');
      router.refresh(); // Refresh the page to show updated data
      router.push('/admin/users'); // Redirect to users list
      
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('An unexpected error occurred while updating the user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <p className="text-sm text-muted-foreground">
                  {field.value ? 'User is active' : 'User is inactive'}
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Leave empty to keep current password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="requirePasswordReset"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-base">
                  Require Password Reset on Next Login
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  User will be forced to change their password when they log in next time.
                </p>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UpdateUserForm;