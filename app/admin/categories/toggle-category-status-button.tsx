'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toggleCategoryStatus } from '@/lib/actions/category.actions';
import { toast } from 'sonner';

export default function ToggleCategoryStatusButton({
  categoryId,
  isActive,
}: {
  categoryId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleCategoryStatus(categoryId);
      if (result.success) {
        toast.success('Category status updated successfully');
      } else {
        toast.error(result.error || 'Failed to update category status');
      }
    });
  };

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size='sm'
      onClick={handleToggle}
      disabled={isPending}
    >
      {isActive ? 'Active' : 'Inactive'}
    </Button>
  );
}
