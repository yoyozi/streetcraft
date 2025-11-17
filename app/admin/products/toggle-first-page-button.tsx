'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toggleProductFirstPage } from '@/lib/actions/product.actions';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

export default function ToggleFirstPageButton({ 
  productId, 
  isFirstPage 
}: { 
  productId: string; 
  isFirstPage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(isFirstPage);

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleProductFirstPage(productId);
      
      if (result.success) {
        setCurrentStatus(!currentStatus);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant={currentStatus ? 'default' : 'outline'}
      size='sm'
      className='gap-1'
      title={currentStatus ? 'Remove from first page' : 'Add to first page'}
    >
      <Star className={`h-4 w-4 ${currentStatus ? 'fill-current' : ''}`} />
      {isPending ? '...' : currentStatus ? 'On' : 'Off'}
    </Button>
  );
}
