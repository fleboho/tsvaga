"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui';
import Link from 'next/link';

interface FilterOptions {
  categories: string[];
}

interface AdvancedSearchParams {
  // Basic search
  q?: string;
  qMatchType?: 'all' | 'exact' | 'any' | 'none';
  category?: string;
  location?: string;
  
  // Document fields
  documentNumber?: string;
  color?: string;
  
  // Status
  status?: 'all' | 'AVAILABLE' | 'RETURNED';
  
  // Additional document fields
  issuingAuthority?: string;
  holderName?: string;
  documentYear?: string;
  
  // Date range (for analytics only, not search)
  dateFrom?: string;
  dateTo?: string;
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

export default function AdvancedSearchPage() {
  const router = useRouter();
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ categories: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<AdvancedSearchParams>({
    q: '',
    qMatchType: 'all',
    category: 'all',
    location: '',
    documentNumber: '',
    color: '',
    status: 'all',
    issuingAuthority: '',
    holderName: '',
    documentYear: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    async function loadFilters() {
      setIsLoading(true);
      const options = await fetchFilterOptions();
      setFilterOptions(options);
      setIsLoading(false);
    }
    loadFilters();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Build query string with all search parameters
      const queryParams = new URLSearchParams();
      
      // Add all non-empty search parameters
      Object.entries(formData).forEach(([key, value]) => {
        if (value && value !== 'all' && key !== 'dateFrom' && key !== 'dateTo') {
          queryParams.set(key, value.toString());
        }
      });

      // Navigate to search results page with advanced parameters
      router.push(`/search?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error submitting advanced search:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      q: '',
      qMatchType: 'all',
      category: 'all',
      location: '',
      documentNumber: '',
      color: '',
      status: 'all',
      issuingAuthority: '',
      holderName: '',
      documentYear: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const handleSaveAsAlert = () => {
    // Check if user is logged in
    // For now, redirect to login with search parameters
    const queryParams = new URLSearchParams();
    
    Object.entries(formData).forEach(([key, value]) => {
      if (value && value !== 'all' && key !== 'dateFrom' && key !== 'dateTo') {
        queryParams.set(key, value.toString());
      }
    });

    // Store search criteria in session storage or pass as query params
    sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(formData));
    
    // Redirect to login with return URL
    router.push(`/login?returnUrl=/alerts&search=${encodeURIComponent(queryParams.toString())}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-primary-600">Search</Link>
          <span>/</span>
          <span className="text-gray-700">Advanced Search</span>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Search</h1>
            <p className="text-gray-600">
              Find lost items using detailed search criteria. Save your search as an alert to get notified when matching items are found.
            </p>
          </div>
          
          <Link
            href="/search"
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Basic Search
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main search form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Keywords Section */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Keywords</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="q" className="block text-sm font-medium text-gray-700 mb-2">
                      Search for items
                    </label>
                    <input
                      type="text"
                      id="q"
                      name="q"
                      value={formData.q}
                      onChange={handleChange}
                      placeholder="Enter keywords (e.g., 'black wallet', 'silver iPhone')"
                      className="input-field w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="qMatchType" className="block text-sm font-medium text-gray-700 mb-2">
                      Match type
                    </label>
                    <select
                      id="qMatchType"
                      name="qMatchType"
                      value={formData.qMatchType}
                      onChange={handleChange}
                      className="input-field w-full"
                    >
                      <option value="all">All of these words</option>
                      <option value="exact">Exact phrase</option>
                      <option value="any">Any of these words</option>
                      <option value="none">None of these words</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.qMatchType === 'all' && 'Items must contain all words'}
                      {formData.qMatchType === 'exact' && 'Items must contain the exact phrase'}
                      {formData.qMatchType === 'any' && 'Items can contain any of the words'}
                      {formData.qMatchType === 'none' && 'Items must not contain any of the words'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category & Location */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Category & Location</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <Select
                      id="category"
                      value={formData.category || 'all'}
                      onChange={(value) => handleSelectChange('category', value)}
                      options={[
                        { value: 'all', label: 'All Categories' },
                        ...filterOptions.categories.map((category) => ({
                          value: category,
                          label: category,
                        })),
                      ]}
                      disabled={isLoading}
                      loading={isLoading}
                      placeholder="Select category"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Main Building, Parking Lot"
                      className="input-field w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Document & Color Fields */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Item Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Document Number
                    </label>
                    <input
                      type="text"
                      id="documentNumber"
                      name="documentNumber"
                      value={formData.documentNumber}
                      onChange={handleChange}
                      placeholder="e.g., Passport number, ID number"
                      className="input-field w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <input
                      type="text"
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      placeholder="e.g., Black, Red, Blue"
                      className="input-field w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Item Status</h2>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="all"
                      checked={formData.status === 'all'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600"
                    />
                    <span className="ml-2 text-gray-700">All Items</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="AVAILABLE"
                      checked={formData.status === 'AVAILABLE'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600"
                    />
                    <span className="ml-2 text-gray-700">Available Only</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="RETURNED"
                      checked={formData.status === 'RETURNED'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600"
                    />
                    <span className="ml-2 text-gray-700">Returned Items</span>
                  </label>
                </div>
              </div>

              {/* Additional Document Fields */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Document Details (Optional)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="issuingAuthority" className="block text-sm font-medium text-gray-700 mb-2">
                      Issuing Authority
                    </label>
                    <input
                      type="text"
                      id="issuingAuthority"
                      name="issuingAuthority"
                      value={formData.issuingAuthority}
                      onChange={handleChange}
                      placeholder="e.g., Government, University"
                      className="input-field w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="holderName" className="block text-sm font-medium text-gray-700 mb-2">
                      Holder Name
                    </label>
                    <input
                      type="text"
                      id="holderName"
                      name="holderName"
                      value={formData.holderName}
                      onChange={handleChange}
                      placeholder="Name on document"
                      className="input-field w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="documentYear" className="block text-sm font-medium text-gray-700 mb-2">
                      Document Year
                    </label>
                    <input
                      type="text"
                      id="documentYear"
                      name="documentYear"
                      value={formData.documentYear}
                      onChange={handleChange}
                      placeholder="e.g., 2023"
                      className="input-field w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Date Range (Analytics Only) */}
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Date Information (For Analytics)</h2>
                <p className="text-sm text-gray-500 mb-4">
                  This information helps us understand search patterns but will not be used to filter results.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-2">
                      Found From (Optional)
                    </label>
                    <input
                      type="date"
                      id="dateFrom"
                      name="dateFrom"
                      value={formData.dateFrom}
                      onChange={handleChange}
                      className="input-field w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-2">
                      Found To (Optional)
                    </label>
                    <input
                      type="date"
                      id="dateTo"
                      name="dateTo"
                      value={formData.dateTo}
                      onChange={handleChange}
                      className="input-field w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
                <div className="text-sm text-gray-500">
                  {isLoading ? 'Loading categories...' : 
                   `Found ${filterOptions.categories.length} categories`}
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={isSubmitting}
                  >
                    Reset All
                  </button>
                  
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Searching...
                      </span>
                    ) : 'Search Items'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSaveAsAlert}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Save as Alert
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Help Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">How to Use Advanced Search</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>Use keywords to search in item titles and descriptions</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>Select match type for more precise keyword matching</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>Use document number for official documents (passports, IDs)</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>Save your search as an alert to get email notifications</span>
                </li>
              </ul>
            </div>

            {/* Save as Alert Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Save Search as Alert</h3>
              <p className="text-sm text-green-700 mb-3">
                Save your search criteria as an alert to receive email notifications when matching items are found.
              </p>
              <ul className="space-y-2 text-sm text-green-700">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>You must be logged in to save searches as alerts</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>You'll receive email notifications for new matching items</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>Manage your alerts from your dashboard</span>
                </li>
              </ul>
            </div>

            {/* Link to Create Alert Form */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Alert Creation</h3>
              <p className="text-sm text-gray-700 mb-4">
                Need a simpler alert? Use our basic alert creation form.
              </p>
              <Link
                href="/alerts"
                className="inline-block w-full text-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Go to Create Alert Form
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
