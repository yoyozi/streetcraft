'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toggleCrafterStatus } from '@/lib/actions/crafter.actions';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ToggleCrafterStatusButton({ 
  crafterId, 
  isActive 
}: { 
  crafterId: string; 
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(isActive);

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleCrafterStatus(crafterId, !currentStatus);
      
      if (result.success) {
        setCurrentStatus(!currentStatus);
        toast.success(`Crafter ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        toast.error(result.error || 'Failed to update crafter status');
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
      title={currentStatus ? 'Deactivate crafter' : 'Activate crafter'}
    >
      {currentStatus ? (
        <CheckCircle className='h-4 w-4' />
      ) : (
        <XCircle className='h-4 w-4' />
      )}
      {isPending ? '...' : currentStatus ? 'Active' : 'Inactive'}
    </Button>
  );
}
