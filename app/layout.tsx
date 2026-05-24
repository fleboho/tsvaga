import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import Navbar from "@/components/Navbar"
import { VERSION_LABEL } from "@/lib/version"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Lost & Found | Reuniting People with Their Belongings",
  description: "A modern platform to help people find lost items. Search found items, create alerts, and get notified when your lost items are found.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <Navbar />
            <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="border-t border-gray-200 bg-white py-8">
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="text-center text-gray-600">
                  <p className="text-sm">© {new Date().getFullYear()} Lost & Found MVP-1. All rights reserved.</p>
                  <p className="text-xs mt-2 text-gray-500">This is a demonstration platform for reuniting lost items with their owners.</p>
                  <p className="text-[10px] mt-4 text-gray-400 select-none">{VERSION_LABEL}</p>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
