/**
 * Task Model
 * Auto-generated from platform events. Managed by department managers, executed by employees.
 */
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    enum: ['marketplace', 'support', 'finance', 'tech'],
    required: true,
  },
  eventType: {
    type: String,
    enum: [
      'book_upload',        // Marketplace
      'seller_verification',// Marketplace
      'complaint',          // Support
      'refund_request',     // Finance
      'payout_request',     // Finance
      'payment_failure',    // Finance / Tech
      'bug_report',         // Tech
      'server_error',       // Tech
      'manual',             // Any - manually created
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'resolved', 'escalated'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Reference to the entity that triggered this task (Book / Complaint / Order)
  relatedEntity: {
    entityType: { type: String, default: null },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  // Escalation fields
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  escalationReason: { type: String, default: null },
  escalatedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  notes: { type: String, default: null },
  completedAt: { type: Date, default: null },
  // Optimistic locking to prevent two employees processing same task
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  lockedAt: { type: Date, default: null },
}, { timestamps: true });

// Index for efficient dept queries
TaskSchema.index({ department: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Task', TaskSchema);
