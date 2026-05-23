"use client"

import { useState } from 'react'
import Select, { SelectOption } from '@/components/ui/Select'

interface AlertFormProps {
  onSubmit: (data: {
    keywords: string;
    categoryId?: string;
    location?: string;
    isDocument?: boolean;
    documentNumber?: string;
    documentYear?: string;
    issuingAuthority?: string;
    holderName?: string;
    color?: string;
  }) => void
  initialData?: {
    keywords: string
    categoryId?: string
    location?: string
    isDocument?: boolean
    documentNumber?: string
    documentYear?: string
    issuingAuthority?: string
    holderName?: string
    color?: string
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
  const [isDocument, setIsDocument] = useState(initialData?.isDocument || false)
  const [documentNumber, setDocumentNumber] = useState(initialData?.documentNumber || '')
  const [documentYear, setDocumentYear] = useState(initialData?.documentYear || '')
  const [issuingAuthority, setIssuingAuthority] = useState(initialData?.issuingAuthority || '')
  const [holderName, setHolderName] = useState(initialData?.holderName || '')
  const [color, setColor] = useState(initialData?.color || '')
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
      isDocument: isDocument || undefined,
      documentNumber: documentNumber.trim() || undefined,
      documentYear: documentYear.trim() || undefined,
      issuingAuthority: issuingAuthority.trim() || undefined,
      holderName: holderName.trim() || undefined,
      color: color.trim() || undefined,
    })
  }

  const handleReset = () => {
    setKeywords(initialData?.keywords || '')
    setCategoryId(initialData?.categoryId || '')
    setLocation(initialData?.location || '')
    setIsDocument(initialData?.isDocument || false)
    setDocumentNumber(initialData?.documentNumber || '')
    setDocumentYear(initialData?.documentYear || '')
    setIssuingAuthority(initialData?.issuingAuthority || '')
    setHolderName(initialData?.holderName || '')
    setColor(initialData?.color || '')
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

      {/* Document Fields Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="isDocument"
            checked={isDocument}
            onChange={(e) => setIsDocument(e.target.checked)}
            className="h-4 w-4 text-primary-600 rounded"
          />
          <label htmlFor="isDocument" className="ml-2 text-sm font-medium text-gray-700">
            This is a document (ID, passport, certificate, etc.)
          </label>
        </div>

        {isDocument && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Document Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Number (Optional)
                </label>
                <input
                  type="text"
                  id="documentNumber"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Passport number, ID number"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="documentYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Year (Optional)
                </label>
                <input
                  type="text"
                  id="documentYear"
                  value={documentYear}
                  onChange={(e) => setDocumentYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 2023"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="issuingAuthority" className="block text-sm font-medium text-gray-700 mb-1">
                  Issuing Authority (Optional)
                </label>
                <input
                  type="text"
                  id="issuingAuthority"
                  value={issuingAuthority}
                  onChange={(e) => setIssuingAuthority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Government, University"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="holderName" className="block text-sm font-medium text-gray-700 mb-1">
                  Holder Name (Optional)
                </label>
                <input
                  type="text"
                  id="holderName"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Name on document"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Color Field */}
      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
          Color (Optional)
        </label>
        <input
          type="text"
          id="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="e.g., Black, Red, Blue, Silver"
          disabled={loading}
        />
        <p className="mt-1 text-sm text-gray-500">
          Specify the color of the item for more precise matching
        </p>
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
          <li>• Document fields will be matched against item document details</li>
          <li>• Color field helps match items by color</li>
          <li>• You can edit or delete alerts at any time</li>
        </ul>
      </div>
    </form>
  )
}
