/**
 * Seller Book Details Page
 * View detailed information about a book in seller's inventory
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SuccessToast from '../../components/SuccessToast';
import ConfirmDialog from '../../components/ConfirmDialog';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';

const BookDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchBookDetails();
    }, [id]);

    const fetchBookDetails = async () => {
        try {
            setLoading(true);
            const response = await sellerService.getBookDetails(id);
            setBook(response.data?.book);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load book details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await sellerService.deleteBook(id);
            setSuccessMessage('Book deleted successfully!');
            setShowSuccessToast(true);
            setTimeout(() => navigate('/seller/inventory'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete book');
            setDeleteDialogOpen(false);
        } finally {
            setDeleting(false);
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
                        onClick={() => navigate('/seller/inventory')}
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
                        Back to Inventory
                    </button>
                </div>
            </div>
        );
    }

    if (!book) return null;

    const getStatusVariant = () => {
        if (book.isApproved) return 'success';
        if (book.rejectionReason) return 'error';
        return 'warning';
    };

    const getStatusText = () => {
        if (book.isApproved) return 'Approved';
        if (book.rejectionReason) return 'Rejected';
        return 'Pending Review';
    };

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
                        onClick={() => navigate('/seller/inventory')}
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
                        Back to Inventory
                    </button>
                </motion.div>

                {error && (
                    <motion.div
                        className="mb-6"
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                    >
                        <ErrorMessage message={error} />
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Book Image and Actions */}
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

                                {/* Approval Status */}
                                <div className="mb-6">
                                    <p className="body-sm text-charcoal/60 mb-2">Approval Status</p>
                                    <Badge
                                        variant={getStatusVariant()}
                                        size="lg"
                                        className="w-full justify-center"
                                    >
                                        {getStatusText()}
                                    </Badge>
                                    {book.rejectionReason && (
                                        <div className="mt-3 p-3 bg-error-light/10 border border-error-light rounded-lg">
                                            <p className="body-sm font-semibold text-error-dark mb-1">⚠️ Admin Feedback:</p>
                                            <p className="body-sm text-charcoal/80">{book.rejectionReason}</p>
                                            <p className="body-sm text-charcoal/60 mt-2 italic">
                                                Please update this book based on the feedback above.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Availability Status */}
                                <div className="mb-6">
                                    <p className="body-sm text-charcoal/60 mb-2">Availability</p>
                                    <Badge variant={book.isAvailable ? 'success' : 'error'} size="lg" className="w-full justify-center">
                                        {book.isAvailable ? 'Available' : 'Unavailable'}
                                    </Badge>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <Link to={`/seller/edit-book/${book._id}`}>
                                        <Button variant="primary" size="lg" fullWidth>
                                            Edit Book
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="error"
                                        size="lg"
                                        fullWidth
                                        onClick={() => setDeleteDialogOpen(true)}
                                    >
                                        Delete Book
                                    </Button>
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
                                        <p className="body-sm text-charcoal/60 mb-1">Stock</p>
                                        <p className={`heading-4 ${book.stock === 0 ? 'text-error' : 'text-charcoal'}`}>
                                            {book.stock || 0}
                                        </p>
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
                                    <div>
                                        <p className="body-sm text-charcoal/60">Rating</p>
                                        <p className="body font-medium text-charcoal">
                                            {book.rating?.toFixed(1) || '0.0'} ({book.reviewCount || 0} reviews)
                                        </p>
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

                        {/* Timestamps */}
                        <Card>
                            <Card.Body>
                                <h2 className="heading-4 text-charcoal mb-4">Upload Information</h2>
                                <div className="space-y-3">
                                    <div>
                                        <p className="body-sm text-charcoal/60">Uploaded Date</p>
                                        <p className="body font-medium text-charcoal">
                                            {new Date(book.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="body-sm text-charcoal/60">Last Updated</p>
                                        <p className="body font-medium text-charcoal">
                                            {new Date(book.updatedAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </motion.div>
                </div>

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    onConfirm={handleDelete}
                    title="Delete Book"
                    message={`Are you sure you want to delete "${book.title}"? This action cannot be undone.`}
                    confirmText="Delete"
                    type="danger"
                    loading={deleting}
                />

                {/* Success Toast */}
                {showSuccessToast && (
                    <SuccessToast
                        message={successMessage}
                        onClose={() => setShowSuccessToast(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default BookDetails;
