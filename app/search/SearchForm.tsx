'use client';

import { useRouter } from 'next/navigation';
import { useSearchParams } from './SearchParamsContext';
import { useEffect, useState } from 'react';
import { Select } from '@/components/ui';

interface FilterOptions {
  categories: string[];
}

interface SearchFormProps {
  compact?: boolean;
}

async function fetchFilterOptions(): Promise<FilterOptions> {
  try {
    const response = await fetch('/api/items/filters');
    if (!response.ok) {
      throw new Error('Failed to fetch filter options');
    }
    const data = await response.json();
    return { categories: data.categories || [] };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return { categories: [] };
  }
}

export default function SearchForm({ compact = false }: SearchFormProps) {
  const router = useRouter();
  const { params, updateParams } = useSearchParams();
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ categories: [] });
  const [isLoading, setIsLoading] = useState(true);

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
    
    if (params.q) queryParams.set('q', params.q);
    if (params.category) queryParams.set('category', params.category);
    if (params.page && params.page !== '1') queryParams.set('page', params.page);
    if (params.pageSize && params.pageSize !== '20') queryParams.set('pageSize', params.pageSize);
    
    // Navigate with query params
    router.push(`/search?${queryParams.toString()}`);
  };

  const handleReset = () => {
    updateParams({ q: '', category: '' });
    router.push('/search');
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2">
            <input
              type="text"
              id="q"
              value={params.q || ''}
              onChange={(e) => updateParams({ q: e.target.value })}
              placeholder="Search by keywords (wallet, keys, phone...)"
              className="input-field"
            />
          </div>

          {/* Category Select */}
          <div>
            <Select
              id="category"
              value={params.category || ''}
              onChange={(value) => updateParams({ category: value })}
              options={[
                { value: '', label: 'All Categories' },
                ...filterOptions.categories.map((category) => ({
                  value: category,
                  label: category,
                })),
              ]}
              disabled={isLoading}
              loading={isLoading}
              placeholder="All Categories"
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Input */}
        <div>
          <label htmlFor="q" className="block text-sm font-medium text-gray-700 mb-2">
            Search Keywords
          </label>
          <input
            type="text"
            id="q"
            value={params.q || ''}
            onChange={(e) => updateParams({ q: e.target.value })}
            placeholder="e.g., wallet, keys, phone..."
            className="input-field"
          />
        </div>

        {/* Category Select */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <Select
            id="category"
            value={params.category || ''}
            onChange={(value) => updateParams({ category: value })}
            options={[
              { value: '', label: 'All Categories' },
              ...filterOptions.categories.map((category) => ({
                value: category,
                label: category,
              })),
            ]}
            disabled={isLoading}
            loading={isLoading}
            placeholder="All Categories"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-500">
          {isLoading ? 'Loading filters...' : 
           `Found ${filterOptions.categories.length} categories`}
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary"
          >
            Reset Filters
          </button>
          <button
            type="submit"
            className="btn-primary"
          >
            Search Items
          </button>
        </div>
      </div>

      {/* Active filters display */}
      {(params.q || params.category) && (
        <div className="pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {params.q && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Keywords: {params.q}
                  <button
                    type="button"
                    onClick={() => updateParams({ q: '' })}
                    className="ml-1.5 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {params.category && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                  Category: {params.category}
                  <button
                    type="button"
                    onClick={() => updateParams({ category: '' })}
                    className="ml-1.5 text-secondary-600 hover:text-secondary-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
