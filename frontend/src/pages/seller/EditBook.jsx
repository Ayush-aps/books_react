/**
 * Edit Book Page (Seller)
 * Form to update existing book details
 * Supports resubmission of rejected books
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookListingSchema } from '../../schemas/allFormSchemas';
import { sellerService } from '../../services/sellerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

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

  // React Hook Form setup
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm({
    resolver: zodResolver(bookListingSchema),
    defaultValues: {
      title: '',
      price: '',
      isbn: '',
      publicationYear: '',
      description: ''
    }
  });

  // Additional form state not in schema
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [stock, setStock] = useState('');
  const [condition, setCondition] = useState('new');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [coverImage, setCoverImage] = useState('');

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

      // Update form values using React Hook Form reset
      reset({
        title: book.title || '',
        price: book.price || '',
        isbn: book.isbn || '',
        publicationYear: book.publishedDate ? new Date(book.publishedDate).getFullYear() : (book.publicationYear || ''),
        description: book.description || ''
      });

      // Update additional state
      setAuthor(book.author || '');
      setGenre(Array.isArray(book.genres) ? book.genres[0] : (book.genre || ''));
      setStock(book.stock || '');
      setCondition(book.condition || 'new');
      setDiscountPercentage(book.discountPercentage || '');
      setCoverImage(book.coverImage || '');

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
      // Prepare data with additional fields
      const updateData = {
        ...formData,
        author,
        genre,
        stock: parseInt(stock),
        condition,
        discountPercentage: discountPercentage ? parseFloat(discountPercentage) : 0,
        coverImage: coverImage || undefined,
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
                  {...register('title')}
                  className={`w-full px-3 py-2 border ${errors.title
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="Enter book title"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                  Author <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="author"
                  {...register('author')}
                  className={`w-full px-3 py-2 border ${errors.author
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="Author name"
                />
                {errors.author && (
                  <p className="text-red-500 text-sm mt-1">{errors.author.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                  Genre <span className="text-red-500">*</span>
                </label>
                <select
                  id="genre"
                  {...register('genre')}
                  className={`w-full px-3 py-2 border ${errors.genre
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                >
                  <option value="">Select genre</option>
                  {genres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {errors.genre && (
                  <p className="text-red-500 text-sm mt-1">{errors.genre.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  id="isbn"
                  {...register('isbn')}
                  className={`w-full px-3 py-2 border ${errors.isbn
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="10 or 13 digit ISBN"
                />
                {errors.isbn && (
                  <p className="text-red-500 text-sm mt-1">{errors.isbn.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="publicationYear" className="block text-sm font-medium text-gray-700 mb-2">
                  Publication Year
                </label>
                <input
                  type="number"
                  id="publicationYear"
                  {...register('publicationYear')}
                  min="1800"
                  max={new Date().getFullYear()}
                  className={`w-full px-3 py-2 border ${errors.publicationYear
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="YYYY"
                />
                {errors.publicationYear && (
                  <p className="text-red-500 text-sm mt-1">{errors.publicationYear.message}</p>
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
                  {...register('price')}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border ${errors.price
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <input
                  type="number"
                  id="discountPercentage"
                  {...register('discountPercentage')}
                  min="0"
                  max="100"
                  className={`w-full px-3 py-2 border ${errors.discountPercentage
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="0"
                />
                {errors.discountPercentage && (
                  <p className="text-red-500 text-sm mt-1">{errors.discountPercentage.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="stock"
                  {...register('stock')}
                  min="0"
                  className={`w-full px-3 py-2 border ${errors.stock
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
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
              {...register('condition')}
              className={`w-full px-3 py-2 border ${errors.condition
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
                } rounded-md focus:outline-none focus:ring-2`}
            >
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
            {errors.condition && (
              <p className="text-red-500 text-sm mt-1">{errors.condition.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows="5"
              className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
              placeholder="Provide a detailed description of the book..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Cover Image URL */}
          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image URL
            </label>
            <input
              type="url"
              id="coverImage"
              {...register('coverImage')}
              className={`w-full px-3 py-2 border ${errors.coverImage
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
                } rounded-md focus:outline-none focus:ring-2`}
              placeholder="https://example.com/cover.jpg"
            />
            {errors.coverImage && (
              <p className="text-red-500 text-sm mt-1">{errors.coverImage.message}</p>
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
              className={`flex-1 py-3 px-6 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md ${bookData?.rejectionReason
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
