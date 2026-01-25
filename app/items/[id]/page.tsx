import { notFound } from 'next/navigation';
import Image from 'next/image';
import ContactForm from '@/components/ContactForm';

interface Item {
  id: string;
  title: string;
  description: string;
  category: string | null;
  location: string | null;
  status: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

async function getItem(id: string): Promise<Item | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/items/${id}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.item;
  } catch (error) {
    console.error('Error fetching item:', error);
    return null;
  }
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  
  if (!item) {
    notFound();
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Image Gallery */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
          
          <div className="flex items-center space-x-4 mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              item.status === 'AVAILABLE' 
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {item.status}
            </span>
            
            {item.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {item.category}
              </span>
            )}
            
            {item.location && (
              <span className="text-gray-600 text-sm">
                📍 {item.location}
              </span>
            )}
          </div>
          
          {/* Image Display */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Images</h2>
            
            {item.imageUrls && item.imageUrls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {item.imageUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={url}
                      alt={`${item.title} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">No images available for this item</p>
              </div>
            )}
          </div>
          
          {/* Item Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1 text-gray-900">{item.status}</p>
              </div>
              
              {item.category && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p className="mt-1 text-gray-900">{item.category}</p>
                </div>
              )}
              
              {item.location && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location Found</h3>
                  <p className="mt-1 text-gray-900">{item.location}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date Reported</h3>
                <p className="mt-1 text-gray-900">
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
          
          {/* Contact Admin Form */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Claim This Item</h2>
            <p className="text-gray-600 mb-6">
              If you believe this item belongs to you, please contact the administrator with details about why you think it's yours.
              Include any identifying marks, serial numbers, or other information that can help verify your claim.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Before You Contact</h3>
              <ul className="text-blue-700 space-y-2">
                <li className="flex items-start">
                  <span className="inline-block bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 mt-0.5">1</span>
                  Make sure you can provide identifying details about the item
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 mt-0.5">2</span>
                  Be prepared to provide proof of ownership if requested
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 mt-0.5">3</span>
                  Include your contact information so the admin can reach you
                </li>
              </ul>
            </div>
            
            <ContactForm itemId={item.id} itemTitle={item.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
