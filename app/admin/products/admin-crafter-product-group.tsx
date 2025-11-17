'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import DeleteDialog from '@/components/shared/delete-dialog';
import { deleteProduct, toggleProductActive } from '@/lib/actions/product.actions';
import ToggleFirstPageButton from './toggle-first-page-button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: string;
  costPrice?: number;
  priceNeedsReview?: boolean;
  lastCostPriceUpdate?: string;
  availability: number;
  isActive: boolean;
  category: string;
  rating: string;
  isFirstPage: boolean;
}

interface AdminCrafterProductGroupProps {
  crafterName: string;
  crafterId: string;
  productCount: number;
  products: Product[];
  defaultExpanded?: boolean;
  onProductDrop?: (productId: string, targetCrafterId: string, productName: string) => void;
}

export default function AdminCrafterProductGroup({
  crafterName,
  crafterId,
  productCount,
  products,
  defaultExpanded = false,
  onProductDrop,
}: AdminCrafterProductGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isDragOver, setIsDragOver] = useState(false);
  const [togglingProducts, setTogglingProducts] = useState<Set<string>>(new Set());
  const router = useRouter();

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

  const getAvailabilityLabel = (availability: number) => {
    if (availability === -1) return { label: 'Not Available', variant: 'destructive' as const };
    if (availability === 0) return { label: 'In Stock', variant: 'default' as const };
    return { label: `${availability} ${availability === 1 ? 'Day' : 'Days'}`, variant: 'secondary' as const };
  };

  const handleDragStart = (e: React.DragEvent, productId: string, productName: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('productId', productId);
    e.dataTransfer.setData('productName', productName);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const productId = e.dataTransfer.getData('productId');
    const productName = e.dataTransfer.getData('productName');
    if (productId && productName && onProductDrop) {
      onProductDrop(productId, crafterId, productName);
    }
  };

  return (
    <div 
      className={`border rounded-lg overflow-hidden mb-4 transition-colors ${isDragOver ? 'border-blue-500 bg-blue-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header - Crafter Name and Product Count */}
      <Button
        variant='ghost'
        className='w-full flex items-center justify-between p-4 hover:bg-muted/50 h-auto'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='flex items-center gap-3'>
          {isExpanded ? (
            <ChevronDown className='h-5 w-5' />
          ) : (
            <ChevronRight className='h-5 w-5' />
          )}
          <div className='text-left'>
            <h3 className='text-lg font-semibold'>{crafterName}</h3>
            <p className='text-sm text-muted-foreground'>
              {productCount} {productCount === 1 ? 'product' : 'products'}
            </p>
          </div>
        </div>
        <div className='text-sm text-muted-foreground'>
          {isExpanded ? 'Click to collapse' : 'Click to expand'}
        </div>
      </Button>

      {/* Expandable Products Table */}
      {isExpanded && (
        <div className='border-t'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[40px]'></TableHead>
                <TableHead className='w-[90px]'>NAME</TableHead>
                <TableHead className='w-[80px] text-right'>PRICE</TableHead>
                <TableHead className='w-[80px] text-right'>COST</TableHead>
                <TableHead className='w-[50px]'>STATUS</TableHead>
                <TableHead className='w-[50px]'>REVIEW</TableHead>
                <TableHead className='w-[50px] text-center'>FIRST PAGE</TableHead>
                <TableHead className='w-[150px]'>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow 
                  key={product.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, product.id, product.name)}
                  className='cursor-move hover:bg-muted/50'
                >
                  <TableCell className='w-[40px] text-center'>
                    <GripVertical className='h-4 w-4 text-muted-foreground' />
                  </TableCell>
                  <TableCell className='w-[100px] font-medium'>
                    <Link href={`/admin/products/${product.id}`} className='hover:underline truncate block'>
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className='w-[120px] text-right'>
                    {formatCurrency(product.price)}
                  </TableCell>
                  <TableCell className='w-[120px] text-right'>
                    R{product.costPrice || 0}
                  </TableCell>
                  <TableCell className='w-[120px]'>
                    <Badge variant={getAvailabilityLabel(product.availability).variant}>
                      {getAvailabilityLabel(product.availability).label}
                    </Badge>
                  </TableCell>
                  <TableCell className='w-[100px]'>
                    {product.priceNeedsReview && (
                      <Badge variant='destructive' className='gap-1'>
                        <AlertCircle className='h-3 w-3' />
                        Review
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className='w-[120px] text-center'>
                    <ToggleFirstPageButton
                      productId={product.id}
                      isFirstPage={product.isFirstPage}
                    />
                  </TableCell>
                  <TableCell className='w-[100px] flex gap-1'>
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
                    <DeleteDialog id={product.id} action={deleteProduct} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
