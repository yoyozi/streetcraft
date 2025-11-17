import Pagination from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import { formatId } from '@/lib/utils';
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import DeleteDialog from '@/components/shared/delete-dialog';
import { getAllUsers, deleteUser } from '@/lib/actions/user.actions';
import { USER_ROLES } from '@/lib/constants';

interface User {
  id: string;
  name: string;
  email: string;
  role: typeof USER_ROLES[number];
  createdAt?: string;
  updatedAt?: string;
}
export const metadata: Metadata = {
  title: 'Admin Users',
};

// We need to get the page from the search params, so add the following code to the function:
const AdminUsersUpdatePage = async (props: {
  searchParams: Promise<{
    page: string;
    query?: string;
  }>;
}) => {
  await verifyAdmin();
  const searchParams = await props.searchParams;

  const { page = '1', query:searchText } = searchParams;

  const users = await getAllUsers({ 
    page: Number(page),
    query: searchText as string
  });

  return (
    <div className='space-y-4'>
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <h1 className="h2-bold">Users</h1>
          {/* if searchText exists allow us to see a function to clear it */}
          { searchText && (
            <div>Filtered by <i>&quot;{searchText}&quot;</i>{' '}
              <Link href='/admin/users'>
                <Button variant='outline' size='sm'>Remove filter</Button>
              </Link>
            </div>
          )}
        </div>
        <Button asChild variant='default'>
          <Link href='/admin/users/create'>Add User</Link>
        </Button>
      </div>
      <div className='space-y-4'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>ROLE</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.data.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell>{formatId(user.id)}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role === 'user' ? (
                    <Badge variant='secondary'>User</Badge>
                  ) : user.role === 'craft' ? (
                    <Badge variant='outline'>Craft</Badge>
                  ) : (
                    <Badge variant='default'>Admin</Badge>
                  )}
                </TableCell>
                <TableCell className='flex gap-1'>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/admin/users/${user.id}`}>Edit</Link>
                  </Button>
                  {/* DELETE DIALOG HERE */}
                  <DeleteDialog id={user.id} action={deleteUser} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users?.totalPages && users.totalPages > 1 && (
          <Pagination page={page} totalPages={users.totalPages} />
        )}
      </div>
    </div>
  );
};

export default AdminUsersUpdatePage;