/**
 * Task Routes
 * /api/tasks
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const ManagerMessage = require('../models/ManagerMessage');
const User = require('../models/User');
const { ensureAuthenticated, checkRole } = require('../middleware/auth');
const { getLeastWorkloadEmployee } = require('../services/taskService');

const ensureStaff = checkRole('manager', 'admin', 'employee');
const ensureManagerOrAdmin = checkRole('manager', 'admin');

// ── GET /api/tasks ─────────────────────────────────────────────────────────
// Manager: all tasks in their department
// Employee: tasks assigned to them
// Admin: all tasks (optional ?department= filter)
router.get('/', ensureAuthenticated, ensureStaff, async (req, res) => {
  try {
    const user = req.user;
    const { status, department } = req.query;

    let query = {};
    if (user.role === 'manager') {
      query.department = user.department;
      if (status) query.status = status;
    } else if (user.role === 'employee') {
      query.assignedTo = user._id;
      if (status) query.status = status;
    } else if (user.role === 'admin') {
      if (department) query.department = department;
      if (status) query.status = status;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name email')
      .populate('escalatedTo', 'name email department')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, data: { tasks } });
  } catch (err) {
    console.error('[tasks] GET /', err);
    res.status(500).json({ success: false, message: 'Failed to load tasks' });
  }
});

// ── GET /api/tasks/stats ────────────────────────────────────────────────────
router.get('/stats', ensureAuthenticated, ensureManagerOrAdmin, async (req, res) => {
  try {
    const user = req.user;
    const dept = user.role === 'manager' ? user.department : (req.query.department || undefined);

    const matchStage = dept ? { department: dept } : {};
    const statusAgg = await Task.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byStatus = { pending: 0, assigned: 0, in_progress: 0, resolved: 0, escalated: 0, total: 0 };
    statusAgg.forEach((s) => { byStatus[s._id] = s.count; byStatus.total += s.count; });

    // Employee performance: resolved + active + total tasks
    const perfAgg = await Task.aggregate([
      { $match: { ...(dept ? { department: dept } : {}), assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          totalTasks:    { $sum: 1 },
          resolvedTasks: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          activeTasks:   { $sum: { $cond: [{ $in: ['$status', ['assigned', 'in_progress']] }, 1, 0] } },
        }
      },
      {
        $lookup: {
          from: 'users', localField: '_id', foreignField: '_id', as: 'emp',
          pipeline: [{ $project: { name: 1, email: 1 } }],
        }
      },
      { $unwind: { path: '$emp', preserveNullAndEmpty: true } },
      { $sort: { resolvedTasks: -1 } },
      { $limit: 20 },
    ]);

    const employeePerformance = perfAgg.map((p) => ({
      _id:          p._id,
      name:         p.emp?.name  || null,
      email:        p.emp?.email || null,
      totalTasks:   p.totalTasks,
      resolvedTasks:p.resolvedTasks,
      activeTasks:  p.activeTasks,
    }));

    res.json({ success: true, data: { byStatus, employeePerformance } });
  } catch (err) {
    console.error('[tasks] GET /stats', err);
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
});

// ── POST /api/tasks/:id/assign ─────────────────────────────────────────────
// Manager assigns a task to the least-workload employee (or a specific one)
router.post('/:id/assign', ensureAuthenticated, ensureManagerOrAdmin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Manager can only assign tasks in their department
    if (req.user.role === 'manager' && task.department !== req.user.department) {
      return res.status(403).json({ success: false, message: 'Not your department' });
    }

    let employeeId = req.body.employeeId || null;
    if (!employeeId) {
      employeeId = await getLeastWorkloadEmployee(task.department);
    }
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No approved employees available in this department' });
    }

    // Atomic update to prevent race condition
    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ['pending', 'escalated'] } },
      { assignedTo: employeeId, assignedBy: req.user._id, status: 'assigned' },
      { new: true }
    )
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name email');

    if (!updated) {
      return res.status(409).json({ success: false, message: 'Task already assigned or not in assignable state' });
    }

    res.json({ success: true, message: 'Task assigned successfully', data: { task: updated } });
  } catch (err) {
    console.error('[tasks] POST /:id/assign', err);
    res.status(500).json({ success: false, message: 'Failed to assign task' });
  }
});

// ── PATCH /api/tasks/:id/status ────────────────────────────────────────────
// Employee updates task progress; manager can also resolve
router.patch('/:id/status', ensureAuthenticated, ensureStaff, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const user = req.user;

    if (!status) return res.status(400).json({ success: false, message: 'status is required' });

    const VALID = ['assigned', 'in_progress', 'resolved', 'escalated'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID.join(', ')}` });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Employees can only update their own tasks
    if (user.role === 'employee') {
      if (!task.assignedTo || task.assignedTo.toString() !== user._id.toString()) {
        return res.status(403).json({ success: false, message: 'This task is not assigned to you' });
      }
    }

    const updateData = { status };
    if (notes) updateData.notes = notes;
    if (status === 'resolved') updateData.completedAt = new Date();
    if (status === 'in_progress') {
      // Lock the task to prevent duplicate processing
      updateData.lockedBy = user._id;
      updateData.lockedAt = new Date();
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('assignedTo', 'name email');

    res.json({ success: true, data: { task: updated } });
  } catch (err) {
    console.error('[tasks] PATCH /:id/status', err);
    res.status(500).json({ success: false, message: 'Failed to update task status' });
  }
});

// ── POST /api/tasks/:id/escalate ───────────────────────────────────────────
// Manager escalates a task to another department
router.post('/:id/escalate', ensureAuthenticated, ensureManagerOrAdmin, async (req, res) => {
  try {
    const { targetDepartment, reason } = req.body;
    if (!targetDepartment || !reason) {
      return res.status(400).json({ success: false, message: 'targetDepartment and reason are required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Find target department manager
    const targetManager = await User.findOne({ role: 'manager', department: targetDepartment });
    if (!targetManager) {
      return res.status(404).json({ success: false, message: `No manager found for ${targetDepartment} department` });
    }

    // Mark original task as escalated
    await Task.findByIdAndUpdate(req.params.id, {
      status: 'escalated',
      escalatedTo: targetManager._id,
      escalationReason: reason,
    });

    // Create a new task in the target department
    const newTask = await Task.create({
      title: `[ESCALATED] ${task.title}`,
      description: `${task.description || ''}\n\nEscalated from ${task.department} dept by ${req.user.name}.\nReason: ${reason}`,
      department: targetDepartment,
      eventType: task.eventType,
      priority: 'high',
      status: 'pending',
      relatedEntity: task.relatedEntity,
      escalatedFrom: req.user._id,
    });

    // Send a manager-to-manager message
    await ManagerMessage.create({
      fromManager: req.user._id,
      toManager: targetManager._id,
      subject: `Escalation Request: ${task.title}`,
      body: `I need your team's help with the following issue:\n\n${reason}\n\nA task has been created in your department dashboard.`,
      relatedTask: newTask._id,
      status: 'pending',
    });

    res.json({ success: true, message: `Task escalated to ${targetDepartment} department` });
  } catch (err) {
    console.error('[tasks] POST /:id/escalate', err);
    res.status(500).json({ success: false, message: 'Failed to escalate task' });
  }
});

// ── GET /api/tasks/employees ───────────────────────────────────────────────
// Manager gets list of employees in their department (for manual assignment)
// Returns each employee with their current active task count
router.get('/employees', ensureAuthenticated, ensureManagerOrAdmin, async (req, res) => {
  try {
    const dept = req.user.role === 'manager' ? req.user.department : req.query.department;
    const rawEmployees = await User.find({
      role: 'employee',
      department: dept,
      verificationStatus: 'approved',
    }).select('name email department').lean();

    // Attach active task counts
    const empIds = rawEmployees.map((e) => e._id);
    const activeCounts = await Task.aggregate([
      { $match: { assignedTo: { $in: empIds }, status: { $in: ['assigned', 'in_progress'] } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    activeCounts.forEach((c) => { countMap[c._id.toString()] = c.count; });

    const employees = rawEmployees.map((e) => ({
      ...e,
      activeTasks: countMap[e._id.toString()] || 0,
    }));

    res.json({ success: true, data: { employees } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load employees' });
  }
});

module.exports = router;
