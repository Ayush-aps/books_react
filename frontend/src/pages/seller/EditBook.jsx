/**
 * Edit Book Page (Seller)
 * Form to update existing book details
 * Supports resubmission of rejected books
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import useFormValidation from '../../hooks/useFormValidation';
import { validateRequired, validateNumber, validateURL, validateISBN, validateYear } from '../../utils/validation';

const EditBook = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookData, setBookData] = useState(null);
  
  // Check if this is a resubmission
  const isResubmitMode = searchParams.get('resubmit') === 'true';

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 'Science Fiction',
    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Poetry',
    'Horror', 'Adventure', 'Young Adult', 'Children', 'Comics', 'Other'
  ];

  // Validation schema
  const validationSchema = {
    title: (value) => validateRequired(value, 'Book Title'),
    author: (value) => validateRequired(value, 'Author'),
    genre: (value) => validateRequired(value, 'Genre'),
    price: (value) => validateNumber(value, 0.01, undefined, 'Price'),
    discountPercentage: (value) => {
      if (!value) return { isValid: true, error: '' };
      return validateNumber(value, 0, 100, 'Discount Percentage');
    },
    stock: (value) => validateNumber(value, 0, undefined, 'Stock Quantity'),
    isbn: (value) => validateISBN(value, false),
    publicationYear: (value) => validateYear(value, false),
    coverImage: (value) => validateURL(value, false),
  };

  // Form validation hook
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    isValid
  } = useFormValidation(
    {
      title: '',
      author: '',
      genre: '',
      price: '',
      discountPercentage: '',
      stock: '',
      condition: 'new',
      description: '',
      isbn: '',
      publicationYear: '',
      coverImage: ''
    },
    validationSchema
  );

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getBook(id);
      const book = response.data?.book || response.data;
      
      // Store full book data for rejection info
      setBookData(book);

      // Update form values using setFieldValue
      setFieldValue('title', book.title || '');
      setFieldValue('author', book.author || '');
      // Handle genre - it might be an array in the database
      setFieldValue('genre', Array.isArray(book.genres) ? book.genres[0] : (book.genre || ''));
      setFieldValue('price', book.price || '');
      setFieldValue('discountPercentage', book.discountPercentage || '');
      setFieldValue('stock', book.stock || '');
      setFieldValue('condition', book.condition || 'new');
      setFieldValue('description', book.description || '');
      setFieldValue('isbn', book.isbn || '');
      setFieldValue('publicationYear', book.publishedDate ? new Date(book.publishedDate).getFullYear() : (book.publicationYear || ''));
      setFieldValue('coverImage', book.coverImage || '');

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData) => {
    setError(null);

    try {
      // Prepare data
      const updateData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : 0,
        publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : undefined,
        // Include resubmit flag if this is a rejected book being resubmitted
        resubmit: isResubmitMode || (bookData?.rejectionReason ? true : false)
      };

      const response = await sellerService.updateBook(id, updateData);
      const successMessage = response.data?.isResubmission 
        ? 'Book resubmitted successfully! It is now pending admin approval.'
        : 'Book updated successfully!';
      
      navigate('/seller/inventory', { state: { success: successMessage } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update book');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading book details..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {bookData?.rejectionReason ? 'Edit & Resubmit Book' : 'Edit Book'}
          </h1>
          <p className="text-gray-600 mt-2">
            {bookData?.rejectionReason 
              ? 'Make the required changes and resubmit for approval'
              : 'Update book information'
            }
          </p>
        </div>

        {/* Rejection Notice Banner */}
        {bookData?.rejectionReason && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  ⚠️ This book was rejected by admin
                </h3>
                <div className="bg-white p-3 rounded border border-red-200 mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Admin Feedback:</p>
                  <p className="text-gray-800">{bookData.rejectionReason}</p>
                </div>
                {bookData.rejectionDate && (
                  <p className="text-sm text-red-600">
                    Rejected on: {new Date(bookData.rejectionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  Please address the feedback above and click <strong>"Resubmit for Approval"</strong> when ready.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Book Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={values.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border ${touched.title && errors.title
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="Enter book title"
                />
                {touched.title && errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                  Author <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={values.author}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border ${touched.author && errors.author
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="Author name"
                />
                {touched.author && errors.author && (
                  <p className="text-red-500 text-sm mt-1">{errors.author}</p>
                )}
              </div>

              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                  Genre <span className="text-red-500">*</span>
                </label>
                <select
                  id="genre"
                  name="genre"
                  value={values.genre}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border ${touched.genre && errors.genre
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                >
                  <option value="">Select genre</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
                {touched.genre && errors.genre && (
                  <p className="text-red-500 text-sm mt-1">{errors.genre}</p>
                )}
              </div>

              <div>
                <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  id="isbn"
                  name="isbn"
                  value={values.isbn}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border ${touched.isbn && errors.isbn
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="10 or 13 digit ISBN"
                />
                {touched.isbn && errors.isbn && (
                  <p className="text-red-500 text-sm mt-1">{errors.isbn}</p>
                )}
              </div>

              <div>
                <label htmlFor="publicationYear" className="block text-sm font-medium text-gray-700 mb-2">
                  Publication Year
                </label>
                <input
                  type="number"
                  id="publicationYear"
                  name="publicationYear"
                  value={values.publicationYear}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min="1800"
                  max={new Date().getFullYear()}
                  className={`w-full px-3 py-2 border ${touched.publicationYear && errors.publicationYear
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="YYYY"
                />
                {touched.publicationYear && errors.publicationYear && (
                  <p className="text-red-500 text-sm mt-1">{errors.publicationYear}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={values.price}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border ${touched.price && errors.price
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="0.00"
                />
                {touched.price && errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              <div>
                <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <input
                  type="number"
                  id="discountPercentage"
                  name="discountPercentage"
                  value={values.discountPercentage}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min="0"
                  max="100"
                  className={`w-full px-3 py-2 border ${touched.discountPercentage && errors.discountPercentage
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="0"
                />
                {touched.discountPercentage && errors.discountPercentage && (
                  <p className="text-red-500 text-sm mt-1">{errors.discountPercentage}</p>
                )}
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={values.stock}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min="0"
                  className={`w-full px-3 py-2 border ${touched.stock && errors.stock
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="0"
                />
                {touched.stock && errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
                )}
              </div>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
              Condition <span className="text-red-500">*</span>
            </label>
            <select
              id="condition"
              name="condition"
              value={values.condition}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Provide a detailed description of the book..."
            />
          </div>

          {/* Cover Image URL */}
          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image URL
            </label>
            <input
              type="url"
              id="coverImage"
              name="coverImage"
              value={values.coverImage}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border ${touched.coverImage && errors.coverImage
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
                } rounded-md focus:outline-none focus:ring-2`}
              placeholder="https://example.com/cover.jpg"
            />
            {touched.coverImage && errors.coverImage && (
              <p className="text-red-500 text-sm mt-1">{errors.coverImage}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Enter a direct URL to the book cover image
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6 -mb-6 pb-6 rounded-b-lg">
            <button
              type="button"
              onClick={() => navigate('/seller/inventory')}
              disabled={isSubmitting}
              className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md ${
                bookData?.rejectionReason
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-2 border-emerald-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700 border-2 border-blue-700'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  {bookData?.rejectionReason ? 'Resubmitting...' : 'Updating...'}
                </span>
              ) : (
                bookData?.rejectionReason ? '✓ Resubmit for Approval' : 'Update Book'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBook;
