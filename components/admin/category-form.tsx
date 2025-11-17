'use client';

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
import { toast } from 'sonner';
import { createCategory, updateCategory } from '@/lib/actions/category.actions';
import { categorySchema } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

const CategoryForm = ({
  type,
  category,
  categoryId,
}: {
  type: 'Create' | 'Update';
  category?: Category;
  categoryId?: string;
}) => {
  const router = useRouter();

  const defaultValues: CategoryFormValues = category
    ? {
        name: category.name,
        description: category.description,
      }
    : {
        name: '',
        description: '',
      };

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      if (type === 'Create') {
        const result = await createCategory(data);
        if (result.success) {
          toast.success('Category created successfully');
          router.push('/admin/categories');
        } else {
          toast.error(result.error || 'Failed to create category');
        }
      } else {
        if (!categoryId) {
          toast.error('Category ID is required');
          return;
        }
        const result = await updateCategory({ id: categoryId, ...data });
        if (result.success) {
          toast.success('Category updated successfully');
          router.push('/admin/categories');
        } else {
          toast.error(result.error || 'Failed to update category');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <div className='flex flex-col gap-5 md:flex-row'>
          {/* Name */}
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Enter category name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          {/* Description */}
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Enter category description'
                    className='h-32'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex gap-2'>
          <Button
            type='submit'
            size='lg'
            disabled={form.formState.isSubmitting}
            className='button col-span-2 w-full'
          >
            {form.formState.isSubmitting
              ? 'Submitting...'
              : `${type} Category`}
          </Button>
          <Button
            type='button'
            size='lg'
            variant='outline'
            onClick={() => router.push('/admin/categories')}
            className='w-full'
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
