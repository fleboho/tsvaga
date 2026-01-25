export default function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Found Items</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600 mb-4">
          This is the search page where users can search for found items. The search functionality will be implemented in the next phase.
        </p>
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search by keywords..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled
            />
            <button
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md disabled:opacity-50"
              disabled
            >
              Search
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="border border-gray-200 rounded-lg p-4">
              <div className="h-40 bg-gray-100 rounded-md mb-4 flex items-center justify-center">
                <span className="text-gray-400">Item Image</span>
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Sample Found Item {item}</h3>
              <p className="text-gray-600 text-sm mb-3">
                This is a sample description of a found item. The actual item details will be loaded from the database.
              </p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Category: Electronics</span>
                <span>Location: Building A</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}