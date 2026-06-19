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
  import { toast } from 'sonner';
  import { createProduct, updateProduct, deleteProductImages } from '@/lib/actions/product.actions';
  import { getAllCategories } from '@/lib/actions/category.actions';
import { getAllCraftersForDrop } from '@/lib/actions/product.actions';
  import { productDefaultValues } from '@/lib/constants';
  import { insertProductSchema, updateProductSchema } from '@/lib/validators';
  import { ControllerRenderProps } from 'react-hook-form';
  import { Product } from '@/types';
  import { zodResolver } from '@hookform/resolvers/zod';
  import slugify from 'slugify';
  import { useRouter } from 'next/navigation';
  import { useForm, SubmitHandler } from 'react-hook-form';
  import { z } from 'zod';
  import { Textarea } from '@/components/ui/textarea';
  import { Button } from '@/components/ui/button';
  import { UploadButton } from '@/lib/uploadthing';
import { optimizeImages } from '@/lib/image-optimizer';

import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

  type InsertValues = z.infer<typeof insertProductSchema>;
  type UpdateValues = z.infer<typeof updateProductSchema>;

  const ProductForm = ({
    type,
    product,
    productId,
  }: {
    type: 'Create' | 'Update';
    product?: Product;
    productId?: string;
  }) => {
    const router = useRouter();
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [crafters, setCrafters] = useState<{ id: string; name: string; category?: string | null }[]>([]);

  // Determine mode based on the provided type prop
  const isUpdate = type === 'Update';

  // Prepare form default values, handling crafter field properly
  const getFormDefaultValues = () => {
    if (type === 'Update' && product) {
      return {
        ...product,
        crafter: product.crafter?.id || null, // Extract crafter ID from object
      };
    }
    return productDefaultValues;
  };

  const form = useForm<InsertValues | UpdateValues>({
    resolver: zodResolver(type === 'Update' ? updateProductSchema : insertProductSchema),
    defaultValues: getFormDefaultValues(),
  });

  // Fetch categories and crafters on component mount
  useEffect(() => {
    async function fetchData() {
      let [categoriesResult, craftersResult] = await Promise.all([
        getAllCategories({ isActive: true }),
        getAllCraftersForDrop()
      ]);
      
      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }
      
      if (craftersResult) {
        // Ensure current product's crafter is in the list even if inactive
        if (type === 'Update' && product?.crafter?.id) {
          const currentCrafter = product.crafter;
          const alreadyInList = craftersResult.some((c: { id: string }) => c.id === currentCrafter.id);
          if (!alreadyInList) {
            craftersResult = [{ id: currentCrafter.id, name: currentCrafter.name }, ...craftersResult];
          }
          // Auto-fill category from crafter if product category is empty/Uncategorized
          const matched = craftersResult.find((c: { id: string }) => c.id === currentCrafter.id);
          const currentCategory = form.getValues('category');
          if (matched?.category && (!currentCategory || currentCategory === 'Uncategorized')) {
            form.setValue('category', matched.category);
          }
        }
        setCrafters(craftersResult);
      }
    }
    fetchData();
  }, []);

  // Don't render form until data is loaded to prevent hydration mismatch
  if (categories.length === 0 || crafters.length === 0) {
    return <div>Loading form...</div>;
  }


    // Handle form submit
    const onSubmit: SubmitHandler<InsertValues & { id?: string }> = async (values) => {
      if (!isUpdate) {
        const res = await createProduct(values as InsertValues);
        if (!res.success) {
          toast.error(res.message);
        } else {
          toast.success(res.message);
          router.push(`/admin/products`);
        }
        return;
      }

      // Ensure ID is present for update payload
      const maybeUpdate = values as Partial<UpdateValues>;
      const resolvedId = maybeUpdate.id ?? product?.id ?? productId;
      if (!resolvedId) {
        toast.error('Missing product id for update');
        return;
      }

      // Block update if the product still has the auto-generated draft name
      if (!values.name || values.name.trim() === '' || values.name.trim().endsWith('- DRAFT')) {
        toast.error('Please set a proper product name before saving');
        return;
      }

      const payload: UpdateValues = {
        ...(values as unknown as Omit<UpdateValues, 'id'>),
        id: resolvedId,
      };

      // Delete removed images from UploadThing
      if (product?.images) {
        const oldImages = product.images;
        const newImages = values.images || [];
        const removedImages = oldImages.filter((img: string) => !newImages.includes(img));
        
        if (removedImages.length > 0) {
          await deleteProductImages(removedImages);
        }
      }

      const res = await updateProduct(payload);
      if (!res.success) {
        toast.error(res.message);
      } else {
        toast.success(res.message);
        router.push(`/admin/products`);
      }
    };

    // Listens to the actions by user on the page should they check a box etc
    const images = form.watch('images');

    return (
        <Form {...form}>
          <form
            method='post'
            onSubmit={form.handleSubmit(onSubmit)} 
            className='space-y-8'
          >

          <div className='flex flex-col gap-5 md:flex-row'>

            {/* Name */}
            <FormField
              control={form.control}
              name='name'
              render={({
                field,
              }: {
                field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'name'>;
              }) => (
                <FormItem className='w-full'>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter product name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name='slug'
              render={({
                field,
              }: {
                field: ControllerRenderProps<z.infer<typeof insertProductSchema>, 'slug'>;
              }) => (
                <FormItem className='w-full'>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        placeholder='Enter product slug'
                        className='pl-8'
                        {...field}
                      />
                      <button
                        type='button'
                        className='bg-gray-500 text-white px-4 py-1 mt-2 hover:bg-gray-600'
                        onClick={() => {
                          form.setValue('slug', slugify(form.getValues('name'), { lower: true }));
                        }}
                      >
                        Generate
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='flex flex-col gap-5 md:flex-row'>
            {/* Crafter */}
            <FormField
              control={form.control}
              name='crafter'
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  z.infer<typeof insertProductSchema>,
                  'crafter'
                >;
              }) => (
                <FormItem className='w-full'>
                  <FormLabel>Crafter</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value === 'unassigned' ? null : value);
                    // Auto-default category from crafter if product category is empty
                    if (value !== 'unassigned') {
                      const selected = crafters.find(c => c.id === value);
                      const currentCategory = form.getValues('category');
                      if (selected?.category && (!currentCategory || currentCategory === 'Uncategorized')) {
                        form.setValue('category', selected.category);
                      }
                    }
                  }} value={field.value || 'unassigned'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a crafter (optional)' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='unassigned'>Unassigned</SelectItem>
                      {crafters.map((crafter) => (
                        <SelectItem key={crafter.id} value={crafter.id}>
                          {crafter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
                )}
            />

            {/* Category is inherited from the crafter and set automatically */}



            {/* Price */}
            <FormField
              control={form.control}
              name='price'
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  z.infer<typeof insertProductSchema>, 'price'
                >;
              }) => (
                <FormItem className='w-full'>
                  <FormLabel>Retail Price</FormLabel>
                  <FormControl>
                    <Input 
                      type='number'
                      step='0.01'
                      placeholder='Enter retail price' 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cost Price */}
            <FormField
              control={form.control}
              name='costPrice'
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  z.infer<typeof insertProductSchema>, 'costPrice'
                >;
              }) => (
                <FormItem className='w-full'>
                  <FormLabel>Cost Price</FormLabel>
                  <FormControl>
                    <Input 
                      type='number'
                      step='0.01'
                      placeholder='Enter cost price' 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Availability */}
            <FormField
              control={form.control}
              name='availability'
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  z.infer<typeof insertProductSchema>, 'availability'
                >;
              }) => (
                <FormItem className='w-full'>
                  <FormLabel>Availability (days to make)</FormLabel>
                  <FormControl>
                    <Input 
                      type='number'
                      placeholder='-1=N/A, 0=in stock, 1-7=days' 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='flex flex-col gap-5 md:flex-row'>
            {/* Weight */}
            <FormField
              control={form.control}
              name='weight'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Mass (kg)</FormLabel>
                  <FormControl>
                    <Input 
                      type='number'
                      step='0.01'
                      placeholder='Weight in kg' 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Height */}
            <FormField
              control={form.control}
              name='height'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Height (cm)</FormLabel>
                  <FormControl>
                    <Input 
                      type='number'
                      step='0.1'
                      placeholder='Height in cm' 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Width */}
            <FormField
              control={form.control}
              name='width'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Width (cm)</FormLabel>
                  <FormControl>
                    <Input 
                      type='number'
                      step='0.1'
                      placeholder='Width in cm' 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Depth */}
            <FormField
              control={form.control}
              name='depth'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Depth (cm)</FormLabel>
                  <FormControl>
                    <Input 
                      type='number'
                      step='0.1'
                      placeholder='Depth in cm' 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='flex flex-col gap-5 md:flex-row'>
            {/* Tags */}
            <FormField
              control={form.control}
              name='tags'
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  z.infer<typeof insertProductSchema>, 'tags'
                >;
              }) => (
                <FormItem className='w-full'>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input 
                      type='text' 
                      placeholder='e.g. organic, handmade, natural' 
                      defaultValue={field.value?.join(', ') ?? ''}
                      onChange={(e) => {
                        // Store the raw value without processing
                        const value = e.target.value;
                        const tagsArray = value
                          .split(',')
                          .map((tag) => tag.trim());
                        field.onChange(tagsArray);
                      }}
                      onBlur={(e) => {
                        // Clean up on blur - remove empty tags
                        const value = e.target.value;
                        const tagsArray = value
                          .split(',')
                          .map((tag) => tag.trim())
                          .filter((tag) => tag.length > 0);
                        field.onChange(tagsArray);
                        field.onBlur();
                      }}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='upload-field flex flex-col gap-5 md:flex-row'>
            <FormField
              control={form.control}
              name='images'
              render={() => (
                <FormItem className='w-full'>
                  <FormLabel>Images</FormLabel>
                  <Card>
                    <CardContent className='space-y-2 mt-2 min-h-48'>
                      <div className='flex flex-wrap gap-2'>
                        {images && images.length > 0 ? (
                          images.map((image: string) => (
                            <div key={image} className='relative group'>
                              <Image
                                src={image}
                                alt='product image'
                                className='w-20 h-20 object-cover object-center rounded-sm'
                                width={100}
                                height={100}
                                unoptimized
                              />
                              <button
                                type='button'
                                onClick={() => {
                                  // Remove from form UI only (actual deletion from UploadThing happens on save)
                                  const currentImages = form.getValues('images') || [];
                                  form.setValue('images', currentImages.filter((img: string) => img !== image), { shouldValidate: true, shouldDirty: true });
                                  toast.success('Image removed from product');
                                }}
                                className='absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs'
                                title='Remove image'
                              >
                                ×
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className='text-sm text-gray-500'>No images uploaded yet</p>
                        )}
                        <FormControl>
                          <UploadButton
                            endpoint='imageUploader'
                            onBeforeUploadBegin={(files) => optimizeImages(files)}
                            onClientUploadComplete={(res: { url: string }[]) => {
                              const imageUrl = res[0].url;
                              const currentImages = form.getValues('images') || [];
                              const newImages = [...currentImages, imageUrl];
                              form.setValue('images', newImages, { shouldValidate: true, shouldDirty: true });
                              toast.success('Image uploaded successfully');
                            }}
                            onUploadError={(error: Error) => {
                              toast.error(`ERROR! ${error.message}`);
                            }}
                          />
                        </FormControl>
                      </div>
                    </CardContent>
                  </Card>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='upload-field'>
            Product Settings
            <Card>
              <CardContent className='space-y-2 mt-2  '>
                <FormField
                  control={form.control}
                  name='isFirstPage'
                  render={({ field }) => (
                    <FormItem className='space-x-2 items-center'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Show on First Page?</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='isUnique'
                  render={({ field }) => (
                    <FormItem className='space-x-2 items-center'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue('availability', 1);
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel>Unique Item (one-of-a-kind, can only be sold once)</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='priceNeedsReview'
                  render={({ field }) => (
                    <FormItem className='space-x-2 items-center'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Price Needs Review?</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='isActive'
                  render={({ field }) => (
                    <FormItem className='space-x-2 items-center'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const values = form.getValues();
                              const missing: string[] = [];
                              if (!values.costPrice || Number(values.costPrice) <= 0) missing.push('Cost Price');
                              if (!values.price || Number(values.price) <= 0) missing.push('Retail Price');
                              if (!values.weight || Number(values.weight) <= 0) missing.push('Mass');
                              if (!values.height || Number(values.height) <= 0) missing.push('Height');
                              if (!values.width || Number(values.width) <= 0) missing.push('Width');
                              if (!values.depth || Number(values.depth) <= 0) missing.push('Depth');
                              if (values.availability === undefined || values.availability === null) missing.push('Availability');
                              if (!values.crafter) missing.push('Crafter');
                              if (missing.length > 0) {
                                toast.error(`Cannot activate: fill in ${missing.join(', ')} first`);
                                return;
                              }
                            }
                            field.onChange(checked);
                          }}
                        />
                      </FormControl>
                      <FormLabel>Active (visible on public site)</FormLabel>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div>
            {/* Description */}
            <FormField
              control={form.control}
              name='description'
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  z.infer<typeof insertProductSchema>,
                  'description'
                >;
              }) => (
                <FormItem className='w-full'>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter product description'
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>


          <div>{/* Submit */}
            <Button 
              type='submit' 
              size='lg' 
              disabled={form.formState.isSubmitting}
              className='button col-span-2 w-full'
            >
              {isUpdate ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Form>
    );

}

export default ProductForm;