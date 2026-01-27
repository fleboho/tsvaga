"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AlertForm from '@/components/AlertForm'
import { SelectOption } from '@/components/ui/Select'

type Alert = {
  id: string
  keywords: string
  category: {
    id: string
    name: string
  } | null
  location: {
    id: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
}

type AlertResponse = {
  alerts: Alert[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function AlertsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const [categories, setCategories] = useState<SelectOption[]>([])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/alerts')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.status}`)
      }
      
      const data: AlertResponse = await response.json()
      setAlerts(data.alerts)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts')
      console.error('Error fetching alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories.map((cat: any) => ({ value: cat.id, label: cat.name })))
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAlerts()
      fetchCategories()
    }
  }, [status])

  // Handle alert creation
  const handleCreateAlert = async (data: { keywords: string; categoryId?: string; location?: string }) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create alert')
      }

      setShowCreateForm(false)
      fetchAlerts() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert')
    }
  }

  // Handle alert update
  const handleUpdateAlert = async (data: { keywords: string; categoryId?: string; location?: string }) => {
    if (!editingAlert) return

    try {
      const response = await fetch(`/api/alerts/${editingAlert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update alert')
      }

      setEditingAlert(null)
      fetchAlerts() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert')
    }
  }

  // Handle alert deletion
  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return
    }

    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete alert')
      }

      fetchAlerts() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert')
    }
  }

  if (status === 'loading') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading alerts...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Alerts</h1>
          <p className="text-gray-600">
            Create alerts for items you've lost. You'll be notified when matching items are found.
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Create New Alert
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingAlert) && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingAlert ? 'Edit Alert' : 'Create New Alert'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false)
                setEditingAlert(null)
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          
          <AlertForm
            onSubmit={editingAlert ? handleUpdateAlert : handleCreateAlert}
            initialData={editingAlert ? {
              keywords: editingAlert.keywords,
              categoryId: editingAlert.category?.id,
              location: editingAlert.location?.name,
            } : undefined}
            categories={categories}
            loading={false}
          />
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading your alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first alert to get notified when matching items are found.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Create Your First Alert
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{alert.keywords}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        Active
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {alert.category && (
                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <p className="font-medium">{alert.category.name}</p>
                        </div>
                      )}
                      
                      {alert.location && (
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">{alert.location.name}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                      <span className="mx-2">•</span>
                      <span>Last updated: {new Date(alert.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingAlert(alert)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>You'll receive email notifications when items matching your alerts are found or updated.</p>
      </div>
    </div>
  )
}