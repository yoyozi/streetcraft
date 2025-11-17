'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Product } from '@/types';
import { updateProductAvailability, updateProductCostPrice } from '@/lib/actions/product.actions';
import { toast } from 'sonner';

interface CrafterProductsListProps {
  crafterName: string;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }
  return res.json();
};

// Inline cost price editor component
function CostPriceEditor({ product, onUpdate }: { product: Product; onUpdate: () => void }) {
  const [costPrice, setCostPrice] = useState(product.costPrice?.toString() || '0');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync local state when product data updates
  useEffect(() => {
    setCostPrice(product.costPrice?.toString() || '0');
  }, [product.costPrice]);

  const handleUpdate = async () => {
    const numValue = parseFloat(costPrice);
    if (isNaN(numValue) || numValue < 0) {
      toast.error('Please enter a valid price (0 or greater)');
      return;
    }

    setIsUpdating(true);
    const result = await updateProductCostPrice(product.id, numValue);
    
    if (result.success) {
      toast.success('Cost price updated successfully');
      // Immediate revalidation without deduping
      onUpdate();
    } else {
      toast.error(result.message || 'Failed to update cost price');
      // Revert on error
      setCostPrice(product.costPrice?.toString() || '0');
    }
    setIsUpdating(false);
  };

  return (
    <div className="space-y-2 pt-2 border-t">
      <Label htmlFor={`costPrice-${product.id}`} className="text-sm font-medium">
        Price (R)
      </Label>
      <div className="flex gap-2">
        <Input
          id={`costPrice-${product.id}`}
          type="number"
          step="0.01"
          value={costPrice}
          onChange={(e) => setCostPrice(e.target.value)}
          placeholder="Price"
          className="flex-1"
          disabled={isUpdating}
        />
        <Button 
          onClick={handleUpdate} 
          disabled={isUpdating || costPrice === product.costPrice?.toString()}
          size="sm"
        >
          {isUpdating ? 'Updating...' : 'Update'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Your cost for this product
      </p>
    </div>
  );
}

// Inline availability editor component
function AvailabilityEditor({ product, onUpdate }: { product: Product; onUpdate: () => void }) {
  const [availability, setAvailability] = useState(product.availability.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync local state when product data updates
  useEffect(() => {
    setAvailability(product.availability.toString());
  }, [product.availability]);

  const handleUpdate = async () => {
    const numValue = parseInt(availability);
    if (isNaN(numValue) || numValue < -1) {
      toast.error('Please enter a valid number (-1 for not available, 0 for in stock, or positive number for days)');
      return;
    }

    setIsUpdating(true);
    const result = await updateProductAvailability(product.id, numValue);
    
    if (result.success) {
      toast.success('Availability updated successfully');
      // Immediate revalidation without deduping
      onUpdate();
    } else {
      toast.error(result.message || 'Failed to update availability');
      // Revert on error
      setAvailability(product.availability.toString());
    }
    setIsUpdating(false);
  };

  return (
    <div className="space-y-2 pt-2">
      <Label htmlFor={`availability-${product.id}`} className="text-sm font-medium">
        Availability
      </Label>
      <div className="flex gap-2">
        <Input
          id={`availability-${product.id}`}
          type="number"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          placeholder="Days until available"
          className="flex-1"
          disabled={isUpdating}
        />
        <Button 
          onClick={handleUpdate} 
          disabled={isUpdating || availability === product.availability.toString()}
          size="sm"
        >
          {isUpdating ? 'Updating...' : 'Update'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        -1 = Not Available, 0 = In Stock, 1+ = Days until available
      </p>
    </div>
  );
}

export default function CrafterProductsList({ crafterName }: CrafterProductsListProps) {
  // SWR with caching, revalidation, and automatic retries
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: Product[] }>(
    '/api/crafter/products',
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch when window regains focus
      revalidateOnReconnect: true, // Refetch when reconnecting
      dedupingInterval: 0, // No deduping for immediate updates
    }
  );

  const products = data?.data || [];

  const getAvailabilityLabel = (availability: number) => {
    if (availability === -1) return { label: 'Not Available', variant: 'destructive' as const, className: '' };
    if (availability === 0) return { label: 'In Stock', variant: 'default' as const, className: 'bg-chart-2 hover:bg-chart-2/90 text-white' };
    return { label: `${availability} ${availability === 1 ? 'Day' : 'Days'}`, variant: 'secondary' as const, className: '' };
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive">Failed to load products</p>
              <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">

      <div>
        <h1 className="text-2xl font-bold">{crafterName}: Products</h1>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">No products found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {products.map((product) => {
            const availability = getAvailabilityLabel(product.availability);
            
            return (
              <Card key={product.id} className="overflow-hidden w-full !pt-0">
                <div className="relative w-full h-96 bg-muted">
                  <Image
                    src={product.images?.[0] || '/images/placeholder.png'}
                    alt={product.name}
                    fill
                    className="object-contain"
                    sizes="1024px"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-3">
                      <span className="text-lg">{product.name}</span>
                      <span className="text-sm text-muted-foreground"> - {product.description}</span>
                    </CardTitle>

                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <span className="text-lg font-bold">
                        R{product.costPrice || '0'}
                      </span>
                    </div>
                    <Badge variant={availability.variant} className={availability.className}>
                      {availability.label}
                    </Badge>
                  </div>
                  <CostPriceEditor product={product} onUpdate={() => mutate()} />
                  <AvailabilityEditor product={product} onUpdate={() => mutate()} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
