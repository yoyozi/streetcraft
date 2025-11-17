'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { updateCrafter } from '@/lib/actions/crafter.actions';
import CrafterForm from '@/components/admin/crafter-form';
import CrafterAllocationDropdown from '../crafter-allocation-dropdown';
import { CrafterWithDetails } from '@/types';

interface CrafterData {
  _id: string;
  name: string;
  location: string;
  mobile: string;
  profileImage?: string;
}

interface CrafterFormValues {
  name: string;
  location: string;
  mobile: string;
  profileImage?: string;
}

interface EditPageClientProps {
  crafter: CrafterData;
  currentCrafter: CrafterWithDetails | undefined;
}

export default function EditPageClient({ crafter, currentCrafter }: EditPageClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFormSubmit = async (values: CrafterFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await updateCrafter(crafter._id, values);
      if (!res.success) {
        toast.error(res.error || 'Failed to update crafter');
      } else {
        toast.success('Crafter updated successfully');
        router.push(`/admin/crafters`);
      }
    } catch {
      toast.error('Failed to update crafter');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/crafters');
  };

  const handleUpdateClick = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='h2-bold'>Edit Crafter</h2>
        <div className='my-8'>
          <CrafterForm type='Update' crafter={crafter} onSubmit={handleFormSubmit} formRef={formRef} />
        </div>
      </div>
      
      <div className='border-t pt-8'>
        <h3 className='h3-bold mb-4'>User Allocation</h3>
        <div className='max-w-md'>
          <CrafterAllocationDropdown 
            crafterId={crafter._id}
            currentLinkedUser={currentCrafter?.linkedUser || null}
          />
        </div>
      </div>

      <div className='border-t pt-8 flex gap-2'>
        <Button
          type='button'
          size='lg'
          disabled={isSubmitting}
          className='button'
          onClick={handleUpdateClick}
        >
          {isSubmitting ? 'Submitting...' : 'Update Crafter'}
        </Button>
        <Button
          type='button'
          size='lg'
          variant='outline'
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
