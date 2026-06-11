'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { updateCrafter, createProductFromSample } from '@/lib/actions/crafter.actions';
import { deleteInvite } from '@/lib/actions/invite.actions';
import Image from 'next/image';
import CrafterForm from '@/components/admin/crafter-form';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface CrafterData {
  _id: string;
  name: string;
  location: string;
  mobile: string;
  profileImage?: string | null;
  workSamples?: string[];
  personalName?: string;
}

interface CrafterFormValues {
  name: string;
  location: string;
  mobile: string;
  profileImage?: string;
}

interface SoldProduct {
  id: string;
  name: string;
  image: string | null;
  price: string;
}

interface InviteData {
  id: string;
  mobile: string;
  name: string;
  status: string;
  inviteCode: string;
  createdAt: string;
}

interface EditPageClientProps {
  crafter: CrafterData;
  imageCounts: Record<string, number>;
  soldProducts: SoldProduct[];
  invite?: InviteData | null;
}

export default function EditPageClient({ crafter, imageCounts: initialCounts, soldProducts, invite }: EditPageClientProps) {
  const [showSold, setShowSold] = useState(false);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
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

  const handleDeleteInvite = async (inviteId: string) => {
    const res = await deleteInvite(inviteId);
    if (res.success) {
      toast.success('Invite record deleted');
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to delete invite');
    }
  };

  const handleUpdateClick = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='h2-bold'>Edit Crafter: {crafter.personalName} - {crafter.businessName || 'No business name'} - {crafter.mobile}</h2>
        <p className="text-sm text-muted-foreground mt-1">Username and mobile number cannot be changed (only in user section or by crafter)</p>
        <div className='my-8'>
          <CrafterForm type='Update' crafter={crafter} onSubmit={handleFormSubmit} formRef={formRef} />
        </div>
      </div>

      {invite && (
        <div className='border-t pt-8'>
          <h3 className='text-lg font-semibold mb-2'>Invite Record</h3>
          <div className='flex items-center gap-4 p-4 bg-muted rounded-lg'>
            <div className='flex-1 text-sm space-y-1'>
              <p><span className='font-medium'>Mobile:</span> {invite.mobile}</p>
              <p><span className='font-medium'>Name:</span> {invite.name}</p>
              <p><span className='font-medium'>Code:</span> {invite.inviteCode}</p>
              <p><span className='font-medium'>Status:</span> <Badge variant={invite.status === 'REGISTERED' ? 'default' : 'secondary'}>{invite.status}</Badge></p>
            </div>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => handleDeleteInvite(invite.id)}
            >
              Delete Invite
            </Button>
          </div>
        </div>
      )}

      {crafter.workSamples && crafter.workSamples.length > 0 && (
        <div className='border-t pt-8'>
          <h3 className='h3-bold mb-4'>Work Samples</h3>
          <div className='flex gap-4 flex-wrap'>
            {crafter.workSamples.map((url, i) => (
              <div key={i} className='space-y-2'>
                <div className='relative w-36 h-36 rounded-lg overflow-hidden border'>
                  <Image src={url} alt={`Work sample ${i + 1}`} fill className='object-cover' />
                </div>
                {(counts[url] || 0) > 0 ? (
                  <p className='text-xs text-center font-medium text-green-600'>Done</p>
                ) : (
                  <Button
                    size='sm'
                    variant='outline'
                    className='w-36 text-xs'
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await createProductFromSample(crafter._id, url);
                        if (result.success) {
                          toast.success('Draft product created!');
                          setCounts((prev) => ({ ...prev, [url]: (prev[url] || 0) + 1 }));
                        } else {
                          toast.error(result.error || 'Failed to create product');
                        }
                      });
                    }}
                  >
                    + Create Product
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {soldProducts.length > 0 && (
        <div className='border-t pt-8'>
          <div className='flex items-center gap-3 mb-4'>
            <h3 className='h3-bold'>Sold Items</h3>
            <Badge variant='destructive'>{soldProducts.length}</Badge>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setShowSold(!showSold)}
            >
              {showSold ? 'Hide' : 'Show'}
            </Button>
          </div>
          {showSold && (
            <div className='flex gap-4 flex-wrap'>
              {soldProducts.map((product) => (
                <div key={product.id} className='space-y-2'>
                  <div className='relative w-36 h-36 rounded-lg overflow-hidden border opacity-60'>
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill className='object-cover' />
                    ) : (
                      <div className='w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500'>No image</div>
                    )}
                  </div>
                  <p className='text-xs font-medium text-center truncate w-36'>{product.name}</p>
                  <div className='flex items-center justify-center gap-1'>
                    <Badge variant='destructive' className='text-xs'>Sold</Badge>
                    <span className='text-xs text-muted-foreground'>{formatCurrency(product.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
