/**
 * Department Messages Routes
 * /api/dept-messages
 *
 * Manager-to-manager communication and employee-to-manager reports.
 */

const express = require('express');
const router = express.Router();
const ManagerMessage = require('../models/ManagerMessage');
const EmployeeReport = require('../models/EmployeeReport');
const User = require('../models/User');
const { ensureAuthenticated, checkRole } = require('../middleware/auth');

const ensureManagerOrAdmin = checkRole('manager', 'admin');
const ensureStaff = checkRole('manager', 'admin', 'employee');

// ════════════════════════════════════════════════════════════════════════════
// MANAGER ↔ MANAGER COMMUNICATION
// ════════════════════════════════════════════════════════════════════════════

// GET /api/dept-messages/manager-messages
// Manager sees inbox (received) + sent messages, with optional ?type=inbox|sent
router.get('/manager-messages', ensureAuthenticated, ensureManagerOrAdmin, async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.query; // 'inbox' | 'sent' | undefined (both)

    let messages = [];
    if (!type || type === 'inbox') {
      const inbox = await ManagerMessage.find({ toManager: userId })
        .populate('fromManager', 'name email department')
        .populate('toManager', 'name email department')
        .populate('relatedTask', 'title status department')
        .sort({ createdAt: -1 })
        .limit(50);
      messages = [...messages, ...inbox.map((m) => ({ ...m.toObject(), direction: 'inbox' }))];
    }
    if (!type || type === 'sent') {
      const sent = await ManagerMessage.find({ fromManager: userId })
        .populate('fromManager', 'name email department')
        .populate('toManager', 'name email department')
        .populate('relatedTask', 'title status department')
        .sort({ createdAt: -1 })
        .limit(50);
      messages = [...messages, ...sent.map((m) => ({ ...m.toObject(), direction: 'sent' }))];
    }

    // Sort combined by createdAt desc
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: { messages } });
  } catch (err) {
    console.error('[dept-messages] GET /manager-messages', err);
    res.status(500).json({ success: false, message: 'Failed to load messages' });
  }
});

// POST /api/dept-messages/manager-messages
// Manager sends a message to another manager
router.post('/manager-messages', ensureAuthenticated, ensureManagerOrAdmin, async (req, res) => {
  try {
    const { toDepartment, subject, body, relatedTaskId } = req.body;
    if (!toDepartment || !subject || !body) {
      return res.status(400).json({ success: false, message: 'toDepartment, subject, and body are required' });
    }

    // Find the target manager by department
    const targetManager = await User.findOne({ role: 'manager', department: toDepartment });
    if (!targetManager) {
      return res.status(404).json({ success: false, message: `No manager found for department: ${toDepartment}` });
    }
    if (targetManager._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself' });
    }

    const message = await ManagerMessage.create({
      fromManager: req.user._id,
      toManager: targetManager._id,
      subject,
      body,
      relatedTask: relatedTaskId || null,
    });

    const populated = await ManagerMessage.findById(message._id)
      .populate('fromManager', 'name email department')
      .populate('toManager', 'name email department');

    res.status(201).json({ success: true, message: 'Message sent', data: { message: populated } });
  } catch (err) {
    console.error('[dept-messages] POST /manager-messages', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// POST /api/dept-messages/manager-messages/:id/reply
// Reply to a manager message
router.post('/manager-messages/:id/reply', ensureAuthenticated, ensureManagerOrAdmin, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ success: false, message: 'Reply body is required' });

    const message = await ManagerMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    // Only the sender or recipient can reply
    const isParticipant =
      message.fromManager.toString() === req.user._id.toString() ||
      message.toManager.toString() === req.user._id.toString();
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Not authorized' });

    message.replies.push({ from: req.user._id, body });
    if (message.status === 'pending') message.status = 'acknowledged';
    await message.save();

    const updated = await ManagerMessage.findById(req.params.id)
      .populate('fromManager', 'name email department')
      .populate('toManager', 'name email department')
      .populate('replies.from', 'name email department');

    res.json({ success: true, data: { message: updated } });
  } catch (err) {
    console.error('[dept-messages] POST /manager-messages/:id/reply', err);
    res.status(500).json({ success: false, message: 'Failed to reply' });
  }
});

