"use client"

import { useState } from 'react'
import Select, { SelectOption } from '@/components/ui/Select'

interface AlertFormProps {
  onSubmit: (data: { keywords: string; categoryId?: string; location?: string }) => void
  initialData?: {
    keywords: string
    categoryId?: string
    location?: string
  }
  categories: SelectOption[]
  loading?: boolean
}

export default function AlertForm({
  onSubmit,
  initialData,
  categories,
  loading = false,
}: AlertFormProps) {
  const [keywords, setKeywords] = useState(initialData?.keywords || '')
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!keywords.trim()) {
      newErrors.keywords = 'Keywords are required'
    } else if (keywords.length > 500) {
      newErrors.keywords = 'Keywords cannot exceed 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSubmit({
      keywords: keywords.trim(),
      categoryId: categoryId === 'any' ? undefined : categoryId || undefined,
      location: location.trim() || undefined,
    })
  }

  const handleReset = () => {
    setKeywords(initialData?.keywords || '')
    setCategoryId(initialData?.categoryId || '')
    setLocation(initialData?.location || '')
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
          Keywords *
        </label>
        <textarea
          id="keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            errors.keywords ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe what you lost (e.g., 'black wallet', 'silver iPhone', 'blue backpack')"
          disabled={loading}
        />
        {errors.keywords && (
          <p className="mt-1 text-sm text-red-600">{errors.keywords}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Be specific. These keywords will be matched against item titles and descriptions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category (Optional)
          </label>
          <Select
            id="category"
            value={categoryId}
            onChange={setCategoryId}
            options={[
              { value: 'any', label: 'Any category' },
              ...categories,
            ]}
            placeholder="Select a category"
            disabled={loading}
            error={errors.categoryId}
          />
          <p className="mt-1 text-sm text-gray-500">
            Only match items in this specific category
          </p>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location (Optional)
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.location ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Main Building Lobby, Parking Lot A"
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Only match items found in this specific location
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          disabled={loading}
        >
          Reset
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            initialData ? 'Update Alert' : 'Create Alert'
          )}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">How alerts work:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• You'll receive email notifications when matching items are found or updated</li>
          <li>• Alerts match case-insensitively against item titles and descriptions</li>
          <li>• If you specify a category/location, items must match exactly</li>
          <li>• You can edit or delete alerts at any time</li>
        </ul>
      </div>
    </form>
  )
}