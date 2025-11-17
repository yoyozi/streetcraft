'use client';

import { useState, useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateProductCrafter } from '@/lib/actions/product.actions';
import { toast } from 'sonner';

interface ProductCrafterSelectorProps {
  productId: string;
  currentCrafterId?: string;
  crafters: Array<{ _id: string; name: string }>;
}

export default function ProductCrafterSelector({
  productId,
  currentCrafterId,
  crafters,
}: ProductCrafterSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedCrafter, setSelectedCrafter] = useState(currentCrafterId || 'unassigned');

  const handleCrafterChange = (crafterId: string) => {
    startTransition(async () => {
      const result = await updateProductCrafter(
        productId,
        crafterId === 'unassigned' ? null : crafterId
      );

      if (result.success) {
        setSelectedCrafter(crafterId);
        toast.success('Product crafter updated successfully');
      } else {
        toast.error(result.message || 'Failed to update product crafter');
      }
    });
  };

  return (
    <Select
      value={selectedCrafter}
      onValueChange={handleCrafterChange}
      disabled={isPending}
    >
      <SelectTrigger className='w-[180px]'>
        <SelectValue placeholder='Select crafter' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='unassigned'>Unassigned</SelectItem>
        {crafters.map((crafter) => (
          <SelectItem key={crafter._id} value={crafter._id}>
            {crafter.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
