import { auth } from '@/auth';
import CrafterDashboard from './crafter-dashboard';

export default async function CrafterDashboardPage() {
  const session = await auth();
  const crafterName = session?.user?.name || 'Your';

  return <CrafterDashboard crafterName={crafterName} />;
}