import { Button } from '@/components/ui/button';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Unauthorized Access',
};

export default function UnauthorizedPage() {
  return (
    <div className='container mx-auto flex h-[calc(100vh-200px)] flex-col items-center justify-center space-y-4'>
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-chart-2 text-primary-foreground mb-4">
        <span className="text-2xl font-bold">SC</span>
      </div>
      <h1 className='h1-bold text-4xl'>Unauthorized Access</h1>
      <p className='text-muted-foreground'>
        You do not have permission to access this page.
      </p>
      <Button asChild>
        <Link href='/'>Return Home</Link>
      </Button>
    </div>
  );
}