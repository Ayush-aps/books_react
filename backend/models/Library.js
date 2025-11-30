const mongoose = require("mongoose");

const AnnotationSchema = new mongoose.Schema({
  cfi: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#FFD700'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const LibraryItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentPage: {
    type: Number,
    default: 1
  },
  cfi: {
    type: String,
    default: null
  },
  annotations: [AnnotationSchema],
  isBookmarked: {
    type: Boolean,
    default: false
  },
  bookmarkPage: {
    type: Number,
    default: null
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const LibrarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: [LibraryItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Library", LibrarySchema);
