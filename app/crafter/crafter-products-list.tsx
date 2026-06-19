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
  const [costPrice, setCostPrice] = useState(product.costPrice ? String(product.costPrice) : '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync local state when product data updates (only override if remote has a real value)
  useEffect(() => {
    setCostPrice(product.costPrice ? String(product.costPrice) : '');
  }, [product.costPrice]);

  const handleUpdate = async () => {
    const numValue = parseFloat(costPrice);
    if (isNaN(numValue) || numValue <= 0) {
      toast.error('Please enter a cost price greater than 0');
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
      setCostPrice(String(product.costPrice || 0));
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
          disabled={isUpdating || costPrice === String(product.costPrice ?? '')}
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
  const [availability, setAvailability] = useState(String(product.availability));
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync local state when product data updates
  useEffect(() => {
    setAvailability(String(product.availability));
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
      setAvailability(String(product.availability));
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
        -1 = Not Available (deactivates & sends for admin review), 0 = In Stock, 1+ = Days until available
      </p>
    </div>
  );
}

function NotAvailableButton({ product, onUpdate }: { product: Product; onUpdate: () => void }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isUnavailable = product.availability === -1;

  const handleToggle = async () => {
    setIsUpdating(true);
    const newAvailability = isUnavailable ? 0 : -1;
    const result = await updateProductAvailability(product.id, newAvailability);
    if (result.success) {
      toast.success(result.message);
      onUpdate();
    } else {
      toast.error(result.message);
    }
    setIsUpdating(false);
  };

  return (
    <div className="pt-2 border-t">
      <Button
        variant={isUnavailable ? 'outline' : 'destructive'}
        size="sm"
        className="w-full"
        onClick={handleToggle}
        disabled={isUpdating}
      >
        {isUpdating ? 'Updating...' : isUnavailable ? 'Mark as Available' : 'Mark as Not Available'}
      </Button>
      <p className="text-xs text-muted-foreground mt-1">
        {isUnavailable ? 'Item is currently unavailable' : 'Remove this item from the shop temporarily'}
      </p>
    </div>
  );
}

function CompletionForm({ product, onUpdate }: { product: Product; onUpdate: () => void }) {
  const [form, setForm] = useState({
    costPrice: product.costPrice ? String(product.costPrice) : '',
    weight: product.weight ? String(product.weight) : '',
    height: product.height ? String(product.height) : '',
    width: product.width ? String(product.width) : '',
    depth: product.depth ? String(product.depth) : '',
    availability: '3',
    isUnique: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const cp = parseFloat(form.costPrice);
    const wt = parseFloat(form.weight);
    const ht = parseFloat(form.height);
    const wd = parseFloat(form.width);
    const dp = parseFloat(form.depth);

    if (!form.costPrice || isNaN(cp) || cp <= 0) {
      toast.error('Please enter a valid cost price greater than 0'); return;
    }
    if (!form.weight || isNaN(wt) || wt <= 0) {
      toast.error('Please enter a valid weight greater than 0'); return;
    }
    if (!form.height || isNaN(ht) || ht <= 0) {
      toast.error('Please enter a valid height greater than 0'); return;
    }
    if (!form.width || isNaN(wd) || wd <= 0) {
      toast.error('Please enter a valid width greater than 0'); return;
    }
    if (!form.depth || isNaN(dp) || dp <= 0) {
      toast.error('Please enter a valid depth greater than 0'); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/crafter/products/${product.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Product details saved!');
        onUpdate();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  return (
    <div className="mt-4 space-y-3">
      <div>
        <Label>Cost Price (R)</Label>
        <Input type="number" placeholder="0.00" value={form.costPrice}
          onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
      </div>
      <div>
        <Label>Weight (kg)</Label>
        <Input type="number" placeholder="0.0" value={form.weight}
          onChange={(e) => setForm({ ...form, weight: e.target.value })} />
      </div>
      <div>
        <Label>Height (cm)</Label>
        <Input type="number" placeholder="0" value={form.height}
          onChange={(e) => setForm({ ...form, height: e.target.value })} />
      </div>
      <div>
        <Label>Width (cm)</Label>
        <Input type="number" placeholder="0" value={form.width}
          onChange={(e) => setForm({ ...form, width: e.target.value })} />
      </div>
      <div>
        <Label>Depth (cm)</Label>
        <Input type="number" placeholder="0" value={form.depth}
          onChange={(e) => setForm({ ...form, depth: e.target.value })} />
      </div>
      {!form.isUnique && (
        <div>
          <Label>Availability (days)</Label>
          <Input type="number" placeholder="3" value={form.availability}
            onChange={(e) => setForm({ ...form, availability: e.target.value })} />
        </div>
      )}
      <label className="flex items-start gap-2 rounded-md border p-2 cursor-pointer">
        <input type="checkbox" className="mt-1" checked={form.isUnique}
          onChange={(e) => setForm({ ...form, isUnique: e.target.checked })} />
        <span className="text-sm">
          <span className="font-medium">Unique item</span>
          <span className="block text-xs text-muted-foreground">One-of-a-kind (e.g. a painting). Only one will be sold.</span>
        </span>
      </label>
      <Button onClick={handleSubmit} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Submit for Approval'}
      </Button>
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
  const availableProducts = products.filter((p: Product) => !p.isSold);

  const getAvailabilityLabel = (availability: number, isUnique?: boolean) => {
    if (isUnique) return { label: 'Unique', variant: 'default' as const, className: 'bg-purple-600 hover:bg-purple-600/90 text-white' };
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

  const renderProductCard = (product: Product) => {
    const availability = getAvailabilityLabel(product.availability, product.isUnique);
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
          <CardTitle className="line-clamp-3">
            <span className="text-lg">{product.name}</span>
            <span className="text-sm text-muted-foreground"> - {product.description}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {(product.needsCompletion || !product.weight || !product.height || !product.width || !product.depth || !product.costPrice) ? (
            <CompletionForm product={product} onUpdate={() => mutate()} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <span className="text-lg font-bold">R{product.costPrice || '0'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={availability.variant} className={availability.className}>
                    {availability.label}
                  </Badge>
                  {product.priceNeedsReview && (
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      Pending admin review
                    </Badge>
                  )}
                </div>
              </div>
              <CostPriceEditor product={product} onUpdate={() => mutate()} />
              {product.isUnique ? (
                <NotAvailableButton product={product} onUpdate={() => mutate()} />
              ) : (
                <AvailabilityEditor product={product} onUpdate={() => mutate()} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{crafterName}: Products</h1>
      </div>

      {availableProducts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No active products</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {availableProducts.map(renderProductCard)}
        </div>
      )}

    </div>
  );
}
