import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import SuccessToast from '../../components/SuccessToast';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

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
    params.set('page', '1');
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
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete book');
      setDeleteDialogOpen(false);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <LoadingSpinner size="lg" message="Loading inventory..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="container-custom">
        {/* Header */}
        <motion.div 
          className="flex flex-wrap items-center justify-between gap-4 mb-12"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <div>
            <h1 className="heading-1 text-charcoal mb-2">My Inventory</h1>
            <p className="body text-charcoal/70">
              {pagination.totalBooks} book{pagination.totalBooks !== 1 ? 's' : ''} in your inventory
            </p>
          </div>
          <Link to="/seller/upload">
            <Button variant="primary" size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Book
            </Button>
          </Link>
        </motion.div>

        {error && (
          <motion.div 
            className="mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <ErrorMessage message={error} onRetry={fetchInventory} />
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <Card className="mb-8">
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Search"
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Title or Author..."
                />
                <Input.Select
                  label="Status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </Input.Select>
                <Input
                  label="Genre"
                  type="text"
                  value={filters.genre}
                  onChange={(e) => handleFilterChange('genre', e.target.value)}
                  placeholder="Enter genre..."
                />
              </div>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Books List */}
        {books.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card elevated className="text-center py-16">
              <svg
                className="mx-auto h-24 w-24 text-taupe/40 mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h2 className="heading-2 text-charcoal mb-3">No books found</h2>
              <p className="body text-charcoal/60 mb-6">Start adding books to your inventory</p>
              <Link to="/seller/upload">
                <Button variant="primary" size="lg">Upload Your First Book</Button>
              </Link>
            </Card>
          </motion.div>
        ) : (
          <>
            <motion.div 
              className="space-y-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {books.map((book) => (
                <motion.div key={book._id} variants={staggerItem}>
                  <Card hoverable>
                    <Card.Body>
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Book Image & Info */}
                        <div className="flex gap-4 flex-1">
                          <img
                            src={book.coverImage || '/placeholder-book.png'}
                            alt={book.title}
                            className="h-24 w-16 object-cover rounded shadow-sm flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="heading-4 text-charcoal truncate mb-1">{book.title}</h3>
                                <p className="body-sm text-charcoal/60 mb-1">by {book.author}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="default" size="sm">{book.condition}</Badge>
                                  <Badge variant={getStatusVariant(book.approvalStatus)} size="sm">
                                    {book.approvalStatus}
                                  </Badge>
                                  {book.discountPercentage > 0 && (
                                    <Badge variant="success" size="sm">
                                      {book.discountPercentage}% OFF
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Price, Stock & Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
                          {/* Price */}
                          <div className="text-center sm:text-left">
                            <p className="body-sm text-charcoal/60 mb-1">Price</p>
                            <p className="heading-4 text-brown">₹{book.price.toFixed(2)}</p>
                          </div>

                          {/* Stock */}
                          <div className="text-center sm:text-left">
                            <p className="body-sm text-charcoal/60 mb-1">Stock</p>
                            <p className={`heading-4 ${book.stock === 0 ? 'text-error' : 'text-charcoal'}`}>
                              {book.stock}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Link to={`/seller/books/${book._id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                            <Link to={`/seller/books/${book._id}/edit`}>
                              <Button variant="outline" size="sm">Edit</Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setBookToDelete(book._id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-error hover:text-error/80"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <motion.div 
                className="mt-8 flex justify-center"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
              >
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => handleFilterChange('page', page.toString())}
                />
              </motion.div>
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
