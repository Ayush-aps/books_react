/**
 * Browse Books Page (Buyer)
 * Book browsing with filters, search, and pagination
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchBooks, setFilters, clearFilters } from '../../redux/actions/bookActions';
import { addToCart } from '../../redux/actions/cartActions';
import BookCard from '../../components/BookCard';
import Filter from '../../components/Filter';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Browse = () => {
  const dispatch = useDispatch();
  const { books, loading, error, filters, pagination, genres } = useSelector(state => state.books);
  const [localFilters, setLocalFilters] = useState(filters);

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
    const result = await dispatch(addToCart(bookId, 1));
    if (result.success) {
      // Show success feedback (could add a toast notification here)
      console.log('Added to cart successfully');
    }
  };

  return (
    <div className="min-h-screen bg-background-primary py-12">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="heading-1 mb-3">Browse Books</h1>
          <p className="body-xl text-text-secondary">
            Discover your next favorite read from our curated collection
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filter */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-24">
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8 flex items-center justify-between bg-white border border-border-primary rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="brown" size="md">
                    {pagination.totalBooks} {pagination.totalBooks === 1 ? 'Book' : 'Books'}
                  </Badge>
                  <span className="text-text-secondary body">found</span>
                </div>
                {Object.keys(localFilters).length > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-accent-brown hover:text-accent-brown/80 font-medium text-sm transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </motion.div>
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
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {books.map((book) => (
                    <motion.div key={book._id} variants={staggerItem}>
                      <BookCard book={book} onAddToCart={handleAddToCart} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-12 flex justify-center"
                  >
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </motion.div>
                )}
              </>
            )}

            {/* No Results */}
            {!loading && !error && books.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white rounded-lg border border-border-primary"
              >
                <svg
                  className="mx-auto h-24 w-24 text-text-tertiary"
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
                <h3 className="mt-6 heading-4">No books found</h3>
                <p className="mt-3 body-lg text-text-secondary max-w-md mx-auto">
                  Try adjusting your filters or search criteria to discover more books
                </p>
                <div className="mt-6">
                  <Button onClick={handleClearFilters} variant="primary" size="md">
                    Clear All Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Browse;
