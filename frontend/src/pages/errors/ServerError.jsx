/**
 * 500 Server Error Page
 */

import { Link } from 'react-router-dom';

const ServerError = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* 500 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-600 mb-4">500</h1>
          <div className="relative">
            <svg
              className="w-64 h-64 mx-auto text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Server Error
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Oops! Something went wrong on our end. We're working to fix the issue. Please try again later.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold border-2 border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go Home
          </Link>
        </div>

        {/* Error Details (Optional - for development) */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <details className="text-left">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-semibold mb-4">
              Technical Details (For Developers)
            </summary>
            <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-700 font-mono">
              <p className="mb-2"><strong>Error Code:</strong> 500 Internal Server Error</p>
              <p className="mb-2"><strong>Timestamp:</strong> {new Date().toISOString()}</p>
              <p className="mb-2"><strong>URL:</strong> {window.location.href}</p>
              <p className="text-xs text-gray-500 mt-4">
                If this error persists, please contact support with the above information.
              </p>
            </div>
          </details>
        </div>

        {/* Contact Support */}
        <div className="mt-8">
          <p className="text-gray-600 mb-4">Need immediate assistance?</p>
          <Link
            to="/contact"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
