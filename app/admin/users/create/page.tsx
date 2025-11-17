import { Metadata } from 'next';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import CreateUserForm from '@/components/admin/create-user-form';

export const metadata: Metadata = {
  title: 'Add User',
};

const CreateUserPage = async () => {
  await verifyAdmin();

  return (
    <>
      <h2 className='h2-bold'>Add User</h2>
      <div className='my-8'>
        <CreateUserForm />
      </div>
    </>
  );
};

export default CreateUserPage;
