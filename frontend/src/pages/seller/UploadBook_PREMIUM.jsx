import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sellerService } from '../../services/sellerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { bookListingSchema } from '../../schemas/allFormSchemas';
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid }
  } = useForm({
    resolver: zodResolver(bookListingSchema),
    mode: 'onTouched',
    defaultValues: {
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
    }
  });

  const onSubmit = async (data) => {
    setError(null);

    try {
      const bookData = {
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        discountPercentage: data.discountPercentage ? parseFloat(data.discountPercentage) : 0,
        publicationYear: data.publicationYear ? parseInt(data.publicationYear) : undefined
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
                    <svg className="w-5 h-5 text-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      label="Book Title"
                      id="title"
                      {...register("title")}
                      error={errors.title?.message}
                      placeholder="Enter book title"
                      required
                    />
                  </div>

                  <Input
                    label="Author"
                    id="author"
                    {...register("author")}
                    error={errors.author?.message}
                    placeholder="Author name"
                    required
                  />

                  <Input.Select
                    label="Genre"
                    id="genre"
                    {...register("genre")}
                    error={errors.genre?.message}
                    required
                  >
                    <option value="">Select genre</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </Input.Select>

                  <Input
                    label="ISBN"
                    id="isbn"
                    {...register("isbn")}
                    error={errors.isbn?.message}
                    placeholder="10 or 13 digit ISBN"
                  />

                  <Input
                    label="Publication Year"
                    type="number"
                    id="publicationYear"
                    {...register("publicationYear")}
                    error={errors.publicationYear?.message}
                    placeholder="YYYY"
                    min="1800"
                    max={new Date().getFullYear()}
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
                    <svg className="w-5 h-5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="heading-3 text-charcoal">Pricing & Inventory</h2>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="Price (₹)"
                    type="number"
                    id="price"
                    {...register("price")}
                    error={errors.price?.message}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />

                  <Input
                    label="Discount (%)"
                    type="number"
                    id="discountPercentage"
                    {...register("discountPercentage")}
                    error={errors.discountPercentage?.message}
                    placeholder="0"
                    min="0"
                    max="100"
                  />

                  <Input
                    label="Stock Quantity"
                    type="number"
                    id="stock"
                    {...register("stock")}
                    error={errors.stock?.message}
                    placeholder="0"
                    min="0"
                    required
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
                    <svg className="w-5 h-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="heading-3 text-charcoal">Book Details</h2>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  <Input.Select
                    label="Condition"
                    id="condition"
                    {...register("condition")}
                    error={errors.condition?.message}
                    required
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                  </Input.Select>

                  <Input.Textarea
                    label="Description"
                    id="description"
                    {...register("description")}
                    error={errors.description?.message}
                    rows={5}
                    placeholder="Provide a detailed description of the book..."
                  />

                  <Input
                    label="Cover Image URL"
                    type="url"
                    id="coverImage"
                    {...register("coverImage")}
                    error={errors.coverImage?.message}
                    placeholder="https://example.com/cover.jpg"
                    helpText="Enter a direct URL to the book cover image"
                  />
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Note Card */}
          <motion.div variants={staggerItem}>
            <Card className="border-2 border-brown/20 bg-brown/5">
              <Card.Body>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brown/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-brown" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="body text-charcoal/80">
                      <strong className="text-charcoal">Note:</strong> Your book will be submitted for admin approval before it appears in the marketplace.
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Submit Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            variants={staggerItem}
          >
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
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Uploading...' : 'Upload Book'}
            </Button>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
};

export default UploadBook;
