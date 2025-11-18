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

  const getStatusBadgeColor = (status) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading books..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
          <p className="text-gray-600 mt-2">Review and moderate books in the system</p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { value: 'pending', label: 'Pending Review', count: books.filter(b => b.approvalStatus === 'pending').length },
              { value: 'approved', label: 'Approved', count: books.filter(b => b.approvalStatus === 'approved').length },
              { value: 'rejected', label: 'Rejected', count: books.filter(b => b.approvalStatus === 'rejected').length },
              { value: 'all', label: 'All Books', count: books.length }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  statusFilter === tab.value
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                  statusFilter === tab.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {statusFilter === 'all' ? 'No books found' : `No ${statusFilter} books`}
              </h3>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map(book => (
              <div key={book._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Book Cover */}
                <div className="aspect-[3/4] bg-gray-200 relative">
                  {book.coverImage ? (
                    <img 
                      src={book.coverImage} 
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(book.approvalStatus)}`}>
                      {book.approvalStatus ? book.approvalStatus.charAt(0).toUpperCase() + book.approvalStatus.slice(1) : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{book.title || 'Untitled'}</h3>
                  <p className="text-sm text-gray-600 mb-2">by {book.author || 'Unknown'}</p>
                  
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">{book.genre || 'N/A'}</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">{book.condition || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-gray-900">₹{book.price ? book.price.toFixed(2) : '0.00'}</p>
                      <p className="text-xs text-gray-500">Stock: {book.stock || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Seller</p>
                      <p className="text-sm font-medium text-gray-900">{book.sellerId?.name || 'N/A'}</p>
                    </div>
                  </div>

                  {book.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{book.description}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {(!book.approvalStatus || book.approvalStatus === 'pending') && (
                      <>
                        <button
                          onClick={() => handleApprove(book._id)}
                          disabled={processing}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectClick(book)}
                          disabled={processing}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <Link
                      to={`/admin/books/${book._id}`}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 text-center transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              <p className="text-gray-700 mb-4">
                Provide a reason for rejecting <span className="font-semibold">{selectedBook?.title}</span>:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter reason for rejection..."
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedBook(null);
                  }}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={processing || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
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
