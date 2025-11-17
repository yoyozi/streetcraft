'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

// Product-specific filter types
export interface ProductFilters {
  query: string;
  category: string;
  price: string;
  rating: string;
  sort: string;
}

// User-specific filter types  
export interface UserFilters {
  query: string;
  role: string;
  status: string;
  registrationDate: string;
  sort: string;
}

// Order-specific filter types
export interface OrderFilters {
  query: string;
  status: string;
  paymentMethod: string;
  dateRange: string;
  sort: string;
}

// Base filter component props
interface BaseFilterProps<T> {
  filters: T;
  onFiltersChange: (filters: T) => void;
  onClearFilters: () => void;
  children: React.ReactNode;
}

// Base filter component
function BaseFilter<T>({ filters, onFiltersChange, onClearFilters, children }: BaseFilterProps<T>) {
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'query' && value && value.toString().trim() !== '' && value !== 'all'
  );

  return (
    <div className="flex flex-wrap gap-4 items-center p-4 bg-muted/50 rounded-lg">
      {children}
      
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

// Product Filters Component
export function ProductFilters({ 
  initialFilters,
  categories 
}: {
  initialFilters: ProductFilters;
  categories: { name: string }[];
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);

  // Update URL when filters change
  const updateFilters = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      }
    });
    
    const queryString = params.toString();
    const newUrl = queryString ? `/admin/products?${queryString}` : '/admin/products';
    router.push(newUrl);
  };

  const updateFilter = (key: keyof ProductFilters, value: string) => {
    updateFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    updateFilters({
      query: filters.query, // Keep the current search query
      category: 'all',
      price: 'all',
      rating: 'all',
      sort: 'newest',
    });
  };

  return (
    <BaseFilter 
      filters={filters} 
      onFiltersChange={updateFilters}
      onClearFilters={clearFilters}
    >
      {/* Category */}
      <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.name} value={category.name}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Price Range */}
      <Select value={filters.price} onValueChange={(value) => updateFilter('price', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Price" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Prices</SelectItem>
          <SelectItem value="0-50">Under $50</SelectItem>
          <SelectItem value="50-100">$50 - $100</SelectItem>
          <SelectItem value="100-200">$100 - $200</SelectItem>
          <SelectItem value="200+">$200+</SelectItem>
        </SelectContent>
      </Select>

      {/* Rating */}
      <Select value={filters.rating} onValueChange={(value) => updateFilter('rating', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Rating" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Ratings</SelectItem>
          <SelectItem value="4">4+ Stars</SelectItem>
          <SelectItem value="3">3+ Stars</SelectItem>
          <SelectItem value="2">2+ Stars</SelectItem>
          <SelectItem value="1">1+ Stars</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={filters.sort} onValueChange={(value) => updateFilter('sort', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="lowest">Price: Low to High</SelectItem>
          <SelectItem value="highest">Price: High to Low</SelectItem>
          <SelectItem value="rating">Highest Rated</SelectItem>
        </SelectContent>
      </Select>
    </BaseFilter>
  );
}

// User Filters Component
export function UserFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onClearFilters: () => void;
}) {
  const updateFilter = (key: keyof UserFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <BaseFilter 
      filters={filters} 
      onFiltersChange={onFiltersChange}
      onClearFilters={onClearFilters}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={filters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Role */}
      <Select value={filters.role} onValueChange={(value) => updateFilter('role', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>

      {/* Registration Date */}
      <Select value={filters.registrationDate} onValueChange={(value) => updateFilter('registrationDate', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Joined" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={filters.sort} onValueChange={(value) => updateFilter('sort', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="name">Name A-Z</SelectItem>
          <SelectItem value="name-desc">Name Z-A</SelectItem>
        </SelectContent>
      </Select>
    </BaseFilter>
  );
}

// Order Filters Component
export function OrderFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onClearFilters: () => void;
}) {
  const updateFilter = (key: keyof OrderFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <BaseFilter 
      filters={filters} 
      onFiltersChange={onFiltersChange}
      onClearFilters={onClearFilters}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orders..."
          value={filters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status */}
      <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {/* Payment Method */}
      <Select value={filters.paymentMethod} onValueChange={(value) => updateFilter('paymentMethod', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Payment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Methods</SelectItem>
          <SelectItem value="paypal">PayPal</SelectItem>
          <SelectItem value="cod">Cash on Delivery</SelectItem>
          <SelectItem value="eft">EFT</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range */}
      <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={filters.sort} onValueChange={(value) => updateFilter('sort', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="total-high">Total: High to Low</SelectItem>
          <SelectItem value="total-low">Total: Low to High</SelectItem>
        </SelectContent>
      </Select>
    </BaseFilter>
  );
}
