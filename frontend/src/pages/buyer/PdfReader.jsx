import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ChevronRight,
  List,
  AlignLeft
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
  const [showHighlightsSidebar, setShowHighlightsSidebar] = useState(false);
  const [selectionRange, setSelectionRange] = useState(null);

  // Ref to store highlight application status to prevent infinite loop/re-application
  const highlightsAppliedRef = useRef({});

  // Ref to track blob URL for proper cleanup
  const blobUrlRef = useRef(null);

  // Page Tracking States
  const [currentPage, setCurrentPage] = useState(1); // Page currently visible (for Scroll Mode)
  const [pageNumber, setPageNumber] = useState(1); // Page currently displayed (for Page Mode)

  const [lastReadPage, setLastReadPage] = useState(1); // Persisted last read page
  const [bookmarkedPage, setBookmarkedPage] = useState(null); // Manual bookmark

  // View mode: 'scroll' or 'page'
  const [viewMode, setViewMode] = useState('scroll');
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [isReady, setIsReady] = useState(false); // Track if initial restoration is done

  // Swipe detection for vertical scrolling
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  // Memoize the PDF file configuration to prevent unnecessary reloads
  const pdfFileConfig = useMemo(() => {
    return pdfUrl || null;
  }, [pdfUrl]);

  // --- PERSISTENCE: LOAD DATA FROM LOCAL STORAGE (Runs once on mount) ---
  useEffect(() => {
    if (bookId) {
      const savedHighlights = localStorage.getItem(`book_${bookId}_highlights`);
      console.log('[Highlight Debug] Loading highlights for bookId:', bookId);
      const savedPage = localStorage.getItem(`book_${bookId}_lastPage`);
      const savedViewMode = localStorage.getItem(`book_${bookId}_viewMode`);
      const savedBookmark = localStorage.getItem(`book_${bookId}_manualBookmark`);

      if (savedHighlights) {
        // Ensure highlights is an array, fallback to empty array if parsing fails or result is null
        try {
          const parsedHighlights = JSON.parse(savedHighlights);
          setHighlights(Array.isArray(parsedHighlights) ? parsedHighlights : []);
        } catch (e) {
          console.error("Failed to parse saved highlights:", e);
          setHighlights([]);
        }
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

  // **CRUCIAL:** Save highlights immediately when the state changes.
  useEffect(() => {
    if (bookId && highlights.length >= 0) {
      console.log('[Highlight Debug] Saving highlights to localStorage for bookId:', bookId);
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

  // --- LOAD PDF AS BLOB WITH CREDENTIALS ---
  useEffect(() => {
    const loadPdfUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        // **FIX: Fetch PDF as blob with credentials to ensure cookies are sent**
        const backendPdfUrl = `http://localhost:3000/api/library/pdf/${bookId}`;

        console.log('[PDF Reader] Fetching PDF from backend:', backendPdfUrl);

        const response = await fetch(backendPdfUrl, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to access this book.');
          } else if (response.status === 403) {
            setError('You need an active subscription to access this book.');
          } else if (response.status === 404) {
            setError('This book is no longer available. It may have been removed by the seller.');
          } else {
            setError(`Failed to load PDF (Error ${response.status})`);
          }
          setLoading(false);
          return;
        }

        // Convert response to blob
        const blob = await response.blob();

        // Create object URL from blob
        const objectUrl = URL.createObjectURL(blob);

        console.log('[PDF Reader] PDF loaded successfully as blob');

        // Store in ref for cleanup
        blobUrlRef.current = objectUrl;
        setPdfUrl(objectUrl);
        setLoading(false);

      } catch (err) {
        console.error('[PDF Reader] Error loading PDF:', err);
        setError('Failed to load PDF. Please try again.');
        setLoading(false);
      }
    };

    if (bookId) {
      loadPdfUrl();
    } else {
      setError('No book ID provided');
      setLoading(false);
    }

    // Cleanup: Revoke object URL when component unmounts or bookId changes
    return () => {
      // Use ref to get the current blob URL for cleanup
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        console.log('[PDF Reader] Revoking blob URL on cleanup');
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [bookId]); // Removed pdfUrl from dependencies to prevent cleanup loop


  // --- DOCUMENT LOAD SUCCESS HANDLER ---
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);

    // Save total pages to localStorage for progress tracking in Library
    if (bookId) {
      localStorage.setItem(`book_${bookId}_numPages`, numPages.toString());
    }

    // Priority: Manual Bookmark > Last Read Page > 1
    const targetPage = bookmarkedPage || lastReadPage;
    let shouldScroll = false;

    if (targetPage > 1 && targetPage <= numPages) {
      // Set the page states to the persisted value
      setCurrentPage(targetPage);
      setPageNumber(targetPage);

      // We only need to wait for scroll if we are in scroll mode
      if (viewMode === 'scroll') {
        shouldScroll = true;
      }
    } else {
      // If no saved page or invalid page, ensure we start at 1
      setCurrentPage(1);
      setPageNumber(1);
    }

    // If we don't need to scroll, we are ready immediately
    if (!shouldScroll) {
      setIsReady(true);
    }
  };

  // --- PERSISTENCE: INITIAL SCROLL HANDLER ---
  useEffect(() => {
    // This runs after numPages is set and the PDF is rendered
    if (numPages && containerRef.current && !isReady) {
      const targetPage = bookmarkedPage || lastReadPage;

      // Only scroll if we are in 'scroll' mode AND the target page is not the first page.
      if (viewMode === 'scroll' && targetPage > 1 && targetPage <= numPages) {

        // Find the DOM element corresponding to the target page
        const targetElement = document.getElementById(`page_${targetPage}`);

        if (targetElement) {
          // Use a slight delay to ensure the pages have been fully measured by the browser
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.scrollTo({
                top: targetElement.offsetTop - 70, // Offset by header height
                behavior: 'instant'
              });
            }
            setIsReady(true);
          }, 300);
        } else {
          // Fallback if element not found, try again in 100ms or give up
          setTimeout(() => {
            setIsReady(true);
          }, 500);
        }
      } else {
        // If not scrolling, mark as ready immediately
        setTimeout(() => {
          setIsReady(true);
        }, 300);
      }
    }
  }, [numPages, viewMode, lastReadPage, bookmarkedPage, isReady]);

  // Failsafe: Ensure we don't get stuck on the loading screen
  useEffect(() => {
    if (!isReady) {
      const timeout = setTimeout(() => {
        setIsReady(true);
      }, 3000); // 3 second max wait time for restoration
      return () => clearTimeout(timeout);
    }
  }, [isReady]);

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
        // Important: Reset applied highlight state for new page
        highlightsAppliedRef.current[pageNumber + 1] = false;
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
        // Important: Reset applied highlight state for new page
        highlightsAppliedRef.current[pageNumber - 1] = false;
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

  // Handle text selection - wrapped in useCallback to prevent recreation
  const handleTextSelection = useCallback(() => {
    console.log('[Highlight Debug] handleTextSelection called');
    const selection = window.getSelection();
    const text = selection.toString().trim();

    // Clear selection menu if text is empty and menu is open
    if (!text && selectionMenu.show) {
      setSelectionMenu({ show: false, x: 0, y: 0, isHighlighted: false });
      setSelectionRange(null);
      return;
    }

    if (text.length > 0 && selection.rangeCount > 0) {
      setSelectedText(text);

      // Get selection range and position
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Check if selection is within the PDF container
      const containerRect = containerRef.current.getBoundingClientRect();
      if (rect.bottom < containerRect.top || rect.top > containerRect.bottom) {
        // Selection is outside of the visible PDF area, ignore it
        setSelectionMenu({ show: false, x: 0, y: 0, isHighlighted: false });
        setSelectionRange(null);
        return;
      }

      // Store the range for precise highlighting
      setSelectionRange({
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
        // Store bounding box relative to the viewport
        boundingRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      });

      // Normalize text for comparison
      const normalizedText = text.trim().replace(/\s+/g, ' ');

      // Check if this text is already highlighted (with normalized comparison)
      const isHighlighted = highlights.some(h => {
        const normalizedHighlight = h.text.trim().replace(/\s+/g, ' ');
        // Only check highlights on the current page for faster lookups
        return h.page === currentPage && normalizedHighlight === normalizedText;
      });

      // Position menu near selection
      setSelectionMenu({
        show: true,
        x: rect.left + rect.width / 2,
        // Adjust menu position to be above the selection
        y: rect.top - 10,
        isHighlighted
      });
    } else {
      setSelectionMenu({ show: false, x: 0, y: 0, isHighlighted: false });
      setSelectionRange(null);
    }
  }, [highlights, selectionMenu.show, currentPage]);

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
    console.log('[Highlight Debug] highlightText called with selectedText:', selectedText);
    if (selectedText && selectionRange) {
      // Find the text layer for the current page
      const textLayer = document.querySelector(`#page_${currentPage} .react-pdf__Page__textContent`);
      if (!textLayer) {
        console.error('[Highlight Debug] Text layer not found');
        return;
      }

      // **CRITICAL FIX**: Calculate character offsets relative to the entire text layer content
      let fullText = '';
      const textSpans = textLayer.querySelectorAll('span');
      let startOffset = -1;
      let endOffset = -1;
      let foundStartContainer = false;

      // Iterate through all spans to rebuild the full text and find the offsets
      for (let i = 0; i < textSpans.length; i++) {
        const span = textSpans[i];
        const spanText = span.textContent;

        // Find start offset
        if (!foundStartContainer && span.contains(selectionRange.startContainer)) {
          startOffset = fullText.length + selectionRange.startOffset;
          foundStartContainer = true;
        }

        // Find end offset
        if (span.contains(selectionRange.endContainer)) {
          // We need to check if the endContainer is the same as startContainer but a different offset,
          // or if it's a new container. We must break *after* calculating the end offset.
          endOffset = fullText.length + selectionRange.endOffset;
          break;
        }

        fullText += spanText;
      }

      // Fallback check to ensure the end offset is correct if selection spans multiple elements
      if (startOffset !== -1 && endOffset === -1) {
        endOffset = startOffset + selectedText.length;
        // This fallback is extremely unreliable but serves as a last resort if the DOM traversal failed.
      }


      const newHighlight = {
        text: selectedText,
        id: Date.now(),
        page: currentPage,
        color: 'rgba(255, 248, 220, 0.6)',
        position: {
          startOffset,
          endOffset,
          // We don't strictly need to save boundingRect for persistence, 
          // but we keep it for debugging or if we later implement DOM re-rendering based on coordinates.
          boundingRect: selectionRange.boundingRect
        }
      };

      // Reset the application status for the current page to force re-render
      highlightsAppliedRef.current[currentPage] = false;

      setHighlights(prev => [...prev, newHighlight]);
      setSelectionMenu({ show: false, x: 0, y: 0, isHighlighted: false });
      setSelectionRange(null);
      window.getSelection().removeAllRanges();
      console.log('[Highlight Debug] Highlight created and saved successfully');
    } else {
      console.log('[Highlight Debug] No selected text or range to highlight');
    }
  };

  // Remove highlight
  const removeHighlight = (highlightId) => {
    // Find the highlight to be removed
    const highlightToRemove = highlights.find(h => h.id === highlightId);

    if (highlightToRemove) {
      // Immediately clear the DOM highlight for this specific highlight
      const textLayer = document.querySelector(`#page_${highlightToRemove.page} .react-pdf__Page__textContent`);
      if (textLayer) {
        const textSpans = textLayer.querySelectorAll('span');

        // Build character map to find the exact spans to clear
        let fullText = '';
        const charToSpanMap = [];

        textSpans.forEach((span) => {
          const text = span.textContent;
          for (let i = 0; i < text.length; i++) {
            charToSpanMap.push({
              span,
              char: text[i],
              charIndex: fullText.length + i
            });
          }
          fullText += text;
        });

        // Clear the background color for the specific highlight range
        const { position } = highlightToRemove;
        if (position && typeof position.startOffset === 'number' && typeof position.endOffset === 'number') {
          const startIdx = position.startOffset;
          const endIdx = position.endOffset;
          const spansToClear = new Set();

          // Find all spans within the offset range
          for (let i = startIdx; i < endIdx && i < charToSpanMap.length; i++) {
            if (charToSpanMap[i]) {
              spansToClear.add(charToSpanMap[i].span);
            }
          }

          // Clear background color from these spans
          spansToClear.forEach(span => {
            span.style.backgroundColor = '';
          });
        }
      }

      // Reset the application status for the page to force re-application of remaining highlights
      highlightsAppliedRef.current[highlightToRemove.page] = false;
    }

    // Remove from state
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
    setSelectionMenu({ show: false, x: 0, y: 0, isHighlighted: false });
    window.getSelection().removeAllRanges();
  };

  // Remove selected highlight
  const removeSelectedHighlight = () => {
    if (selectedText) {
      const normalizedSelected = selectedText.trim().replace(/\s+/g, ' ');
      // Find the highlight on the current page that matches the selected text
      const highlight = highlights.find(h => {
        const normalizedHighlight = h.text.trim().replace(/\s+/g, ' ');
        return h.page === currentPage && normalizedHighlight === normalizedSelected;
      });
      if (highlight) {
        removeHighlight(highlight.id);
      }
    }
  };

  // --- APPLY HIGHLIGHTS TO DOM (FIXED VERSION FOR PERSISTENCE) ---
  useEffect(() => {
    if (numPages === null || highlights.length === 0) return;

    // Apply highlights with a short delay to ensure text layer is rendered
    const timer = setTimeout(() => {
      const textLayers = document.querySelectorAll('.react-pdf__Page__textContent');

      if (textLayers.length === 0) {
        // Retry if no text layers are found yet
        return;
      }

      textLayers.forEach((textLayer, pageIndex) => {
        const pageNum = pageIndex + 1;

        // Skip re-application if highlights were already applied for this page in this render cycle
        if (highlightsAppliedRef.current[pageNum]) {
          return;
        }

        const pageHighlights = highlights.filter(h => h.page === pageNum);

        // **CRITICAL:** Always clear existing background colors before applying new ones
        const textSpans = textLayer.querySelectorAll('span');
        textSpans.forEach(span => {
          span.style.backgroundColor = '';
        });

        if (pageHighlights.length === 0) {
          highlightsAppliedRef.current[pageNum] = true;
          return; // No highlights for this page
        }

        // Build a character-level map of the text
        let fullText = '';
        const charToSpanMap = [];

        textSpans.forEach((span) => {
          const text = span.textContent;
          for (let i = 0; i < text.length; i++) {
            charToSpanMap.push({
              span,
              char: text[i],
              charIndex: fullText.length + i
            });
          }
          fullText += text;
        });

        // Apply each highlight using stored offsets
        pageHighlights.forEach(highlight => {
          const { position } = highlight;

          if (position && typeof position.startOffset === 'number' && typeof position.endOffset === 'number') {
            const startIdx = position.startOffset;
            const endIdx = position.endOffset;
            const spansToHighlight = new Set();

            // Find all spans within the offset range
            for (let i = startIdx; i < endIdx && i < charToSpanMap.length; i++) {
              if (charToSpanMap[i]) {
                spansToHighlight.add(charToSpanMap[i].span);
              }
            }

            // Apply highlight color
            spansToHighlight.forEach(span => {
              span.style.backgroundColor = highlight.color || 'rgba(255, 248, 220, 0.6)';
              span.style.transition = 'background-color 0.2s';
            });

          }
          // NOTE: Removed fallback to text matching as it's unreliable and should be fixed with offsets.
        });

        // Mark this page as applied only after processing all its highlights
        highlightsAppliedRef.current[pageNum] = true;
      });
    }, 100); // Reduced timeout to apply highlights faster

    return () => clearTimeout(timer);
  }, [highlights, numPages, rotation, scale, isReady, viewMode]);
  // Dependency array includes everything that changes the DOM size/position

  // Navigate to highlight
  const navigateToHighlight = (highlight) => {
    // Switch to the correct page
    if (viewMode === 'scroll') {
      // In scroll mode, we need to scroll to the page
      const targetElement = document.getElementById(`page_${highlight.page}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        setCurrentPage(highlight.page);
      } else {
        // If element not found (maybe not rendered yet?), just set page
        setCurrentPage(highlight.page);
      }
    } else {
      // In page mode, just set the page number
      setPageNumber(highlight.page);
      setCurrentPage(highlight.page);
      // Reset applied flag for the new page
      highlightsAppliedRef.current[highlight.page] = false;
    }

    if (window.innerWidth < 640) {
      setShowHighlightsSidebar(false);
    }
  };

  // Listen for text selection
  useEffect(() => {
    // Event listeners are set up for mouseup and touchend, which is correct for selection.
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
    };
  }, [handleTextSelection]);

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
  }, [selectionMenu.show, viewMode, pageNumber, numPages, goToPrevPage, goToNextPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
        <div className="max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-4">Unable to Load PDF</h2>
          <p className="text-gray-300 text-lg mb-6">{error}</p>
          <button
            onClick={closeReader}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <ChevronLeft size={20} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Controls - Auto-hide - Responsive */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 shadow-lg transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'
          }`}
      >
        {/* Initial Restoration Loading Overlay */}
        {!isReady && (
          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-gray-900 text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-lg font-medium mb-4">Restoring your place...</p>
            {/* Manual Dismiss Button (appears after delay via CSS animation or just always visible as fallback) */}
            <button
              onClick={() => setIsReady(true)}
              className="text-sm text-gray-400 hover:text-white underline"
            >
              Skip
            </button>
          </div>
        )}
        <div className="w-full px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left Section - Close Button & Sidebar Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={closeReader}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all duration-200 hover:shadow-lg text-sm sm:text-base"
                title="Close (Esc)"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Close</span>
              </button>

              <button
                onClick={() => setShowHighlightsSidebar(!showHighlightsSidebar)}
                className={`p-2 rounded-lg transition-all duration-200 ${showHighlightsSidebar
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                title="Toggle Highlights"
              >
                <List size={20} />
              </button>
            </div>

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

      {/* Highlights Sidebar */}
      <div
        className={`fixed top-[60px] right-0 bottom-0 w-80 bg-gray-800 border-l border-gray-700 shadow-2xl transform transition-transform duration-300 z-40 ${showHighlightsSidebar ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlignLeft size={20} />
              Highlights
            </h3>
            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
              {highlights.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {highlights.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <p>No highlights yet.</p>
                <p className="text-sm mt-2">Select text to add highlights.</p>
              </div>
            ) : (
              highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors group"
                >
                  <div
                    onClick={() => navigateToHighlight(highlight)}
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-blue-400 font-medium">
                        Page {highlight.page}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(highlight.id).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-3 border-l-2 border-blue-500 pl-2">
                      "{highlight.text}"
                    </p>
                  </div>
                  <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHighlight(highlight.id);
                      }}
                      className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-gray-600"
                      title="Delete highlight"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
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
        {!pdfUrl ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 text-lg">Preparing PDF...</div>
          </div>
        ) : viewMode === 'scroll' ? (
          // Continuous Scroll Mode
          <div className="flex flex-col items-center py-4 sm:py-8 px-2 sm:px-4 gap-2 sm:gap-4">
            <Document
              key={pdfUrl} // Force remount when PDF URL changes
              file={pdfFileConfig}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error('[PDF Reader] Document load error:', error);
                setError('Failed to load PDF document. Please try refreshing.');
                setIsReady(true);
              }}
              loading={
                <div className="flex items-center justify-center p-10 sm:p-20 bg-gray-100 rounded-lg">
                  <div className="text-gray-600 text-base sm:text-lg">Loading PDF document...</div>
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
              key={pdfUrl} // Force remount when PDF URL changes
              file={pdfFileConfig}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error('[PDF Reader] Document load error:', error);
                setError('Failed to load PDF document. Please try refreshing.');
                setIsReady(true);
              }}
              loading={
                <div className="flex items-center justify-center p-10 sm:p-20 bg-gray-100 rounded-lg">
                  <div className="text-gray-600 text-base sm:text-lg">Loading PDF document...</div>
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