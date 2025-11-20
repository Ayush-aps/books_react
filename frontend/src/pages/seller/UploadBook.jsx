/**
 * Upload Book Page (Seller)
 * Form to add a new book to inventory
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import useFormValidation from '../../hooks/useFormValidation';
import { validateRequired, validateNumber, validateURL, validateISBN, validateYear } from '../../utils/validation';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const UploadBook = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

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

  const onSubmit = async (formData) => {
    setError(null);

    try {
      // Prepare data
      const bookData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : 0,
        publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : undefined
      };

      await sellerService.uploadBook(bookData);
      navigate('/seller/inventory', { state: { success: 'Book uploaded successfully!' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload book');
    }
  };

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mb-12"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="heading-1 text-charcoal mb-2">Upload New Book</h1>
          <p className="body text-charcoal/70">Add a new book to your inventory</p>
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

        {/* Form */}
        <motion.form 
          onSubmit={handleSubmit(onSubmit)}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Basic Information */}
          <motion.div variants={staggerItem}>
            <Card>
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brown/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="heading-3 text-charcoal">Basic Information</h2>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input
                      id="title"
                      name="title"
                      label="Book Title"
                      required
                      value={values.title}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.title && errors.title}
                      placeholder="Enter book title"
                    />
                  </div>

                  <Input
                    id="author"
                    name="author"
                    label="Author"
                    required
                    value={values.author}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.author && errors.author}
                    placeholder="Author name"
                  />

                  <Input.Select
                    id="genre"
                    name="genre"
                    label="Genre"
                    required
                    value={values.genre}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.genre && errors.genre}
                  >
                    <option value="">Select genre</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </Input.Select>

                  <Input
                    id="isbn"
                    name="isbn"
                    label="ISBN"
                    value={values.isbn}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.isbn && errors.isbn}
                    placeholder="10 or 13 digit ISBN"
                  />

                  <Input
                    type="number"
                    id="publicationYear"
                    name="publicationYear"
                    label="Publication Year"
                    value={values.publicationYear}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min="1800"
                    max={new Date().getFullYear()}
                    error={touched.publicationYear && errors.publicationYear}
                    placeholder="YYYY"
                  />
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Pricing & Inventory */}
          <motion.div variants={staggerItem}>
            <Card>
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="heading-3 text-charcoal">Pricing & Inventory</h2>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    type="number"
                    id="price"
                    name="price"
                    label="Price ($)"
                    required
                    value={values.price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min="0"
                    step="0.01"
                    error={touched.price && errors.price}
                    placeholder="0.00"
                  />

                  <Input
                    type="number"
                    id="discountPercentage"
                    name="discountPercentage"
                    label="Discount (%)"
                    value={values.discountPercentage}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min="0"
                    max="100"
                    error={touched.discountPercentage && errors.discountPercentage}
                    placeholder="0"
                  />

                  <Input
                    type="number"
                    id="stock"
                    name="stock"
                    label="Stock Quantity"
                    required
                    value={values.stock}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min="0"
                    error={touched.stock && errors.stock}
                    placeholder="0"
                  />
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Book Details */}
          <motion.div variants={staggerItem}>
            <Card>
              <Card.Header>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-taupe/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="heading-3 text-charcoal">Book Details</h2>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  <Input.Select
                    id="condition"
                    name="condition"
                    label="Condition"
                    required
                    value={values.condition}
                    onChange={handleChange}
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                  </Input.Select>

                  <Input.Textarea
                    id="description"
                    name="description"
                    label="Description"
                    value={values.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Provide a detailed description of the book..."
                  />

                  <Input
                    type="url"
                    id="coverImage"
                    name="coverImage"
                    label="Cover Image URL"
                    value={values.coverImage}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.coverImage && errors.coverImage}
                    placeholder="https://example.com/cover.jpg"
                    helpText="Enter a direct URL to the book cover image"
                  />
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Note */}
          <motion.div variants={staggerItem}>
            <Card className="border-2 border-brown/20 bg-brown/5">
              <Card.Body>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-brown/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="body text-charcoal">
                      <strong className="text-brown">Note:</strong> Your book will be submitted for admin approval before it appears in the marketplace.
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Submit Buttons */}
          <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/seller/inventory')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={!isValid}
            >
              Upload Book
            </Button>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
};

export default UploadBook;
