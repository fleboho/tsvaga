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
  };
}

export default function ItemCard({ item }: ItemCardProps) {
  const truncatedDescription = item.description.length > 100 
    ? `${item.description.substring(0, 100)}...` 
    : item.description;
  
  const mainImage = item.imageUrls && item.imageUrls.length > 0 
    ? item.imageUrls[0] 
    : '/placeholder-item.jpg';

  return (
    <Link href={`/items/${item.id}`} className="block">
      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100">
          {item.imageUrls && item.imageUrls.length > 0 ? (
            <Image
              src={mainImage}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-gray-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}
          
          {/* Status badge */}
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item.status === 'AVAILABLE' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {item.status}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 flex-grow">
          <h3 className="font-medium text-gray-800 mb-2 line-clamp-1">{item.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{truncatedDescription}</p>
          
          <div className="mt-auto">
            <div className="flex justify-between text-sm text-gray-500 mb-3">
              {item.category && (
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {item.category}
                </span>
              )}
              
              {item.location && (
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {item.location}
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-400">
              Reported {new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>
        
        {/* View Details Button */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <div className="text-primary-600 font-medium text-sm hover:text-primary-700">
            View details →
          </div>
        </div>
      </div>
    </Link>
  );
}