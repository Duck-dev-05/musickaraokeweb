'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = 'An error occurred during authentication';

  switch (error) {
    case 'Configuration':
      errorMessage = 'There is a problem with the server configuration.';
      break;
    case 'AccessDenied':
      errorMessage = 'Access denied. You do not have permission to access this resource.';
      break;
    case 'Verification':
      errorMessage = 'The token has expired or is invalid.';
      break;
    case 'Default':
    default:
      errorMessage = 'An unexpected error occurred.';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="max-w-md w-full mx-auto p-8 bg-dark-secondary rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-light mb-4">Authentication Error</h1>
          <p className="text-light-secondary text-center mb-8">{errorMessage}</p>
          <div className="space-y-4 w-full">
            <Link
              href="/login"
              className="block w-full text-center px-4 py-2 bg-primary text-dark font-medium rounded-full hover:bg-primary/90 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="block w-full text-center px-4 py-2 border border-primary text-primary font-medium rounded-full hover:bg-primary/10 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 