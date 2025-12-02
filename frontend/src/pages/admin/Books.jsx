/**
 * Admin Books Page (Content Moderation)
 * Moderate and manage all books in the system
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookRejectionSchema } from '../../schemas/allFormSchemas';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import SuccessToast from '../../components/SuccessToast';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Books = () => {
  const [pendingBooks, setPendingBooks] = useState([]);
  const [approvedBooks, setApprovedBooks] = useState([]);
  const [rejectedBooks, setRejectedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // React Hook Form for rejection
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(bookRejectionSchema),
    defaultValues: { reason: '' }
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await adminService.getContent();
      setPendingBooks(response.data?.pendingBooks || []);
      setApprovedBooks(response.data?.approvedBooks || []);
      setRejectedBooks(response.data?.rejectedBooks || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookId) => {
    try {
      setProcessing(true);
      await adminService.approveBook(bookId);

      // Move book from pending to approved
      const approvedBook = pendingBooks.find(book => book._id === bookId);
      if (approvedBook) {
        setPendingBooks(pendingBooks.filter(book => book._id !== bookId));
        setApprovedBooks([{ ...approvedBook, isApproved: true }, ...approvedBooks]);
      }

      setSuccessMessage('Book approved successfully and now available for buyers');
      setShowSuccessToast(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve book');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = (book) => {
    setSelectedBook(book);
    reset({ reason: '' });
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async (data) => {
    if (!selectedBook) return;

    try {
      setProcessing(true);
      const response = await adminService.rejectBook(selectedBook._id, data.reason);

      // Use the book data from the response to ensure it has the correct structure
      const rejectedBook = response.data?.book || {
        ...selectedBook,
        rejectionReason: rejectReason,
        rejectionDate: new Date(),
        isApproved: false
      };

      // Move book from pending/approved to rejected list
      setPendingBooks(pendingBooks.filter(book => book._id !== selectedBook._id));
      setApprovedBooks(approvedBooks.filter(book => book._id !== selectedBook._id));
      setRejectedBooks([rejectedBook, ...rejectedBooks]);

      setSuccessMessage('Book rejected. Seller has been notified with feedback.');
      setShowSuccessToast(true);
      setShowRejectModal(false);
      reset({ reason: '' });
      setSelectedBook(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject book');
    } finally {
      setProcessing(false);
    }
  };

  const allBooks = [...pendingBooks, ...approvedBooks, ...rejectedBooks];

  const filteredBooks = statusFilter === 'all'
    ? allBooks
    : statusFilter === 'pending'
      ? pendingBooks
      : statusFilter === 'approved'
        ? approvedBooks
        : statusFilter === 'rejected'
          ? rejectedBooks
          : [];

  const getStatusVariant = (book) => {
    if (book.isApproved) return 'success';
    if (book.rejectionReason) return 'error';
    return 'warning';
  };

  const getStatusText = (book) => {
    if (book.isApproved) return 'Approved';
    if (book.rejectionReason) return 'Rejected';
    return 'Pending';
  };

  const isPendingBook = (book) => pendingBooks.some(p => p._id === book._id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading books..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-6 sm:py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-6 sm:mb-8 md:mb-12"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-1 sm:mb-2">Content Moderation</h1>
          <p className="text-sm sm:text-base text-charcoal/70">Review and moderate books in the system</p>
        </motion.div>

        {error && (
          <motion.div
            className="mb-4 sm:mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <ErrorMessage message={error} />
          </motion.div>
        )}

        {/* Filter Tabs - Mobile Optimized */}
        <motion.div
          className="mb-4 sm:mb-6 md:mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <Card.Body className="p-1 sm:p-2">
              <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
                {[
                  { value: 'pending', label: 'Pending', mobileLabel: 'Pending', count: pendingBooks.length },
                  { value: 'approved', label: 'Approved', mobileLabel: 'Approved', count: approvedBooks.length },
                  { value: 'rejected', label: 'Rejected', mobileLabel: 'Rejected', count: rejectedBooks.length },
                  { value: 'all', label: 'All Books', mobileLabel: 'All', count: allBooks.length }
                ].map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                      statusFilter === tab.value
                        ? 'bg-brown text-white shadow-sm'
                        : 'text-charcoal/70 hover:bg-taupe/10'
                    }`}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.mobileLabel}</span>
                    <Badge
                      variant={statusFilter === tab.value ? 'light' : 'default'}
                      size="sm"
                      className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                    >
                      {tab.count}
                    </Badge>
                  </button>
                ))}
              </nav>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Books Grid - Responsive */}
        {filteredBooks.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <Card.Body className="py-12 sm:py-16 text-center">
                <div className="max-w-md mx-auto px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-taupe/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-charcoal mb-2 sm:mb-3">
                    {statusFilter === 'all' ? 'No books found' : `No ${statusFilter} books`}
                  </h3>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredBooks.map(book => (
              <motion.div key={book._id} variants={staggerItem}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 h-full flex flex-col">
                  <Link to={`/admin/content/${book._id}`} className="block">
                    <div className="relative pb-[135%] bg-gray-50">
                      <img
                        src={book.coverImage || 'https://via.placeholder.com/300x420?text=No+Cover'}
                        alt={book.title}
                        className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
                        <Badge variant={getStatusVariant(book)} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                          {getStatusText(book)}
                        </Badge>
                      </div>
                      {book.stock === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <span className="text-white font-bold text-[10px] sm:text-xs">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-col flex-grow p-2 sm:p-3">
                    <Link to={`/admin/content/${book._id}`} className="block mb-1">
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-900 hover:text-accent-brown line-clamp-2 transition-colors leading-tight min-h-[2rem] sm:min-h-[2.5rem]">
                        {book.title || 'Untitled'}
                      </h3>
                    </Link>
                    <p className="text-gray-500 line-clamp-1 text-[10px] sm:text-[11px] mb-1.5 sm:mb-2">{book.author || 'Unknown'}</p>

                    <div className="mt-auto">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">₹{book.price ? book.price.toFixed(2) : '0.00'}</span>
                        {book.condition && (
                          <span className="text-[9px] sm:text-[10px] text-gray-500 capitalize bg-gray-50 px-1 sm:px-1.5 py-0.5 rounded">{book.condition}</span>
                        )}
                      </div>

                      {book.seller?.name && (
                        <p className="text-[9px] sm:text-[10px] text-gray-500 mb-1.5 sm:mb-2 line-clamp-1">
                          By: {book.seller.name}
                        </p>
                      )}

                      {isPendingBook(book) ? (
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-1.5">
                          <button
                            onClick={() => handleApprove(book._id)}
                            disabled={processing}
                            className="w-full sm:flex-1 bg-green-600 text-white rounded font-medium py-1.5 sm:py-2 text-[10px] sm:text-xs hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                            style={{
                              zIndex: 100,
                              backgroundColor: '#16a34a',
                              borderColor: '#16a34a'
                            }}
                            onMouseEnter={(e) => {
                              if (!processing) {
                                e.currentTarget.style.backgroundColor = '#15803d';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!processing) {
                                e.currentTarget.style.backgroundColor = '#16a34a';
                              }
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectClick(book)}
                            disabled={processing}
                            className="w-full sm:flex-1 bg-red-600 text-white rounded font-medium py-1.5 sm:py-2 text-[10px] sm:text-xs hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <Link to={`/admin/content/${book._id}`} className="block">
                          <button className="w-full bg-gray-100 text-gray-700 border border-gray-300 rounded font-medium py-1.5 sm:py-2 text-[10px] sm:text-xs hover:bg-gray-200 transition-colors duration-200 shadow-sm">
                            View Details
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Reject Modal - Mobile Optimized */}
        {showRejectModal && (
          <Modal
            isOpen={showRejectModal}
            onClose={() => {
              setShowRejectModal(false);
              reset({ reason: '' });
              setSelectedBook(null);
            }}
            title="Reject Book"
            size="md"
          >
            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-charcoal mb-3 sm:mb-4">
                Provide feedback to the seller for <span className="font-semibold">{selectedBook?.title}</span>:
              </p>
              <p className="text-xs sm:text-sm text-charcoal/60 mb-3 sm:mb-4">
                This message will be visible to the seller in their inventory. Please provide constructive feedback to help them improve.
              </p>
              <form onSubmit={handleSubmit(handleRejectConfirm)}>
                <Input.Textarea
                  {...register('reason')}
                  rows={4}
                  placeholder="e.g., 'Please provide a higher quality cover image and fix the ISBN format.'"
                  error={errors.reason?.message}
                  className="text-sm"
                />
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    type="button"
                    onClick={() => {
                      setShowRejectModal(false);
                      reset({ reason: '' });
                      setSelectedBook(null);
                    }}
                    disabled={processing}
                    className="order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="error"
                    size="lg"
                    fullWidth
                    type="submit"
                    disabled={processing}
                    loading={processing}
                    className="order-1 sm:order-2"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        )}

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

export default Books;
