/**
 * Reader Page (Buyer)
 * eBook reader interface
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const Reader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    fetchBookContent();
  }, [bookId]);

  const fetchBookContent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/library/book/${bookId}`);
      setBook(response.data.data);
      
      // Load saved reading progress
      const progress = response.data.data.readingProgress;
      if (progress?.currentPage) {
        setCurrentPage(progress.currentPage);
      }
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (page) => {
    try {
      await api.put('/library/update-progress', {
        bookId: bookId,
        currentPage: page
      });
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || (book?.totalPages && newPage > book.totalPages)) return;
    setCurrentPage(newPage);
    saveProgress(newPage);
  };

  const handlePreviousPage = () => {
    handlePageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorMessage message={error} />
      </div>
    );
  }

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-gray-100' 
    : 'bg-white text-gray-900';

  return (
    <div className={`min-h-screen ${themeClasses}`}>
      {/* Reader Controls */}
      <div className="sticky top-0 z-10 border-b border-gray-300 dark:border-gray-700 bg-opacity-95 backdrop-blur">
        <div className={`${themeClasses} px-4 py-3`}>
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/buyer/library')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                ← Back to Library
              </button>
              <h1 className="text-lg font-semibold truncate max-w-md">{book?.book?.title}</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Font Size Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={decreaseFontSize}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Decrease font size"
                >
                  A-
                </button>
                <span className="text-sm">{fontSize}px</span>
                <button
                  onClick={increaseFontSize}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Increase font size"
                >
                  A+
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              {/* Page Info */}
              <span className="text-sm">
                Page {currentPage} {book?.totalPages && `of ${book.totalPages}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reader Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div
          className="prose prose-lg max-w-none"
          style={{ fontSize: `${fontSize}px` }}
        >
          {/* Placeholder content - In production, this would load actual book content */}
          <p className="mb-6">
            This is a placeholder for the eBook reader. In a production environment, this would display
            the actual book content for page {currentPage}.
          </p>
          <p className="mb-6">
            The book content would be fetched from your backend API and rendered here with proper
            formatting, images, and pagination.
          </p>
          <p className="mb-6">
            Features available:
          </p>
          <ul className="mb-6">
            <li>Adjustable font size for comfortable reading</li>
            <li>Dark/Light theme toggle</li>
            <li>Reading progress tracking</li>
            <li>Page navigation</li>
            <li>Bookmark support (can be added)</li>
          </ul>
          <p className="mb-6">
            To implement full eBook functionality, you would need to:
          </p>
          <ol className="mb-6">
            <li>Store book content in a suitable format (EPUB, PDF, or custom format)</li>
            <li>Parse and render the content appropriately</li>
            <li>Handle pagination based on viewport and font size</li>
            <li>Implement bookmarks and annotations</li>
            <li>Add text selection and highlighting features</li>
          </ol>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-300 dark:border-gray-700 bg-opacity-95 backdrop-blur">
        <div className={`${themeClasses} px-4 py-4`}>
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <div className="flex-1 mx-8">
              <input
                type="range"
                min="1"
                max={book?.totalPages || 100}
                value={currentPage}
                onChange={(e) => handlePageChange(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={handleNextPage}
              disabled={book?.totalPages && currentPage >= book.totalPages}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reader;
