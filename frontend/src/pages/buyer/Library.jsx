/**
 * Library Page - Premium Design
 * User's purchased books with reading progress and premium styling
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';
import { fetchLibrary } from '../../redux/actions/libraryActions';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
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
    if (progress === 0) return 'bg-gray-300';
    if (progress < 30) return 'bg-red-600';
    if (progress < 70) return 'bg-amber-600';
    return 'bg-green-600';
  };

  const getProgressVariant = (progress) => {
    if (progress === 0) return 'secondary';
    if (progress < 30) return 'error';
    if (progress < 70) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <LoadingSpinner size="lg" message="Loading library..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div>
            <h1 className="heading-1 mb-2">My Library</h1>
            <p className="body-lg text-text-secondary">
              {books.length} {books.length === 1 ? 'book' : 'books'} in your library
            </p>
          </div>
          {currentSubscription && (
            <Card className="bg-gradient-to-r from-brown to-accent-brown text-white border-0">
              <Card.Body className="py-3 px-5">
                <p className="body-sm opacity-90">Active Subscription</p>
                <p className="heading-5">{currentSubscription.planName}</p>
              </Card.Body>
            </Card>
          )}
        </motion.div>

        {error && (
          <motion.div 
            className="mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <ErrorMessage message={error} onRetry={() => dispatch(fetchLibrary())} />
          </motion.div>
        )}

        {/* Library Grid */}
        {books.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card elevated className="text-center py-16 px-6">
              <Card.Body>
                <svg
                  className="mx-auto h-24 w-24 text-text-secondary/30 mb-6"
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
                <h2 className="heading-2 mb-3">Your library is empty</h2>
                <p className="body-lg text-text-secondary mb-8 max-w-md mx-auto">
                  Purchase books to start building your digital library
                </p>
                <Link to="/buyer/browse">
                  <Button variant="primary" size="lg">
                    Browse Books
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {books.map((libraryItem) => {
              const book = libraryItem.bookId || libraryItem.book;
              const progress = libraryItem.progress || 0;

              // Skip if book data is missing
              if (!book || !book._id) {
                return null;
              }

              return (
                <motion.div key={libraryItem._id} variants={staggerItem} className="flex">
                  <Card hoverable className="flex flex-col h-full w-full overflow-hidden">
                    {/* Book Cover */}
                    <Link to={`/buyer/reader/${book._id}`} className="block relative flex-shrink-0">
                      <div className="relative bg-charcoal aspect-[3/4] overflow-hidden">
                        <img
                          src={book.coverImage || '/placeholder-book.png'}
                          alt={book.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        {/* Progress Badge Overlay */}
                        {progress > 0 && progress < 100 && (
                          <div className="absolute top-3 right-3">
                            <Badge variant={getProgressVariant(progress)} size="lg">
                              {progress}%
                            </Badge>
                          </div>
                        )}
                        {progress === 100 && (
                          <div className="absolute top-3 left-3">
                            <Badge variant="success" className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Completed</span>
                            </Badge>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Book Info */}
                    <Card.Body className="flex flex-col flex-grow">
                      <div className="flex-grow">
                        <Link
                          to={`/buyer/reader/${book._id}`}
                          className="heading-5 text-text-primary hover:text-brown line-clamp-2 mb-2 block transition-colors"
                        >
                          {book.title}
                        </Link>
                        <p className="body-sm text-text-secondary mb-4 line-clamp-1">{book.author}</p>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
                            <span className="font-medium">Reading Progress</span>
                            <span className="font-semibold text-brown">{progress}%</span>
                          </div>
                          <div className="w-full bg-cream/80 border border-taupe/30 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ease-out ${getProgressColor(progress)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-auto">
                        <Link to={`/buyer/reader/${book._id}`} className="flex-1">
                          <Button
                            variant="primary"
                            size="sm"
                            fullWidth
                            className="whitespace-nowrap"
                          >
                            {progress > 0 ? 'Continue Reading' : 'Start Reading'}
                          </Button>
                        </Link>
                        <Link to={`/buyer/books/${book._id}`} title="View Book Details">
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-3"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </Button>
                        </Link>
                      </div>

                      {/* Last Read */}
                      {libraryItem.lastRead && (
                        <p className="text-xs text-text-tertiary mt-3 pt-3 border-t border-border-light">
                          Last read: {new Date(libraryItem.lastRead).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      )}
                    </Card.Body>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Subscription CTA */}
        {!currentSubscription && books.length > 0 && (
          <motion.div
            className="mt-12"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-r from-brown to-accent-brown text-white border-0 overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-white rounded-full blur-3xl" />
              </div>
              <Card.Body className="relative text-center py-12 px-6">
                <h3 className="heading-2 mb-4">Unlock Unlimited Reading</h3>
                <p className="body-xl opacity-90 mb-8 max-w-2xl mx-auto">
                  Subscribe to access our entire library and get unlimited downloads
                </p>
                <Link to="/pricing">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="bg-white text-brown hover:bg-cream border-white hover:border-cream"
                  >
                    View Subscription Plans
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Library;
