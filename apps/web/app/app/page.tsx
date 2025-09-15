import { auth } from "@clerk/nextjs/server";
import { ALL_ROLES } from "../../../../packages/shared/src/roles";

export default async function AppPage() {
  const { userId } = await auth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
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
            href="/app/notes"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            📝 Notes
          </a>
        </div>
      </div>
    </div>
  );
}
