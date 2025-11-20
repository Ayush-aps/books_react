/**
 * Admin Books Page (Content Moderation)
 * Moderate and manage all books in the system
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await adminService.getBooks();
      setBooks(response.data?.books || []);
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
      setBooks(books.map(book => 
        book._id === bookId ? { ...book, approvalStatus: 'approved' } : book
      ));
      setSuccessMessage('Book approved successfully');
      setShowSuccessToast(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve book');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = (book) => {
    setSelectedBook(book);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedBook || !rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await adminService.rejectBook(selectedBook._id, rejectReason);
      setBooks(books.map(book => 
        book._id === selectedBook._id ? { ...book, approvalStatus: 'rejected' } : book
      ));
      setSuccessMessage('Book rejected');
      setShowSuccessToast(true);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedBook(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject book');
    } finally {
      setProcessing(false);
    }
  };

  const filteredBooks = statusFilter === 'all' 
    ? books 
    : books.filter(book => (book.approvalStatus || 'pending') === statusFilter);

  const getStatusVariant = (status) => {
    const variants = {
      approved: 'success',
      pending: 'warning',
      rejected: 'error'
    };
    return variants[status] || 'default';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading books..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mb-12"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="heading-1 text-charcoal mb-2">Content Moderation</h1>
          <p className="body text-charcoal/70">Review and moderate books in the system</p>
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

        {/* Filter Tabs */}
        <motion.div 
          className="mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <Card.Body className="p-0">
              <nav className="flex space-x-1 overflow-x-auto p-2">
                {[
                  { value: 'pending', label: 'Pending Review', count: books.filter(b => b.approvalStatus === 'pending').length },
                  { value: 'approved', label: 'Approved', count: books.filter(b => b.approvalStatus === 'approved').length },
                  { value: 'rejected', label: 'Rejected', count: books.filter(b => b.approvalStatus === 'rejected').length },
                  { value: 'all', label: 'All Books', count: books.length }
                ].map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-6 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      statusFilter === tab.value
                        ? 'bg-brown text-white shadow-sm'
                        : 'text-charcoal/70 hover:bg-taupe/10'
                    }`}
                  >
                    {tab.label}
                    <Badge 
                      variant={statusFilter === tab.value ? 'light' : 'default'} 
                      size="sm" 
                      className="ml-2"
                    >
                      {tab.count}
                    </Badge>
                  </button>
                ))}
              </nav>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <Card.Body className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-taupe/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="heading-4 text-charcoal mb-3">
                    {statusFilter === 'all' ? 'No books found' : `No ${statusFilter} books`}
                  </h3>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredBooks.map(book => (
              <motion.div key={book._id} variants={staggerItem}>
                <Card hoverable className="h-full flex flex-col">
                  {/* Book Cover */}
                  <div className="aspect-[3/4] bg-taupe/10 relative overflow-hidden">
                    {book.coverImage ? (
                      <img 
                        src={book.coverImage} 
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge variant={getStatusVariant(book.approvalStatus)}>
                        {book.approvalStatus ? book.approvalStatus.charAt(0).toUpperCase() + book.approvalStatus.slice(1) : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  {/* Book Info */}
                  <Card.Body className="flex-1 flex flex-col">
                    <h3 className="heading-5 text-charcoal line-clamp-2 mb-2">{book.title || 'Untitled'}</h3>
                    <p className="body-sm text-charcoal/60 mb-3">by {book.author || 'Unknown'}</p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="default" size="sm">{book.genre || 'N/A'}</Badge>
                      <Badge variant="default" size="sm">{book.condition || 'N/A'}</Badge>
                    </div>

                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-charcoal/10">
                      <div>
                        <p className="heading-5 text-brown">${book.price ? book.price.toFixed(2) : '0.00'}</p>
                        <p className="body-sm text-charcoal/60">Stock: {book.stock || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="body-sm text-charcoal/60">Seller</p>
                        <p className="body-sm font-medium text-charcoal">{book.sellerId?.name || 'N/A'}</p>
                      </div>
                    </div>

                    {book.description && (
                      <p className="body-sm text-charcoal/70 line-clamp-2 mb-4">{book.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      {(!book.approvalStatus || book.approvalStatus === 'pending') && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            fullWidth
                            onClick={() => handleApprove(book._id)}
                            disabled={processing}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="error"
                            size="sm"
                            fullWidth
                            onClick={() => handleRejectClick(book)}
                            disabled={processing}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        as={Link}
                        to={`/admin/books/${book._id}`}
                        variant="outline"
                        size="sm"
                        fullWidth={book.approvalStatus !== 'pending'}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <Modal
            isOpen={showRejectModal}
            onClose={() => {
              setShowRejectModal(false);
              setRejectReason('');
              setSelectedBook(null);
            }}
            title="Reject Book"
            size="md"
          >
            <div className="p-6">
              <p className="body text-charcoal mb-4">
                Provide a reason for rejecting <span className="font-semibold">{selectedBook?.title}</span>:
              </p>
              <Input.Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Enter reason for rejection..."
              />
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedBook(null);
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  variant="error"
                  size="lg"
                  fullWidth
                  onClick={handleRejectConfirm}
                  disabled={processing || !rejectReason.trim()}
                  loading={processing}
                >
                  Confirm Rejection
                </Button>
              </div>
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
