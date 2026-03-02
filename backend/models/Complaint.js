const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      // Buyer categories
      'Product Quality', 'Delivery Issue', 'Wrong Item', 'Damaged Item',
      'Missing Item', 'Seller Communication', 'Refund Issue',
      // Seller categories  
      'Payment Issue', 'Platform Fee Dispute', 'Buyer Issue',
      'Technical Problem', 'Account Issue', 'Policy Violation Report',
      // Common
      'Other', 'General Inquiry'
    ],
    default: 'General Inquiry'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userRole: {
    type: String,
    enum: ['buyer', 'seller', 'guest', 'moderator', 'employee'],
    required: true
  },
  // Guest user information (for non-authenticated users)
  guestInfo: {
    name: String,
    email: String
  },
  // Source tracking
  source: {
    type: String,
    enum: ['complaint_form', 'contact_form'],
    default: 'complaint_form'
  },
  // Reference fields for context
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    default: null
  },
  // Status workflow
  status: {
    type: String,
    enum: ['open', 'pending', 'in-progress', 'resolved', 'escalated', 'rejected', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Admin interaction
  adminResponse: {
    type: String,
    trim: true,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Communication thread
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    userRole: {
      type: String,
      enum: ['buyer', 'seller', 'admin', 'guest', 'moderator', 'employee'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Resolution details
  resolution: {
    action: {
      type: String,
      enum: ['refund_issued', 'replacement_sent', 'compensation_provided', 'policy_clarified', 'no_action', 'other'],
      default: null
    },
    details: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
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

// Update the updatedAt timestamp before saving
ComplaintSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
ComplaintSchema.index({ user: 1, userRole: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', ComplaintSchema);
