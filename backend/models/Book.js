/**
 * Book model with support for new and second-hand books
 */

const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a title"],
    trim: true,
    maxlength: [100, "Title cannot be more than 100 characters"],
  },
  author: {
    type: String,
    required: [true, "Please add an author"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
  },
  isbn: {
    type: String,
    required: [true, "Please add an ISBN"],
    unique: true,
    match: [/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/, "Please add a valid ISBN"],
  },
  coverImage: {
    type: String,
    default: "default-book-cover.jpg",
  },
  price: {
    type: Number,
    required: [true, "Please add a price"],
  },
  discountPrice: {
    type: Number,
  },
  publisher: {
    type: String,
    required: [true, "Please add a publisher"],
  },
  publishedDate: {
    type: Date,
  },
  pageCount: {
    type: Number,
  },
  language: {
    type: String,
    default: "English",
  },
  genres: {
    type: [String],
    required: true,
    validate: [(v) => v.length > 0, "At least 1 genre required"],
  },
  condition: {
    type: String,
    enum: ["new", "used"],
    default: "new",
  },
  originalOwner: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  stock: {
    type: Number,
    required: [true, "Please add stock quantity"],
    min: [0, "Stock cannot be negative"],
  },
  format: {
    type: String,
    enum: ["paperback", "hardcover", "ebook", "audiobook"],
    required: true,
  },
  epubFile: {
    type: String,
    default: null,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  rejectionReason: {
    type: String,
    default: null,
  },
  rejectionDate: {
    type: Date,
    default: null,
  },
  approvalDate: {
    type: Date,
    default: null,
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  lockedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  lockedAt: {
    type: Date,
    default: null,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Keep isApproved in sync with approvalStatus for backward compatibility
BookSchema.pre('save', function (next) {
  if (this.isModified('approvalStatus')) {
    this.isApproved = (this.approvalStatus === 'approved');
  }
  next();
});

// Create index for search functionality
BookSchema.index({
  title: "text",
  author: "text",
  description: "text",
  publisher: "text",
  genres: "text",
});
BookSchema.index({ approvalStatus: 1 });
BookSchema.index({ lockedBy: 1 });

module.exports = mongoose.model("Book", BookSchema);
