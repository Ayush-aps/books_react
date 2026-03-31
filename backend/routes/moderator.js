/**
 * Moderator Routes
 */

const express = require("express");
const router = express.Router();
const {
    ensureAuthenticated,
    ensureModeratorOrAdmin,
    checkRole,
} = require("../middleware/auth");
const {
    // Existing
    getPendingUsers,
    verifyUser,
    getEmployeeStats,
    getApprovedBooks,
    getApprovedUsers,
    // User Management
    getModeratorUsers,
    getModeratorUser,
    moderatorDeleteUser,
    moderatorPromoteEmployee,
    // Analytics
    getGlobalStats,
    // Book Locking
    claimBook,
    releaseBook,
    // Orders & Reports
    getModeratorOrders,
    updateModeratorOrderStatus,
    getModeratorReports,
    // Complaint Resolution
    resolveComplaint,
    // Book Approve/Reject
    moderatorReviewBook,
} = require("../controllers/moderatorController");

// ============================================
// USER VERIFICATION QUEUE
// ============================================
router.get("/pending-users", ensureAuthenticated, ensureModeratorOrAdmin, getPendingUsers);
router.post("/verify-user", ensureAuthenticated, ensureModeratorOrAdmin, verifyUser);

// ============================================
// EMPLOYEE COMPLAINT STATISTICS
// ============================================
router.get("/employee-stats", ensureAuthenticated, ensureModeratorOrAdmin, getEmployeeStats);

// ============================================
// VERIFIED LIBRARY
// ============================================
router.get("/approved-books", ensureAuthenticated, ensureModeratorOrAdmin, getApprovedBooks);
router.get("/approved-users", ensureAuthenticated, ensureModeratorOrAdmin, getApprovedUsers);

// ============================================
// USER MANAGEMENT (MODERATOR-SCOPED)
// ============================================
router.get("/users", ensureAuthenticated, ensureModeratorOrAdmin, getModeratorUsers);
router.get("/users/:id", ensureAuthenticated, ensureModeratorOrAdmin, getModeratorUser);
router.delete("/users/:id", ensureAuthenticated, ensureModeratorOrAdmin, moderatorDeleteUser);
router.put("/users/:id/promote", ensureAuthenticated, ensureModeratorOrAdmin, moderatorPromoteEmployee);
router.post("/users/:id/verify", ensureAuthenticated, ensureModeratorOrAdmin, verifyUser);

// ============================================
// GLOBAL ANALYTICS
// ============================================
router.get("/global-stats", ensureAuthenticated, ensureModeratorOrAdmin, getGlobalStats);

// ============================================
// BOOK LOCKING & REVIEW
// ============================================
router.patch("/books/:id/claim", ensureAuthenticated, ensureModeratorOrAdmin, claimBook);
router.patch("/books/:id/release", ensureAuthenticated, ensureModeratorOrAdmin, releaseBook);
router.patch("/books/:id/review", ensureAuthenticated, ensureModeratorOrAdmin, moderatorReviewBook);

// ============================================
// COMPLAINT RESOLUTION
// ============================================
router.patch("/complaints/:id/resolve", ensureAuthenticated, ensureModeratorOrAdmin, resolveComplaint);

// ============================================
// ORDER MANAGEMENT & REPORTS (Admin, Moderator, Employee)
// ============================================
const ensureStaffAccess = checkRole("admin", "moderator", "employee");

router.get("/orders", ensureAuthenticated, ensureStaffAccess, getModeratorOrders);
router.patch("/orders/:id/status", ensureAuthenticated, ensureStaffAccess, updateModeratorOrderStatus);
router.get("/reports", ensureAuthenticated, ensureStaffAccess, getModeratorReports);

module.exports = router;


