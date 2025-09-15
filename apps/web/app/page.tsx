import Link from "next/link";
import MarketingLayout from "../src/components/MarketingLayout";

export default function Home() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered SaaS Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Build, deploy, and scale your AI-powered applications with our comprehensive platform. 
            Get started in minutes with our modern tech stack.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/app"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-lg"
            >
              Get Started Free
            </Link>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-lg">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to build AI applications
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools and infrastructure you need to create, deploy, and scale AI-powered applications.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-indigo-600 text-3xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Development</h3>
              <p className="text-gray-600">
                Get started quickly with our pre-built templates and modern development tools.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-indigo-600 text-3xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Authentication</h3>
              <p className="text-gray-600">
                Built-in authentication and authorization with enterprise-grade security.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-indigo-600 text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics & Monitoring</h3>
              <p className="text-gray-600">
                Track usage, performance, and user behavior with comprehensive analytics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of developers building the future with AI.
          </p>
          <Link
            href="/app"
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors text-lg"
          >
            Start Building Today
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
