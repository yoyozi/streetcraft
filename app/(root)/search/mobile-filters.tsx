'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MobileFiltersProps {
  category: string;
  price: string;
  categories: Array<{ category: string }>;
  prices: Array<{ name: string; value: string }>;
}

export default function MobileFilters({
  category,
  price,
  categories,
  prices,
}: MobileFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Build filter URL client-side
  const getFilterUrl = ({
    c,
    p,
    r,
  }: {
    c?: string;
    p?: string;
    r?: string;
  }) => {
    const q = searchParams.get('q') || 'all';
    const sort = searchParams.get('sort') || 'newest';
    const page = searchParams.get('page') || '1';
    const rating = searchParams.get('rating') || 'all';

    const params = { q, category, price, rating, page, sort };
    if (c) params.category = c;
    if (p) params.price = p;
    if (r) params.rating = r;

    return `/search?${new URLSearchParams(params).toString()}`;
  };

  return (
    <div className='md:hidden col-span-full space-y-3'>
      <div className='grid grid-cols-2 gap-3'>
        {/* Category Dropdown */}
        <Select
          value={category}
          onValueChange={(value) => router.push(getFilterUrl({ c: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder='Category' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Categories</SelectItem>
            {categories.map((x) => (
              <SelectItem key={x.category} value={x.category}>
                {x.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price Dropdown */}
        <Select 
          value={price} 
          onValueChange={(value) => router.push(getFilterUrl({p: value}))}
        >
          <SelectTrigger>
            <SelectValue placeholder='Price' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Prices</SelectItem>
            {prices.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
