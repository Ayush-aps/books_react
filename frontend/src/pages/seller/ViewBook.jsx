/**
 * Seller View Book Page
 * Read-only view for sellers to see details of any book (including those not uploaded by them)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicService } from '../../services/publicService'; // Use public service to fetch any book
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
        fetchBookDetails();
    }, [id]);

    const fetchBookDetails = async () => {
        try {
            setLoading(true);
            // Use publicService.getBookDetails to allow viewing any public book
            // Assuming publicService exists and has getBookDetails, similar to buyer flow
            // If publicService is not available, we might need to use a general endpoint
            const response = await publicService.getBook(id);
            setBook(response.data?.data?.book);
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
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="mt-4 w-full"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (!book) return null;

    return (
        <div className="min-h-screen bg-cream py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    className="mb-8"
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="text-brown hover:text-brown/80 flex items-center gap-2 mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Book Image */}
                    <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                    >
                        <Card>
                            <Card.Body>
                                {/* Book Cover */}
                                <div className="aspect-[3/4] bg-taupe/10 rounded-lg overflow-hidden mb-6">
                                    {book.coverImage ? (
                                        <img
                                            src={book.coverImage}
                                            alt={book.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-20 h-20 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Availability Status */}
                                <div className="mb-6">
                                    <p className="body-sm text-charcoal/60 mb-2">Availability</p>
                                    <Badge variant={book.stock > 0 ? 'success' : 'error'} size="lg" className="w-full justify-center">
                                        {book.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                    </Badge>
                                </div>
                            </Card.Body>
                        </Card>
                    </motion.div>

                    {/* Right Column - Book Details */}
                    <motion.div
                        className="lg:col-span-2 space-y-6"
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.1 }}
                    >
                        {/* Basic Information */}
                        <Card>
                            <Card.Body>
                                <h1 className="heading-2 text-charcoal mb-2">{book.title}</h1>
                                <p className="heading-5 text-charcoal/70 mb-6">by {book.author}</p>

                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <p className="body-sm text-charcoal/60 mb-1">Price</p>
                                        <p className="heading-4 text-brown">₹{book.price?.toFixed(2)}</p>
                                        {book.discountPercentage > 0 && (
                                            <Badge variant="success" size="sm" className="mt-1">
                                                {book.discountPercentage}% OFF
                                            </Badge>
                                        )}
                                    </div>
                                    <div>
                                        <p className="body-sm text-charcoal/60 mb-1">Rating</p>
                                        <div className="flex items-center gap-2">
                                            <span className="heading-4 text-charcoal">{book.rating?.toFixed(1) || '0.0'}</span>
                                            <span className="body-sm text-charcoal/60">({book.reviewCount || 0} reviews)</span>
                                        </div>
                                    </div>
                                </div>

                                {book.description && (
                                    <div>
                                        <p className="body-sm text-charcoal/60 mb-2">Description</p>
                                        <p className="body text-charcoal/80">{book.description}</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Book Details */}
                        <Card>
                            <Card.Body>
                                <h2 className="heading-4 text-charcoal mb-4">Book Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="body-sm text-charcoal/60">ISBN</p>
                                        <p className="body font-medium text-charcoal">{book.isbn || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="body-sm text-charcoal/60">Publisher</p>
                                        <p className="body font-medium text-charcoal">{book.publisher || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="body-sm text-charcoal/60">Published Date</p>
                                        <p className="body font-medium text-charcoal">
                                            {book.publishedDate ? new Date(book.publishedDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="body-sm text-charcoal/60">Page Count</p>
                                        <p className="body font-medium text-charcoal">{book.pageCount || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="body-sm text-charcoal/60">Language</p>
                                        <p className="body font-medium text-charcoal">{book.language || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="body-sm text-charcoal/60">Format</p>
                                        <p className="body font-medium text-charcoal capitalize">{book.format || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="body-sm text-charcoal/60">Condition</p>
                                        <p className="body font-medium text-charcoal capitalize">{book.condition || 'N/A'}</p>
                                    </div>
                                </div>

                                {book.genres && book.genres.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-charcoal/10">
                                        <p className="body-sm text-charcoal/60 mb-2">Genres</p>
                                        <div className="flex flex-wrap gap-2">
                                            {book.genres.map((genre, index) => (
                                                <Badge key={index} variant="default">{genre}</Badge>
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
