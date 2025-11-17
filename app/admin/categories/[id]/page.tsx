import { notFound } from 'next/navigation';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import { getCategoryById } from '@/lib/actions/category.actions';
import CategoryForm from '@/components/admin/category-form';

const EditCategoryPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  await verifyAdmin();

  const { id } = await params;
  const categoryResult = await getCategoryById(id);

  if (!categoryResult.success || !categoryResult.data) {
    notFound();
  }

  const category = categoryResult.data;

  return (
    <div className='space-y-2'>
      <h1 className='h2-bold'>Edit Category</h1>
      <CategoryForm type='Update' category={category} categoryId={id} />
    </div>
  );
};

export default EditCategoryPage;
