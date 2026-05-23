"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getDisplayNameFromEmail } from "@/lib/utils"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [alertCount, setAlertCount] = useState<number | null>(null)
  const [itemCount, setItemCount] = useState<number | null>(null)
  const [returnedCount, setReturnedCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Fetch dashboard data
  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData()
    }
  }, [status])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch alert count for the current user
      const alertsResponse = await fetch('/api/alerts')
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setAlertCount(alertsData.pagination.totalCount)
      }
      
      // Fetch item counts (public endpoint)
      const itemsResponse = await fetch('/api/items?pageSize=1')
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        setItemCount(itemsData.pagination.totalCount)
      }
      
      // Fetch returned items count (would need a separate endpoint or filter)
      // For now, we'll set it to 0
      setReturnedCount(0)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Welcome back, {getDisplayNameFromEmail(session.user.email)}! You are logged in as a {session.user.role}.
      </p>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">User Information</h3>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Email:</span> {session.user.email}
            </p>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Display Name:</span> {getDisplayNameFromEmail(session.user.email)}
            </p>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Role:</span> {session.user.role}
            </p>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">User ID:</span> {session.user.id}
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button
                className="w-full text-left px-3 py-2 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 text-sm"
                onClick={() => router.push("/search")}
              >
                Search for lost items
              </button>
              {session.user.role === "USER" && (
                <button
                  className="w-full text-left px-3 py-2 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 text-sm"
                  onClick={() => router.push("/alerts")}
                >
                  Manage your alerts
                </button>
              )}
              {session.user.role === "ADMIN" && (
                <button
                  className="w-full text-left px-3 py-2 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 text-sm"
                  onClick={() => router.push("/admin/items")}
                >
                  Manage found items
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {alertCount !== null ? alertCount : (
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              )}
            </div>
            <div className="text-gray-700 font-medium">Your Active Alerts</div>
            <p className="text-gray-500 text-sm mt-2">
              Alerts you've created for lost items
            </p>
            {alertCount !== null && alertCount > 0 && (
              <button
                onClick={() => router.push("/alerts")}
                className="mt-2 text-sm text-primary-600 hover:text-primary-800"
              >
                View your alerts →
              </button>
            )}
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {itemCount !== null ? itemCount : (
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              )}
            </div>
            <div className="text-gray-700 font-medium">Items Found</div>
            <p className="text-gray-500 text-sm mt-2">
              Total items in the system
            </p>
            {itemCount !== null && itemCount > 0 && (
              <button
                onClick={() => router.push("/search")}
                className="mt-2 text-sm text-primary-600 hover:text-primary-800"
              >
                Search items →
              </button>
            )}
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {returnedCount !== null ? returnedCount : (
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              )}
            </div>
            <div className="text-gray-700 font-medium">Items Returned</div>
            <p className="text-gray-500 text-sm mt-2">
              Successfully returned to owners
            </p>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            {alertCount === null || itemCount === null ? (
              "Loading dashboard statistics..."
            ) : (
              "Your dashboard shows real-time statistics about your alerts and platform activity."
            )}
          </p>
        </div>
      </div>
    </div>
  )
}