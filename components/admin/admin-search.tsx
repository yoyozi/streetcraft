'use client'

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function AdminSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');

  // Don't show on admin landing page or overview page
  if (pathname === '/admin' || pathname === '/admin/' || pathname === '/admin/overview' || pathname === '/admin/categories' || pathname === '/admin/crafters') {
    return null;
  }

  // Determine search placeholder and route based on current path
  const getSearchConfig = () => {
    if (pathname.includes('/products')) {
      return {
        placeholder: 'Search products...',
        route: '/admin/products',
      };
    }
    if (pathname.includes('/users')) {
      return {
        placeholder: 'Search users...',
        route: '/admin/users',
      };
    }
    if (pathname.includes('/orders')) {
      return {
        placeholder: 'Search orders...',
        route: '/admin/orders',
      };
    }
    if (pathname.includes('/categories')) {
      return {
        placeholder: 'Search categories...',
        route: '/admin/categories',
      };
    }
    if (pathname.includes('/crafters')) {
      return {
        placeholder: 'Search crafters...',
        route: '/admin/crafters',
      };
    }
    // Default fallback
    return {
      placeholder: 'Search...',
      route: '/admin',
    };
  };

  const { placeholder, route } = getSearchConfig();

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.trim()) {
      router.push(`${route}?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(route);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-md bg-white">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 pr-4"
      />
    </form>
  );
}
