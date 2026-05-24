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
  const mainImage = item.imageUrls && item.imageUrls.length > 0 
    ? item.imageUrls[0] 
    : '/placeholder-item.jpg';

  const statusColors = {
    'AVAILABLE': { bg: 'bg-green-600', text: 'text-white', label: 'Available' },
    'RETURNED': { bg: 'bg-gray-500', text: 'text-white', label: 'Returned' },
  };

  const statusConfig = statusColors[item.status as keyof typeof statusColors] || statusColors.AVAILABLE;

  return (
    <Link href={`/items/${item.id}`} className="block group">
      <div className="flex flex-row h-32 bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-primary-300 hover:shadow-sm transition-all duration-200">
        {/* Thumbnail - 180px wide */}
        <div className="relative w-[180px] h-32 flex-shrink-0 bg-gray-100 overflow-hidden">
          {item.imageUrls && item.imageUrls.length > 0 ? (
            <Image
              src={mainImage}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="180px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content - middle section */}
        <div className="flex-1 flex flex-col justify-center px-4 py-2 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {item.category}
              </span>
            )}
            {item.location && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                📍 {item.location}
              </span>
            )}
          </div>
        </div>

        {/* Right section - status + date */}
        <div className="flex flex-col items-end justify-between py-3 pr-5 flex-shrink-0">
          <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-bold tracking-wide ${statusConfig.bg} ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
