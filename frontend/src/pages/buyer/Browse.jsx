/**
 * Browse Books Page (Buyer)
 * Book browsing with filters, search, and pagination
 */

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { useToast } from '../../components/Toast';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Browse = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { books, loading, error, filters, pagination, genres } = useSelector(state => state.books);
  const [localFilters, setLocalFilters] = useState(filters);
  const searchTimeoutRef = useRef(null);

  // Normalize genres: remove duplicates (case-insensitive), remove quotes, and sort
  const normalizedGenres = genres && Array.isArray(genres) ? (() => {
    const genreMap = new Map();
    genres.forEach(genre => {
      if (!genre || typeof genre !== 'string') return;
      // Remove quotes and trim
      let normalized = genre.replace(/^["']|["']$/g, '').trim();
      if (!normalized) return;
      // Use lowercase as key for case-insensitive deduplication
      const key = normalized.toLowerCase();
      // Keep the first occurrence (which should already be properly formatted from backend)
      if (!genreMap.has(key)) {
        genreMap.set(key, normalized);
      }
    });
    return Array.from(genreMap.values()).sort();
  })() : [];

  // Debounced fetch function for search
  const debouncedFetch = useCallback((filters) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      dispatch(fetchBooks(filters));
    }, 500); // 500ms debounce delay
  }, [dispatch]);

  useEffect(() => {
    // Use debounced fetch for search, immediate fetch for other filters
    const hasSearch = localFilters.search !== undefined && localFilters.search !== '';
    
    if (hasSearch) {
      debouncedFetch(localFilters);
    } else {
      dispatch(fetchBooks(localFilters));
    }

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [dispatch, localFilters, debouncedFetch]);

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
    try {
      const result = await dispatch(addToCart(bookId, 1));
      if (result.success) {
        // Find the book that was added to show its title in the toast
        const addedBook = books.find(book => book._id === bookId);
        const bookTitle = addedBook?.title || 'Book';
        toast.success(`"${bookTitle}" added to cart!`, 3000);
      } else {
        toast.error(result.message || 'Failed to add to cart', 3000);
      }
    } catch (error) {
      toast.error('An error occurred while adding to cart', 3000);
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
                genres={normalizedGenres}
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
                    {pagination?.totalBooks ?? books.length} {(pagination?.totalBooks ?? books.length) === 1 ? 'Book' : 'Books'}
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
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5"
                >
                  {books.map((book) => (
                    <motion.div key={book._id} variants={staggerItem}>
                      <BookCard book={book} compact={true} onAddToCart={handleAddToCart} />
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
