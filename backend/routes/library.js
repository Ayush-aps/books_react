/**
 * Library API routes for managing user's book library
 * Netflix-like subscription model: Library access only for active subscribers
 */

const express = require("express");
const router = express.Router();
const axios = require("axios");
const { ensureAuthenticated } = require("../middleware/auth");
const { requireActiveSubscription } = require("../middleware/subscription");
const Library = require("../models/Library");
const Book = require("../models/Book");
const Subscription = require("../models/Subscription");

/**
 * @route   GET /api/library
 * @desc    Get user's library (Check subscription first, no DB query for non-subscribers)
 * @access  Private
 */
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    console.log('=== Library Request for user:', req.user._id);

    // Check subscription status FIRST (before any DB queries)
    const subscription = await Subscription.findOne({
      user: req.user._id,
      isActive: true,
      endDate: { $gt: new Date() },
    });

    console.log('Subscription found:', subscription ? {
      plan: subscription.plan,
      isActive: subscription.isActive,
      endDate: subscription.endDate,
      startDate: subscription.startDate
    } : 'NONE');

    // If no subscription, return clean response without querying library
    if (!subscription || subscription.plan === 'free') {
      console.log('❌ No valid subscription - returning requiresSubscription');
      return res.status(200).json({
        success: false,
        hasSubscription: false,
        requiresSubscription: true,
        message: "Subscribe to unlock unlimited access to thousands of books and start building your personal digital library.",
        redirectTo: "/pricing"
      });
    }

    console.log('✅ Valid subscription found - fetching library');

    // User has subscription - fetch library data
    let library = await Library.findOne({ user: req.user._id }).populate({
      path: "items.book",
      select: "title author coverImage format description price",
    });

    if (!library) {
      library = { items: [] };
    }

    // Calculate remaining subscription days
    const daysRemaining = Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      message: "Library retrieved successfully",
      data: {
        library: library.items || [],
        hasSubscription: true,
        subscription: {
          plan: subscription.plan,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          daysRemaining,
          isActive: subscription.isActive,
          autoRenew: subscription.autoRenew
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error loading your library",
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/library/add/:bookId
 * @desc    Add a book to user's library (Check subscription, return 200 with flag)
 * @access  Private
 */
router.post("/add/:bookId", ensureAuthenticated, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;

    // Check subscription status FIRST
    const subscription = await Subscription.findOne({
      user: userId,
      isActive: true,
      endDate: { $gt: new Date() },
    });

    // If no subscription, return 200 with requiresSubscription flag
    if (!subscription || subscription.plan === 'free') {
      return res.status(200).json({
        success: false,
        requiresSubscription: true,
        message: "Please subscribe to add books to your library",
      });
    }

    // Find the book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check if user already has a library
    let library = await Library.findOne({ user: userId });

    // If no library exists, create one
    if (!library) {
      library = new Library({
        user: userId,
        items: [],
      });
    }

    // Check if book is already in library
    const existingItem = library.items.find((item) => item.book && item.book.toString() === bookId);

    if (existingItem) {
      return res.status(200).json({
        success: false,
        message: "This book is already in your library",
      });
    }

    // Add the book to the library
    library.items.push({
      book: bookId,
      progress: 0,
      currentPage: 1,
      accessCount: 0,
    });

    await library.save();

    res.status(200).json({
      success: true,
      message: "Successfully added book to your library",
      data: { library },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error adding book to library",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/library/book/:bookId
 * @desc    Get book details from library for reading (Requires active subscription)
 * @access  Private + Active Subscription
 */
router.get("/book/:bookId", ensureAuthenticated, requireActiveSubscription, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;

    // Find the user's library
    const library = await Library.findOne({ user: userId });

    if (!library) {
      return res.status(404).json({
        success: false,
        message: "Library not found",
      });
    }

    // Find the book in the library
    const bookItem = library.items.find((item) => item.book && item.book.toString() === bookId);

    if (!bookItem) {
      return res.status(404).json({
        success: false,
        message: "Book not found in your library",
      });
    }

    // Get the book details
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Update access count
    bookItem.accessCount = (bookItem.accessCount || 0) + 1;
    bookItem.lastAccessed = Date.now();
    await library.save();

    res.json({
      success: true,
      message: "Book retrieved successfully",
      data: {
        book,
        currentPage: bookItem.currentPage || 1,
        progress: bookItem.progress || 0,
        isBookmarked: bookItem.isBookmarked || false,
        bookmarkPage: bookItem.bookmarkPage,
        pageCount: 10, // Default page count
        cfi: bookItem.cfi || null,
        annotations: bookItem.annotations || [],
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while loading the book",
      error: err.message,
    });
  }
});

/**
 * @route   PUT /api/library/update-progress
 * @desc    Update reading progress for a book (Requires active subscription)
 * @access  Private + Active Subscription
 */
router.put("/update-progress", ensureAuthenticated, requireActiveSubscription, async (req, res) => {
  try {
    const { bookId, progress, currentPage, cfi } = req.body;
    const userId = req.user._id;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required",
      });
    }

    // Find user's library
    const library = await Library.findOne({ user: userId });
    if (!library) {
      return res.status(404).json({ success: false, message: "Library not found" });
    }

    // Find the book item in the library
    const bookItem = library.items.find((item) => item.book && item.book.toString() === bookId);

    if (!bookItem) {
      return res.status(404).json({ success: false, message: "Book not found in library" });
    }

    // Update progress and currentPage if provided
    if (progress !== undefined) {
      // Cap progress between 0 and 100
      bookItem.progress = Math.min(Math.max(progress, 0), 100);
    } else if (currentPage !== undefined) {
      // Calculate progress based on 10 pages if only currentPage is provided
      const calculatedProgress = Math.round((currentPage / 10) * 100);
      bookItem.progress = Math.min(Math.max(calculatedProgress, 0), 100);
    }

    if (currentPage !== undefined) {
      bookItem.currentPage = currentPage;
    }

    // Update CFI (Canonical Fragment Identifier) for ePub position
    if (cfi !== undefined) {
      bookItem.cfi = cfi;
    }

    bookItem.lastAccessed = Date.now();
    library.updatedAt = Date.now();

    await library.save();

    res.json({
      success: true,
      message: "Progress updated successfully",
      data: {
        progress: bookItem.progress,
        currentPage: bookItem.currentPage,
        cfi: bookItem.cfi,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/**
 * @route   DELETE /api/library/remove/:bookId
 * @desc    Remove a book from user's library (Requires active subscription)
 * @access  Private + Active Subscription
 */
router.delete("/remove/:bookId", ensureAuthenticated, requireActiveSubscription, async (req, res) => {
  try {
    const bookId = req.params.bookId;

    // Find user's library
    const library = await Library.findOne({ user: req.user._id });

    if (!library) {
      return res.status(404).json({
        success: false,
        message: "Library not found",
      });
    }

    // Find the item in the library
    const itemIndex = library.items.findIndex((item) => item.book.toString() === bookId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Book not found in your library",
      });
    }

    // Remove the item from the array
    library.items.splice(itemIndex, 1);
    await library.save();

    res.json({
      success: true,
      message: "Book removed from your library",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error removing book from library",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/library/progress-data
 * @desc    Get progress data for user's library items (Requires active subscription)
 * @access  Private + Active Subscription
 */
router.get("/progress-data", ensureAuthenticated, requireActiveSubscription, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the user's library
    const library = await Library.findOne({ user: userId });

    if (!library) {
      return res.json({ success: true, data: { items: [] } });
    }

    // Return simplified progress data for each book
    const items = library.items.map((item) => ({
      book: item.book.toString(),
      progress: item.progress,
      currentPage: item.currentPage,
      lastAccessed: item.lastAccessed,
    }));

    res.json({ success: true, data: { items } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/**
 * @route   POST /api/library/bookmark
 * @desc    Save or remove a bookmark (Requires active subscription)
 * @access  Private + Active Subscription
 */
router.post("/bookmark", ensureAuthenticated, requireActiveSubscription, async (req, res) => {
  try {
    const { bookId, currentPage, isBookmarked } = req.body;
    const userId = req.user._id;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required",
      });
    }

    // Find user's library
    const library = await Library.findOne({ user: userId });
    if (!library) {
      return res.status(404).json({ success: false, message: "Library not found" });
    }

    // Find the book in the library
    const bookItem = library.items.find((item) => item.book && item.book.toString() === bookId);

    if (!bookItem) {
      return res.status(404).json({ success: false, message: "Book not found in library" });
    }

    // Update bookmark information
    bookItem.isBookmarked = isBookmarked;

    if (isBookmarked) {
      bookItem.bookmarkPage = currentPage;
    } else {
      bookItem.bookmarkPage = null;
    }

    await library.save();

    res.json({
      success: true,
      message: isBookmarked ? "Bookmark saved" : "Bookmark removed",
      data: { isBookmarked },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/**
 * @route   GET /api/library/bookmark/:bookId
 * @desc    Check if a book is bookmarked (Requires active subscription)
 * @access  Private + Active Subscription
 */
router.get("/bookmark/:bookId", ensureAuthenticated, requireActiveSubscription, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;

    // Find user's library
    const library = await Library.findOne({ user: userId });
    if (!library) {
      return res.json({ success: true, data: { isBookmarked: false } });
    }

    // Find the book in the library
    const bookItem = library.items.find((item) => item.book && item.book.toString() === bookId);

    if (!bookItem) {
      return res.json({ success: true, data: { isBookmarked: false } });
    }

    res.json({
      success: true,
      data: {
        isBookmarked: !!bookItem.isBookmarked,
        bookmarkPage: bookItem.bookmarkPage,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/**
 * @route   POST /api/library/annotations
 * @desc    Add or update an annotation for a book (Requires active subscription)
 * @access  Private + Active Subscription
 */
router.post("/annotations", ensureAuthenticated, requireActiveSubscription, async (req, res) => {
  try {
    const { bookId, cfi, text, note, color } = req.body;
    const userId = req.user._id;

    if (!bookId || !cfi || !text) {
      return res.status(400).json({
        success: false,
        message: "Book ID, CFI, and text are required",
      });
    }

    // Find user's library
    const library = await Library.findOne({ user: userId });
    if (!library) {
      return res.status(404).json({ success: false, message: "Library not found" });
    }

    // Find the book item in the library
    const bookItem = library.items.find((item) => item.book && item.book.toString() === bookId);

    if (!bookItem) {
      return res.status(404).json({ success: false, message: "Book not found in library" });
    }

    // Check if annotation with same CFI already exists
    const existingAnnotation = bookItem.annotations.find((ann) => ann.cfi === cfi);

    if (existingAnnotation) {
      // Update existing annotation
      existingAnnotation.text = text;
      existingAnnotation.note = note || '';
      existingAnnotation.color = color || '#FFD700';
      existingAnnotation.updatedAt = Date.now();
    } else {
      // Add new annotation
      bookItem.annotations.push({
        cfi,
        text,
        note: note || '',
        color: color || '#FFD700',
      });
    }

    library.updatedAt = Date.now();
    await library.save();

    res.json({
      success: true,
      message: existingAnnotation ? "Annotation updated successfully" : "Annotation added successfully",
      data: { annotations: bookItem.annotations },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/**
 * @route   GET /api/library/annotations/:bookId
 * @desc    Get all annotations for a book (Requires active subscription)
 * @access  Private + Active Subscription
 */
router.get("/annotations/:bookId", ensureAuthenticated, requireActiveSubscription, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;

    // Find user's library
    const library = await Library.findOne({ user: userId });
    if (!library) {
      return res.json({ success: true, data: { annotations: [] } });
    }

    // Find the book item in the library
    const bookItem = library.items.find((item) => item.book && item.book.toString() === bookId);

    if (!bookItem) {
      return res.json({ success: true, data: { annotations: [] } });
    }

    res.json({
      success: true,
      data: { annotations: bookItem.annotations || [] },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/**
 * @route   DELETE /api/library/annotations/:bookId/:annotationId
 * @desc    Delete an annotation (Requires active subscription)
 * @access  Private + Active Subscription
 */
router.delete("/annotations/:bookId/:annotationId", ensureAuthenticated, requireActiveSubscription, async (req, res) => {
  try {
    const { bookId, annotationId } = req.params;
    const userId = req.user._id;

    // Find user's library
    const library = await Library.findOne({ user: userId });
    if (!library) {
      return res.status(404).json({ success: false, message: "Library not found" });
    }

    // Find the book item in the library
    const bookItem = library.items.find((item) => item.book && item.book.toString() === bookId);

    if (!bookItem) {
      return res.status(404).json({ success: false, message: "Book not found in library" });
    }

    // Remove the annotation
    bookItem.annotations = bookItem.annotations.filter(
      (ann) => ann._id.toString() !== annotationId
    );

    library.updatedAt = Date.now();
    await library.save();

    res.json({
      success: true,
      message: "Annotation deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/**
 * @route   GET /api/library/pdf/:bookId
 * @desc    Stream PDF file for a book (Requires active subscription)
 * @access  Private + Active Subscription
 */
router.get("/pdf/:bookId", ensureAuthenticated, requireActiveSubscription, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;

    // Find the user's library
    const library = await Library.findOne({ user: userId });

    if (!library) {
      return res.status(404).json({
        success: false,
        message: "Library not found. Please add this book to your library first.",
      });
    }

    // Check if book is in user's library
    const bookItem = library.items.find((item) => item.book && item.book.toString() === bookId);

    if (!bookItem) {
      return res.status(404).json({
        success: false,
        message: "Book not found in your library. Please add this book to your library first.",
      });
    }

    // Get the book details and check if it still exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "This book is no longer available. It may have been removed by the seller.",
      });
    }

    // Check if book has a PDF file
    if (!book.epubFile) {
      return res.status(404).json({
        success: false,
        message: "This book does not have a PDF file available.",
      });
    }

    // **FIX: Stream the PDF through the backend to bypass Cloudinary 401 errors**
    try {
      // Fetch the PDF from Cloudinary
      const pdfResponse = await axios({
        method: 'GET',
        url: book.epubFile,
        responseType: 'stream',
        timeout: 30000, // 30 second timeout
      });

      // Set appropriate headers for PDF streaming
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${book.title}.pdf"`);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

      // If Cloudinary provides content-length, forward it
      if (pdfResponse.headers['content-length']) {
        res.setHeader('Content-Length', pdfResponse.headers['content-length']);
      }

      // Stream the PDF to the client
      pdfResponse.data.pipe(res);

      // Handle stream errors
      pdfResponse.data.on('error', (streamError) => {
        console.error('PDF stream error:', streamError);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error streaming PDF file",
          });
        }
      });

    } catch (fetchError) {
      console.error('Error fetching PDF from Cloudinary:', fetchError.message);

      // Return detailed error information
      return res.status(500).json({
        success: false,
        message: "Failed to fetch PDF from storage. Please try again later.",
        error: fetchError.response?.status === 401
          ? "Storage authentication failed"
          : fetchError.message,
      });
    }

  } catch (err) {
    console.error('PDF endpoint error:', err);
    res.status(500).json({
      success: false,
      message: "Error loading PDF",
      error: err.message,
    });
  }
});

module.exports = router;
