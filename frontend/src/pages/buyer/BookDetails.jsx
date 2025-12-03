/**
 * Book Details Page - Premium Design
 * Full book information with enhanced layout and animations
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useToast } from '../../components/Toast';
import { fadeInUp, scaleIn, staggerContainer, staggerItem } from '../../utils/animations';
import { roundPrice } from '../../utils/priceUtils';
import { fetchBookDetails } from '../../redux/actions/bookActions';
import { addToCart, saveForLater } from '../../redux/actions/cartActions';
import { addBookToLibrary } from '../../redux/actions/libraryActions';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SuccessToast from '../../components/SuccessToast';
import BookCard from '../../components/BookCard';
import ReviewForm from '../../components/ReviewForm';
import ReviewsList from '../../components/ReviewsList';
import api from '../../services/api';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentBook, recommendedBooks, loading, error } = useSelector(state => state.books);
  const { user } = useSelector(state => state.auth);
  const { books: libraryBooks } = useSelector(state => state.library);
  const [quantity, setQuantity] = useState(1);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [isInLibrary, setIsInLibrary] = useState(false);

  useEffect(() => {
    dispatch(fetchBookDetails(id));
    window.scrollTo(0, 0);
  }, [dispatch, id]);

  // Check if book is already in library
  useEffect(() => {
    if (libraryBooks && currentBook) {
      const bookInLibrary = libraryBooks.some(
        (item) => {
          const book = item.bookId || item.book;
          return book && book._id === currentBook._id;
        }
      );
      setIsInLibrary(bookInLibrary);
    }
  }, [libraryBooks, currentBook]);

  // Check if user can review
  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (!user) {
        setCanReview(false);
        return;
      }

      try {
        const response = await api.get(`/reviews/user/can-review/${id}`);
        if (response.data.success) {
          setCanReview(response.data.data.canReview);
          if (response.data.data.review) {
            setExistingReview(response.data.data.review);
          }
        }
      } catch (err) {
        console.error('Error checking review eligibility:', err);
      }
    };

    if (id) {
      checkReviewEligibility();
    }
  }, [id, user]);

  // Auto-open review form if coming from orders page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('review') === 'true' && canReview) {
      setActiveTab('reviews');
      setShowReviewForm(true);
    }
  }, [canReview]);

  // Track book view when user visits the page
  useEffect(() => {
    const trackView = async () => {
      if (user && id && currentBook) {
        try {
          await api.post(`/buyer/track-view/${id}`);
        } catch (err) {
          // Silently fail - don't interrupt user experience
          console.error('Error tracking view:', err);
        }
      }
    };

    trackView();
  }, [currentBook, user, id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/buyer/book/${id}` } });
      return;
    }

    const result = await dispatch(addToCart(currentBook._id, quantity));
    if (result.success) {
      setToastMessage('Book added to cart successfully!');
      setShowSuccessToast(true);
    }
  };

  const handleSaveForLater = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/buyer/book/${id}` } });
      return;
    }

    const result = await dispatch(saveForLater(currentBook._id));
    if (result.success) {
      setToastMessage('Book saved for later!');
      setShowSuccessToast(true);
    }
  };

  const handleAddToLibrary = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/buyer/book/${id}` } });
      return;
    }

    const result = await dispatch(addBookToLibrary(currentBook._id));

    // Check if subscription is required
    if (!result.success && result.requiresSubscription) {
      // Show message to take subscription first
      setToastMessage('Please subscribe to add books to your library');
      setShowSuccessToast(true);
      return;
    }

    // Show success or error message
    if (result.success) {
      setIsInLibrary(true); // Update state immediately
      setToastMessage('Successfully added book to your library!');
      setShowSuccessToast(true);
    } else {
      setToastMessage(result.message || 'Failed to add book to library');
      setShowSuccessToast(true);
    }
  };

  const handleRelatedAddToCart = async (bookId) => {
    if (!user) {
      navigate('/login', { state: { from: `/buyer/book/${id}` } });
      return;
    }
    const result = await dispatch(addToCart(bookId, 1));
    if (result.success) {
      setToastMessage('Book added to cart successfully!');
      setShowSuccessToast(true);
    }
  };

  const handleReviewSubmit = (newReview) => {
    setShowReviewForm(false);
    setExistingReview(newReview);
    setCanReview(false);
    setToastMessage('Review submitted successfully!');
    setShowSuccessToast(true);
  };

  const handleReviewsUpdate = (reviews) => {
    // Update book average rating based on reviews
    if (currentBook && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = totalRating / reviews.length;
      // Update local book data (optional)
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <LoadingSpinner size="lg" message="Loading book details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background-primary">
        <ErrorMessage message={error} onRetry={() => dispatch(fetchBookDetails(id))} />
      </div>
    );
  }

  if (!currentBook) {
    return null;
  }

  const book = currentBook;
  const discountedPrice = book.discountPercentage
    ? book.price - (book.price * book.discountPercentage / 100)
    : book.price;
  const isOutOfStock = book.stock === 0;
  const isPending = book.isApproved === false && !book.rejectionReason;
  const isAvailable = book.isApproved === true && !isOutOfStock;

  return (
    <div className="min-h-screen bg-background-primary py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.nav
          className="mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Link to="/" className="hover:text-accent-brown transition-colors">Home</Link>
            <span>/</span>
            <Link to="/buyer/browse" className="hover:text-accent-brown transition-colors">Browse</Link>
            <span>/</span>
            <span className="text-text-primary font-medium truncate max-w-[200px]">{book.title}</span>
          </div>
        </motion.nav>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12"
        >
          {/* Left Column - Image (5 cols) */}
          <motion.div variants={staggerItem} className="md:col-span-5 lg:col-span-4">
            <div className="sticky top-24">
              <div className="relative bg-white rounded-lg overflow-hidden shadow-lg aspect-[2/3]">
                <motion.img
                  src={book.coverImage || '/placeholder-book.png'}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                />

                {/* Status Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {book.discountPercentage > 0 && (
                    <Badge variant="error" size="md">
                      {book.discountPercentage}% OFF
                    </Badge>
                  )}
                  {isPending && (
                    <Badge variant="warning" size="md">
                      Pending Approval
                    </Badge>
                  )}
                  {isOutOfStock && (
                    <Badge variant="secondary" size="md">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Details (7 cols) */}
          <motion.div variants={staggerItem} className="md:col-span-7 lg:col-span-8 space-y-8">
            {/* Header Info */}
            <div>
              <h1 className="heading-2 mb-2 text-text-primary">{book.title}</h1>
              <p className="text-lg text-text-secondary">by <span className="font-medium text-text-primary">{book.author}</span></p>

              {/* Rating */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex text-warning">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-5 w-5 ${star <= (book.averageRating || 0) ? 'fill-current' : 'text-border-medium'}`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-text-tertiary">
                  ({book.averageRating?.toFixed(1) || '0.0'} rating)
                </span>
              </div>
            </div>

            {/* Price & Actions Card */}
            <Card elevated padding="lg" className="bg-white/80 backdrop-blur-sm border-border-light">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-serif font-bold text-accent-brown">
                      ₹{roundPrice(discountedPrice)}
                    </span>
                    {book.discountPercentage > 0 && (
                      <span className="text-xl text-text-tertiary line-through">
                        ₹{roundPrice(book.price)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm">
                    {isOutOfStock ? (
                      <span className="text-error font-medium">Currently Unavailable</span>
                    ) : (
                      <span className="text-success font-medium">In Stock ({book.stock} available)</span>
                    )}
                  </p>
                </div>

                {/* Quantity Selector */}
                {isAvailable && (
                  <div className="flex items-center gap-3">
                    <label htmlFor="quantity" className="text-sm font-medium text-text-secondary">Qty:</label>
                    <select
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="form-control w-20 py-1 px-2 text-sm"
                    >
                      {[...Array(Math.min(book.stock, 10))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isAvailable && (
                <div className="flex flex-col gap-4">
                  {/* Primary Action - Add to Cart */}
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleAddToCart}
                    className="w-full justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Add to Cart
                  </Button>

                  {/* Secondary Actions */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={isInLibrary ? () => navigate('/buyer/library') : handleAddToLibrary}
                      className={`flex-1 justify-center ${isInLibrary
                        ? 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                        : 'border-accent-brown text-accent-brown hover:bg-accent-brown hover:text-white'
                        }`}
                    >
                      {isInLibrary ? (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Already in Library
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Add to Library
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleSaveForLater}
                      className="flex-1 justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Save for Later
                    </Button>
                  </div>
                </div>
              )}

              {/* Out of Stock Message */}
              {isOutOfStock && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-6 text-center">
                  <svg className="w-16 h-16 text-error mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-error mb-2">Out of Stock</h3>
                  <p className="text-text-secondary mb-4">
                    This book is currently unavailable. The seller and admin have been notified to restock.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={handleSaveForLater}
                      className="border-accent-brown text-accent-brown hover:bg-accent-brown hover:text-white"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Save for Later
                    </Button>
                    <Link to="/buyer/browse">
                      <Button variant="outline" size="md">
                        Browse Similar Books
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </Card>

            {/* Tabs Section */}
            <div className="border-b border-border-primary">
              <div className="flex gap-8">
                {['description', 'details', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-base font-medium capitalize transition-colors relative ${activeTab === tab
                      ? 'text-accent-brown'
                      : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-brown"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
              {activeTab === 'description' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                    {book.description || 'No description available.'}
                  </p>
                </motion.div>
              )}

              {activeTab === 'details' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                >
                  <div>
                    <h4 className="text-sm font-medium text-text-tertiary mb-1">Genre</h4>
                    <p className="text-text-primary">{book.genres?.join(', ') || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-text-tertiary mb-1">Condition</h4>
                    <Badge
                      variant={
                        book.condition === 'new' ? 'success' :
                          book.condition === 'like-new' ? 'info' :
                            'warning'
                      }
                    >
                      {book.condition}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-text-tertiary mb-1">ISBN</h4>
                    <p className="text-text-primary">{book.isbn || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-text-tertiary mb-1">Publication Year</h4>
                    <p className="text-text-primary">{book.publishedDate ? new Date(book.publishedDate).getFullYear() : 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-text-tertiary mb-1">Seller</h4>
                    <p className="text-text-primary">{book.seller?.name || 'Unknown Seller'}</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Not Eligible Notice */}
                  {user && !canReview && !existingReview && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <p className="text-sm text-blue-700">
                        You can write a review once your order is delivered. Only verified purchases can be reviewed.
                      </p>
                    </div>
                  )}

                  {/* Write Review Button */}
                  {user && canReview && !showReviewForm && !existingReview && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-brown hover:bg-brown/90 text-white"
                      >
                        Write a Review
                      </Button>
                    </div>
                  )}

                  {/* Existing Review Notice */}
                  {existingReview && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        You have already reviewed this book. Your review is displayed below.
                      </p>
                    </div>
                  )}

                  {/* Review Form */}
                  {showReviewForm && (
                    <ReviewForm
                      bookId={id}
                      onReviewSubmit={handleReviewSubmit}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  )}

                  {/* Reviews List */}
                  <ReviewsList
                    bookId={id}
                    onReviewsUpdate={handleReviewsUpdate}
                  />

                  {/* Link to Video Reviews Page */}
                  {book.videos && book.videos.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-primary">
                      <h4 className="text-lg font-bold text-charcoal mb-4">
                        Video Reviews ({book.videos.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {book.videos.slice(0, 3).map((video) => (
                          <Link key={video._id} to={`/buyer/videos/${video._id}`}>
                            <Card hoverable className="overflow-hidden h-full">
                              <div className="relative aspect-video bg-charcoal">
                                <video src={video.videoUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                    <svg className="h-6 w-6 text-accent-brown ml-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div className="p-3">
                                <p className="text-sm font-medium line-clamp-2">{video.title}</p>
                              </div>
                            </Card>
                          </Link>
                        ))}
                      </div>
                      {book.videos.length > 3 && (
                        <div className="text-center mt-4">
                          <Link
                            to="/buyer/videos"
                            className="text-brown hover:text-brown/80 font-medium"
                          >
                            View all video reviews →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Related Books Section */}
        {recommendedBooks && recommendedBooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 pt-10 border-t border-border-light"
          >
            <h2 className="heading-3 mb-8">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedBooks.map((relatedBook) => (
                <BookCard
                  key={relatedBook._id}
                  book={relatedBook}
                  onAddToCart={handleRelatedAddToCart}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          message={toastMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  );
};

export default BookDetails;
