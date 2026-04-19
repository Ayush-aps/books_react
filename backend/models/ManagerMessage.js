/**
 * ManagerMessage Model
 * Handles manager-to-manager communication and inter-department escalation.
 */
const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const ManagerMessageSchema = new mongoose.Schema({
  fromManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  // Optional link to the task that triggered this escalation
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'resolved'],
    default: 'pending',
  },
  replies: [ReplySchema],
}, { timestamps: true });

ManagerMessageSchema.index({ toManager: 1, status: 1 });
ManagerMessageSchema.index({ fromManager: 1 });

module.exports = mongoose.model('ManagerMessage', ManagerMessageSchema);
