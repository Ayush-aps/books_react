/**
 * Moderator Routes
 * Routes for moderator-specific operations (user verification and employee stats)
 * All routes require admin or moderator role.
 */

const express = require("express");
const router = express.Router();
const {
    ensureAuthenticated,
    ensureModeratorOrAdmin,
} = require("../middleware/auth");
const {
    getPendingUsers,
    verifyUser,
    getEmployeeStats,
    getApprovedBooks,
    getApprovedUsers,
} = require("../controllers/moderatorController");

// ============================================
// USER VERIFICATION QUEUE
// ============================================
router.get(
    "/pending-users",
    ensureAuthenticated,
    ensureModeratorOrAdmin,
    getPendingUsers
);

// ============================================
// VERIFICATION ACTION
// ============================================
router.post(
    "/verify-user",
    ensureAuthenticated,
    ensureModeratorOrAdmin,
    verifyUser
);

// ============================================
// EMPLOYEE COMPLAINT STATISTICS
// ============================================
router.get(
    "/employee-stats",
    ensureAuthenticated,
    ensureModeratorOrAdmin,
    getEmployeeStats
);

// ============================================
// VERIFIED LIBRARY
// ============================================
router.get(
    "/approved-books",
    ensureAuthenticated,
    ensureModeratorOrAdmin,
    getApprovedBooks
);

router.get(
    "/approved-users",
    ensureAuthenticated,
    ensureModeratorOrAdmin,
    getApprovedUsers
);

module.exports = router;
