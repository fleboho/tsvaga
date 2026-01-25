import ItemCard from './ItemCard';
import Pagination from './Pagination';

interface Item {
  id: string;
  title: string;
  description: string;
  category: string | null;
  location: string | null;
  status: string;
  imageUrls: string[];
  createdAt: string;
}

interface PaginationData {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface SearchResponse {
  items: Item[];
  pagination: PaginationData;
}

async function fetchSearchResults(params: any): Promise<SearchResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.q) queryParams.set('q', params.q);
    if (params.category) queryParams.set('category', params.category);
    if (params.location) queryParams.set('location', params.location);
    if (params.page) queryParams.set('page', params.page);
    if (params.pageSize) queryParams.set('pageSize', params.pageSize);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/items?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching search results:', error);
    return { items: [], pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
  }
}

interface SearchResultsProps {
  searchParams: {
    q?: string;
    category?: string;
    location?: string;
    page?: string;
    pageSize?: string;
  };
}

export default async function SearchResults({ searchParams }: SearchResultsProps) {
  const { items, pagination } = await fetchSearchResults(searchParams);
  
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {searchParams.q || searchParams.category || searchParams.location 
            ? 'Try adjusting your search filters or search terms.'
            : 'No items have been reported yet. Check back later.'}
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Search Results</h2>
          <p className="text-gray-600 text-sm">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} items
          </p>
        </div>
        
        <div className="text-sm text-gray-500">
          Page {pagination.page} of {pagination.totalPages}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
      
      <Pagination pagination={pagination} />
    </div>
  );
}