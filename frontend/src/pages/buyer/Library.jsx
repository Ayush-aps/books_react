/**
 * Library Page (Buyer)
 * Display user's purchased books with reading progress
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchLibrary } from '../../redux/actions/libraryActions';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const Library = () => {
  const dispatch = useDispatch();
  const { books = [], loading, error } = useSelector(state => state.library);
  const { currentSubscription } = useSelector(state => state.subscription);

  useEffect(() => {
    dispatch(fetchLibrary());
  }, [dispatch]);

  const getProgressColor = (progress) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading library..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Library</h1>
            <p className="text-gray-600 mt-2">
              {books.length} {books.length === 1 ? 'book' : 'books'} in your library
            </p>
          </div>
          {currentSubscription && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg">
              <p className="text-sm opacity-90">Active Subscription</p>
              <p className="font-bold">{currentSubscription.planName}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={() => dispatch(fetchLibrary())} />
          </div>
        )}

        {/* Library Grid */}
        {books.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your library is empty</h2>
            <p className="text-gray-600 mb-6">
              Purchase books to start building your digital library
            </p>
            <Link
              to="/buyer/browse"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Books
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((libraryItem) => {
              const book = libraryItem.bookId || libraryItem.book;
              const progress = libraryItem.progress || 0;

              // Skip if book data is missing
              if (!book || !book._id) {
                return null;
              }

              return (
                <div key={libraryItem._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Book Cover */}
                  <Link to={`/buyer/reader/${book._id}`} className="block relative">
                    <div className="relative" style={{ paddingBottom: '140%' }}>
                      <img
                        src={book.coverImage || '/placeholder-book.png'}
                        alt={book.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Progress Overlay */}
                      {progress > 0 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-semibold">
                          {progress}%
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Book Info */}
                  <div className="p-4">
                    <Link
                      to={`/buyer/reader/${book._id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 mb-1"
                    >
                      {book.title}
                    </Link>
                    <p className="text-sm text-gray-600 mb-3">{book.author}</p>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getProgressColor(progress)}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        to={`/buyer/reader/${book._id}`}
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                      >
                        {progress > 0 ? 'Continue Reading' : 'Start Reading'}
                      </Link>
                      <Link
                        to={`/buyer/books/${book._id}`}
                        className="border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                        title="View Details"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </Link>
                    </div>

                    {/* Last Read */}
                    {libraryItem.lastRead && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last read: {new Date(libraryItem.lastRead).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Subscription CTA */}
        {!currentSubscription && books.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Unlock Unlimited Reading</h3>
            <p className="mb-6 opacity-90">
              Subscribe to access our entire library and get unlimited downloads
            </p>
            <Link
              to="/pricing"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              View Subscription Plans
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
