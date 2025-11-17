'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon } from 'lucide-react';

interface Category {
    category: string;
}

const Search = () => {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Fetch categories on mount
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error('Failed to load categories:', err));
    }, []);

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value);
        // Auto-navigate when category changes
        const params = new URLSearchParams();
        params.set('category', value);
        if (searchQuery) params.set('q', searchQuery);
        router.push(`/search?${params.toString()}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        if (searchQuery) params.set('q', searchQuery);
        router.push(`/search?${params.toString()}`);
    };

  return (
    <form onSubmit={handleSubmit}>
        <div className="flex w-full max-w-sm items-center space-x-2">

            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder='All Categories'/>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem key='all' value='all'>All</SelectItem>
                    {categories.map((x) => (
                        <SelectItem key={x.category} value={x.category}>
                            {x.category}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Input 
                type='text' 
                placeholder='Search...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='md:w-[100px] lg:w-[300px]'
            />

            <Button type='submit'>
                <SearchIcon />
            </Button>

        </div>
    </form>
  );
};

export default Search;