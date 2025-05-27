'use client';

import Link from 'next/link';
import { Frown } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Frown className="w-10 h-10 text-red-500" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
      </div>
      <p className="text-center max-w-md mb-6">
        Sorry, you don&apos;t have permission to view this page. Please contact the administrator if you think this is a mistake.
      </p>
      <Link
        href="/sign-in"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}