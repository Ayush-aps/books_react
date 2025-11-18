/**
 * Browse Books Page (Buyer)
 * Book browsing with filters, search, and pagination
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchBooks, setFilters, clearFilters } from '../../redux/actions/bookActions';
import { addToCart } from '../../redux/actions/cartActions';
import BookCard from '../../components/BookCard';
import Filter from '../../components/Filter';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const Browse = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { books, loading, error, filters, pagination, genres } = useSelector(state => state.books);
  const { user } = useSelector(state => state.auth);
  const [localFilters, setLocalFilters] = useState(filters);
  const [addingToCart, setAddingToCart] = useState(null);
  const [cartMessage, setCartMessage] = useState(null);

  useEffect(() => {
    // Fetch books on mount and when filters change
    dispatch(fetchBooks(localFilters));
  }, [dispatch, localFilters]);

  const handleFilterChange = (newFilters) => {
    setLocalFilters({
      ...localFilters,
      ...newFilters
    });
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    dispatch(clearFilters());
  };

  const handlePageChange = (page) => {
    setLocalFilters({
      ...localFilters,
      page
    });
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (bookId) => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setAddingToCart(bookId);
      const result = await dispatch(addToCart(bookId, 1));
      
      if (result.success) {
        setCartMessage({ type: 'success', text: 'Added to cart successfully!' });
        setTimeout(() => setCartMessage(null), 3000);
      } else {
        setCartMessage({ type: 'error', text: result.message || 'Failed to add to cart' });
        setTimeout(() => setCartMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setCartMessage({ type: 'error', text: 'An error occurred. Please try again.' });
      setTimeout(() => setCartMessage(null), 3000);
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cart Message Toast */}
        {cartMessage && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            cartMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            <div className="flex items-center gap-2">
              {cartMessage.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span>{cartMessage.text}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Books</h1>
          <p className="mt-2 text-gray-600">
            Discover your next favorite read from our collection
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filter */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-4">
              <Filter
                filters={localFilters}
                onFilterChange={handleFilterChange}
                genres={genres}
                onClearFilters={handleClearFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Results Info */}
            {!loading && !error && (
              <div className="mb-6 flex items-center justify-between">
                <p className="text-gray-600">
                  {pagination.totalBooks} {pagination.totalBooks === 1 ? 'book' : 'books'} found
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size="lg" message="Loading books..." />
              </div>
            )}

            {/* Error State */}
            {error && (
              <ErrorMessage
                message={error}
                onRetry={() => dispatch(fetchBooks(localFilters))}
              />
            )}

            {/* Books Grid */}
            {!loading && !error && books.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {books.map((book) => (
                    <BookCard 
                      key={book._id} 
                      book={book} 
                      onAddToCart={handleAddToCart}
                      isAddingToCart={addingToCart === book._id}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}

            {/* No Results */}
            {!loading && !error && books.length === 0 && (
              <div className="text-center py-20">
                <svg
                  className="mx-auto h-24 w-24 text-gray-300"
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
                <h3 className="mt-4 text-lg font-medium text-gray-900">No books found</h3>
                <p className="mt-2 text-gray-500">
                  Try adjusting your filters or search criteria
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Browse;
