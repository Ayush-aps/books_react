/**
 * Upload Book Page (Seller)
 * Form to add a new book to inventory
 * Supports both manual entry and Google Books API lookup
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
  const [entryMode, setEntryMode] = useState('manual'); // 'manual' or 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 'Science Fiction',
    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Poetry',
    'Horror', 'Adventure', 'Young Adult', 'Children', 'Comics', 'Other'
  ];

  const formats = ['paperback', 'hardcover', 'ebook', 'audiobook'];
  const conditions = ['new', 'used'];

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
    isbn: (value) => validateISBN(value, true), // Always required now
    publicationYear: (value) => validateYear(value, false),
    coverImage: (value) => validateURL(value, false),
    format: (value) => validateRequired(value, 'Format'),
    condition: (value) => validateRequired(value, 'Condition'),
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
    isValid,
    setValues,
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
      publisher: '',
      pageCount: '',
      language: 'English',
      coverImage: '',
      format: '',
    },
    validationSchema
  );

  // Check if query looks like an ISBN
  const isISBNFormat = (query) => {
    const cleaned = query.replace(/[-\s]/g, '');
    return /^\d{10}(\d{3})?$/.test(cleaned);
  };

  // Handle unified search (auto-detects ISBN vs title/author)
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter an ISBN, book title, or author name');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setError(null);
    setSearchResults([]);
    setSelectedBook(null);

    try {
      const query = searchQuery.trim();
      
      // Auto-detect if it's an ISBN
      if (isISBNFormat(query)) {
        // Search by ISBN - returns single result
        const response = await sellerService.lookupBookByISBN(query);
        const bookData = response.data.book;
        
        // Populate form directly for ISBN
        populateFormWithBookData(bookData);
        setSearchError(null);
        setSearchResults([]); // Clear results since we auto-filled
      } else {
        // Search by title/author - returns multiple results
        const response = await sellerService.searchBooks(query, 20);
        const books = response.data.books;
        
        if (books && books.length > 0) {
          setSearchResults(books);
          setSearchError(null);
        } else {
          setSearchError('No books found. Try a different search term.');
        }
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle book selection from search results
  const handleSelectBook = (book) => {
    setSelectedBook(book);
    populateFormWithBookData(book);
    setSearchResults([]); // Clear results after selection
  };

  // Populate form with book data from API
  const populateFormWithBookData = (bookData) => {
    const fullTitle = bookData.subtitle 
      ? `${bookData.title}: ${bookData.subtitle}` 
      : bookData.title;

    setValues({
      ...values,
      title: fullTitle || '',
      author: bookData.author || '',
      description: bookData.description || '',
      isbn: bookData.isbn || '',
      publisher: bookData.publisher || '',
      publishedDate: bookData.publishedDate || '',
      pageCount: bookData.pageCount || '',
      language: bookData.language || 'English',
      genre: bookData.genres && bookData.genres.length > 0 ? bookData.genres[0] : '',
      coverImage: bookData.coverImage || '',
    });
  };

  // Handle mode switch
  const handleModeSwitch = (mode) => {
    setEntryMode(mode);
    setSearchError(null);
    setError(null);
    setSearchResults([]);
    setSelectedBook(null);
    if (mode === 'manual') {
      setSearchQuery('');
    }
  };

  const onSubmit = async (formData) => {
    setError(null);

    try {
      // Prepare data
      const bookData = {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        isbn: formData.isbn,
        publisher: formData.publisher,
        publishedDate: formData.publishedDate,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : null,
        language: formData.language,
        genres: formData.genre,
        condition: formData.condition,
        stock: parseInt(formData.stock),
        format: formData.format,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPercentage 
          ? parseFloat(formData.price) * (1 - parseFloat(formData.discountPercentage) / 100)
          : parseFloat(formData.price),
        coverImageUrl: formData.coverImage,
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

        {/* Entry Mode Toggle */}
        <motion.div
          className="mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <Card.Body>
              <div className="space-y-4">
                <label className="body-sm font-semibold text-charcoal">Choose Entry Method</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Manual Entry Option */}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('manual')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      entryMode === 'manual'
                        ? 'border-brown bg-brown/5 shadow-md'
                        : 'border-taupe/30 hover:border-taupe'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        entryMode === 'manual' ? 'bg-brown text-white' : 'bg-taupe/20 text-charcoal'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-charcoal mb-1">Manual Entry</h3>
                        <p className="text-sm text-charcoal/60">Enter all details manually</p>
                      </div>
                    </div>
                  </button>

                  {/* Smart Search Option */}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('search')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      entryMode === 'search'
                        ? 'border-brown bg-brown/5 shadow-md'
                        : 'border-taupe/30 hover:border-taupe'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        entryMode === 'search' ? 'bg-brown text-white' : 'bg-taupe/20 text-charcoal'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-charcoal mb-1">Smart Search</h3>
                        <p className="text-sm text-charcoal/60">Search by ISBN, title, or author</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Smart Search Section (only shown in search mode) */}
        {entryMode === 'search' && (
          <motion.div
            className="mb-8"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card className="border-2 border-brown/20">
              <Card.Body>
                <div className="space-y-4">
                  <div>
                    <label className="body-sm font-semibold text-charcoal mb-2 block">
                      Search for a Book
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Enter ISBN (e.g., 9780134685991) or book title/author"
                        className="flex-1 px-4 py-3 border-2 border-taupe/30 rounded-lg focus:border-brown focus:outline-none"
                        disabled={isSearching}
                      />
                      <Button
                        type="button"
                        onClick={handleSearch}
                        loading={isSearching}
                        disabled={!searchQuery.trim() || isSearching}
                        variant="primary"
                      >
                        {isSearching ? 'Searching...' : 'Search'}
                      </Button>
                    </div>
                    <p className="text-sm text-charcoal/60 mt-2">
                      💡 Smart search auto-detects: Enter ISBN for exact match, or title/author for multiple results
                    </p>
                  </div>
                  {searchError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{searchError}</p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        )}

        {/* Search Results Grid */}
        {entryMode === 'search' && searchResults.length > 0 && (
          <motion.div
            className="mb-8"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <Card.Header>
                <h2 className="heading-3 text-charcoal">Search Results ({searchResults.length})</h2>
                <p className="text-sm text-charcoal/60 mt-1">Click on a book to select it</p>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {searchResults.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => handleSelectBook(book)}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                        selectedBook?.id === book.id
                          ? 'border-brown bg-brown/5'
                          : 'border-taupe/30 hover:border-brown/50'
                      }`}
                    >
                      <div className="flex gap-3">
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-16 h-24 object-cover rounded shadow-sm"
                            onError={(e) => {
                              e.target.src = 'https://nnpdev.wustl.edu/img/BookCovers/genericBookCover.jpg';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-24 bg-taupe/20 rounded flex items-center justify-center">
                            <svg className="w-8 h-8 text-charcoal/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-charcoal text-sm line-clamp-2 mb-1">
                            {book.title}
                          </h3>
                          <p className="text-xs text-charcoal/70 mb-1">{book.author || 'Unknown Author'}</p>
                          {book.publishedDate && (
                            <p className="text-xs text-charcoal/50">{book.publishedDate.split('-')[0]}</p>
                          )}
                          {book.isbn && (
                            <p className="text-xs text-brown/70 mt-1">ISBN: {book.isbn}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        )}

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
                    required
                    value={values.isbn}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.isbn && errors.isbn}
                    placeholder="10 or 13 digit ISBN"
                    disabled={entryMode === 'search'}
                  />

                  <Input
                    id="publisher"
                    name="publisher"
                    label="Publisher"
                    value={values.publisher}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Publisher name"
                  />

                  <Input
                    id="publishedDate"
                    name="publishedDate"
                    label="Published Date"
                    value={values.publishedDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="YYYY or YYYY-MM-DD"
                  />

                  <Input
                    type="number"
                    id="pageCount"
                    name="pageCount"
                    label="Page Count"
                    value={values.pageCount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min="1"
                    placeholder="Number of pages"
                  />

                  <Input
                    id="language"
                    name="language"
                    label="Language"
                    value={values.language}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., English"
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
                    label="Price (₹)"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input.Select
                      id="condition"
                      name="condition"
                      label="Condition"
                      required
                      value={values.condition}
                      onChange={handleChange}
                    >
                      <option value="">Select condition</option>
                      {conditions.map(cond => (
                        <option key={cond} value={cond}>
                          {cond.charAt(0).toUpperCase() + cond.slice(1)}
                        </option>
                      ))}
                    </Input.Select>

                    <Input.Select
                      id="format"
                      name="format"
                      label="Format"
                      required
                      value={values.format}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.format && errors.format}
                    >
                      <option value="">Select format</option>
                      {formats.map(fmt => (
                        <option key={fmt} value={fmt}>
                          {fmt.charAt(0).toUpperCase() + fmt.slice(1)}
                        </option>
                      ))}
                    </Input.Select>
                  </div>

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
                    helpText="Enter a direct URL to the book cover image (auto-filled if using ISBN lookup)"
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
                  <div className="space-y-2">
                    <p className="body text-charcoal">
                      <strong className="text-brown">Note:</strong> Your book will be submitted for admin approval before it appears in the marketplace.
                    </p>
                    {entryMode === 'search' && (
                      <p className="body-sm text-charcoal/70">
                        <strong>Tip:</strong> After fetching book details from Google Books, you can still edit any field before submitting.
                      </p>
                    )}
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
