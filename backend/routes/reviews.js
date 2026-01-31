/**
 * Book Reviews API routes
 * Handle text, image, and video reviews
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const { reviewMediaUpload } = require("../middleware/upload");
const { uploadImage, uploadVideo, deleteImage, deleteVideo } = require("../config/cloudinary");
const Book = require("../models/Book");
const BookReview = require("../models/BookReview");
const Order = require("../models/Order");
const Library = require("../models/Library");

/**
 * @route   GET /api/reviews/book/:bookId
 * @desc    Get all reviews for a book
 * @access  Public
 */
router.get("/book/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { sort = 'recent', rating } = req.query;

    // Build query
    const query = { book: bookId, isApproved: true };
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'helpful':
        sortOptions = { helpfulCount: -1, createdAt: -1 };
        break;
      case 'rating-high':
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      case 'rating-low':
        sortOptions = { rating: 1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 }; // Recent first
    }

    const reviews = await BookReview.find(query)
      .populate("user", "name avatar")
      .populate({
        path: "replies.user",
        select: "name avatar role"
      })
      .sort(sortOptions);

    // Add helpful status for current user
    const reviewsWithHelpfulStatus = reviews.map((review) => ({
      ...review.toObject(),
      isHelpfulByCurrentUser: req.user ? review.helpfulBy.includes(req.user._id) : false,
    }));

    res.json({
      success: true,
      message: "Reviews retrieved successfully",
      data: { reviews: reviewsWithHelpfulStatus },
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/reviews/user/can-review/:bookId
 * @desc    Check if user can review this book (purchased only - Amazon style)
 * @access  Private
 */
router.get("/user/can-review/:bookId", ensureAuthenticated, async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user._id;

    // Check if already reviewed
    const existingReview = await BookReview.findOne({ book: bookId, user: userId });
    if (existingReview) {
      return res.json({
        success: true,
        data: { canReview: false, reason: "already_reviewed", review: existingReview }
      });
    }

    // Check if purchased and delivered (Amazon-style workflow)
    const hasPurchased = await Order.findOne({
      buyer: userId,
      'items.book': bookId,
      $or: [
        { status: 'delivered' },
        { orderStatus: 'delivered' }
      ]
    });

    const canReview = Boolean(hasPurchased);
    const isVerifiedPurchase = Boolean(hasPurchased);

    res.json({
      success: true,
      data: {
        canReview,
        isVerifiedPurchase,
        reason: canReview ? null : "not_purchased_or_not_delivered"
      }
    });
  } catch (err) {
    console.error("Error checking review eligibility:", err);
    res.status(500).json({
      success: false,
      message: "Error checking eligibility",
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/reviews
 * @desc    Create a new review with text, images, and/or video
 * @access  Private
 */
router.post("/", ensureAuthenticated, reviewMediaUpload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  const uploadedFiles = [];

  try {
    const { bookId, rating, reviewText } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!bookId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Book ID and rating are required",
      });
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check if user already reviewed this book
    const existingReview = await BookReview.findOne({ book: bookId, user: userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this book",
      });
    }

    // Check if purchased and delivered (Amazon-style workflow)
    const hasPurchased = await Order.findOne({
      buyer: userId,
      'items.book': bookId,
      $or: [
        { status: 'delivered' },
        { orderStatus: 'delivered' }
      ]
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: "You can only review books from delivered orders",
      });
    }

    // Process uploaded images
    const images = [];
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        uploadedFiles.push(file.path);
        const cloudinaryResult = await uploadImage(file.path, {
          folder: 'book-reviews/images',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });

        images.push({
          url: cloudinaryResult.url,
          publicId: cloudinaryResult.publicId
        });

        // Clean up local file
        fs.unlinkSync(file.path);
      }
    }

    // Process uploaded video
    let video = null;
    if (req.files && req.files.video && req.files.video[0]) {
      const videoFile = req.files.video[0];
      uploadedFiles.push(videoFile.path);

      const cloudinaryResult = await uploadVideo(videoFile.path, {
        folder: 'book-reviews/videos',
        resource_type: 'video'
      });

      video = {
        videoUrl: cloudinaryResult.url,
        thumbnailUrl: cloudinaryResult.thumbnail,
        publicId: cloudinaryResult.publicId,
        duration: Math.round(cloudinaryResult.duration) || 0
      };

      // Clean up local file
      fs.unlinkSync(videoFile.path);
    }

    // Create review
    const newReview = new BookReview({
      book: bookId,
      user: userId,
      rating: parseInt(rating),
      reviewText: reviewText || '',
      images,
      video,
      isVerifiedPurchase: Boolean(hasPurchased),
      isApproved: true
    });

    await newReview.save();
    await newReview.populate("user", "name avatar");

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: { review: newReview },
    });
  } catch (err) {
    console.error("Error creating review:", err);

    // Clean up uploaded files on error
    for (const filePath of uploadedFiles) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error creating review",
      error: err.message,
    });
  }
});

/**
 * @route   PUT /api/reviews/:id/helpful
 * @desc    Mark review as helpful/unhelpful
 * @access  Private
 */
router.put("/:id/helpful", ensureAuthenticated, async (req, res) => {
  try {
    const review = await BookReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const userId = req.user._id;
    const helpfulIndex = review.helpfulBy.indexOf(userId);

    if (helpfulIndex === -1) {
      // Add helpful
      review.helpfulBy.push(userId);
      review.helpfulCount += 1;
    } else {
      // Remove helpful
      review.helpfulBy.splice(helpfulIndex, 1);
      review.helpfulCount -= 1;
    }

    await review.save();

    res.json({
      success: true,
      message: helpfulIndex === -1 ? "Marked as helpful" : "Removed helpful mark",
      data: {
        isHelpful: helpfulIndex === -1,
        helpfulCount: review.helpfulCount,
      },
    });
  } catch (err) {
    console.error("Error marking review helpful:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete own review
 * @access  Private
 */
router.delete("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const review = await BookReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews",
      });
    }

    // Delete images from Cloudinary
    if (review.images && review.images.length > 0) {
      for (const image of review.images) {
        if (image.publicId) {
          try {
            await deleteImage(image.publicId);
          } catch (err) {
            console.error("Failed to delete image from Cloudinary:", err);
          }
        }
      }
    }

    // Delete video from Cloudinary
    if (review.video && review.video.publicId) {
      try {
        await deleteVideo(review.video.publicId);
      } catch (err) {
        console.error("Failed to delete video from Cloudinary:", err);
      }
    }

    await BookReview.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting review",
      error: err.message,
    });
  }
});

module.exports = router;
