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
import { getAllCrafters } from '@/lib/actions/crafter.actions';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import ToggleCrafterStatusButton from './toggle-crafter-status-button';
import DeleteDialog from '@/components/shared/delete-dialog';
import { deleteCrafter } from '@/lib/actions/crafter.actions';
import { CrafterWithDetails } from '@/types';
import { Badge } from '@/components/ui/badge';

const AdminCraftersPage = async () => {
  await verifyAdmin();

  const result = await getAllCrafters();
  const crafters = result.success ? result.data : [];

  return (
    <div className='space-y-2'>
      <div className='flex-between'>
        <div className="flex items-center gap-3">
          <h1 className="h2-bold">Crafters</h1>
        </div>
        <Button asChild variant='default'>
          <Link href='/admin/crafters/create'>Create Crafter</Link>
        </Button>
      </div>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NAME</TableHead>
              <TableHead>LOCATION</TableHead>
              <TableHead>CONTACT NUMBER</TableHead>
              <TableHead className='text-center'>PRODUCTS</TableHead>
              <TableHead className='text-center'>STATUS</TableHead>
              <TableHead>CRAFT USER</TableHead>
              <TableHead className='w-[100px]'>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crafters.map((crafter: CrafterWithDetails) => (
              <TableRow key={crafter._id}>
                <TableCell className='font-medium'>{crafter.name}</TableCell>
                <TableCell>{crafter.location}</TableCell>
                <TableCell>{crafter.mobile}</TableCell>
                <TableCell className='text-center'>{crafter.productCount}</TableCell>
                <TableCell className='text-center'>
                  <ToggleCrafterStatusButton 
                    crafterId={crafter._id} 
                    isActive={crafter.isActive} 
                  />
                </TableCell>
                <TableCell>
                  {crafter.linkedUser ? (
                    <Badge variant="secondary" className="text-xs">
                      {crafter.linkedUser.name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Unallocated
                    </Badge>
                  )}
                </TableCell>
                <TableCell className='flex gap-1'>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/admin/crafters/${crafter._id}`}>Edit</Link>
                  </Button>
                  <DeleteDialog id={crafter._id} action={deleteCrafter} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {crafters.length === 0 && (
          <div className='text-center py-8 text-muted-foreground'>
            No crafters found. Create your first crafter to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCraftersPage;
