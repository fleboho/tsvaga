"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getDisplayNameFromEmail } from '@/lib/utils';

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

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard?error=admin_required');
    } else {
      fetchItems();
    }
  }, [status, session, router]);

  // Filter items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.location && item.location.toLowerCase().includes(query)) ||
        item.status.toLowerCase().includes(query) ||
        (item.createdBy?.email && item.createdBy.email.toLowerCase().includes(query))
      );
      setFilteredItems(filtered);
    }
  }, [items, searchQuery]);

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
      
      // Reset form and close modal
      setNewItem({
        title: '',
        description: '',
        category: '',
        location: '',
      });
      setImages([]);
      setImagePreviews([]);
      setIsCreateModalOpen(false);
      
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
        Welcome, Admin {getDisplayNameFromEmail(session.user.email)}. Manage all found items here.
      </p>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            + Add New Found Item
          </button>
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search items..."
          />
        </div>
      </div>
      
      {/* Items List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">All Found Items</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Showing {filteredItems.length} of {items.length} items
            </span>
            <button
              onClick={fetchItems}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchQuery ? 'No items match your search.' : 'No found items yet. Add your first item using the button above.'}
            </p>
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
                {filteredItems.map((item) => (
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

      {/* Create Item Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm" 
              onClick={() => setIsCreateModalOpen(false)}
              aria-hidden="true"
            ></div>

            {/* Modal - Even wider version */}
            <div className="relative inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                  disabled={creating}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-3">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                    <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Add New Found Item
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Fill out the form below to add a new found item to the system.
                  </p>
                </div>

                <form onSubmit={handleCreateItem} className="space-y-6">
                  {/* Title - Full width */}
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
                      placeholder="e.g., Black Wallet, iPhone 12, Car Keys"
                    />
                  </div>
                  
                  {/* Description - Full width */}
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
                      placeholder="Describe the item in detail..."
                    />
                  </div>
                  
                  {/* Two-column grid for Category and Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="e.g., Main Building Lobby, Parking Lot B"
                        disabled={creating}
                      />
                    </div>
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
                          id="modal-image-upload"
                          multiple
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={creating || images.length >= 3}
                        />
                        <label
                          htmlFor="modal-image-upload"
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

                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={creating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {creating ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </span>
                      ) : 'Add Item'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
