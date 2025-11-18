/**
 * Book Details Page (Buyer)
 * Displays full book information with add to cart and video reviews
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookDetails } from '../../redux/actions/bookActions';
import { addToCart } from '../../redux/actions/cartActions';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SuccessToast from '../../components/SuccessToast';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentBook, loading, error } = useSelector(state => state.books);
  const { user } = useSelector(state => state.auth);
  const [quantity, setQuantity] = useState(1);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    dispatch(fetchBookDetails(id));
  }, [dispatch, id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const result = await dispatch(addToCart(currentBook._id, quantity));
    if (result.success) {
      setShowSuccessToast(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading book details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
  const isPending = book.approvalStatus === 'pending';
  const isAvailable = (book.approvalStatus === 'approved' || !book.approvalStatus) && !isOutOfStock;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link to="/" className="text-blue-600 hover:text-blue-800">Home</Link>
          <span className="mx-2 text-gray-500">/</span>
          <Link to="/buyer/browse" className="text-blue-600 hover:text-blue-800">Browse</Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-700">{book.title}</span>
        </nav>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left Column - Image */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <img
                  src={book.coverImage || '/placeholder-book.png'}
                  alt={book.title}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                {book.discountPercentage > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-semibold">
                    {book.discountPercentage}% OFF
                  </div>
                )}
                {isPending && (
                  <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full font-semibold">
                    Pending Approval
                  </div>
                )}
                {isOutOfStock && (
                  <div className="absolute top-4 left-4 bg-gray-700 text-white px-3 py-1 rounded-full font-semibold">
                    Out of Stock
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Title and Author */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                <p className="text-lg text-gray-600">by {book.author}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-5 w-5 ${
                        star <= (book.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-600">
                  ({book.averageRating?.toFixed(1) || '0.0'})
                </span>
              </div>

              {/* Price */}
              <div className="border-t border-b border-gray-200 py-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{discountedPrice.toFixed(2)}
                  </span>
                  {book.discountPercentage > 0 && (
                    <span className="text-xl text-gray-500 line-through">
                      ₹{book.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {isOutOfStock ? 'Out of Stock' : `${book.stock} available`}
                </p>
              </div>

              {/* Quantity and Add to Cart */}
              {isAvailable && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <select
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[...Array(Math.min(book.stock, 10))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              )}

              {/* Book Info */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Genre:</span>
                  <span className="font-medium text-gray-900">{book.genre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Condition:</span>
                  <span className="font-medium text-gray-900 capitalize">{book.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ISBN:</span>
                  <span className="font-medium text-gray-900">{book.isbn || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Published:</span>
                  <span className="font-medium text-gray-900">
                    {book.publicationYear || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Seller Info */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  Sold by:{' '}
                  <span className="font-medium text-gray-900">
                    {book.sellerId?.name || 'Unknown Seller'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-8 pb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {book.description || 'No description available.'}
            </p>
          </div>

          {/* Video Reviews Section */}
          {book.videos && book.videos.length > 0 && (
            <div className="px-8 pb-8 border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Video Reviews</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {book.videos.slice(0, 3).map((video) => (
                  <Link
                    key={video._id}
                    to={`/buyer/videos/${video._id}`}
                    className="group"
                  >
                    <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <video
                        src={video.videoUrl}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-900 line-clamp-2">
                      {video.title}
                    </p>
                  </Link>
                ))}
              </div>
              {book.videos.length > 3 && (
                <Link
                  to={`/buyer/videos?bookId=${book._id}`}
                  className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all {book.videos.length} videos →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          message="Book added to cart successfully!"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  );
};

export default BookDetails;
