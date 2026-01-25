import Link from "next/link"

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Welcome to Lost & Found
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        A simple platform to help people find lost items. Search for found items, 
        create alerts for items you've lost, and get notified when matching items are found.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Search Items</h2>
          <p className="text-gray-600 mb-4">
            Browse through found items reported by administrators. Use keywords to search for specific items.
          </p>
          <Link 
            href="/search" 
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
          >
            Search Now
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Create Alerts</h2>
          <p className="text-gray-600 mb-4">
            Register an account and create alerts for items you've lost. Get email notifications when matching items are found.
          </p>
          <Link 
            href="/register" 
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
          >
            Register Now
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Admin Portal</h2>
          <p className="text-gray-600 mb-4">
            Administrators can manage found items, verify details, and help connect found items with their owners.
          </p>
          <Link 
            href="/login" 
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
          >
            Admin Login
          </Link>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-primary-100 text-primary-800 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-3">
              1
            </div>
            <h3 className="font-medium text-gray-800 mb-2">Report Found Item</h3>
            <p className="text-gray-600 text-sm">
              Admins report found items with details like description, category, and location.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 text-primary-800 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-3">
              2
            </div>
            <h3 className="font-medium text-gray-800 mb-2">System Matches Alerts</h3>
            <p className="text-gray-600 text-sm">
              System automatically checks for matching user alerts and sends notifications.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 text-primary-800 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-3">
              3
            </div>
            <h3 className="font-medium text-gray-800 mb-2">Connect & Return</h3>
            <p className="text-gray-600 text-sm">
              Users contact admin through the platform to claim and return found items.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}