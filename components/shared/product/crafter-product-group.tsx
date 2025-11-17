'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ProductCard from './product-card';
import { Button } from '@/components/ui/button';

interface CrafterProductGroupProps {
  crafterName: string;
  productCount: number;
  products: any[];
  defaultExpanded?: boolean;
}

export default function CrafterProductGroup({
  crafterName,
  productCount,
  products,
  defaultExpanded = false,
}: CrafterProductGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className='border rounded-lg overflow-hidden mb-4'>
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

      {/* Expandable Products Grid */}
      {isExpanded && (
        <div className='p-4 bg-muted/20 border-t'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
