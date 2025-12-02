/**
 * Upload Book Page (Seller)
 * Form to add a new book to inventory
 * Supports both manual entry and Google Books API lookup
 */

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

/**
 * Cover Image Preview Component
 * Displays a preview of the cover image URL with smooth loading animations
 */
const CoverImagePreview = ({ imageUrl }) => {
  const [imageStatus, setImageStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'
  const [currentUrl, setCurrentUrl] = useState(imageUrl);

  // Reset status when URL changes
  useState(() => {
    if (imageUrl !== currentUrl) {
      setImageStatus('loading');
      setCurrentUrl(imageUrl);
    }
  }, [imageUrl, currentUrl]);

  // Use useEffect to properly handle URL changes
  React.useEffect(() => {
    setImageStatus('loading');
    setCurrentUrl(imageUrl);
  }, [imageUrl]);

  const handleImageLoad = () => {
    setImageStatus('loaded');
  };

  const handleImageError = () => {
    setImageStatus('error');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mt-4"
    >
      <label className="body-sm font-semibold text-charcoal mb-2 block">
        Cover Image Preview
      </label>
      <div className="relative inline-block rounded-lg overflow-hidden border-2 border-taupe/30 bg-taupe/5">
        {/* Loading State */}
        {imageStatus === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-taupe/10 z-10"
          >
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-3 border-brown/30 border-t-brown rounded-full"
              />
              <span className="text-sm text-charcoal/60">Loading preview...</span>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {imageStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-48 h-64 flex flex-col items-center justify-center bg-red-50 p-4"
          >
            <svg className="w-12 h-12 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-red-600 font-medium text-center">Failed to load image</span>
            <span className="text-xs text-red-500 text-center mt-1">Please check the URL</span>
          </motion.div>
        )}

        {/* Image */}
        <motion.img
          key={currentUrl}
          src={currentUrl}
          alt="Book cover preview"
          onLoad={handleImageLoad}
          onError={handleImageError}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: imageStatus === 'loaded' ? 1 : 0,
            scale: imageStatus === 'loaded' ? 1 : 0.95
          }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1] // Custom easing for smooth reveal
          }}
          className={`max-w-48 max-h-64 object-contain shadow-lg ${imageStatus !== 'loaded' ? 'invisible absolute' : ''
            }`}
        />

        {/* Success Overlay (briefly shows on successful load) */}
        {imageStatus === 'loaded' && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute inset-0 bg-green/10 pointer-events-none"
          />
        )}
      </div>

      {/* Status Indicator */}
      {imageStatus === 'loaded' && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex items-center gap-2 mt-2"
        >
          <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-green font-medium">Image loaded successfully</span>
        </motion.div>
      )}
    </motion.div>
  );
};

