import { auth } from '@/auth';
import CrafterProductsList from './crafter-products-list';

export default async function CrafterProducts() {
  const session = await auth();
  const crafterName = session?.user?.name || 'Your';

  return <CrafterProductsList crafterName={crafterName} />;
}
