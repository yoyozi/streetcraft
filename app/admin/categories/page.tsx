import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAllCategories } from '@/lib/actions/category.actions';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import DeleteDialog from '@/components/shared/delete-dialog';
import { deleteCategory } from '@/lib/actions/category.actions';
import ToggleCategoryStatusButton from './toggle-category-status-button';

const AdminCategoriesPage = async () => {
  await verifyAdmin();

  const categoriesResult = await getAllCategories();
  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <div className='space-y-2'>
      <div className='flex justify-between items-center'>
        <h1 className='h2-bold'>Categories</h1>
        <Button asChild variant='default'>
          <Link href='/admin/categories/create'>Create Category</Link>
        </Button>
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NAME</TableHead>
              <TableHead>DESCRIPTION</TableHead>
              <TableHead className='text-center'>STATUS</TableHead>
              <TableHead className='w-[100px]'>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.id}>
                <TableCell className='font-medium'>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell className='text-center'>
                  <ToggleCategoryStatusButton
                    categoryId={category.id}
                    isActive={category.isActive}
                  />
                </TableCell>
                <TableCell className='flex gap-1'>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/admin/categories/${category.id}`}>Edit</Link>
                  </Button>
                  <DeleteDialog id={category.id} action={deleteCategory} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
