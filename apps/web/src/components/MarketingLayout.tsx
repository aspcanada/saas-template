"use client";

import { UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white">
      {/* Marketing Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-gray-900">
                AI SaaS Template
              </Link>
            </div>

            {/* Marketing Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="#features"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Pricing
              </Link>
              <Link
                href="#about"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                About
              </Link>
            </nav>

            {/* Marketing Auth Section */}
            <div className="flex items-center space-x-4">
              {!isLoaded ? (
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              ) : isSignedIn ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/app"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Go to App
                  </Link>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8",
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <SignInButton mode="modal">
                    <button className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                      Get Started
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Marketing Content */}
      <main>{children}</main>

      {/* Marketing Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-300 hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-300 hover:text-white">Pricing</Link></li>
                <li><Link href="/app" className="text-gray-300 hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#about" className="text-gray-300 hover:text-white">About</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Blog</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-300 hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Contact</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-300 hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Terms</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AI SaaS Template. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
