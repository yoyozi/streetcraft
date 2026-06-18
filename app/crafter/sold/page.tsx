import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';
import Image from 'next/image';
import { getCrafterSoldItems } from '@/lib/actions/crafter-sold.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Pagination from '@/components/shared/pagination';

export default async function CrafterSoldPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'craft') redirect('/sign-in');

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;

  const result = await getCrafterSoldItems(page);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Sold Items</h1>
          <p className="text-sm text-muted-foreground mt-1">{result.totalCount} item{result.totalCount !== 1 ? 's' : ''} sold</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/crafter">Back to dashboard</Link>
        </Button>
      </div>

      {result.data.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">No sold items yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {result.data.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center gap-4 py-3">
                <div className="relative w-16 h-16 flex-shrink-0 bg-muted rounded">
                  <Image
                    src={item.image || '/images/placeholder.png'}
                    alt={item.name}
                    fill
                    className="object-contain rounded"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.qty} &nbsp;·&nbsp; R{item.price.toFixed(2)} each
                  </p>
                  {item.paidAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.paidAt).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold">R{(item.price * item.qty).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <Pagination page={page} totalPages={result.totalPages} />
      )}
    </div>
  );
}
