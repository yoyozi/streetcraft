import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUserById } from '@/lib/actions/user.actions';
import UpdateUserForm from './update-user-form';
import { verifyAdmin } from '@/lib/actions/auth-actions';
import { USER_ROLES } from '@/lib/constants';

// Define the user type with isActive field
type UserWithIsActive = Awaited<ReturnType<typeof getUserById>> & {
  isActive?: boolean;
};

export const metadata: Metadata = {
  title: 'Update user',
};

const UpdateUserPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  await verifyAdmin();
  const { id } = await props.params;

  try {
    const user = await getUserById(id);
    if (!user) notFound();
    
    // Transform the user object to match the expected type
    const userWithIsActive = user as UserWithIsActive;
    const userData = {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role as typeof USER_ROLES[number],
      isActive: userWithIsActive.isActive ?? true,
      password: '',
      requirePasswordReset: false,
    };

    return (
      <div className='space-y-8 max-w-lg mx-auto'>
        <h1 className='h2-bold'>Update User</h1>
        <UpdateUserForm user={userData} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    notFound();
  }
};

export default UpdateUserPage;