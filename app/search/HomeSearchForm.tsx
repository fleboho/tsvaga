'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui';

interface FilterOptions {
  categories: string[];
  locations: string[];
}

async function fetchFilterOptions(): Promise<FilterOptions> {
  try {
    const response = await fetch('/api/items/filters');
    if (!response.ok) {
      throw new Error('Failed to fetch filter options');
    }
    const data = await response.json();
    // Validate response structure
    return {
      categories: Array.isArray(data.categories) ? data.categories : [],
      locations: Array.isArray(data.locations) ? data.locations : [],
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return { categories: [], locations: [] };
  }
}

export default function HomeSearchForm() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ categories: [], locations: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Load filter options on mount
  useEffect(() => {
    async function loadFilters() {
      setIsLoading(true);
      const options = await fetchFilterOptions();
      setFilterOptions(options);
      setIsLoading(false);
    }
    loadFilters();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build query string
    const queryParams = new URLSearchParams();
    
    if (searchQuery) queryParams.set('q', searchQuery);
    if (category) queryParams.set('category', category);
    if (location) queryParams.set('location', location);
    
    // Navigate to search page with query params
    router.push(`/search?${queryParams.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="md:col-span-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords (wallet, keys, phone...)"
            className="input-field"
          />
        </div>

        {/* Category Select */}
        <div>
          <Select
            value={category}
            onChange={setCategory}
            options={[
              { value: '', label: 'All Categories' },
              ...filterOptions.categories.map((cat) => ({
                value: cat,
                label: cat,
              })),
            ]}
            disabled={isLoading}
            loading={isLoading}
            placeholder="All Categories"
          />
        </div>

        {/* Location Select */}
        <div>
          <Select
            value={location}
            onChange={setLocation}
            options={[
              { value: '', label: 'All Locations' },
              ...filterOptions.locations.map((loc) => ({
                value: loc,
                label: loc,
              })),
            ]}
            disabled={isLoading}
            loading={isLoading}
            placeholder="All Locations"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn-primary"
        >
          Search
        </button>
      </div>
    </form>
  );
}