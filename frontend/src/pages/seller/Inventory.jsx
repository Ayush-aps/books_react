/**
 * Seller Inventory Page
 * Manage all books with filters and search
 */

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import SuccessToast from '../../components/SuccessToast';

const Inventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalBooks: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const filters = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    genre: searchParams.get('genre') || '',
    page: parseInt(searchParams.get('page')) || 1
  };

  useEffect(() => {
    fetchInventory();
  }, [searchParams]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getInventory(filters);
      setBooks(response.data.books || []);
      setPagination(response.data.pagination || { currentPage: 1, totalPages: 1, totalBooks: 0 });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to first page
    setSearchParams(params);
  };

  const handleDeleteBook = async () => {
    if (!bookToDelete) return;

    try {
      await sellerService.deleteBook(bookToDelete);
      setSuccessMessage('Book deleted successfully!');
      setShowSuccessToast(true);
      setDeleteDialogOpen(false);
      setBookToDelete(null);
      fetchInventory(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete book');
      setDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading inventory..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Inventory</h1>
            <p className="text-gray-600 mt-2">
              {pagination.totalBooks} book{pagination.totalBooks !== 1 ? 's' : ''} in your inventory
            </p>
          </div>
          <Link
            to="/seller/upload"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Add New Book
          </Link>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchInventory} />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Title or Author..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
              <input
                type="text"
                value={filters.genre}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
                placeholder="Enter genre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Books Table */}
        {books.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No books found</h2>
            <p className="text-gray-600 mb-6">Start adding books to your inventory</p>
            <Link
              to="/seller/upload"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Upload Your First Book
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Book
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {books.map((book) => (
                      <tr key={book._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={book.coverImage || '/placeholder-book.png'}
                              alt={book.title}
                              className="h-16 w-12 object-cover rounded"
                            />
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{book.title}</div>
                              <div className="text-sm text-gray-500">{book.author}</div>
                              <div className="text-xs text-gray-500 capitalize">{book.condition}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₹{book.price.toFixed(2)}</div>
                          {book.discountPercentage > 0 && (
                            <div className="text-xs text-green-600">
                              {book.discountPercentage}% off
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${book.stock === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {book.stock}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(book.approvalStatus)}`}>
                            {book.approvalStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Link
                              to={`/seller/books/${book._id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </Link>
                            <Link
                              to={`/seller/books/${book._id}/edit`}
                              className="text-green-600 hover:text-green-900"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => {
                                setBookToDelete(book._id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => handleFilterChange('page', page.toString())}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteBook}
        title="Delete Book"
        message="Are you sure you want to delete this book? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  );
};

export default Inventory;
