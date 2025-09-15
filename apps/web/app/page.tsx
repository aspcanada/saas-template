import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <main className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          AI SaaS Template — Hello
        </h1>
        <div className="space-y-4">
          <p className="text-lg text-gray-600 mb-8">
            Welcome to your AI-powered SaaS application
          </p>
          <div className="space-x-4">
            <Link
              href="/sign-in"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium border border-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/app"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Protected App
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
