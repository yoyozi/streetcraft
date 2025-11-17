import { Metadata } from 'next';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import ProductForm from '@/components/admin/product-form';

export const metadata: Metadata = {
  title: 'Create product',
};

const CreateProductPage = async() => {
  await verifyAdmin();
    return (
      <>
        <h2 className='h2-bold'>Create Product</h2>
        <div className='my-8'>
          <ProductForm type='Create' />
        </div>
      </>
    );
};


export default CreateProductPage;