import { Suspense } from 'react';

export default function NotFound() {
  return (
    <Suspense>
      {/* Existing content of the 404 page */}
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-4xl font-bold text-gray-800">404</h1>
        <p className="text-xl text-gray-600">Page Not Found</p>
        <p className="mt-4 text-gray-500">The page you're looking for doesn't exist.</p>
        <a href="/" className="mt-6 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Go Home</a>
      </div>
    </Suspense>
  );
}