const UploadBook = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [entryMode, setEntryMode] = useState('manual'); // 'manual' or 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [epubFile, setEpubFile] = useState(null);

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 'Science Fiction',
    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business', 'Poetry',
    'Horror', 'Adventure', 'Young Adult', 'Children', 'Comics', 'Other'
  ];

  const formats = ['paperback', 'hardcover', 'ebook', 'audiobook'];
  const conditions = ['new', 'used'];
  const LANGUAGES = ['English', 'Hindi', 'Punjabi', 'French', 'Spanish', 'German', 'Marathi', 'Telugu'];

  const [languageMode, setLanguageMode] = useState('select'); // 'select' | 'manual'

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
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
      publisher: '',
      pageCount: '',
      language: 'English',
      coverImage: '',
      format: '',
    }
  });

  const coverImageValue = watch('coverImage');

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

    // Format date for date input (YYYY-MM-DD)
    let formattedDate = '';
    if (bookData.publishedDate) {
      const dateParts = bookData.publishedDate.split('-');
      if (dateParts.length === 1) {
        // YYYY -> YYYY-01-01
        formattedDate = `${dateParts[0]}-01-01`;
      } else if (dateParts.length === 2) {
        // YYYY-MM -> YYYY-MM-01
        formattedDate = `${dateParts[0]}-${dateParts[1]}-01`;
      } else {
        formattedDate = bookData.publishedDate;
      }
    }

    reset({
      title: fullTitle || '',
      author: bookData.author || '',
      description: bookData.description || '',
      isbn: bookData.isbn || '',
      publisher: bookData.publisher || '',
      publishedDate: formattedDate,
      pageCount: bookData.pageCount || '',
      language: bookData.language || 'English',
      genre: bookData.genres && bookData.genres.length > 0 ? bookData.genres[0] : '',
      coverImage: bookData.coverImage || '',
      // Preserve other fields
      price: '',
      discountPercentage: '',
      stock: '',
      condition: 'new',
      format: ''
    });

    // Set language mode based on whether the fetched language is in our list
    const fetchedLang = bookData.language || 'English';
    if (LANGUAGES.includes(fetchedLang)) {
      setLanguageMode('select');
    } else {
      setLanguageMode('manual');
    }
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

  const onSubmit = async (data) => {
    setError(null);

    try {
      // Prepare data
      const bookData = {
        title: data.title,
        author: data.author,
        description: data.description,
        isbn: data.isbn,
        publisher: data.publisher,
        publishedDate: data.publishedDate,
        pageCount: data.pageCount ? parseInt(data.pageCount) : null,
        language: data.language,
        genres: data.genre,
        condition: data.condition,
        stock: parseInt(data.stock),
        format: data.format,
        price: parseFloat(data.price),
        discountPrice: data.discountPercentage
          ? parseFloat(data.price) * (1 - parseFloat(data.discountPercentage) / 100)
          : parseFloat(data.price),
        coverImageUrl: data.coverImage,
      };

      await sellerService.uploadBook(bookData, epubFile);
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
                    className={`p-4 rounded-lg border-2 transition-all ${entryMode === 'manual'
                      ? 'border-brown bg-brown/5 shadow-md'
                      : 'border-taupe/30 hover:border-taupe'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entryMode === 'manual' ? 'bg-brown text-white' : 'bg-taupe/20 text-charcoal'
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
                    className={`p-4 rounded-lg border-2 transition-all ${entryMode === 'search'
                      ? 'border-brown bg-brown/5 shadow-md'
                      : 'border-taupe/30 hover:border-taupe'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entryMode === 'search' ? 'bg-brown text-white' : 'bg-taupe/20 text-charcoal'
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
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${selectedBook?.id === book.id
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
                      label="Book Title"
                      required
                      {...register("title")}
                      error={errors.title?.message}
                      placeholder="Enter book title"
                    />
                  </div>

                  <Input
                    id="author"
                    label="Author"
                    required
                    {...register("author")}
                    error={errors.author?.message}
                    placeholder="Author name"
                  />

                  <Input.Select
                    id="genre"
                    label="Genre"
                    required
                    {...register("genre")}
                    error={errors.genre?.message}
                  >
                    <option value="">Select genre</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </Input.Select>

                  <Input
                    id="isbn"
                    label="ISBN"
                    required
                    {...register("isbn")}
                    error={errors.isbn?.message}
                    placeholder="10 or 13 digit ISBN"
                    helpText={entryMode === 'search' ? "Auto-filled from search. You can edit if needed." : undefined}
                  />

                  <Input
                    id="publisher"
                    label="Publisher"
                    {...register("publisher")}
                    error={errors.publisher?.message}
                    placeholder="Publisher name"
                  />

                  <Input
                    type="date"
                    id="publishedDate"
                    label="Published Date"
                    {...register("publishedDate")}
                    error={errors.publishedDate?.message}
                    placeholder="Select date"
                  />

                  <Input
                    type="number"
                    id="pageCount"
                    label="Page Count"
                    {...register("pageCount")}
                    error={errors.pageCount?.message}
                    min="1"
                    placeholder="Number of pages"
                  />

                  <div className="relative">
                    {languageMode === 'select' ? (
                      <Input.Select
                        id="language"
                        label="Language"
                        {...register("language")}
                        error={errors.language?.message}
                      >
                        {LANGUAGES.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </Input.Select>
                    ) : (
                      <Input
                        id="language"
                        label="Language"
                        {...register("language")}
                        error={errors.language?.message}
                        placeholder="e.g., English"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const newMode = languageMode === 'select' ? 'manual' : 'select';
                        setLanguageMode(newMode);
                        // Reset value when switching to default 'English' if going to select, or empty if manual?
                        // Actually, let's just keep the value if it matches, or reset if not.
                        // For simplicity, let's just switch mode. The user can select/type.
                        if (newMode === 'select') {
                          setValue('language', 'English');
                        } else {
                          setValue('language', '');
                        }
                      }}
                      className="absolute top-0 right-0 -mt-6 text-xs text-brown hover:underline focus:outline-none"
                    >
                      {languageMode === 'select' ? 'Type manually' : 'Select from list'}
                    </button>
                  </div>
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
                    label="Price (₹)"
                    required
                    {...register("price")}
                    min="0"
                    step="0.01"
                    error={errors.price?.message}
                    placeholder="0.00"
                  />

                  <Input
                    type="number"
                    id="discountPercentage"
                    label="Discount (%)"
                    {...register("discountPercentage")}
                    min="0"
                    max="100"
                    error={errors.discountPercentage?.message}
                    placeholder="0"
                  />

                  <Input
                    type="number"
                    id="stock"
                    label="Stock Quantity"
                    required
                    {...register("stock")}
                    min="0"
                    error={errors.stock?.message}
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
                      label="Condition"
                      required
                      {...register("condition")}
                      error={errors.condition?.message}
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
                      label="Format"
                      required
                      {...register("format")}
                      error={errors.format?.message}
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
                    label="Description"
                    {...register("description")}
                    error={errors.description?.message}
                    rows={5}
                    placeholder="Provide a detailed description of the book..."
                  />

                  {/* PDF File Upload */}
                  <div className="space-y-2">
                    <label className="body-sm font-semibold text-charcoal">
                      Upload PDF File
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-taupe/30 border-dashed rounded-lg cursor-pointer bg-taupe/5 hover:bg-taupe/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-4 text-charcoal/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-charcoal/70">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-charcoal/50">PDF only (MAX. 50MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 50 * 1024 * 1024) {
                                setError('File size must be less than 50MB');
                                e.target.value = null;
                                return;
                              }
                              setEpubFile(file);
                              setError(null);
                            }
                          }}
                        />
                      </label>
                    </div>
                    {epubFile && (
                      <div className="flex items-center gap-2 p-2 bg-green/10 rounded text-sm text-green">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="truncate">{epubFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setEpubFile(null)}
                          className="ml-auto text-charcoal/50 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Input
                      type="url"
                      id="coverImage"
                      label="Cover Image URL"
                      {...register("coverImage")}
                      error={errors.coverImage?.message}
                      placeholder="https://example.com/book-cover.jpg"
                      helpText="Enter a direct link to the book cover image"
                    />

                    {/* Cover Image Preview */}
                    {coverImageValue && (
                      <CoverImagePreview imageUrl={coverImageValue} />
                    )}
                  </div>


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
