/**
 * TaskService
 * Handles task creation and the Least-Workload auto-assignment algorithm.
 */

const Task = require('../models/Task');
const User = require('../models/User');

/**
 * Least Workload Algorithm.
 * Finds the approved employee in a department with the fewest active tasks.
 * Returns the employee ObjectId or null if none found.
 */
const getLeastWorkloadEmployee = async (department) => {
  const employees = await User.find({
    role: 'employee',
    department,
    verificationStatus: 'approved',
  }).select('_id');

  if (employees.length === 0) return null;

  const employeeIds = employees.map((e) => e._id);

  // Count active (assigned + in_progress) tasks per employee
  const workloads = await Task.aggregate([
    {
      $match: {
        assignedTo: { $in: employeeIds },
        status: { $in: ['assigned', 'in_progress'] },
      },
    },
    { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
  ]);

  const workloadMap = {};
  workloads.forEach((w) => {
    workloadMap[w._id.toString()] = w.count;
  });

  let minEmployee = null;
  let minCount = Infinity;
  employeeIds.forEach((id) => {
    const count = workloadMap[id.toString()] || 0;
    if (count < minCount) {
      minCount = count;
      minEmployee = id;
    }
  });

  return minEmployee;
};

/**
 * Create a platform task.
 * Does NOT auto-assign — manager assigns from dashboard.
 */
const createTask = async ({ title, description, department, eventType, priority = 'medium', relatedEntity = null }) => {
  try {
    const task = await Task.create({
      title,
      description: description || '',
      department,
      eventType,
      priority,
      status: 'pending',
      relatedEntity: relatedEntity || { entityType: null, entityId: null },
    });
    console.log(`[TaskService] Task created — id=${task._id} dept=${department} type=${eventType}`);
    return task;
  } catch (err) {
    console.error('[TaskService] createTask FAILED:', err.message, '| dept:', department, '| type:', eventType);
    if (err.errors) {
      Object.entries(err.errors).forEach(([field, e]) =>
        console.error(`  Validation error on "${field}": ${e.message}`)
      );
    }
    return null;
  }
};

module.exports = { createTask, getLeastWorkloadEmployee };
