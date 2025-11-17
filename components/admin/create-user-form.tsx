'use client'

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from '@/components/ui/form';
  import { Input } from '@/components/ui/input';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
  import { Checkbox } from '@/components/ui/checkbox';
  import { toast } from 'sonner';
  import { createUser } from '@/lib/actions/user.actions';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { useRouter } from 'next/navigation';
  import { useForm } from 'react-hook-form';
  import { z } from 'zod';
  import { Button } from '@/components/ui/button';
  import { useState } from 'react';
  import { USER_ROLES } from '@/lib/constants';

  // User creation validation schema
  const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(USER_ROLES as [string, ...string[]], {
      required_error: 'Please select a role',
    }),
    requirePasswordReset: z.boolean().default(false),
  }).refine((data) => data.requirePasswordReset === true, {
    message: 'User must be required to reset password on first login',
    path: ['requirePasswordReset'],
  });

  type CreateUserFormValues = z.infer<typeof createUserSchema>;

  const CreateUserForm = () => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CreateUserFormValues>({
      resolver: zodResolver(createUserSchema),
      defaultValues: {
        name: '',
        email: '',
        password: '',
        role: 'user',
        requirePasswordReset: true,
      },
    });

    // Handle form submit
    const onSubmit = async (values: CreateUserFormValues) => {
      setIsSubmitting(true);
      try {
        const res = await createUser(values);
        if (!res.success) {
          toast.error(res.message || 'Failed to create user');
        } else {
          toast.success('User created successfully');
          router.push(`/admin/users`);
        }
      } catch {
        toast.error('Failed to create user');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)} 
            className='space-y-8'
          >
            <div className='flex flex-col gap-5 md:flex-row'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter user name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder='Enter email address' 
                        type='email'
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='flex flex-col gap-5 md:flex-row'>
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder='Enter initial password' 
                        type='password'
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>

            <div className='space-y-4'>
              <FormField
                control={form.control}
                name='requirePasswordReset'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>
                        Require Password Reset on First Login
                      </FormLabel>
                      <p className='text-sm text-muted-foreground'>
                        The user will be forced to change their password when they log in for the first time.
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className='flex gap-2'>
              <Button
                type='submit'
                size='lg'
                disabled={isSubmitting}
                className='button col-span-2 w-full'
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
              <Button
                type='button'
                size='lg'
                variant='outline'
                onClick={() => router.push('/admin/users')}
                className='w-full'
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
    );
  };

  export default CreateUserForm;
