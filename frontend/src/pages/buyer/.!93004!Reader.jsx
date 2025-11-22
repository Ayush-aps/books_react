/**
 * Reader Page - Premium Design
 * Enhanced eBook reader interface with premium controls
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '../../utils/animations';
import api from '../../services/api';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const Reader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState('cream');
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    fetchBookContent();
  }, [bookId]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds of inactivity
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls]);

  const fetchBookContent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/library/book/₹{bookId}`);
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
    setFontSize(prev => Math.min(prev + 2, 28));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 14));
  };

  const cycleTheme = () => {
    setTheme(prev => {
      if (prev === 'cream') return 'dark';
      if (prev === 'dark') return 'sepia';
      return 'cream';
    });
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-charcoal text-cream';
      case 'sepia':
        return 'bg-[#f4ecd8] text-[#5c4a3a]';
      default:
        return 'bg-cream text-charcoal';
    }
  };

  const progressPercentage = book?.totalPages 
    ? Math.round((currentPage / book.totalPages) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <LoadingSpinner size="lg" message="Loading book..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream p-4">
        <ErrorMessage message={error} onRetry={fetchBookContent} />
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ₹{getThemeClasses()}`}
      onMouseMove={() => setShowControls(true)}
      onClick={() => setShowControls(true)}
    >
      {/* Top Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-charcoal/90 border-b border-white/10"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Back Button */}
                <Button
                  variant="ghost"
                  onClick={() => navigate('/buyer/library')}
                  className="text-cream hover:text-white"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Library
                </Button>

                {/* Center: Book Info */}
                <div className="flex-1 text-center hidden md:block">
                  <h1 className="heading-4 text-cream truncate">
                    {book?.book?.title || 'Unknown Title'}
                  </h1>
                  <p className="body-sm text-taupe">
                    {book?.book?.author || 'Unknown Author'}
                  </p>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-2">
                  {/* Font Size */}
                  <div className="hidden sm:flex items-center gap-2 border border-white/20 rounded-lg px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={decreaseFontSize}
                      className="text-cream hover:text-white p-1"
                      title="Decrease font"
                    >
                      <span className="text-sm">A−</span>
                    </Button>
                    <span className="body-sm text-taupe min-w-[3rem] text-center">
                      {fontSize}px
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={increaseFontSize}
                      className="text-cream hover:text-white p-1"
                      title="Increase font"
                    >
                      <span className="text-lg">A+</span>
                    </Button>
                  </div>

                  {/* Theme Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cycleTheme}
                    className="text-cream hover:text-white"
                    title="Change theme"
                  >
                    {theme === 'cream' && '☀️'}
