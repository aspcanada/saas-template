import { auth } from "@clerk/nextjs/server";
import { ALL_ROLES } from "../../../../packages/shared/src/roles";

export default async function AppPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Welcome to the App
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            You are successfully signed in!
          </p>
        </div>
        <div className="mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-lg font-medium text-gray-900">
              Signed in
            </p>
            <p className="mt-2 text-sm text-gray-600">
              User ID: {userId}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Available roles: {ALL_ROLES.length} ({ALL_ROLES.join(", ")})
            </p>
          </div>
        </div>
        <div className="mt-6">
          <a
            href="/"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
