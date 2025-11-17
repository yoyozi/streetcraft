import Link from 'next/link';
import Pagination from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { getAdminProducts, getAllCraftersForDrop } from '@/lib/actions/product.actions';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import ProductsListClient from './products-list-client';


const AdminProductsPage = async (props: {
  searchParams: Promise<{
    page: string;
    query: string;
    crafter: string;
  }>;
}) => {
  await verifyAdmin();

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || '';
  const crafterId = searchParams.crafter || '';

  const [productsData, allCrafters] = await Promise.all([
    getAdminProducts({
      query,
      page,
      crafterId,
    }),
    getAllCraftersForDrop(),
  ]);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild variant='default'>
          <Link href='/admin/products/create'>Create Product</Link>
        </Button>
      </div>
      <ProductsListClient 
        products={productsData.data} 
        allCrafters={allCrafters} 
        selectedCrafter={crafterId}
      />
      {productsData?.totalPages && productsData.totalPages > 1 && (
        <Pagination page={page} totalPages={productsData.totalPages} />
      )}
    </>
  );
};

export default AdminProductsPage;