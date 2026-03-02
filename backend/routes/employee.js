/**
 * Employee Routes
 * Routes for employee operations: book verification and complaint management.
 * All routes require employee, moderator, or admin role.
 */

const express = require("express");
const router = express.Router();
const {
    ensureAuthenticated,
    checkRole,
} = require("../middleware/auth");
const {
    getPendingBooks,
    reviewBook,
    getComplaints,
    claimComplaint,
    resolveComplaint,
    escalateComplaint,
} = require("../controllers/employeeController");

// Shared middleware: employee, moderator, or admin
const ensureEmployeeAccess = checkRole("employee", "moderator", "admin");

// ============================================
// BOOK VERIFICATION ROUTES
// ============================================
router.get("/pending-books", ensureAuthenticated, ensureEmployeeAccess, getPendingBooks);
router.post("/review-book", ensureAuthenticated, ensureEmployeeAccess, reviewBook);

// ============================================
// COMPLAINT MANAGEMENT ROUTES
// ============================================
router.get("/complaints", ensureAuthenticated, ensureEmployeeAccess, getComplaints);
router.patch("/claim-complaint", ensureAuthenticated, ensureEmployeeAccess, claimComplaint);
router.post("/resolve-complaint", ensureAuthenticated, ensureEmployeeAccess, resolveComplaint);
router.post("/escalate-complaint", ensureAuthenticated, ensureEmployeeAccess, escalateComplaint);

module.exports = router;
