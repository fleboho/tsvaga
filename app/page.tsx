import Link from "next/link"
import HomeSearchForm from "./search/HomeSearchForm"

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          Lost Something? <span className="text-primary-600">Find It Here</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-4xl mx-auto">
          Our platform helps reunite people with their lost belongings. Search through found items, 
          create alerts for items you've lost, and get notified when matching items are found.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-2 border border-gray-200">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Search Found Items</h3>
              <HomeSearchForm />
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            Search by keywords, category, or location. No account required.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/search" className="btn-primary px-8 py-3 text-lg">
            Browse All Items
          </Link>
          <Link href="/register" className="btn-secondary px-8 py-3 text-lg">
            Create Alert
          </Link>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            A simple three-step process to help you find your lost items
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card card-hover p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
              1
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Report or Search</h3>
            <p className="text-gray-600">
              Admins report found items with detailed descriptions. You can search through all reported items using keywords, categories, or locations.
            </p>
          </div>
          
          <div className="card card-hover p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
              2
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Create Alerts</h3>
            <p className="text-gray-600">
              Register an account and create alerts for items you've lost. Our system will automatically notify you when matching items are found.
            </p>
          </div>
          
          <div className="card card-hover p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
              3
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Connect & Reunite</h3>
            <p className="text-gray-600">
              Contact the admin through our secure platform to claim found items. We facilitate the connection while protecting everyone's privacy.
            </p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Use Our Platform?</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-primary-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Centralized Database:</strong> All found items in one place, easily searchable</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-primary-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Proactive Notifications:</strong> Get alerted when items matching your description are found</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-primary-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Privacy Protected:</strong> All communication goes through admin - no direct contact required</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">100+</div>
                  <div className="text-sm text-gray-600">Items Found</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">24h</div>
                  <div className="text-sm text-gray-600">Avg. Response Time</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">85%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">50+</div>
                  <div className="text-sm text-gray-600">Happy Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-12 text-center" id="how-it-works">
        <div className="bg-primary-600 rounded-2xl p-8 md:p-12 text-white">
          <h2 className="text-3xl font-bold mb-6">Ready to Find Your Lost Item?</h2>
          <p className="text-primary-100 mb-8 max-w-3xl mx-auto">
            Join our community today. Whether you've lost something or found an item, our platform makes the process simple and secure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg text-lg transition-colors">
              Get Started Free
            </Link>
            <Link href="/search" className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold py-3 px-8 rounded-lg text-lg transition-colors">
              Browse Items
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
