"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useState } from "react"

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">Lost & Found</span>
            </Link>
            
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-6">
              <Link href="/search" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Search Items
              </Link>
              {session && (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                  {session.user.role === "ADMIN" && (
                    <Link href="/admin/items" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      Admin
                    </Link>
                  )}
                </>
              )}
              <Link href="/#how-it-works" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                How It Works
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex md:items-center md:space-x-4">
            {status === "loading" ? (
              <div className="text-gray-500 text-sm">Loading...</div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 text-sm font-medium">
                      {session.user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">{session.user.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{session.user.role.toLowerCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="btn-secondary text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link href="/search" className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md">
                Search Items
              </Link>
              {session && (
                <>
                  <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md">
                    Dashboard
                  </Link>
                  {session.user.role === "ADMIN" && (
                    <Link href="/admin/items" className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md">
                      Admin
                    </Link>
                  )}
                </>
              )}
              <Link href="/#how-it-works" className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md">
                How It Works
              </Link>
              
              <div className="pt-4 border-t border-gray-200">
                {status === "loading" ? (
                  <div className="px-3 py-2 text-gray-500">Loading...</div>
                ) : session ? (
                  <div className="space-y-3">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">{session.user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{session.user.role.toLowerCase()}</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/login" className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md">
                      Login
                    </Link>
                    <Link href="/register" className="block px-3 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-md text-center">
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
