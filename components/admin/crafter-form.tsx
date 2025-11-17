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
  import { toast } from 'sonner';
  import { createCrafter, updateCrafter } from '@/lib/actions/crafter.actions';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { useRouter } from 'next/navigation';
  import { useForm } from 'react-hook-form';
  import { z } from 'zod';
  import { forwardRef } from 'react';

  // Crafter validation schema
  const crafterSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    location: z.string().min(1, 'Location is required'),
    mobile: z.string().min(10, 'Valid mobile number is required'),
    profileImage: z.string().optional(),
  });

  type CrafterFormValues = z.infer<typeof crafterSchema>;

  interface CrafterData {
    _id?: string;
    name: string;
    location: string;
    mobile: string;
    profileImage?: string;
  }

  interface CrafterFormProps {
    type: 'Create' | 'Update';
    crafter?: CrafterData;
    onSubmit?: (values: CrafterFormValues) => Promise<void>;
    formRef?: React.RefObject<HTMLFormElement>;
  }

  const CrafterForm = forwardRef<HTMLFormElement, CrafterFormProps>(({
    type,
    crafter,
    onSubmit,
    formRef,
  }, ref) => {
    const router = useRouter();

  // Determine mode based on the provided type prop
  const isUpdate = type === 'Update';

  const form = useForm<CrafterFormValues>({
    resolver: zodResolver(crafterSchema),
    defaultValues: crafter ? {
      name: crafter.name,
      location: crafter.location,
      mobile: crafter.mobile,
      profileImage: crafter.profileImage || '',
    } : {
      name: '',
      location: '',
      mobile: '',
      profileImage: '',
    },
  });

    // Handle form submit
    const handleFormSubmit = async (values: CrafterFormValues) => {
      if (onSubmit) {
        await onSubmit(values);
        return;
      }

      if (!isUpdate) {
        const res = await createCrafter(values);
        if (!res.success) {
          toast.error(res.error || 'Failed to create crafter');
        } else {
          toast.success('Crafter created successfully');
          router.push(`/admin/crafters`);
        }
        return;
      }

      // Update existing crafter
      if (!crafter?._id) {
        toast.error('Missing crafter id for update');
        return;
      }

      const res = await updateCrafter(crafter._id, values);
      if (!res.success) {
        toast.error(res.error || 'Failed to update crafter');
      } else {
        toast.success('Crafter updated successfully');
        router.push(`/admin/crafters`);
      }
    };

    return (
        <Form {...form}>
          <form
            ref={ref || formRef}
            method='post'
            onSubmit={form.handleSubmit(handleFormSubmit)} 
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
                      <Input placeholder='Enter crafter name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='location'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter location' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='flex flex-col gap-5 md:flex-row'>
              <FormField
                control={form.control}
                name='mobile'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder='Enter contact number (e.g., +27821234567)' 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


            </div>
          </form>
        </Form>
    );
  });

CrafterForm.displayName = 'CrafterForm';

  export default CrafterForm;
