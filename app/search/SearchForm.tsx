'use client';

import { useRouter } from 'next/navigation';
import { useSearchParams } from './SearchParamsContext';
import { useEffect, useState } from 'react';

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
    return await response.json();
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return { categories: [], locations: [] };
  }
}

export default function SearchForm() {
  const router = useRouter();
  const { params, updateParams } = useSearchParams();
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ categories: [], locations: [] });
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
    if (params.location) queryParams.set('location', params.location);
    if (params.page && params.page !== '1') queryParams.set('page', params.page);
    if (params.pageSize && params.pageSize !== '20') queryParams.set('pageSize', params.pageSize);
    
    // Navigate with query params
    router.push(`/search?${queryParams.toString()}`);
  };

  const handleReset = () => {
    updateParams({ q: '', category: '', location: '' });
    router.push('/search');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div>
          <label htmlFor="q" className="block text-sm font-medium text-gray-700 mb-1">
            Search Keywords
          </label>
          <input
            type="text"
            id="q"
            value={params.q || ''}
            onChange={(e) => updateParams({ q: e.target.value })}
            placeholder="e.g., wallet, keys, phone..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Category Select */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={params.category || ''}
            onChange={(e) => updateParams({ category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          >
            <option value="">All Categories</option>
            {filterOptions.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Location Select */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            id="location"
            value={params.location || ''}
            onChange={(e) => updateParams({ location: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          >
            <option value="">All Locations</option>
            {filterOptions.locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {isLoading ? 'Loading filters...' : 
           `Found ${filterOptions.categories.length} categories and ${filterOptions.locations.length} locations`}
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Search
          </button>
        </div>
      </div>

      {/* Active filters display */}
      {(params.q || params.category || params.location) && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {params.q && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Keywords: {params.q}
                  <button
                    type="button"
                    onClick={() => updateParams({ q: '' })}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {params.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Category: {params.category}
                  <button
                    type="button"
                    onClick={() => updateParams({ category: '' })}
                    className="ml-1.5 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {params.location && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Location: {params.location}
                  <button
                    type="button"
                    onClick={() => updateParams({ location: '' })}
                    className="ml-1.5 text-purple-600 hover:text-purple-800"
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