/**
 * EmployeeReport Model
 * Handles employee-to-manager communication (reports / requests for help).
 */
const mongoose = require('mongoose');

const EmployeeReportSchema = new mongoose.Schema({
  fromEmployee: {
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
  managerResponse: { type: String, default: null },
  respondedAt: { type: Date, default: null },
}, { timestamps: true });

EmployeeReportSchema.index({ toManager: 1, status: 1 });
EmployeeReportSchema.index({ fromEmployee: 1 });

module.exports = mongoose.model('EmployeeReport', EmployeeReportSchema);
