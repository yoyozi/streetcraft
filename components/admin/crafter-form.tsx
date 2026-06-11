'use client'

import { useState, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createCrafter, updateCrafter } from '@/lib/actions/crafter.actions';
import { getAllCategories } from '@/lib/actions/category.actions';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { forwardRef } from 'react';

// Crafter validation schema matching FUNCTIONING.md
const crafterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  businessName: z.string().optional(),
  description: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  mobile: z.string().min(10, 'Valid mobile number is required'),
  category: z.string().optional(),
});

type CrafterFormValues = z.infer<typeof crafterSchema>;

interface CrafterData {
  _id?: string;
  name: string;
  businessName?: string;
  description?: string | null;
  location: string;
  mobile: string;
  category?: string;
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
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const isUpdate = type === 'Update';

  useEffect(() => {
    async function fetchCategories() {
      const result = await getAllCategories({ isActive: true });
      if (result.success && result.data) {
        setCategories(result.data);
      }
    }
    fetchCategories();
  }, []);

  const form = useForm<CrafterFormValues>({
    resolver: zodResolver(crafterSchema),
    defaultValues: crafter ? {
      name: crafter.name,
      businessName: crafter.businessName || '',
      description: crafter.description || '',
      location: crafter.location,
      mobile: crafter.mobile,
      category: crafter.category || '',
    } : {
      name: '',
      businessName: '',
      description: '',
      location: '',
      mobile: '',
      category: '',
    },
  });

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
            name='businessName'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Business Name <span className='text-muted-foreground text-xs'>(optional)</span></FormLabel>
                <FormControl>
                  <Input placeholder='Leave blank to use name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Business Description <span className='text-muted-foreground text-xs'>(from crafter)</span></FormLabel>
              <FormControl>
                <Textarea placeholder='Description of the craft / business' rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex flex-col gap-5 md:flex-row'>
          <FormField
            control={form.control}
            name='location'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder='Enter location / suburb' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='mobile'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <Input placeholder='e.g. 0821234567' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex flex-col gap-5 md:flex-row'>
          <FormField
            control={form.control}
            name='category'
            render={({ field }) => (
              <FormItem className='w-full md:w-1/2'>
                <FormLabel>Category <span className='text-muted-foreground text-xs'>(optional)</span></FormLabel>
                <Select onValueChange={(val) => field.onChange(val === 'none' ? '' : val)} value={field.value || 'none'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a category' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='none'>None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!onSubmit && (
          <Button type='submit' disabled={form.formState.isSubmitting} className='w-full md:w-auto'>
            {form.formState.isSubmitting
              ? (isUpdate ? 'Updating...' : 'Creating...')
              : (isUpdate ? 'Update Crafter' : 'Create Crafter')
            }
          </Button>
        )}
      </form>
    </Form>
  );
});

CrafterForm.displayName = 'CrafterForm';

export default CrafterForm;
