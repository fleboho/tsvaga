import { Suspense } from 'react';
import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import { SearchParamsProvider } from './SearchParamsContext';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  
  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Search Found Items</h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Browse through items found by administrators. Use our powerful search to filter by keywords, category, or location.
        </p>
      </div>
      
      <SearchParamsProvider initialParams={params}>
        {/* Search Section */}
        <div className="card mb-12">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Refine Your Search</h2>
                <p className="text-gray-600 mt-1">Use the filters below to find specific items</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Tip: Combine filters for better results</span>
                  </div>
                </div>
                <a
                  href="/search/advanced"
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Advanced Search
                </a>
              </div>
            </div>
            
            <Suspense fallback={
              <div className="space-y-4">
                <div className="h-16 bg-gray-100 animate-pulse rounded-xl"></div>
              </div>
            }>
              <SearchForm />
            </Suspense>
          </div>
          
          {/* Results Section */}
          <div className="p-8">
            <Suspense fallback={
              <div className="space-y-8">
                <div className="h-8 bg-gray-100 animate-pulse rounded w-1/4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="card">
                      <div className="h-48 bg-gray-100 animate-pulse rounded-t-xl"></div>
                      <div className="p-6">
                        <div className="h-5 bg-gray-100 animate-pulse rounded mb-3"></div>
                        <div className="h-4 bg-gray-100 animate-pulse rounded mb-4"></div>
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-100 animate-pulse rounded w-1/3"></div>
                          <div className="h-4 bg-gray-100 animate-pulse rounded w-1/3"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }>
              <SearchResults searchParams={params} />
            </Suspense>
          </div>
        </div>
      </SearchParamsProvider>
      
      {/* Help Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">How to Claim an Item</h3>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold mr-4">
                  1
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Search for Your Item</h4>
                <p className="text-gray-700">Use keywords, category, or location filters to find items matching your lost item.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold mr-4">
                  2
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">View Item Details</h4>
                <p className="text-gray-700">Click on an item to see detailed information, photos, and when/where it was found.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold mr-4">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Contact the Admin</h4>
                <p className="text-gray-700">Use the "Contact Admin" button to send a secure message about the item.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold mr-4">
                  4
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Arrange Return</h4>
                <p className="text-gray-700">The administrator will review your request and contact you to arrange the return.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Need More Help?</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Create an Alert</h4>
              <p className="text-gray-700 mb-3">Can't find your item? Create an alert and we'll notify you when a matching item is found.</p>
              <a href="/register" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
                Set up an alert
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
            <div className="pt-6 border-t border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2">Found an Item?</h4>
              <p className="text-gray-700 mb-3">If you're an administrator, you can report found items through the admin portal.</p>
              <a href="/login" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
                Admin login
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
            <div className="pt-6 border-t border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2">Have Questions?</h4>
              <p className="text-gray-700">Contact our support team for assistance with the platform or item claims.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
