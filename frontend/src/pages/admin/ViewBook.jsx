/**
 * Admin View Book Page
 * Read-only view for admins to see details of any book without moderation actions
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicService } from '../../services/publicService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';

const ViewBook = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchBookDetails();
    }, [id]);

    const fetchBookDetails = async () => {
        try {
            setLoading(true);
            // Use publicService to fetch book details as seen by users
            const response = await publicService.getBook(id);
            setBook(response.data?.data?.book || response.data?.book);
            setError(null);
        } catch (err) {
            console.error("Error fetching book:", err);
            setError(err.response?.data?.message || 'Failed to load book details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream">
                <LoadingSpinner size="lg" message="Loading book details..." />
            </div>
        );
    }

    if (error && !book) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream">
                <div className="max-w-md w-full px-4">
                    <ErrorMessage message={error} />
                    <button
                        onClick={() => navigate(-1)}
                        className="text-charcoal text-xs sm:text-sm rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none hover:shadow-md whitespace-nowrap inline-flex items-center border-none mt-4 w-full justify-center"
                        style={{ 
                          backgroundColor: 'transparent',
                          padding: '0.625rem 1.5rem',
                          border: 'none',
                          lineHeight: '1.5',
                          height: '50px',
                          fontWeight: '500',
                          outline: 'none'
                        }}
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!book) return null;

    return (
        <div className="min-h-screen bg-cream py-6 sm:py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-6 sm:mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <button
            onClick={() => navigate(-1)}
            className="text-charcoal text-xs sm:text-sm rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none hover:shadow-md whitespace-nowrap inline-flex items-center border-none"
            style={{ 
              backgroundColor: 'transparent',
              padding: '0.625rem 1.5rem',
              border: 'none',
              lineHeight: '1.5',
              height: '50px',
              fontWeight: '500',
              outline: 'none'
            }}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Left Column - Book Image */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <Card.Body className="p-3 sm:p-4 md:p-6">
                {/* Book Cover */}
                <div className="aspect-[3/4] bg-taupe/10 rounded-lg overflow-hidden mb-4 sm:mb-6">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Availability Status */}
                <div className="mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-charcoal/60 mb-2">Availability</p>
                  <Badge variant={book.stock > 0 ? 'success' : 'error'} size="lg" className="w-full justify-center text-xs sm:text-sm">
                    {book.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Right Column - Book Details */}
          <motion.div
            className="lg:col-span-2 space-y-4 sm:space-y-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            {/* Basic Information */}
            <Card>
              <Card.Body className="p-3 sm:p-4 md:p-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-charcoal mb-1 sm:mb-2">{book.title}</h1>
                <p className="text-base sm:text-lg md:text-xl font-medium text-charcoal/70 mb-4 sm:mb-6">by {book.author}</p>

                <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div>
                    <p className="text-xs sm:text-sm text-charcoal/60 mb-1">Price</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-brown">₹{book.price?.toFixed(2)}</p>
                    {book.discountPercentage > 0 && (
                      <Badge variant="success" size="sm" className="mt-1 text-xs">
                        {book.discountPercentage}% OFF
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-charcoal/60 mb-1">Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl md:text-3xl font-bold text-charcoal">{book.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-xs sm:text-sm text-charcoal/60">({book.reviewCount || 0} reviews)</span>
                    </div>
                  </div>
                </div>

                {book.description && (
                  <div>
                    <p className="text-xs sm:text-sm text-charcoal/60 mb-2">Description</p>
                    <p className="text-sm sm:text-base text-charcoal/80">{book.description}</p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Book Details */}
            <Card>
              <Card.Body className="p-3 sm:p-4 md:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-charcoal mb-3 sm:mb-4">Book Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-charcoal/60">ISBN</p>
                    <p className="text-sm sm:text-base font-medium text-charcoal">{book.isbn || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-charcoal/60">Publisher</p>
                    <p className="text-sm sm:text-base font-medium text-charcoal">{book.publisher || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-charcoal/60">Published Date</p>
                    <p className="text-sm sm:text-base font-medium text-charcoal">
                      {book.publishedDate ? new Date(book.publishedDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-charcoal/60">Page Count</p>
                    <p className="text-sm sm:text-base font-medium text-charcoal">{book.pageCount || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-charcoal/60">Language</p>
                    <p className="text-sm sm:text-base font-medium text-charcoal">{book.language || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-charcoal/60">Format</p>
                    <p className="text-sm sm:text-base font-medium text-charcoal capitalize">{book.format || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-charcoal/60">Condition</p>
                    <p className="text-sm sm:text-base font-medium text-charcoal capitalize">{book.condition || 'N/A'}</p>
                  </div>
                </div>

                {book.genres && book.genres.length > 0 && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-charcoal/10">
                    <p className="text-xs sm:text-sm text-charcoal/60 mb-2">Genres</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {book.genres.map((genre, index) => (
                        <Badge key={index} variant="default" className="text-xs sm:text-sm">{genre}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
    );
};

export default ViewBook;