// PATCH /api/dept-messages/manager-messages/:id/resolve
router.patch('/manager-messages/:id/resolve', ensureAuthenticated, ensureManagerOrAdmin, async (req, res) => {
  try {
    const msg = await ManagerMessage.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    );
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, data: { message: msg } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resolve message' });
  }
});

// GET /api/dept-messages/managers-list
// Get list of other managers (for composing messages)
router.get('/managers-list', ensureAuthenticated, ensureManagerOrAdmin, async (req, res) => {
  try {
    const managers = await User.find({
      role: 'manager',
      _id: { $ne: req.user._id },
    }).select('name email department');
    res.json({ success: true, data: { managers } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load managers' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE → MANAGER REPORTS
// ════════════════════════════════════════════════════════════════════════════

// GET /api/dept-messages/employee-reports
// Manager sees reports from their employees
router.get('/employee-reports', ensureAuthenticated, ensureManagerOrAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { toManager: req.user._id };
    if (status) query.status = status;

    const reports = await EmployeeReport.find(query)
      .populate('fromEmployee', 'name email department')
      .populate('relatedTask', 'title status department')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: { reports } });
  } catch (err) {
    console.error('[dept-messages] GET /employee-reports', err);
    res.status(500).json({ success: false, message: 'Failed to load reports' });
  }
});

// GET /api/dept-messages/my-reports
// Employee sees their own submitted reports
router.get('/my-reports', ensureAuthenticated, checkRole('employee'), async (req, res) => {
  try {
    const reports = await EmployeeReport.find({ fromEmployee: req.user._id })
      .populate('toManager', 'name email department')
      .populate('relatedTask', 'title status')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { reports } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load reports' });
  }
});

// POST /api/dept-messages/report
// Employee sends a report to their manager
router.post('/report', ensureAuthenticated, checkRole('employee'), async (req, res) => {
  try {
    const { subject, body, relatedTaskId } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ success: false, message: 'subject and body are required' });
    }

    // Find the manager: validate managedBy is in same department, else look up by department
    let managerId = null;
    if (req.user.managedBy) {
      const assignedMgr = await User.findById(req.user.managedBy).select('department role');
      if (assignedMgr && assignedMgr.role === 'manager' && assignedMgr.department === req.user.department) {
        managerId = assignedMgr._id;
      } else {
        console.warn(`[dept-messages] Employee ${req.user.email} managedBy mismatch — falling back to dept lookup`);
      }
    }
    if (!managerId) {
      const manager = await User.findOne({ role: 'manager', department: req.user.department });
      managerId = manager?._id;
      // Auto-correct the stale managedBy on the employee record
      if (managerId) {
        await User.updateOne({ _id: req.user._id }, { managedBy: managerId });
      }
    }
    if (!managerId) {
      return res.status(400).json({ success: false, message: 'No manager assigned to your account' });
    }

    const report = await EmployeeReport.create({
      fromEmployee: req.user._id,
      toManager: managerId,
      subject,
      body,
      relatedTask: relatedTaskId || null,
    });

    res.status(201).json({ success: true, message: 'Report sent to manager', data: { report } });
  } catch (err) {
    console.error('[dept-messages] POST /report', err);
    res.status(500).json({ success: false, message: 'Failed to send report' });
  }
});

// POST /api/dept-messages/employee-reports/:id/respond
// Manager responds to an employee report
router.post('/employee-reports/:id/respond', ensureAuthenticated, ensureManagerOrAdmin, async (req, res) => {
  try {
    const { response } = req.body;
    if (!response) return res.status(400).json({ success: false, message: 'response is required' });

    const report = await EmployeeReport.findOneAndUpdate(
      { _id: req.params.id, toManager: req.user._id },
      { managerResponse: response, status: 'acknowledged', respondedAt: new Date() },
      { new: true }
    ).populate('fromEmployee', 'name email');

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.json({ success: true, data: { report } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to respond to report' });
  }
});

module.exports = router;
