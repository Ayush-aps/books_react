/**
 * Manager Routes (previously Moderator)
 */

const express = require("express");
const router = express.Router();
const {
    ensureAuthenticated,
    ensureManagerOrAdmin,
    checkRole,
} = require("../middleware/auth");
const {
    // Existing
    getPendingUsers,
    verifyUser,
    getEmployeeStats,
    getApprovedBooks,
    getApprovedUsers,
    // New — User Management
    getModeratorUsers,
    getModeratorUser,
    moderatorDeleteUser,
    moderatorPromoteEmployee,
    // New — Analytics
    getGlobalStats,
    // New — Book Locking
    claimBook,
    releaseBook,
    // New — Orders & Reports
    getModeratorOrders,
    updateModeratorOrderStatus,
    getModeratorReports,
} = require("../controllers/moderatorController");

// ============================================
// USER VERIFICATION QUEUE
// ============================================
router.get("/pending-users", ensureAuthenticated, ensureManagerOrAdmin, getPendingUsers);
router.post("/verify-user", ensureAuthenticated, ensureManagerOrAdmin, verifyUser);

// ============================================
// EMPLOYEE COMPLAINT STATISTICS
// ============================================
router.get("/employee-stats", ensureAuthenticated, ensureManagerOrAdmin, getEmployeeStats);

// ============================================
// VERIFIED LIBRARY
// ============================================
router.get("/approved-books", ensureAuthenticated, ensureManagerOrAdmin, getApprovedBooks);
router.get("/approved-users", ensureAuthenticated, ensureManagerOrAdmin, getApprovedUsers);

// ============================================
// USER MANAGEMENT (MODERATOR-SCOPED)
// ============================================
router.get("/users", ensureAuthenticated, ensureManagerOrAdmin, getModeratorUsers);
router.get("/users/:id", ensureAuthenticated, ensureManagerOrAdmin, getModeratorUser);
router.delete("/users/:id", ensureAuthenticated, ensureManagerOrAdmin, moderatorDeleteUser);
router.put("/users/:id/promote", ensureAuthenticated, ensureManagerOrAdmin, moderatorPromoteEmployee);
router.post("/users/:id/verify", ensureAuthenticated, ensureManagerOrAdmin, verifyUser);

// ============================================
// GLOBAL ANALYTICS
// ============================================
router.get("/global-stats", ensureAuthenticated, ensureManagerOrAdmin, getGlobalStats);

// ============================================
// BOOK LOCKING
// ============================================
router.patch("/books/:id/claim", ensureAuthenticated, ensureManagerOrAdmin, claimBook);
router.patch("/books/:id/release", ensureAuthenticated, ensureManagerOrAdmin, releaseBook);

// ============================================
// ORDER MANAGEMENT & REPORTS (Admin, Moderator, Employee)
// ============================================
const ensureStaffAccess = checkRole("admin", "manager", "employee");

router.get("/orders", ensureAuthenticated, ensureStaffAccess, getModeratorOrders);
router.patch("/orders/:id/status", ensureAuthenticated, ensureStaffAccess, updateModeratorOrderStatus);
router.get("/reports", ensureAuthenticated, ensureStaffAccess, getModeratorReports);

module.exports = router;


