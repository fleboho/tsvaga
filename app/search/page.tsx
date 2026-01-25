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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Found Items</h1>
      <p className="text-gray-600 mb-8">
        Search through found items reported by administrators. Use keywords, categories, or locations to filter results.
      </p>
      
      <SearchParamsProvider initialParams={params}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Search Filters</h2>
            <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse rounded"></div>}>
              <SearchForm />
            </Suspense>
          </div>
          
          <div className="p-6">
            <Suspense fallback={
              <div className="space-y-4">
                <div className="h-8 bg-gray-100 animate-pulse rounded w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="h-40 bg-gray-100 animate-pulse rounded-md mb-4"></div>
                      <div className="h-4 bg-gray-100 animate-pulse rounded mb-2"></div>
                      <div className="h-3 bg-gray-100 animate-pulse rounded mb-3"></div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-100 animate-pulse rounded w-1/3"></div>
                        <div className="h-3 bg-gray-100 animate-pulse rounded w-1/3"></div>
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
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Claim an Item</h3>
        <ul className="text-blue-700 space-y-2">
          <li className="flex items-start">
            <span className="inline-block bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 mt-0.5">1</span>
            Search for your lost item using keywords, category, or location
          </li>
          <li className="flex items-start">
            <span className="inline-block bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 mt-0.5">2</span>
            Click on an item to view detailed information and photos
          </li>
          <li className="flex items-start">
            <span className="inline-block bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 mt-0.5">3</span>
            Use the "Contact Admin" button to send a message about the item
          </li>
          <li className="flex items-start">
            <span className="inline-block bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 mt-0.5">4</span>
            The administrator will review your request and contact you
          </li>
        </ul>
      </div>
    </div>
  );
}