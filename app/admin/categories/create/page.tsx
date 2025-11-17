import { verifyAdmin } from '@/lib/actions/auth-actions';
import CategoryForm from '@/components/admin/category-form';

const CreateCategoryPage = async () => {
  await verifyAdmin();

  return (
    <div className='space-y-2'>
      <h1 className='h2-bold'>Create Category</h1>
      <CategoryForm type='Create' />
    </div>
  );
};

export default CreateCategoryPage;
