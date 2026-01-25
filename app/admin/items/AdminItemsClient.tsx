"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

export default function AdminItemsClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard?error=admin_required');
    } else {
      fetchItems();
    }
  }, [status, session, router]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/items');
      
      if (response.status === 403) {
        setError('Admin access required');
        router.push('/dashboard?error=admin_required');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages: File[] = [];
    const newPreviews: string[] = [];
    
    // Limit to 3 images total
    const remainingSlots = 3 - images.length;
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
      
      newImages.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreviews(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    }
    
    setImages(prev => [...prev, ...newImages]);
  };
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItem.title || !newItem.description) {
      setError('Title and description are required');
      return;
    }
    
    if (images.length > 3) {
      setError('Maximum 3 images allowed per item');
      return;
    }
    
    try {
      setCreating(true);
      setError('');
      
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('title', newItem.title);
      formData.append('description', newItem.description);
      formData.append('category', newItem.category);
      formData.append('location', newItem.location);
      
      // Append images
      images.forEach((file, index) => {
        formData.append(`images[${index}]`, file);
      });
      
      const response = await fetch('/api/admin/items', {
        method: 'POST',
        body: formData,
        // Note: Don't set Content-Type header for FormData
        // The browser will set it automatically with boundary
      });
      
      if (response.status === 403) {
        setError('Admin access required');
        return;
      }
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create item');
      }
      
      const data = await response.json();
      
      // Add new item to list
      setItems([data.item, ...items]);
      
      // Reset form
      setNewItem({
        title: '',
        description: '',
        category: '',
        location: '',
      });
      setImages([]);
      setImagePreviews([]);
      
      alert('Item created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setCreating(false);
    }
  };

  const handleEditItem = (itemId: string) => {
    router.push(`/admin/items/${itemId}/edit`);
  };

  const updateItem = async (itemId: string, updates: any) => {
    try {
      setError('');
      const response = await fetch(`/api/admin/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
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
      
      // Update item in list
      setItems(items.map(item => 
        item.id === itemId ? data.item : item
      ));
      
      alert('Item updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item? It will be moved to the archive.')) {
      return;
    }
    
    try {
      setError('');
      const response = await fetch(`/api/admin/items/${itemId}`, {
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
      
      // Remove item from list
      setItems(items.filter(item => item.id !== itemId));
      
      alert('Item deleted successfully (moved to archive)!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const handleMarkReturned = async (itemId: string) => {
    if (!confirm('Mark this item as returned?')) {
      return;
    }
    
    try {
      setError('');
      const response = await fetch(`/api/admin/items/${itemId}/mark-returned`, {
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
      
      // Update item in list
      setItems(items.map(item => 
        item.id === itemId ? data.item : item
      ));
      
      alert('Item marked as returned successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark item as returned');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return null; // Will redirect from useEffect
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel - Found Items</h1>
      <p className="text-gray-600 mb-6">
        Welcome, Admin {session.user.email}. Manage all found items here.
      </p>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Item Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Found Item</h2>
            
            <form onSubmit={handleCreateItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    disabled={creating}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Description *
                  </label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    required
                    disabled={creating}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Wallet, Electronics, Keys"
                    disabled={creating}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Location Found
                  </label>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Main Building Lobby"
                    disabled={creating}
                  />
                </div>
                
                {/* Image Upload */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Images (Max 3)
                  </label>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="image-upload"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={creating || images.length >= 3}
                      />
                      <label
                        htmlFor="image-upload"
                        className={`cursor-pointer block ${creating || images.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span className="text-gray-600 text-sm">
                            {images.length >= 3 
                              ? 'Maximum 3 images reached' 
                              : 'Click to upload images (JPEG, PNG, WebP, max 4MB each)'}
                          </span>
                          <span className="text-gray-500 text-xs mt-1">
                            {images.length} of 3 images selected
                          </span>
                        </div>
                      </label>
                    </div>
                    
                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              disabled={creating}
                            >
                              ×
                            </button>
                            <div className="text-xs text-gray-500 truncate mt-1">
                              {images[index]?.name || `Image ${index + 1}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Add Found Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Items List */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">All Found Items</h2>
              <button
                onClick={fetchItems}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Refresh
              </button>
            </div>
            
            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No found items yet. Add your first item using the form.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{item.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {item.description}
                            </div>
                            <div className="mt-2 flex space-x-2">
                              <button
                                onClick={() => handleEditItem(item.id)}
                                className="text-xs text-primary-600 hover:text-primary-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                              {item.status === 'AVAILABLE' && (
                                <button
                                  onClick={() => handleMarkReturned(item.id)}
                                  className="text-xs text-green-600 hover:text-green-800"
                                >
                                  Mark Returned
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {item.location || 'Unknown'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'AVAILABLE' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {item.createdBy?.email || 'System'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-500 text-sm">
                Total: {items.length} found item(s). Only admins can view and manage this page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}