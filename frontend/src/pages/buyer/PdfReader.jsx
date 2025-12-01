import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ZoomIn,
  ZoomOut,
  X,
  RotateCw,
  ChevronUp,
  Highlighter,
  Search,
  Trash2,
  Bookmark,
  BookOpen,
  Scroll,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Worker configuration for pdf.js (Using Unpkg for reliable CDN link)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Import required CSS for text selection and annotations
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Suppress TextLayer cancellation warnings (normal during page transitions)
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('TextLayer task cancelled')) {
    return; // Suppress this specific warning
  }
  originalConsoleWarn(...args);
};

const PdfReader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // State management
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const controlsTimeoutRef = useRef(null);

  // Text selection and highlighting
  const [selectedText, setSelectedText] = useState('');
  const [selectionMenu, setSelectionMenu] = useState({ show: false, x: 0, y: 0 });
  const [highlights, setHighlights] = useState([]);

  // Page Tracking States
  const [currentPage, setCurrentPage] = useState(1); // Page currently visible (for Scroll Mode)
  const [pageNumber, setPageNumber] = useState(1); // Page currently displayed (for Page Mode)

  const [lastReadPage, setLastReadPage] = useState(1); // Persisted last read page
  const [bookmarkedPage, setBookmarkedPage] = useState(null); // Manual bookmark

  // View mode: 'scroll' or 'page'
  const [viewMode, setViewMode] = useState('scroll');
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  // Swipe detection for vertical scrolling
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  // --- PERSISTENCE: LOAD DATA FROM LOCAL STORAGE (Runs once on mount) ---
  useEffect(() => {
    if (bookId) {
      const savedHighlights = localStorage.getItem(`book_${bookId}_highlights`);
      const savedPage = localStorage.getItem(`book_${bookId}_lastPage`);
      const savedViewMode = localStorage.getItem(`book_${bookId}_viewMode`);
      const savedBookmark = localStorage.getItem(`book_${bookId}_manualBookmark`);

      if (savedHighlights) {
        setHighlights(JSON.parse(savedHighlights));
      }

      // Initialize the tracking states from local storage
      if (savedPage) {
        const pageNum = parseInt(savedPage, 10);
        setLastReadPage(pageNum);
        setCurrentPage(pageNum);
        setPageNumber(pageNum);
      }

      if (savedViewMode) {
        setViewMode(savedViewMode);
        // Set scale based on the loaded view mode
        if (savedViewMode === 'page') {
          setScale(0.8);
        } else {
          setScale(1.2);
        }
      }

      if (savedBookmark) {
        setBookmarkedPage(parseInt(savedBookmark, 10));
      }
    }
  }, [bookId]);

  // --- PERSISTENCE: SAVE VIEW MODE & HIGHLIGHTS ---
  useEffect(() => {
    if (bookId && viewMode) {
      localStorage.setItem(`book_${bookId}_viewMode`, viewMode);
    }
  }, [viewMode, bookId]);

  useEffect(() => {
    if (bookId && highlights.length >= 0) {
      localStorage.setItem(`book_${bookId}_highlights`, JSON.stringify(highlights));
    }
  }, [highlights, bookId]);

  // --- PERSISTENCE: TRACK CURRENT PAGE ON SCROLL (Only in Scroll Mode) ---
  useEffect(() => {
    const handleScroll = () => {
      if (viewMode === 'scroll' && containerRef.current && numPages) {
        const pageElements = document.querySelectorAll('.pdf-page-container');
        let current = 1;

        // Determine which page is at the top of the container viewport
        for (let i = 0; i < pageElements.length; i++) {
          const page = pageElements[i];
          const rect = page.getBoundingClientRect();
          const containerTop = containerRef.current.getBoundingClientRect().top;

          // Check if the top of the page is visible or slightly above the container top
          if (rect.top >= containerTop - 50) {
            current = i + 1;
            break;
          }
        }

        // Update current page and persist it
        if (current !== currentPage) {
          setCurrentPage(current);
          localStorage.setItem(`book_${bookId}_lastPage`, current.toString());
        }

        // Hide selection menu on scroll
        if (selectionMenu.show) {
          setSelectionMenu({ show: false, x: 0, y: 0, isHighlighted: false });
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [numPages, viewMode, currentPage, bookId, selectionMenu.show]);

  // --- LOAD PDF URL ---
  useEffect(() => {
    const loadPdfUrl = async () => {
      try {
        // Using the existing SherlockHolmes.pdf in public/books folder
        setPdfUrl('/books/SherlockHolmes.pdf');
        setLoading(false);
      } catch (err) {
        setError('Failed to load PDF');
        setLoading(false);
      }
    };

    loadPdfUrl();
  }, [bookId]);

  // --- DOCUMENT LOAD SUCCESS HANDLER ---
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);

    // Priority: Manual Bookmark > Last Read Page > 1
    const targetPage = bookmarkedPage || lastReadPage;

    if (targetPage > 1 && targetPage <= numPages) {
      // Set the page states to the persisted value
      setCurrentPage(targetPage);
      setPageNumber(targetPage);
    } else {
      // If no saved page or invalid page, ensure we start at 1
      setCurrentPage(1);
      setPageNumber(1);
    }
  };

  // --- PERSISTENCE: INITIAL SCROLL HANDLER (THE FIX) ---
  useEffect(() => {
    // This runs after numPages is set and the PDF is rendered
    if (numPages && containerRef.current) {
      const targetPage = bookmarkedPage || lastReadPage;

      // Only scroll if we are in 'scroll' mode AND the target page is not the first page.
      if (viewMode === 'scroll' && targetPage > 1 && targetPage <= numPages) {

        // Find the DOM element corresponding to the target page
        const targetElement = document.getElementById(`page_${targetPage}`);

        if (targetElement) {
          // Use a slight delay to ensure the pages have been fully measured by the browser
          setTimeout(() => {
            containerRef.current.scrollTo({
              top: targetElement.offsetTop - 70, // Offset by header height
              behavior: 'instant'
            });
          }, 300);
        }
      }
    }
  }, [numPages, viewMode, lastReadPage, bookmarkedPage]);

  // Zoom functions
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.2);
  };

  // Rotation function
  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Manual Bookmark Toggle
  const toggleBookmark = () => {
    if (bookmarkedPage === currentPage) {
      setBookmarkedPage(null);
      localStorage.removeItem(`book_${bookId}_manualBookmark`);
    } else {
      setBookmarkedPage(currentPage);
      localStorage.setItem(`book_${bookId}_manualBookmark`, currentPage.toString());
    }
  };

  // View mode toggle
  const toggleViewMode = () => {
    setViewMode(prev => {
      if (prev === 'scroll') {
        // Switching to Page Mode
        setScale(0.8);
        setPageNumber(currentPage); // Sync page number from current scroll position
        return 'page';
      } else {
        // Switching to Scroll Mode
        setScale(1.2);

        // Scroll to the current page after render
        setTimeout(() => {
          if (containerRef.current && numPages) {
            const targetElement = document.getElementById(`page_${pageNumber}`);
            if (targetElement) {
              containerRef.current.scrollTo({
                top: targetElement.offsetTop - 70,
                behavior: 'smooth'
              });
            }
          }
        }, 100);

        return 'scroll';
      }
    });
  };

  // Page navigation for page-fill view with smooth transitions
  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setIsPageTransitioning(true);
      setTimeout(() => {
        setPageNumber(prev => prev + 1);
        setCurrentPage(prev => prev + 1);
        setIsPageTransitioning(false);
      }, 150);
    }
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setIsPageTransitioning(true);
      setTimeout(() => {
        setPageNumber(prev => prev - 1);
        setCurrentPage(prev => prev - 1);
        setIsPageTransitioning(false);
      }, 150);
    }
  };

  // Swipe handlers for page mode
  const handleTouchStart = (e) => {
    if (viewMode === 'page') {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (viewMode === 'page') {
      touchEndY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    if (viewMode === 'page') {
      const swipeDistance = touchStartY.current - touchEndY.current;
      const minSwipeDistance = 50;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          // Swiped up - next page
          goToNextPage();
        } else {
          // Swiped down - previous page
          goToPrevPage();
        }
      }
    }
  };

  // Close reader
  const closeReader = () => {
    navigate(-1);
  };

  // Scroll to top
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    // If selection menu is already visible, clear selection on subsequent click
    if (!text && selectionMenu.show) {
      setSelectionMenu({ show: false, x: 0, y: 0, isHighlighted: false });
      return;
    }

    if (text.length > 0) {
      setSelectedText(text);

      // Get selection position
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Check if this text is already highlighted
      const isHighlighted = highlights.some(h => h.text === text);

      // Position menu near selection
      setSelectionMenu({
        show: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        isHighlighted
      });
    } else {
      setSelectionMenu({ show: false, x: 0, y: 0, isHighlighted: false });
    }
  };

  // Search word meaning on Google
  const searchMeaning = () => {
    if (selectedText) {
      const searchUrl = `https://www.google.com/search?q=define+${encodeURIComponent(selectedText)}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
      setSelectionMenu({ show: false, x: 0, y: 0, isHighlighted: false });
      window.getSelection().removeAllRanges();
    }
  };

  // Highlight selected text
  const highlightText = () => {
    if (selectedText) {
      const newHighlight = {
        text: selectedText,
        id: Date.now(),
        page: currentPage,
        color: 'rgba(147, 197, 253, 0.3)' // Light blue with 30% opacity
      };

      setHighlights(prev => [...prev, newHighlight]);
      setSelectionMenu({ show: false, x: 0, y: 0, isHighlighted: false });
      window.getSelection().removeAllRanges(); // Clear browser selection
    }
  };

  // Remove highlight
  const removeHighlight = (highlightId) => {
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
    setSelectionMenu({ show: false, x: 0, y: 0, isHighlighted: false });
    window.getSelection().removeAllRanges();
  };

  // Remove selected highlight
  const removeSelectedHighlight = () => {
    if (selectedText) {
      const highlight = highlights.find(h => h.text === selectedText);
      if (highlight) {
        removeHighlight(highlight.id);
      }
    }
  };

  // Listen for text selection
  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
    };
  }, [highlights, currentPage, viewMode]);

  // Auto-hide controls on mouse inactivity
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Handle mouse movement to show/hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      resetControlsTimeout();
    };

    window.addEventListener('mousemove', handleMouseMove);
    resetControlsTimeout();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setShowScrollTop(containerRef.current.scrollTop > 500);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === '0') resetZoom();

      // Arrow key navigation for page mode (vertical: up/down + horizontal: left/right)
      if (viewMode === 'page') {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goToPrevPage();
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goToNextPage();
      }

      if (e.key === 'Escape') {
        if (selectionMenu.show) {
          setSelectionMenu({ show: false, x: 0, y: 0, isHighlighted: false });
        } else {
          closeReader();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectionMenu.show, viewMode, pageNumber, numPages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Controls - Auto-hide - Responsive */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 shadow-lg transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'
          }`}
      >
        <div className="w-full px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left Section - Close Button */}
            <button
              onClick={closeReader}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all duration-200 hover:shadow-lg text-sm sm:text-base"
              title="Close (Esc)"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Close</span>
            </button>

            {/* Center Section - Page Info */}
            <div className="flex items-center gap-2 bg-gray-700/50 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg">
              <Bookmark size={14} className="sm:w-4 sm:h-4 text-blue-400" />
              <span className="text-gray-300 text-xs sm:text-sm whitespace-nowrap">
                Page {currentPage} / {numPages || '--'}
              </span>
            </div>

            {/* Right Section - Tools */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Manual Bookmark Button */}
              <button
                onClick={toggleBookmark}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${bookmarkedPage === currentPage
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white'
                  }`}
                title={bookmarkedPage === currentPage ? "Remove Bookmark" : "Bookmark this page"}
              >
                <Bookmark
                  size={16}
                  className={`sm:w-5 sm:h-5 ${bookmarkedPage === currentPage ? 'fill-current' : ''}`}
                />
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-700/50 px-1 sm:px-2 py-1.5 sm:py-2 rounded-lg">
                <button
                  onClick={zoomOut}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-600 text-white transition-all duration-200"
                  title="Zoom Out (-)"
                >
                  <ZoomOut size={16} className="sm:w-5 sm:h-5" />
                </button>

                <span className="px-1 sm:px-3 text-white text-xs sm:text-sm font-medium min-w-[40px] sm:min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>

                <button
                  onClick={zoomIn}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-600 text-white transition-all duration-200"
                  title="Zoom In (+)"
                >
                  <ZoomIn size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Rotate Button - Hidden on very small screens */}
              <button
                onClick={rotate}
                className="hidden xs:block p-1.5 sm:p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
                title="Rotate"
              >
                <RotateCw size={16} className="sm:w-5 sm:h-5" />
              </button>

              {/* View Mode Toggle */}
              <button
                onClick={toggleViewMode}
                className="p-1.5 sm:p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200"
                title={viewMode === 'scroll' ? 'Switch to Page View' : 'Switch to Scroll View'}
              >
                {viewMode === 'scroll' ? (
                  <BookOpen size={16} className="sm:w-5 sm:h-5" />
                ) : (
                  <Scroll size={16} className="sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Text Selection Menu - Quick Action Popup */}
      {selectionMenu.show && (
        <div
          className="fixed z-50 rounded-lg shadow-2xl border border-gray-600 overflow-hidden bg-gray-800"
          style={{
            left: `${selectionMenu.x}px`,
            top: `${selectionMenu.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          // Prevent menu click from clearing the selection
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex flex-row">
            {/* Action 1: Highlight / Remove Highlight */}
            <button
              onClick={selectionMenu.isHighlighted ? removeSelectedHighlight : highlightText}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-white transition-colors text-sm sm:text-base border-r border-gray-600 ${selectionMenu.isHighlighted
                ? 'bg-red-700/80 hover:bg-red-600' // Red for Remove
                : 'bg-blue-600/80 hover:bg-blue-500' // Blue for Highlight
                }`}
              title={selectionMenu.isHighlighted ? "Remove Highlight" : "Highlight text"}
            >
              {selectionMenu.isHighlighted ? (
                <>
                  <Trash2 size={16} className="sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">Remove</span>
                </>
              ) : (
                <>
                  <Highlighter size={16} className="sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">Highlight</span>
                </>
              )}
            </button>

            {/* Action 2: Define/Search Meaning */}
            <button
              onClick={searchMeaning}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-white bg-gray-700 hover:bg-gray-600 transition-colors text-sm sm:text-base"
              title="Search meaning on Google"
            >
              <Search size={16} className="sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">Define</span>
            </button>
          </div>
        </div>
      )}

      {/* PDF Viewer - Conditional rendering based on view mode */}
      <div
        ref={containerRef}
        className={`h-full w-full pt-[70px] ${viewMode === 'scroll' ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden flex items-center justify-center'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {viewMode === 'scroll' ? (
          // Continuous Scroll Mode
          <div className="flex flex-col items-center py-4 sm:py-8 px-2 sm:px-4 gap-2 sm:gap-4">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-10 sm:p-20 bg-gray-100 rounded-lg">
                  <div className="text-gray-600 text-base sm:text-lg">Loading PDF document...</div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-10 sm:p-20 bg-red-50 rounded-lg">
                  <div className="text-red-600 text-base sm:text-lg">Failed to load PDF. Please try again.</div>
                </div>
              }
            >
              {/* Render all pages for continuous scrolling */}
              {numPages && Array.from(new Array(numPages), (el, index) => (
                <div
                  key={`page_${index + 1}`}
                  id={`page_${index + 1}`} // <-- CRUCIAL: Added ID for initial scroll
                  className="mb-2 sm:mb-4 shadow-2xl rounded-lg overflow-hidden bg-white w-full max-w-full pdf-page-container"
                >
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    rotate={rotation}
                    renderAnnotationLayer={true}
                    renderTextLayer={true}
                    className="pdf-page"
                    width={window.innerWidth < 640 ? window.innerWidth - 32 : undefined}
                  />
                </div>
              ))}
            </Document>
          </div>
        ) : (
          // Page-Fill Mode
          <div className="relative w-full h-full flex items-center justify-center pt-4 sm:pt-8 pb-4 sm:pb-8">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-10 sm:p-20 bg-gray-100 rounded-lg">
                  <div className="text-gray-600 text-base sm:text-lg">Loading PDF document...</div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-10 sm:p-20 bg-red-50 rounded-lg">
                  <div className="text-red-600 text-base sm:text-lg">Failed to load PDF. Please try again.</div>
                </div>
              }
            >
              {/* Render single page */}
              <div
                className="shadow-2xl rounded-lg overflow-hidden bg-white transition-opacity duration-150"
                style={{ opacity: isPageTransitioning ? 0.3 : 1 }}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                  className="pdf-page"
                  // Use aspect ratio limiting based on screen size for page fill mode
                  width={window.innerWidth < 1024 ? window.innerWidth * 0.9 : window.innerWidth * 0.55}
                  height={window.innerHeight - 150}
                />
              </div>
            </Document>

            {/* Page Mode Navigation Buttons */}
            {numPages > 1 && (
              <>
                <button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 p-3 sm:p-4 bg-gray-700/80 hover:bg-gray-600/90 text-white rounded-full transition-all duration-200 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed z-30"
                  title="Previous Page"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-3 sm:p-4 bg-gray-700/80 hover:bg-gray-600/90 text-white rounded-full transition-all duration-200 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed z-30"
                  title="Next Page"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Scroll to Top Button - Responsive */}
      {showScrollTop && viewMode === 'scroll' && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 p-3 sm:p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all duration-200 hover:shadow-xl z-40"
          title="Scroll to Top"
        >
          <ChevronUp size={20} className="sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Highlights Count - Show when there are highlights */}
      {highlights.length > 0 && (
        <div
          className={`fixed bottom-4 sm:bottom-8 left-4 sm:left-8 bg-blue-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs sm:text-sm shadow-lg transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
          <div className="flex items-center gap-2">
            <Highlighter size={14} className="sm:w-4 sm:h-4" />
            <span>{highlights.length} highlight{highlights.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Info - Hidden on mobile */}
      <div
        className={`hidden lg:block fixed bottom-4 right-20 bg-gray-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-xs shadow-lg transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        <div className="font-semibold mb-1">Keyboard Shortcuts:</div>
        <div className="space-y-0.5 text-gray-300">
          <div>+ / - : Zoom in/out</div>
          <div>0 : Reset zoom</div>
          <div>Esc : Close reader / Dismiss menu</div>
          {viewMode === 'page' && <div>↑ ↓ / ← → : Navigate pages</div>}
          {viewMode === 'page' && <div className="text-blue-300">Swipe ↑↓ : Next/Prev page</div>}
          <div>Select text : Highlight/Define</div>
        </div>
      </div>
    </div>
  );
};

export default PdfReader;