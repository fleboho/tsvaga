"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Item {
  id: string;
  title: string;
  description: string;
  category: string | null;
  location: string | null;
  status: string;
  imageUrls: string[];
  createdAt: string;
  createdBy: {
    email: string;
    role: string;
  } | null;
}

interface EditItemClientProps {
  item: Item;
}

export default function EditItemClient({ item }: EditItemClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: item.title,
    description: item.description,
    category: item.category || '',
    location: item.location || '',
  });
  
  const [existingImages, setExistingImages] = useState<string[]>(item.imageUrls || []);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard?error=admin_required');
    }
  }, [status, session, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImageFiles: File[] = [];
    const newPreviews: string[] = [];
    
    // Calculate remaining slots (max 3 total images)
    const remainingSlots = 3 - (existingImages.length - imagesToDelete.length + newImages.length);
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    
    for (const file of filesToAdd) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} is not an image`);
        continue;
      }
      
      // Validate file size (4MB)
      if (file.size > 4 * 1024 * 1024) {
        setError(`Image ${file.name} exceeds 4MB size limit`);
        continue;
      }
      
      newImageFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreviews(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    }
    
    setNewImages(prev => [...prev, ...newImageFiles]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const markImageForDeletion = (imageUrl: string) => {
    setImagesToDelete(prev => [...prev, imageUrl]);
  };

  const unmarkImageForDeletion = (imageUrl: string) => {
    setImagesToDelete(prev => prev.filter(url => url !== imageUrl));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return;
    }
    
    // Calculate total images after changes
    const totalImagesAfter = (existingImages.length - imagesToDelete.length + newImages.length);
    if (totalImagesAfter > 3) {
      setError('Maximum 3 images allowed per item');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('location', formData.location);
      
      // Append images to delete
      imagesToDelete.forEach(url => {
        formDataToSend.append('imagesToDelete[]', url);
      });
      
      // Append new images
      newImages.forEach((file, index) => {
        formDataToSend.append(`newImages[${index}]`, file);
      });
      
      const response = await fetch(`/api/admin/items/${item.id}`, {
        method: 'PATCH',
        body: formDataToSend,
      });
      
      if (response.status === 403) {
        setError('Admin access required');
        return;
      }
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update item');
      }
      
      const data = await response.json();
      
      setSuccess('Item updated successfully!');
      
      // Update local state with new data
      setExistingImages(data.item.imageUrls || []);
      setNewImages([]);
      setImagePreviews([]);
      setImagesToDelete([]);
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!confirm('Are you sure you want to delete this item? It will be moved to the archive.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/admin/items/${item.id}`, {
        method: 'DELETE',
      });
      
      if (response.status === 403) {
        setError('Admin access required');
        return;
      }
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete item');
      }
      
      alert('Item deleted successfully (moved to archive)!');
      router.push('/admin/items');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      setLoading(false);
    }
  };

  const handleMarkReturned = async () => {
    if (!confirm('Mark this item as returned?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/admin/items/${item.id}/mark-returned`, {
        method: 'POST',
      });
      
      if (response.status === 403) {
        setError('Admin access required');
        return;
      }
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark item as returned');
      }
      
      const data = await response.json();
      
      alert('Item marked as returned successfully!');
      router.refresh(); // Refresh the page to show updated status
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark item as returned');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading edit page...</p>
          </div>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return null; // Will redirect from useEffect
  }

  const totalImagesAfter = (existingImages.length - imagesToDelete.length + newImages.length);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Found Item</h1>
            <p className="text-gray-600">
              Editing: <span className="font-medium">{item.title}</span>
            </p>
          </div>
          <Link
            href="/admin/items"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Items
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
          {success}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Item Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Status
                  </label>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === 'AVAILABLE' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                    {item.status === 'AVAILABLE' && (
                      <button
                        type="button"
                        onClick={handleMarkReturned}
                        disabled={loading}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Mark as Returned
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Wallet, Electronics, Keys"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Location Found
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Main Building Lobby"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Images</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {existingImages.map((imageUrl, index) => {
                    const isMarkedForDeletion = imagesToDelete.includes(imageUrl);
                    return (
                      <div key={index} className={`relative ${isMarkedForDeletion ? 'opacity-50' : ''}`}>
                        <img
                          src={imageUrl}
                          alt={`Item image ${index + 1}`}
                          className="w-full h-48 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => isMarkedForDeletion ? unmarkImageForDeletion(imageUrl) : markImageForDeletion(imageUrl)}
                          className={`absolute top-2 right-2 rounded-full w-6 h-6 flex items-center justify-center text-xs ${
                            isMarkedForDeletion 
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                          disabled={loading}
                        >
                          {isMarkedForDeletion ? '↶' : '×'}
                        </button>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          {isMarkedForDeletion ? 'Will be deleted' : 'Click × to delete'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* New Images Upload */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Add New Images ({totalImagesAfter} of 3 total)
              </h2>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="new-image-upload"
                    multiple
                    accept="image/*"
                    onChange={handleNewImageChange}
                    className="hidden"
                    disabled={loading || totalImagesAfter >= 3}
                  />
                  <label
                    htmlFor="new-image-upload"
                    className={`cursor-pointer block ${loading || totalImagesAfter >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <span className="text-gray-600 text-sm">
                        {totalImagesAfter >= 3 
                          ? 'Maximum 3 images reached' 
                          : 'Click to upload new images (JPEG, PNG, WebP, max 4MB each)'}
                      </span>
                      <span className="text-gray-500 text-xs mt-1">
                        {totalImagesAfter} of 3 images total (including existing)
                      </span>
                    </div>
                  </label>
                </div>
                
                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">New Images to Add</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`New image preview ${index + 1}`}
                            className="w-full h-48 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            disabled={loading}
                          >
                            ×
                          </button>
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {newImages[index]?.name || `New image ${index + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                Delete Item
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Item Metadata */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Item Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Item ID</label>
            <div className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">{item.id}</div>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Created At</label>
            <div className="text-gray-900">
              {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Created By</label>
            <div className="text-gray-900">
              {item.createdBy?.email || 'System'} ({item.createdBy?.role || 'Unknown'})
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Total Images</label>
            <div className="text-gray-900">
              {item.imageUrls?.length || 0} image(s)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
