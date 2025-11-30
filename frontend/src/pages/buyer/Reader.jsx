/**
 * Reader Page - ePub Reader with Annotations
 * Enhanced eBook reader interface with epubjs and annotation support
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ePub from 'epubjs';
import { fadeIn } from '../../utils/animations';
import api from '../../services/api';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const Reader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState('cream');
  const [showControls, setShowControls] = useState(true);
  
  // ePub specific states
  const [bookLoaded, setBookLoaded] = useState(false);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const viewerRef = useRef(null);
  const locationsRef = useRef(null);
  
  // Annotation states
  const [annotations, setAnnotations] = useState([]);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFD700');

  const colors = [
    { name: 'Gold', value: '#FFD700' },
    { name: 'Pink', value: '#FFB6C1' },
    { name: 'Green', value: '#98FB98' },
    { name: 'Blue', value: '#87CEEB' },
    { name: 'Purple', value: '#DDA0DD' }
  ];

  useEffect(() => {
    fetchBookContent();
  }, [bookId]);

  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls]);

  useEffect(() => {
    if (renditionRef.current && annotations.length > 0) {
      applyAnnotations();
    }
  }, [annotations]);

  const fetchBookContent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/library/book/${bookId}`);
      const data = response.data.data;
      
      console.log('📚 Book data loaded:', data);
      console.log('📕 Book object:', data.book);
      console.log('📗 ePub file from book:', data.book?.epubFile);
      console.log('📘 ePub file from data:', data.epubFile);
      console.log('📝 Annotations count:', data.annotations?.length || 0);
      console.log('📍 Saved CFI:', data.cfi);
      console.log('📄 Saved current page from DB:', data.currentPage);
      
      setBookData(data);
      // Don't set currentPage here - let loadEpub handle it based on locations
      setAnnotations(data.annotations || []);
      
      // Load ePub if available
      const epubUrl = data.book?.epubFile || data.epubFile;
      console.log('📖 Final ePub URL:', epubUrl);
      
      if (epubUrl) {
        loadEpub(epubUrl, data.cfi);
      } else {
        console.warn('⚠️ No ePub file found for this book');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching book:', err);
      setError(err.response?.data?.message || 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const loadEpub = async (url, savedCfi = null) => {
    try {
      console.log('📖 Loading ePub from:', url);
      console.log('📍 Saved CFI to resume:', savedCfi);
      
      if (!viewerRef.current) {
        console.error('Viewer container not found');
        return;
      }

      // Clean up existing book
      if (renditionRef.current) {
        renditionRef.current.destroy();
      }

      const book = ePub(url);
      bookRef.current = book;

      const rendition = book.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        spread: 'none'
      });
      renditionRef.current = rendition;

      // Get total pages first
      await book.ready;
      const locations = await book.locations.generate(1024);
      locationsRef.current = locations;
      setTotalPages(locations.length);
      console.log('📄 Total locations generated:', locations.length);

      // Display at saved CFI or start
      const displayed = await rendition.display(savedCfi || undefined);
      console.log('📖 Book displayed, location:', displayed);
      
      // Handle page navigation - must be set AFTER display
      rendition.on('relocated', (location) => {
        console.log('🔄 Relocated event fired');
        console.log('   Start CFI:', location.start.cfi);
        console.log('   Current location index:', location.start.location);
        
        if (location.start && typeof location.start.location === 'number') {
          // Use the location index directly from the event
          const page = location.start.location + 1;
          setCurrentPage(page);
          console.log('✅ Page updated to:', page, 'of', locations.length);
          
          const progress = Math.min(Math.max(Math.round((page / locations.length) * 100), 0), 100);
          console.log('📊 Calculated progress:', progress + '%');
          saveProgress(location.start.cfi, page, locations.length);
        } else if (location.start && location.start.cfi) {
          // Fallback: try to get location from CFI
          try {
            const locationIndex = locations.locationFromCfi(location.start.cfi);
            console.log('🔍 locationFromCfi returned:', locationIndex);
            
            if (typeof locationIndex === 'number' && locationIndex >= 0) {
              const page = locationIndex + 1;
              setCurrentPage(page);
              console.log('✅ Page updated to:', page, 'of', locations.length);
              
              const progress = Math.min(Math.max(Math.round((page / locations.length) * 100), 0), 100);
              console.log('📊 Calculated progress:', progress + '%');
              saveProgress(location.start.cfi, page, locations.length);
            } else {
              console.warn('⚠️ Invalid location index:', locationIndex);
            }
          } catch (err) {
            console.error('❌ Error getting location from CFI:', err);
          }
        }
      });
      
      // Set initial page based on displayed location
      if (displayed && displayed.start) {
        if (typeof displayed.start.location === 'number') {
          const page = displayed.start.location + 1;
          setCurrentPage(page);
          console.log('📍 Initial page set to:', page);
        } else {
          setCurrentPage(1);
          console.log('📍 Starting at page 1');
        }
      } else {
        setCurrentPage(1);
        console.log('📍 Default to page 1');
      }

      // Handle text selection for annotations
      rendition.on('selected', handleTextSelection);

      // Apply theme
      applyThemeToEpub(rendition, theme);
      
      // Apply annotations
      if (annotations.length > 0) {
        setTimeout(() => applyAnnotations(), 500);
      }

      setBookLoaded(true);
      console.log('✅ ePub loaded successfully');
    } catch (err) {
      console.error('Error loading ePub:', err);
      setError('Failed to load ePub file');
    }
  };

  const handleTextSelection = (cfiRange, contents) => {
    if (!cfiRange || !contents) return;

    try {
      const range = contents.range(cfiRange);
      const selectedText = range.toString().trim();
      
      if (selectedText && selectedText.length > 0) {
        console.log('📝 Text selected:', selectedText);
        setSelectedText({ text: selectedText, cfiRange: cfiRange });
        setNoteText('');
        setSelectedColor('#FFD700');
        setCurrentAnnotation(null);
        setShowNoteDialog(true);
      }
    } catch (err) {
      console.error('Error handling text selection:', err);
    }
  };

  const applyAnnotations = () => {
    if (!renditionRef.current) return;

    try {
      // Clear existing annotations
      renditionRef.current.annotations.remove('highlight');

      // Apply each annotation
      annotations.forEach((annotation) => {
        renditionRef.current.annotations.highlight(
          annotation.cfi,
          {},
          (e) => {
            // Click handler for annotations
            console.log('Clicked annotation:', annotation);
            setCurrentAnnotation(annotation);
            setSelectedText({ text: annotation.text, cfiRange: annotation.cfi });
            setNoteText(annotation.note || '');
            setSelectedColor(annotation.color || '#FFD700');
            setShowNoteDialog(true);
          },
          'highlight',
          {
            fill: annotation.color,
            'fill-opacity': '0.3',
            'mix-blend-mode': 'multiply'
          }
        );
      });

      console.log('✨ Applied', annotations.length, 'annotations');
    } catch (err) {
      console.error('Error applying annotations:', err);
    }
  };

  const saveAnnotation = async () => {
    if (!selectedText) return;

    try {
      const response = await api.post('/library/annotations', {
        bookId: bookId,
        cfi: selectedText.cfiRange,
        text: selectedText.text,
        note: noteText,
        color: selectedColor
      });

      setAnnotations(response.data.data.annotations);
      setShowNoteDialog(false);
      setCurrentAnnotation(null);
      
      // Reapply annotations after a short delay
      setTimeout(() => applyAnnotations(), 100);
    } catch (err) {
      console.error('Failed to save annotation:', err);
      alert('Failed to save annotation. Please try again.');
    }
  };

  const updateAnnotation = async () => {
    if (!currentAnnotation || !selectedText) return;

    try {
      const response = await api.post('/library/annotations', {
        bookId: bookId,
        cfi: currentAnnotation.cfi,
        text: selectedText.text,
        note: noteText,
        color: selectedColor
      });

      setAnnotations(response.data.data.annotations);
      setShowNoteDialog(false);
      setCurrentAnnotation(null);
      
      // Reapply annotations after a short delay
      setTimeout(() => applyAnnotations(), 100);
    } catch (err) {
      console.error('Failed to update annotation:', err);
      alert('Failed to update annotation. Please try again.');
    }
  };

  const deleteAnnotation = async () => {
    if (!currentAnnotation) return;

    try {
      await api.delete(`/library/annotations/${bookId}/${currentAnnotation._id}`);
      
      setAnnotations(prev => prev.filter(ann => ann._id !== currentAnnotation._id));
      setShowNoteDialog(false);
      setCurrentAnnotation(null);
      
      // Reapply annotations after a short delay
      setTimeout(() => applyAnnotations(), 100);
    } catch (err) {
      console.error('Failed to delete annotation:', err);
      alert('Failed to delete annotation. Please try again.');
    }
  };

  const saveProgress = async (cfi, page, total) => {
    try {
      const progress = Math.min(Math.max(Math.round((page / total) * 100), 0), 100);
      console.log('📍 Saving progress:', { page, total, progress, cfi });
      
      await api.put('/library/update-progress', {
        bookId: bookId,
        currentPage: page,
        progress: progress,
        cfi: cfi
      });
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  };

  const applyThemeToEpub = (rendition, themeName) => {
    const themes = {
      cream: { body: { background: '#f5f5dc', color: '#2c2c2c' } },
      dark: { body: { background: '#1a1a1a', color: '#f5f5dc' } },
      sepia: { body: { background: '#f4ecd8', color: '#5c4a3a' } }
    };

    rendition.themes.default(themes[themeName]);
    rendition.themes.fontSize(`${fontSize}px`);
  };

  const handlePreviousPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const handleNextPage = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 28);
    setFontSize(newSize);
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${newSize}px`);
    }
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 14);
    setFontSize(newSize);
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${newSize}px`);
    }
  };

  const cycleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'cream' ? 'dark' : prev === 'dark' ? 'sepia' : 'cream';
      if (renditionRef.current) {
        applyThemeToEpub(renditionRef.current, newTheme);
      }
      return newTheme;
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

  const progressPercentage = totalPages && totalPages > 0
    ? Math.min(Math.max(Math.round((currentPage / totalPages) * 100), 0), 100)
    : (bookData?.progress !== undefined ? Math.min(Math.max(bookData.progress, 0), 100) : 0);

  // Debug logging for progress
  useEffect(() => {
    if (totalPages > 0) {
      console.log('📊 Progress:', {
        currentPage,
        totalPages,
        progressPercentage,
        calculation: `${currentPage} / ${totalPages} * 100 = ${(currentPage / totalPages) * 100}%`
      });
    }
  }, [currentPage, totalPages, progressPercentage]);

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

  // Extract book and epubFile correctly from bookData structure
  // bookData = { book: {...}, currentPage, progress, cfi, annotations }
  const book = bookData?.book;
  const epubUrl = book?.epubFile;

  console.log('🔍 Render check - bookData:', bookData);
  console.log('🔍 Render check - book:', book);
  console.log('🔍 Render check - epubUrl:', epubUrl);
  console.log('🔍 Render check - bookLoaded:', bookLoaded);

  // Fallback reader for books without ePub
  if (!epubUrl) {
    return (
      <div 
        className={`min-h-screen transition-colors duration-300 ${getThemeClasses()}`}
        onMouseMove={() => setShowControls(true)}
      >
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-charcoal/90 border-b border-white/10"
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
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

                  <div className="flex items-center gap-3">
                    {/* Font Size Controls */}
                    <div className="flex items-center gap-2 border border-white/20 rounded-lg px-3 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFontSize(Math.max(fontSize - 2, 14))}
                        className="text-cream hover:text-brown p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </Button>
                      <span className="text-sm text-taupe min-w-[3rem] text-center">{fontSize}px</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFontSize(Math.min(fontSize + 2, 28))}
                        className="text-cream hover:text-brown p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </Button>
                    </div>

                    {/* Theme Selector */}
                    <Button
                      variant="outline"
                      onClick={cycleTheme}
                      className="border-white/20 text-cream hover:bg-white/10 px-3 py-2"
                    >
                      {theme === 'cream' && '🌙'}
                      {theme === 'dark' && '📜'}
                      {theme === 'sepia' && '☀️'}
                    </Button>

                    {/* Progress Indicator */}
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
                      <span className="body-sm text-taupe">{progressPercentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="max-w-4xl mx-auto px-6 sm:px-8 md:px-12 py-16 md:py-24"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div
            className="prose prose-lg max-w-none leading-relaxed"
            style={{ 
              fontSize: `${fontSize}px`,
              lineHeight: '1.8'
            }}
          >
            <motion.div variants={fadeIn}>
              <h2 className="font-serif text-3xl mb-8">Chapter {Math.ceil(currentPage / 10)}</h2>
              
              <p className="mb-6 first-letter:text-6xl first-letter:font-serif first-letter:mr-2 first-letter:float-left">
                This is the reading experience for "{book?.title}" by {book?.author}. In a production environment with an ePub file uploaded, 
                this would display the actual book content with full interactivity.
              </p>
              
              <p className="mb-6">
                The book content would be rendered here with proper formatting, images, and pagination. 
                The reading experience has been carefully designed to be comfortable and distraction-free.
              </p>
              
              <p className="mb-6">
                <strong>About this book:</strong> {book?.description}
              </p>
              
              <p className="mb-6">
                Features available in this premium reader:
              </p>
              
              <ul className="mb-6 space-y-2">
                <li>Adjustable font size (14px - 28px) for optimal readability</li>
                <li>Three reading themes: Light (Cream), Dark, and Sepia</li>
                <li>Auto-hiding controls for immersive reading</li>
                <li>Reading progress tracking and sync</li>
                <li>Smooth page navigation with keyboard support</li>
                <li>Progress percentage and page indicators</li>
              </ul>
              
              <p className="mb-6">
                The interface disappears when you're focused on reading and reappears when you move
                your mouse or tap the screen, providing an uninterrupted reading experience.
              </p>
              
              <p className="mb-6">
                Advanced features like annotations, text highlighting, bookmarks, and dictionary lookup
                are available when an ePub file is uploaded for this book.
              </p>
              
              <div className="bg-brown/10 p-6 rounded-lg mt-8">
                <p className="text-center text-taupe font-semibold">
                  📚 To enable the full interactive ePub reader with annotations, please upload an ePub file for this book.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Navigation for Fallback Reader */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-charcoal/90 border-t border-white/10"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newPage = Math.max(currentPage - 1, 1);
                      setCurrentPage(newPage);
                      const progress = Math.round((newPage / 100) * 100);
                      api.put('/library/update-progress', {
                        bookId: bookId,
                        currentPage: newPage,
                        progress: progress
                      }).catch(err => console.error('Failed to save progress:', err));
                    }}
                    disabled={currentPage === 1}
                    className="border-white/20 text-cream hover:bg-white/10 disabled:opacity-30"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  <div className="flex-1">
                    <div className="flex items-center justify-between body-sm text-taupe mb-2">
                      <span>Page {currentPage}</span>
                      <span>of 100</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={currentPage}
                      onChange={(e) => {
                        const newPage = parseInt(e.target.value);
                        setCurrentPage(newPage);
                        const progress = Math.round((newPage / 100) * 100);
                        api.put('/library/update-progress', {
                          bookId: bookId,
                          currentPage: newPage,
                          progress: progress
                        }).catch(err => console.error('Failed to save progress:', err));
                      }}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, var(--color-brown) 0%, var(--color-brown) ${progressPercentage}%, rgba(255,255,255,0.1) ${progressPercentage}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const newPage = Math.min(currentPage + 1, 100);
                      setCurrentPage(newPage);
                      const progress = Math.round((newPage / 100) * 100);
                      api.put('/library/update-progress', {
                        bookId: bookId,
                        currentPage: newPage,
                        progress: progress
                      }).catch(err => console.error('Failed to save progress:', err));
                    }}
                    disabled={currentPage >= 100}
                    className="border-white/20 text-cream hover:bg-white/10 disabled:opacity-30"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${getThemeClasses()}`}
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
                    {book?.title || 'Unknown Title'}
                  </h1>
                  <p className="body-sm text-taupe">
                    {book?.author || 'Unknown Author'}
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
                    {theme === 'dark' && '🌙'}
                    {theme === 'sepia' && '📜'}
                  </Button>

                  {/* Annotations Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnnotations(!showAnnotations)}
                    className="text-cream hover:text-white relative"
                    title="Annotations"
                  >
                    📝
                    {annotations.length > 0 && (
                      <Badge variant="success" size="sm" className="absolute -top-1 -right-1 px-1 min-w-[20px] h-5">
                        {annotations.length}
                      </Badge>
                    )}
                  </Button>

                  {/* Progress Badge */}
                  <Badge variant="success" size="sm" className="hidden md:inline-flex">
                    {progressPercentage}%
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ePub Viewer */}
      <div
        ref={viewerRef}
        className="epub-viewer"
        style={{
          height: 'calc(100vh - 80px)',
          paddingTop: '80px',
          paddingBottom: '80px',
          overflow: 'hidden'
        }}
      />

      {/* Bottom Navigation */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-charcoal/90 border-t border-white/10"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center gap-4">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="border-white/20 text-cream hover:bg-white/10 disabled:opacity-30"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                {/* Progress Slider */}
                <div className="flex-1">
                  <div className="flex items-center justify-between body-sm text-taupe mb-2">
                    <span>Page {currentPage}</span>
                    <span>{totalPages ? `of ${totalPages}` : ''}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={totalPages || 100}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (renditionRef.current && locationsRef.current && locationsRef.current.length > 0) {
                        try {
                          const cfi = locationsRef.current.cfiFromLocation(page - 1);
                          if (cfi) {
                            console.log('🎯 Slider: Jumping to page', page, 'CFI:', cfi);
                            renditionRef.current.display(cfi);
                          }
                        } catch (err) {
                          console.error('Slider navigation error:', err);
                        }
                      }
                    }}
                    onInput={(e) => {
                      const page = parseInt(e.target.value);
                      if (renditionRef.current && locationsRef.current && locationsRef.current.length > 0) {
                        try {
                          const cfi = locationsRef.current.cfiFromLocation(page - 1);
                          if (cfi) {
                            renditionRef.current.display(cfi);
                          }
                        } catch (err) {
                          console.error('Slider navigation error:', err);
                        }
                      }
                    }}
                    className="w-full h-2 rounded-lg cursor-grab active:cursor-grabbing"
                    style={{
                      background: `linear-gradient(to right, #8B4513 0%, #8B4513 ${progressPercentage}%, rgba(255,255,255,0.1) ${progressPercentage}%, rgba(255,255,255,0.1) 100%)`,
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      outline: 'none',
                      pointerEvents: 'auto',
                      touchAction: 'none'
                    }}
                  />
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  className="border-white/20 text-cream hover:bg-white/10"
                >
                  <span className="hidden sm:inline">Next</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Annotations Panel */}
      <AnimatePresence>
        {showAnnotations && (
          <motion.div
            className="fixed top-0 right-0 bottom-0 w-80 bg-charcoal/95 backdrop-blur-md border-l border-white/10 z-40 overflow-y-auto"
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-cream">Annotations</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnnotations(false)}
                  className="text-cream hover:text-white"
                >
                  ✕
                </Button>
              </div>

              {annotations.length === 0 ? (
                <p className="text-taupe text-center py-8">
                  No annotations yet. Select text to create one!
                </p>
              ) : (
                <div className="space-y-4">
                  {annotations.map((annotation, index) => (
                    <div
                      key={annotation._id || index}
                      className="p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => {
                        setCurrentAnnotation(annotation);
                        setSelectedText({ text: annotation.text, cfiRange: annotation.cfi });
                        setNoteText(annotation.note || '');
                        setSelectedColor(annotation.color || '#FFD700');
                        setShowNoteDialog(true);
                      }}
                    >
                      <div
                        className="w-full h-1 rounded mb-2"
                        style={{ backgroundColor: annotation.color }}
                      />
                      <p className="text-cream text-sm mb-2 line-clamp-2">{annotation.text}</p>
                      {annotation.note && (
                        <p className="text-taupe text-xs italic">{annotation.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Annotation Dialog */}
      <AnimatePresence>
        {showNoteDialog && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNoteDialog(false)}
          >
            <motion.div
              className="bg-charcoal rounded-lg p-6 max-w-md w-full"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-cream mb-4">
                {currentAnnotation ? 'Edit Annotation' : 'Add Annotation'}
              </h3>

              <div className="mb-4">
                <p className="text-taupe text-sm mb-2">Selected text:</p>
                <p className="text-cream bg-white/5 p-3 rounded text-sm max-h-24 overflow-y-auto">
                  {selectedText?.text}
                </p>
              </div>

              <div className="mb-4">
                <label className="text-taupe text-sm mb-2 block">Your note:</label>
                <textarea
                  className="w-full bg-white/5 text-cream p-3 rounded border border-white/10 focus:border-brown focus:outline-none"
                  rows="4"
                  placeholder="Add your thoughts..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label className="text-taupe text-sm mb-2 block">Highlight color:</label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      className={`w-10 h-10 rounded transition-all ${
                        selectedColor === color.value
                          ? 'border-2 border-gray-800 ring-2 ring-gray-400 scale-110'
                          : 'border-2 border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => currentAnnotation ? updateAnnotation() : saveAnnotation()}
                  className="flex-1"
                >
                  {currentAnnotation ? 'Update' : 'Save'}
                </Button>
                {currentAnnotation && (
                  <Button
                    variant="outline"
                    onClick={deleteAnnotation}
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    Delete
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowNoteDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reader;
