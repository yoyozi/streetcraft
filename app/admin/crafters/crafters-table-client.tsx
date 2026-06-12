'use client';

import { useState, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ToggleCrafterStatusButton from './toggle-crafter-status-button';
import DeleteDialog from '@/components/shared/delete-dialog';
import { deleteCrafter } from '@/lib/actions/crafter.actions';
import { CrafterWithDetails } from '@/types';
import { Badge } from '@/components/ui/badge';

interface CraftersTableClientProps {
  crafters: CrafterWithDetails[];
  categories: { id: string; name: string }[];
}

export default function CraftersTableClient({ crafters, categories }: CraftersTableClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCrafters = useMemo(() => {
    if (selectedCategory === 'all') return crafters;
    if (selectedCategory === 'none') return crafters.filter((c) => !c.category);
    return crafters.filter((c) => c.category === selectedCategory);
  }, [crafters, selectedCategory]);

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <span className='text-sm font-medium'>Filter by category:</span>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className='w-[220px]'>
            <SelectValue placeholder='All categories' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All categories</SelectItem>
            <SelectItem value='none'>No category</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>BUSINESS NAME</TableHead>
            <TableHead>USER</TableHead>
            <TableHead>LOCATION</TableHead>
            <TableHead>CONTACT NUMBER</TableHead>
            <TableHead className='text-center'>PRODUCTS</TableHead>
            <TableHead className='text-center'>STATUS</TableHead>
            <TableHead className='w-[100px]'>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCrafters.map((crafter: CrafterWithDetails) => (
            <TableRow key={crafter._id}>
              <TableCell className='font-medium'>
                {crafter.businessName || <span className='text-muted-foreground'>No business name</span>}
              </TableCell>
              <TableCell>
                {crafter.linkedUser ? (
                  <Badge variant='secondary' className='text-xs'>
                    {crafter.linkedUser.name}
                  </Badge>
                ) : (
                  <Badge variant='outline' className='text-xs'>
                    Unallocated
                  </Badge>
                )}
              </TableCell>
              <TableCell>{crafter.location}</TableCell>
              <TableCell>{crafter.mobile}</TableCell>
              <TableCell className='text-center'>{crafter.productCount}</TableCell>
              <TableCell className='text-center'>
                <ToggleCrafterStatusButton
                  crafterId={crafter._id}
                  isActive={crafter.isActive}
                />
              </TableCell>
              <TableCell className='flex gap-1'>
                <Button asChild variant='outline' size='sm'>
                  <Link href={`/admin/crafters/${crafter._id}`}>Edit</Link>
                </Button>
                <DeleteDialog id={crafter._id} action={async (id: string) => {
                  const res = await deleteCrafter(id);
                  return { success: res.success, message: res.success ? 'Crafter deleted' : (res.error || 'Failed to delete') };
                }} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filteredCrafters.length === 0 && (
        <div className='text-center py-8 text-muted-foreground'>
          No crafters found.
        </div>
      )}
    </div>
  );
}
