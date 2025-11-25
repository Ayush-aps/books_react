/**
 * Reviews List Component
 * Display all book reviews with filtering and helpful buttons
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, AlertCircle, Filter, ChevronDown, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';

const ReviewsList = ({ bookId, onReviewsUpdate }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = { sort: sortBy };
      if (filterRating) params.rating = filterRating;

      const response = await api.get(`/reviews/book/${bookId}`, { params });
      
      if (response.data.success) {
        setReviews(response.data.data.reviews);
        if (onReviewsUpdate) onReviewsUpdate(response.data.data.reviews);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [bookId, sortBy, filterRating]);

  // Handle helpful button
  const handleHelpful = async (reviewId) => {
    try {
      const response = await api.put(`/reviews/${reviewId}/helpful`);
      
      if (response.data.success) {
        // Update local state
        setReviews(reviews.map(review => 
          review._id === reviewId 
            ? {
                ...review,
                helpfulCount: response.data.data.helpfulCount,
                isHelpfulByCurrentUser: response.data.data.isHelpful
              }
            : review
        ));
      }
    } catch (err) {
      console.error('Error marking review helpful:', err);
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-brown border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center gap-2 p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-charcoal">Customer Reviews</h3>
          <p className="text-sm text-tertiary mt-1">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        <div className="flex gap-3">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brown text-sm bg-white cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="rating-high">Highest Rating</option>
              <option value="rating-low">Lowest Rating</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" size={16} />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border border-primary rounded-lg hover:bg-cream transition-colors ${
              filterRating ? 'bg-brown text-white hover:bg-brown/90' : 'bg-white text-charcoal'
            }`}
          >
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-cream rounded-lg border border-primary"
        >
          <p className="text-sm font-medium text-charcoal mb-3">Filter by Rating</p>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterRating(null)}
              className={`px-3 py-1 rounded-full text-sm ${
                !filterRating ? 'bg-brown text-white' : 'bg-white text-charcoal border border-primary'
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilterRating(rating)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  filterRating === rating ? 'bg-brown text-white' : 'bg-white text-charcoal border border-primary'
                }`}
              >
                {rating} <Star size={12} className="fill-current" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-tertiary italic">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-primary p-6 hover:shadow-md transition-shadow"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={review.user?.avatar || '/img/users/default-avatar.png'}
                    alt={review.user?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-charcoal">{review.user?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      {review.isVerifiedPurchase && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-tertiary">
                  {format(new Date(review.createdAt), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Review Text */}
              {review.reviewText && (
                <p className="text-charcoal mb-4 whitespace-pre-wrap">{review.reviewText}</p>
              )}

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {review.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(image.url)}
                      className="flex-shrink-0 group relative"
                    >
                      <img
                        src={image.url}
                        alt={image.caption || `Review image ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border border-primary hover:border-brown transition-colors"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <ImageIcon className="text-white" size={24} />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Review Video */}
              {review.video && (
                <div className="mb-4">
                  <video
                    src={review.video.videoUrl}
                    poster={review.video.thumbnailUrl}
                    controls
                    className="w-full max-h-96 rounded-lg border border-primary"
                  />
                </div>
              )}

              {/* Helpful Button */}
              <div className="flex items-center gap-4 pt-3 border-t border-primary">
                <button
                  onClick={() => handleHelpful(review._id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    review.isHelpfulByCurrentUser
                      ? 'bg-brown text-white'
                      : 'bg-cream text-charcoal hover:bg-taupe/20'
                  }`}
                >
                  <ThumbsUp size={16} />
                  <span className="text-sm">
                    Helpful {review.helpfulCount > 0 && `(${review.helpfulCount})`}
                  </span>
                </button>
              </div>

              {/* Seller/Admin Replies */}
              {review.replies && review.replies.length > 0 && (
                <div className="mt-4 pl-6 border-l-2 border-taupe space-y-3">
                  {review.replies.map((reply, index) => (
                    <div key={index} className="bg-cream p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-medium text-charcoal">
                          {reply.user?.name}
                        </p>
                        <span className="text-xs bg-brown text-white px-2 py-0.5 rounded">
                          {reply.user?.role === 'admin' ? 'Admin' : 'Seller'}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal">{reply.text}</p>
                      <p className="text-xs text-tertiary mt-1">
                        {format(new Date(reply.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Review"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
