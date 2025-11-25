/**
 * Book Review Model
 * Stores text, image, and video reviews for books
 */

const mongoose = require('mongoose');

const bookReviewSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // Text Review
  reviewText: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  // Image Reviews (multiple images allowed)
  images: [{
    url: String,
    publicId: String, // For Cloudinary deletion
    caption: String
  }],
  // Video Review (single video)
  video: {
    videoUrl: String,
    thumbnailUrl: String,
    publicId: String, // For Cloudinary deletion
    duration: Number
  },
  // Helpful count (like Amazon's helpful button)
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Verification status
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  // Moderation
  isApproved: {
    type: Boolean,
    default: true // Auto-approve by default
  },
  // Review replies (for seller/admin responses)
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
bookReviewSchema.index({ book: 1, createdAt: -1 });
bookReviewSchema.index({ user: 1, book: 1 }, { unique: true }); // One review per user per book
bookReviewSchema.index({ rating: 1 });

// Method to check if user found review helpful
bookReviewSchema.methods.isHelpfulBy = function(userId) {
  return this.helpfulBy.includes(userId);
};

// Static method to get average rating for a book
bookReviewSchema.statics.getAverageRating = async function(bookId) {
  const result = await this.aggregate([
    { $match: { book: new mongoose.Types.ObjectId(bookId), isApproved: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { averageRating: 0, totalReviews: 0 };
};

// Update book's average rating after review changes
bookReviewSchema.post('save', async function() {
  const Book = mongoose.model('Book');
  const stats = await this.constructor.getAverageRating(this.book);
  
  await Book.findByIdAndUpdate(this.book, {
    averageRating: stats.averageRating,
    reviewCount: stats.totalReviews
  });
});

bookReviewSchema.post('remove', async function() {
  const Book = mongoose.model('Book');
  const stats = await this.constructor.getAverageRating(this.book);
  
  await Book.findByIdAndUpdate(this.book, {
    averageRating: stats.averageRating,
    reviewCount: stats.totalReviews
  });
});

module.exports = mongoose.model('BookReview', bookReviewSchema);
