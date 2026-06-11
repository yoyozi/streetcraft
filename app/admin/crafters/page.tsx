import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllCrafters, getPendingCrafters } from '@/lib/actions/crafter.actions';
import { getAllCategories } from '@/lib/actions/category.actions';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import { CrafterWithDetails } from '@/types';
import { Badge } from '@/components/ui/badge';
import CraftersTableClient from './crafters-table-client';

const AdminCraftersPage = async () => {
  await verifyAdmin();

  const result = await getAllCrafters();
  const crafters = result.success ? result.data : [];
  const pendingResult = await getPendingCrafters();
  const pendingCount = pendingResult.success ? pendingResult.data.length : 0;
  const categoriesResult = await getAllCategories({ isActive: true });
  const categories = categoriesResult.success ? categoriesResult.data.map((c) => ({ id: c.id, name: c.name })) : [];

  return (
    <div className='space-y-2'>
      <div className='flex-between'>
        <div className="flex items-center gap-3">
          <h1 className="h2-bold">Crafters</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant='secondary'>
            <Link href='/admin/crafters/review' className="flex items-center gap-2">
              Review Applications
              {pendingCount > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[1.25rem] justify-center">
                  {pendingCount}
                </Badge>
              )}
            </Link>
          </Button>
          <Button asChild variant='outline'>
            <Link href='/admin/crafters/invite'>Invite Crafter</Link>
          </Button>
          <Button asChild variant='default'>
            <Link href='/admin/crafters/create'>Create Crafter</Link>
          </Button>
        </div>
      </div>
      <CraftersTableClient crafters={crafters as CrafterWithDetails[]} categories={categories} />
    </div>
  );
};

export default AdminCraftersPage;
