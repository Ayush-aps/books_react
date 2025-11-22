/**
 * Admin Routes
 * All admin-related routes
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require("../middleware/auth");
const {
  // User Management
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  seedAdmin,
  // Reports & Analytics
  getReports,
  // Content Moderation
  getContent,
  approveBook,
  rejectBook,
  getBookDetails,
  // Complaint Management
  getAllComplaints,
  getComplaintDetails,
  updateComplaintStatus,
  addComplaintComment,
  resolveComplaint,
  // Order Management
  getAllOrders,
  updateOrder,
  // Book Management
  getAllBooks,
} = require("../controllers/adminController");

// ============================================
// USER MANAGEMENT ROUTES
// ============================================
router.get("/users", ensureAuthenticated, ensureAdmin, getAllUsers);
router.put("/users/:id/role", ensureAuthenticated, ensureAdmin, updateUserRole);
router.put("/users/:id/status", ensureAuthenticated, ensureAdmin, toggleUserStatus);
router.delete("/users/:id", ensureAuthenticated, ensureAdmin, deleteUser);
router.get("/seed-admin", seedAdmin);

// ============================================
// REPORTS & ANALYTICS ROUTES
// ============================================
router.get("/reports", ensureAuthenticated, ensureAdmin, getReports);

// ============================================
// CONTENT MODERATION ROUTES
// ============================================
router.get("/content", ensureAuthenticated, ensureAdmin, getContent);
router.post("/content/:id/approve", ensureAuthenticated, ensureAdmin, approveBook);
router.post("/content/:id/reject", ensureAuthenticated, ensureAdmin, rejectBook);
router.get("/content/:id", ensureAuthenticated, ensureAdmin, getBookDetails);

// ============================================
// COMPLAINT MANAGEMENT ROUTES
// ============================================
router.get("/complaints", ensureAuthenticated, ensureAdmin, getAllComplaints);
router.get("/complaints/:id", ensureAuthenticated, ensureAdmin, getComplaintDetails);
router.patch("/complaints/:id/status", ensureAuthenticated, ensureAdmin, updateComplaintStatus);
router.post("/complaints/:id/comment", ensureAuthenticated, ensureAdmin, addComplaintComment);
router.post("/complaints/:id/resolve", ensureAuthenticated, ensureAdmin, resolveComplaint);

// ============================================
// ORDER MANAGEMENT ROUTES
// ============================================
router.get("/orders", ensureAuthenticated, ensureAdmin, getAllOrders);
router.put("/orders/:id", ensureAuthenticated, ensureAdmin, updateOrder);

// ============================================
// BOOK MANAGEMENT ROUTES
// ============================================
router.get("/books", ensureAuthenticated, ensureAdmin, getAllBooks);

module.exports = router;

