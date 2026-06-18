'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import DeleteDialog from '@/components/shared/delete-dialog';
import { deleteProduct, toggleProductActive } from '@/lib/actions/product.actions';
import ToggleFirstPageButton from './toggle-first-page-button';
import { toast } from 'sonner';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  costPrice?: number;
  priceNeedsReview?: boolean;
  reviewReason?: string | null;
  lastCostPriceUpdate?: string;
  availability: number;
  isActive: boolean;
  isUnique: boolean;
  isSold?: boolean;
  category: string;
  rating: string;
  isFirstPage: boolean;
  needsCompletion?: boolean;
  crafter?: { id: string; name: string } | null;
}

interface ProductsListClientProps {
  products: Product[];
  allCrafters: Array<{
    id: string;
    name: string;
  }>;
  selectedCrafter: string;
}

export default function ProductsListClient({ products, allCrafters, selectedCrafter }: ProductsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [togglingProducts, setTogglingProducts] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [showPending, setShowPending] = useState(false);

  const pendingCount = products.filter((p) => p?.needsCompletion).length;
  const visibleProducts = showPending ? products : products.filter((p) => !p?.needsCompletion);
  const needsReviewCount = visibleProducts.filter((p) => p && p.priceNeedsReview).length;

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    // Brief visual feedback; server data re-renders on refresh
    setTimeout(() => setRefreshing(false), 800);
  };

  const getAvailabilityLabel = (product: Product) => {
    if (product.isUnique) {
      return product.isSold
        ? { label: 'Sold', variant: 'destructive' as const, className: '' }
        : { label: 'Unique', variant: 'default' as const, className: 'bg-purple-600 hover:bg-purple-600/90 text-white' };
    }
    if (product.availability === -1) return { label: 'Not Available', variant: 'destructive' as const, className: '' };
    if (product.availability === 0) return { label: 'In Stock', variant: 'default' as const, className: 'bg-chart-2 hover:bg-chart-2/90 text-white' };
    return { label: `${product.availability} ${product.availability === 1 ? 'Day' : 'Days'}`, variant: 'secondary' as const, className: '' };
  };

  const isSoldUnique = (product: Product) => product.isUnique && !!product.isSold;

  const handleToggleActive = async (productId: string, productName: string) => {
    setTogglingProducts(prev => new Set(prev).add(productId));
    const result = await toggleProductActive(productId);
    
    if (result.success) {
      toast.success(`${productName} ${result.isActive ? 'activated' : 'deactivated'}`);
      router.refresh();
    } else {
      toast.error(result.message || 'Failed to toggle product status');
    }
    setTogglingProducts(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const handleCrafterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('crafter');
    } else {
      params.set('crafter', value);
    }
    params.delete('page'); // Reset to page 1
    router.push(`/admin/products?${params.toString()}`);
  };

  if (!products || products.length === 0) {
    return (
      <div className='text-center py-10'>
        <p className='text-muted-foreground'>No products found</p>
      </div>
    );
  }

  if (!showPending && visibleProducts.length === 0) {
    return (
      <div className='text-center py-10'>
        <p className='text-muted-foreground'>No products found</p>
        {pendingCount > 0 && (
          <p className='text-xs text-muted-foreground mt-1'>{pendingCount} pending product(s) hidden — use the checkbox to show them.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className='mb-4 flex flex-wrap items-center gap-2'>
        <span className='text-sm font-medium'>Crafter:</span>
        <Select value={selectedCrafter || 'all'} onValueChange={handleCrafterChange}>
          <SelectTrigger className='w-[250px]'>
            <SelectValue placeholder='All Crafters' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Crafters</SelectItem>
            {allCrafters.map((crafter) => (
              <SelectItem key={crafter.id} value={crafter.id}>
                {crafter.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className='flex items-center gap-2 text-sm cursor-pointer'>
          <input
            type='checkbox'
            checked={showPending}
            onChange={(e) => setShowPending(e.target.checked)}
            className='h-4 w-4'
          />
          Show pending ({pendingCount})
        </label>

        <div className='ml-auto flex items-center gap-2'>
          {needsReviewCount > 0 && (
            <Badge variant='destructive' className='gap-1'>
              <AlertCircle className='h-3 w-3' />
              {needsReviewCount} need{needsReviewCount === 1 ? 's' : ''} review
            </Badge>
          )}
          <Button variant='outline' size='sm' onClick={handleRefresh} disabled={refreshing} className='gap-1'>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NAME</TableHead>
            <TableHead>CRAFTER</TableHead>
            <TableHead className='text-right'>PRICE</TableHead>
            <TableHead className='text-right'>COST</TableHead>
            <TableHead>STATUS</TableHead>
            <TableHead className='text-center'>FIRST PAGE</TableHead>
            <TableHead>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleProducts.filter(p => p && p.id).map((product) => {
            const availability = getAvailabilityLabel(product);
            return (
              <TableRow key={product.id}>
                <TableCell className='font-medium'>
                  <div className={`${product.priceNeedsReview ? 'bg-red-500 text-white px-2 py-1 rounded' : ''}`}>
                    {product.name}
                    {product.description && (
                      <span className={`text-sm font-normal ml-2 ${product.priceNeedsReview ? 'text-white/90' : 'text-muted-foreground'}`}>
                        - {product.description}
                      </span>
                    )}
                    {product.priceNeedsReview && product.reviewReason && (
                      <span className='block text-xs font-normal text-white/90 mt-0.5'>
                        Changed: {product.reviewReason}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{product.crafter?.name || 'Unassigned'}</TableCell>
                <TableCell className='text-right'>
                  {formatCurrency(product.price)}
                </TableCell>
                <TableCell className='text-right'>
                  R{product.costPrice || 0}
                </TableCell>
                <TableCell>
                  <Badge variant={availability.variant} className={availability.className}>
                    {availability.label}
                  </Badge>
                </TableCell>
                <TableCell className='text-center'>
                  {isSoldUnique(product) ? (
                    <span className='text-xs text-muted-foreground'>—</span>
                  ) : (
                    <ToggleFirstPageButton
                      productId={product.id}
                      isFirstPage={product.isFirstPage}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <div className='flex gap-1'>
                    {isSoldUnique(product) ? (
                      <Badge variant='destructive'>Sold</Badge>
                    ) : (
                      <>
                        <Button
                          variant={product.isActive ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => handleToggleActive(product.id, product.name)}
                          disabled={togglingProducts.has(product.id)}
                        >
                          {togglingProducts.has(product.id) ? '...' : (product.isActive ? 'Active' : 'Inactive')}
                        </Button>
                        <Button asChild variant='outline' size='sm'>
                          <Link href={`/admin/products/${product.id}`}>Edit</Link>
                        </Button>
                      </>
                    )}
                    <DeleteDialog id={product.id} action={deleteProduct} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
