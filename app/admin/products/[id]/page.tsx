import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import ProductForm from '@/components/admin/product-form';
import { getProductById } from '@/lib/actions/product.actions';

export const metadata: Metadata = {
  title: 'Update product',
};

const UpdateProductPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  await verifyAdmin();
  const { id } = await props.params;

  const product = await getProductById(id);

  if (!product) return notFound();

  return (
    <div className='space-y-8 max-w-5xl mx-auto'>
      <h1 className='h2-bold'>Update Product - R{product.costPrice}</h1>
      <div className='rounded-lg border bg-muted/40 p-3 text-sm'>
        <span className='font-medium'>Category (from crafter):</span>{' '}
        <span className='text-muted-foreground'>{product.category || 'Uncategorized'}</span>
        <p className='mt-1 text-xs text-muted-foreground'>
          Set on the crafter, not the product. Change it in Admin → Crafters → Edit; all the crafter&apos;s products update automatically.
        </p>
      </div>
      {product.priceNeedsReview && (
        <div className='rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700'>
          <p className='font-semibold'>Needs review — changed by the crafter</p>
          {product.reviewReason && <p className='mt-1'>{product.reviewReason}</p>}
          <p className='mt-1 text-xs text-red-600'>This product is deactivated. Review the change, then activate it to clear this flag.</p>
        </div>
      )}
      <ProductForm type='Update' product={product} productId={product.id} />
    </div>
  );
};

export default UpdateProductPage;