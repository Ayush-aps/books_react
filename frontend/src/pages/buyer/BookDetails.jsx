/**
 * Book Details Page - Premium Design
 * Full book information with enhanced layout and animations
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem, scaleIn } from '../../utils/animations';
import { fetchBookDetails } from '../../redux/actions/bookActions';
import { addToCart } from '../../redux/actions/cartActions';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
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
  const [selectedImage, setSelectedImage] = useState(0);

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
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <LoadingSpinner size="lg" message="Loading book details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-cream">
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
    <div className="min-h-screen bg-cream py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.nav 
          className="mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="flex items-center gap-2 body text-text-secondary">
            <Link to="/" className="text-brown hover:text-accent-brown transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/buyer/browse" className="text-brown hover:text-accent-brown transition-colors">
              Browse
            </Link>
            <span>/</span>
            <span className="text-text-primary">{book.title}</span>
          </div>
        </motion.nav>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <Card elevated className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 p-6 md:p-10">
              {/* Left Column - Image Gallery */}
              <motion.div variants={staggerItem} className="space-y-4">
                <div className="relative bg-white rounded-lg overflow-hidden shadow-md">
                  <motion.img
                    key={selectedImage}
                    src={book.coverImage || '/placeholder-book.png'}
                    alt={book.title}
                    className="w-full h-auto"
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                  />
                  
                  {/* Status Badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {book.discountPercentage > 0 && (
                      <Badge variant="error" size="lg">
                        {book.discountPercentage}% OFF
                      </Badge>
                    )}
                    {isPending && (
                      <Badge variant="warning" size="lg">
                        Pending Approval
                      </Badge>
                    )}
                    {isOutOfStock && (
                      <Badge variant="secondary" size="lg">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Thumbnail Gallery (if multiple images exist) */}
                {/* This can be extended when multiple images are supported */}
              </motion.div>

              {/* Right Column - Details */}
              <motion.div variants={staggerItem} className="space-y-6">
                {/* Title and Author */}
                <div>
                  <h1 className="heading-1 mb-3">{book.title}</h1>
                  <p className="body-xl text-text-secondary">by {book.author}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-6 w-6 ${
                          star <= (book.averageRating || 0) ? 'text-warning' : 'text-border'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="body text-text-secondary">
                    ({book.averageRating?.toFixed(1) || '0.0'})
                  </span>
                </div>

                {/* Price */}
                <Card className="bg-cream/50 border-2 border-brown/20">
                  <Card.Body>
                    <div className="flex items-baseline gap-4 mb-2">
                      <span className="text-5xl font-serif font-bold text-brown">
                        ${discountedPrice.toFixed(2)}
                      </span>
                      {book.discountPercentage > 0 && (
                        <span className="text-2xl text-text-secondary line-through">
                          ${book.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="body text-text-secondary">
                      {isOutOfStock ? (
                        <Badge variant="error">Out of Stock</Badge>
                      ) : (
                        <span className="text-success font-medium">{book.stock} in stock</span>
                      )}
                    </p>
                  </Card.Body>
                </Card>

                {/* Quantity and Add to Cart */}
                {isAvailable && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="quantity" className="heading-5 mb-3 block">
                        Quantity
                      </label>
                      <select
                        id="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="input w-32"
                      >
                        {[...Array(Math.min(book.stock, 10))].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleAddToCart}
                      className="w-full"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Add to Cart
                    </Button>
                  </div>
                )}

                {/* Book Info Grid */}
                <Card>
                  <Card.Body className="space-y-4">
                    <h3 className="heading-4 mb-4 pb-3 border-b border-border">
                      Book Details
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="body-sm text-text-secondary mb-1">Genre</p>
                        <p className="body font-medium">{book.genre}</p>
                      </div>
                      <div>
                        <p className="body-sm text-text-secondary mb-1">Condition</p>
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
                        <p className="body-sm text-text-secondary mb-1">ISBN</p>
                        <p className="body font-medium">{book.isbn || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="body-sm text-text-secondary mb-1">Published</p>
                        <p className="body font-medium">{book.publicationYear || 'N/A'}</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                {/* Seller Info */}
                <Card className="bg-green/5 border border-green/20">
                  <Card.Body>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green/10 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="body-sm text-text-secondary">Sold by</p>
                        <p className="heading-5 text-green">
                          {book.sellerId?.name || 'Unknown Seller'}
                        </p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </div>

            {/* Description Section */}
            <div className="px-6 md:px-10 pb-10 border-t border-border pt-8">
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h2 className="heading-2 mb-6">Description</h2>
                <p className="body-lg text-text-secondary whitespace-pre-line leading-relaxed">
                  {book.description || 'No description available.'}
                </p>
              </motion.div>
            </div>

            {/* Video Reviews Section */}
            {book.videos && book.videos.length > 0 && (
              <div className="px-6 md:px-10 pb-10 border-t border-border pt-8">
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <motion.h2 variants={staggerItem} className="heading-2 mb-6">
                    Video Reviews
                  </motion.h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {book.videos.slice(0, 3).map((video) => (
                      <motion.div key={video._id} variants={staggerItem}>
                        <Link to={`/buyer/videos/${video._id}`}>
                          <Card hoverable className="overflow-hidden">
                            <div className="relative aspect-video bg-charcoal">
                              <video
                                src={video.videoUrl}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-charcoal/30 group-hover:bg-charcoal/40 transition-all flex items-center justify-center">
                                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                                  <svg className="h-8 w-8 text-brown ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <Card.Body>
                              <p className="body font-medium line-clamp-2">
                                {video.title}
                              </p>
                            </Card.Body>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {book.videos.length > 3 && (
                    <motion.div variants={staggerItem} className="mt-6">
                      <Button variant="ghost" asChild>
                        <Link to={`/buyer/videos?bookId=${book._id}`}>
                          View all {book.videos.length} videos
                          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            )}
          </Card>
        </motion.div>
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
