/**
 * Library API routes for managing user's book library
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const Library = require("../models/Library");
const Book = require("../models/Book");
const Subscription = require("../models/Subscription");

/**
 * @route   GET /api/library
 * @desc    Get user's library
 * @access  Private
 */
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    // Check subscription status
    const subscription = await Subscription.findOne({
      user: req.user._id,
      isActive: true,
      endDate: { $gt: new Date() },
    });

    const hasSubscription = !!subscription;

    // Get user's library with proper population
    let library = await Library.findOne({ user: req.user._id }).populate({
      path: "items.book",
      select: "title author coverImage format description",
    });

    if (!library) {
      library = { items: [] };
    }

    res.json({
      success: true,
      message: "Library retrieved successfully",
      data: {
        library: library.items || [],
        hasSubscription,
        subscription,
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
 * @desc    Add a book to user's library
 * @access  Private
 */
router.post("/add/:bookId", ensureAuthenticated, async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const userId = req.user._id;

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
      return res.status(400).json({
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

    res.status(201).json({
      success: true,
      message: "Book added to your library",
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
 * @desc    Get book details from library for reading
 * @access  Private
 */
router.get("/book/:bookId", ensureAuthenticated, async (req, res) => {
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
 * @desc    Update reading progress for a book
 * @access  Private
 */
router.put("/update-progress", ensureAuthenticated, async (req, res) => {
  try {
    const { bookId, progress, currentPage } = req.body;
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
      bookItem.progress = progress;
    } else if (currentPage !== undefined) {
      // Calculate progress based on 10 pages if only currentPage is provided
      bookItem.progress = Math.round((currentPage / 10) * 100);
    }

    if (currentPage !== undefined) {
      bookItem.currentPage = currentPage;
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
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/**
 * @route   DELETE /api/library/remove/:bookId
 * @desc    Remove a book from user's library
 * @access  Private
 */
router.delete("/remove/:bookId", ensureAuthenticated, async (req, res) => {
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
 * @desc    Get progress data for user's library items
 * @access  Private
 */
router.get("/progress-data", ensureAuthenticated, async (req, res) => {
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
 * @desc    Save or remove a bookmark
 * @access  Private
 */
router.post("/bookmark", ensureAuthenticated, async (req, res) => {
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
 * @desc    Check if a book is bookmarked
 * @access  Private
 */
router.get("/bookmark/:bookId", ensureAuthenticated, async (req, res) => {
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

module.exports = router;
