import Link from 'next/link';
import Image from 'next/image';

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    description: string;
    category: string | null;
    location: string | null;
    status: string;
    imageUrls: string[];
    createdAt: string;
    isDocument?: boolean;
  };
}

export default function ItemCard({ item }: ItemCardProps) {
  const truncatedDescription = item.description.length > 120 
    ? `${item.description.substring(0, 120)}...` 
    : item.description;
  
  const mainImage = item.imageUrls && item.imageUrls.length > 0 
    ? item.imageUrls[0] 
    : '/placeholder-item.jpg';

  const statusColors = {
    'AVAILABLE': { bg: 'bg-green-100', text: 'text-green-800', label: 'Available' },
    'RETURNED': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Returned' },
  };

  const statusConfig = statusColors[item.status as keyof typeof statusColors] || statusColors.AVAILABLE;

  return (
    <Link href={`/items/${item.id}`} className="block group">
      <div className="card card-hover h-full flex flex-col overflow-hidden">
        {/* Image Container */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {item.imageUrls && item.imageUrls.length > 0 ? (
            <Image
              src={mainImage}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-gray-300">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}
          
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        {/* Content */}
        <div className="p-6 flex-grow flex flex-col">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
              {item.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">{truncatedDescription}</p>
          </div>
          
          <div className="mt-auto">
            {/* Metadata */}
            <div className="flex flex-wrap gap-3 mb-4">
              {item.category && (
                <div className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-lg">
                  <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{item.category}</span>
                </div>
              )}
              
              {item.location && (
                <div className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-lg">
                  <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{item.location}</span>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Found {new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="inline-flex items-center text-primary-600 font-medium text-sm group-hover:text-primary-700">
                View details
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
