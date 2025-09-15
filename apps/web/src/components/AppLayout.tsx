"use client";

import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/app" className="text-xl font-bold text-gray-900">
                AI SaaS Template
              </Link>
            </div>

            {/* App Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                href="/app"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/app" 
                    ? "bg-indigo-100 text-indigo-700" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/app/notes"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname.startsWith("/app/notes") 
                    ? "bg-indigo-100 text-indigo-700" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Notes
              </Link>
            </nav>

            {/* App Auth Section */}
            <div className="flex items-center space-x-4">
              {!isLoaded ? (
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              ) : isSignedIn ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Marketing Site
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
                <SignInButton mode="modal">
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* App Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
