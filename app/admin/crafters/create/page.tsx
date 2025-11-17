import { Metadata } from 'next';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import CrafterForm from '@/components/admin/crafter-form';

export const metadata: Metadata = {
  title: 'Create Crafter',
};

const CreateCrafterPage = async() => {
  await verifyAdmin();
    return (
      <>
        <h2 className='h2-bold'>Create Crafter</h2>
        <div className='my-8'>
          <CrafterForm type='Create' />
        </div>
      </>
    );
};

export default CreateCrafterPage;
