/**
 * Library Page - Premium Design with Netflix-like Subscription Access Control
 * User's purchased books with reading progress and premium styling
 * REQUIRES ACTIVE SUBSCRIPTION - blocks access for non-subscribers
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';
import { fetchLibrary, removeBookFromLibrary } from '../../redux/actions/libraryActions';
import { fetchSubscriptionStatus } from '../../redux/actions/subscriptionActions';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SubscriptionModal from '../../components/SubscriptionModal';

const Library = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { books = [], loading, error } = useSelector(state => state.library);
  const { currentSubscription, loading: subscriptionLoading } = useSelector(state => state.subscription);
  const [hasSubscription, setHasSubscription] = useState(null); // null = checking, true = subscribed, false = not subscribed
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [removingBookId, setRemovingBookId] = useState(null);

  useEffect(() => {
    // Reset state on mount to ensure fresh fetch
    setHasSubscription(null);
    setShowSubscriptionModal(false);
    setSubscriptionError(null);
    setFetchAttempted(false);

    // Fetch subscription status
    dispatch(fetchSubscriptionStatus());
  }, [dispatch]);

  useEffect(() => {
    if (fetchAttempted) return; // Prevent multiple fetches

    const checkAndFetchLibrary = async () => {
      setFetchAttempted(true);
      try {
        const result = await dispatch(fetchLibrary());

        // PRIORITY 1: Check if explicitly requires subscription (no subscription)
        if (result?.requiresSubscription === true && result?.success === false) {
          setHasSubscription(false);
          setSubscriptionError(result.message);
          setShowSubscriptionModal(true);
        }
        // PRIORITY 2: Check if success is true (has subscription)
        else if (result?.success === true) {
          setHasSubscription(true);
          setShowSubscriptionModal(false);
        }
        // PRIORITY 3: Has data object (has subscription)
        else if (result?.data?.hasSubscription === true) {
          setHasSubscription(true);
          setShowSubscriptionModal(false);
        }
        // Fallback
        else {
          setHasSubscription(true);
          setShowSubscriptionModal(false);
        }
      } catch (err) {
        console.error('Error fetching library:', err);
        // If there's an error, default to showing library with error message
        setHasSubscription(true);
      }
    };

    checkAndFetchLibrary();
  }, [dispatch]);

  // Additional check based on error state - ONLY for subscription errors (but don't override success state)
  useEffect(() => {
    if (!loading && error && hasSubscription === null) {
      const errorStr = String(error).toLowerCase();
      const isSubscriptionError = errorStr.includes('subscribe to unlock') ||
        errorStr.includes('unlimited access');

      if (isSubscriptionError) {
        setHasSubscription(false);
        setSubscriptionError(error);
        setShowSubscriptionModal(true);
      } else {
        // Not a subscription error - might be server error, show library anyway
        setHasSubscription(true);
      }
    }
  }, [loading, error, hasSubscription]);

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

  const handleRemoveBook = async (bookId, bookTitle) => {
    if (!window.confirm(`Are you sure you want to remove "${bookTitle}" from your library?`)) {
      return;
    }

    setRemovingBookId(bookId);
    const result = await dispatch(removeBookFromLibrary(bookId));
    setRemovingBookId(null);

    if (result.success) {
      // Optionally show a success message
      console.log('Book removed successfully');
    } else {
      alert(result.message || 'Failed to remove book from library');
    }
  };

  if (loading || hasSubscription === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <LoadingSpinner size="lg" message="Loading library..." />
      </div>
    );
  }

  // Show clean subscription upgrade page ONLY for non-subscribed users (hasSubscription === false)
  if (hasSubscription === false && showSubscriptionModal) {
    return (
      <div className="min-h-screen bg-cream py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Hero Section */}
            <div className="mb-12">
              <div className="w-32 h-32 bg-gradient-to-br from-brown to-accent-brown rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <svg
                  className="w-16 h-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>

              <h1 className="heading-1 mb-4">Your Library Awaits</h1>
              <p className="body-xl text-text-secondary max-w-2xl mx-auto mb-2">
                Subscribe to unlock unlimited access to thousands of books and start building your personal digital library today.
              </p>
              <p className="body-lg text-brown font-medium">
                No subscription yet? Get started now!
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card elevated className="text-center">
                <Card.Body className="py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="heading-5 mb-2">Unlimited Books</h3>
                  <p className="body-sm text-text-secondary">
                    Access thousands of books across all genres
                  </p>
                </Card.Body>
              </Card>

              <Card elevated className="text-center">
                <Card.Body className="py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="heading-5 mb-2">Video Reviews</h3>
                  <p className="body-sm text-text-secondary">
                    Watch and share book video reviews with the community
                  </p>
                </Card.Body>
              </Card>

              <Card elevated className="text-center">
                <Card.Body className="py-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="heading-5 mb-2">Track Progress</h3>
                  <p className="body-sm text-text-secondary">
                    Sync your reading progress across all devices
                  </p>
                </Card.Body>
              </Card>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/pricing">
                <Button variant="primary" size="lg" className="min-w-[240px]">
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    View Subscription Plans
                  </span>
                </Button>
              </Link>
              <Link to="/buyer/dashboard">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            {/* Pricing Preview */}
            <Card className="mt-12 bg-gradient-to-r from-brown/5 to-accent-brown/5 border-brown/20">
              <Card.Body className="py-6">
                <p className="body-lg text-text-secondary mb-2">
                  <span className="font-semibold text-brown text-2xl">₹199/month</span> for Premium Plan
                </p>
                <p className="body-sm text-text-tertiary">
                  No commitment • Cancel anytime • 7-day free trial
                </p>
              </Card.Body>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show normal library ONLY for subscribed users (hasSubscription === true)
  if (hasSubscription === true) {
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
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
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

                // Read page progress from localStorage
                const lastPage = parseInt(localStorage.getItem(`book_${book._id}_lastPage`) || '1', 10);
                const totalPages = parseInt(localStorage.getItem(`book_${book._id}_numPages`) || '0', 10);

                // Calculate progress percentage from pages
                const pageProgress = totalPages > 0 ? Math.round((lastPage / totalPages) * 100) : progress;

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
                          {pageProgress > 0 && pageProgress < 100 && (
                            <div className="absolute top-1.5 right-1.5">
                              <Badge variant={getProgressVariant(pageProgress)} size="sm">
                                {pageProgress}%
                              </Badge>
                            </div>
                          )}
                          {pageProgress === 100 && (
                            <div className="absolute top-1.5 left-1.5">
                              <Badge variant="success" size="sm" className="flex items-center gap-0.5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </Badge>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Book Info */}
                      <Card.Body className="flex flex-col flex-grow p-2 md:p-3">
                        <div className="flex-grow min-h-0">
                          <Link
                            to={`/buyer/reader/${book._id}`}
                            className="text-sm font-semibold text-text-primary hover:text-brown line-clamp-2 mb-1 block transition-colors leading-tight"
                            title={book.title}
                          >
                            {book.title}
                          </Link>
                          <p className="text-xs text-text-secondary mb-2 line-clamp-1" title={book.author}>{book.author}</p>

                          {/* Progress Bar */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-[10px] text-text-secondary mb-1">
                              <span className="font-medium">Progress</span>
                              <span className="font-semibold text-brown">
                                {totalPages > 0 ? `${lastPage}/${totalPages}` : `${pageProgress}%`}
                              </span>
                            </div>
                            <div className="w-full bg-cream/80 border border-taupe/30 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-500 ease-out ${getProgressColor(pageProgress)}`}
                                style={{ width: `${pageProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1.5 mt-auto">
                          <Link to={`/buyer/reader/${book._id}`} className="flex-1 min-w-0">
                            <Button
                              variant="primary"
                              size="sm"
                              fullWidth
                              className="text-xs py-1.5 px-2 whitespace-nowrap overflow-hidden text-ellipsis"
                            >
                              {pageProgress > 0 ? 'Continue' : 'Start'}
                            </Button>
                          </Link>
                          <Link to={`/buyer/book/${book._id}`} title="View Book Details">
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2 py-1.5 min-w-[32px]"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveBook(book._id, book.title)}
                            disabled={removingBookId === book._id}
                            className="px-2 py-1.5 min-w-[32px] border-red-300 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600"
                            title="Remove from Library"
                          >
                            {removingBookId === book._id ? (
                              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </Button>
                        </div>

                        {/* Last Read */}
                        {libraryItem.lastRead && (
                          <p className="text-[10px] text-text-tertiary mt-2 pt-2 border-t border-border-light">
                            {new Date(libraryItem.lastRead).toLocaleDateString('en-US', {
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

          {/* Subscription CTA - Only show if user does NOT have an active subscription */}
          {!subscriptionLoading && !(currentSubscription && currentSubscription.isActive && new Date(currentSubscription.endDate) > new Date()) && books.length > 0 && (
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
  }

  // Fallback - should never reach here
  return null;
};

export default Library;
