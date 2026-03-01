/**
 * Seller Routes
 * All seller-related routes
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureSeller } = require("../middleware/auth");
const { pdfUpload } = require("../middleware/upload");
const {
  // Dashboard
  getDashboard,
  // Inventory Management
  getInventory,
  // Book Management
  createBook,
  searchBooks,
  lookupBookByISBN,
  getBookDetails,
  updateBook,
  deleteBook,
  getAllBooks,
  // Order Management
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  // Complaint Management
  getAllComplaints,
  createComplaint,
  getComplaintDetails,
  addComplaintComment,
} = require("../controllers/sellerController");

// ============================================
// DASHBOARD ROUTES
// ============================================
router.get("/dashboard", ensureAuthenticated, ensureSeller, getDashboard);

// ============================================
// INVENTORY MANAGEMENT ROUTES
// ============================================
router.get("/inventory", ensureAuthenticated, ensureSeller, getInventory);

// ============================================
// BOOK MANAGEMENT ROUTES
// ============================================
router.get("/books", ensureAuthenticated, ensureSeller, getAllBooks);
router.get("/books/search", ensureAuthenticated, ensureSeller, searchBooks);
router.get("/books/lookup/:isbn", ensureAuthenticated, ensureSeller, lookupBookByISBN);
router.post("/books", ensureAuthenticated, ensureSeller, pdfUpload.single('epubFile'), createBook);
router.get("/books/:id", ensureAuthenticated, ensureSeller, getBookDetails);
router.put("/books/:id", ensureAuthenticated, ensureSeller, pdfUpload.single('epubFile'), updateBook);
router.delete("/books/:id", ensureAuthenticated, ensureSeller, deleteBook);

// ============================================
// ORDER MANAGEMENT ROUTES
// ============================================
router.get("/orders", ensureAuthenticated, ensureSeller, getAllOrders);
router.get("/orders/:id", ensureAuthenticated, ensureSeller, getOrderDetails);
router.put("/orders/:id/status", ensureAuthenticated, ensureSeller, updateOrderStatus);

// ============================================
// COMPLAINT MANAGEMENT ROUTES
// ============================================
router.get("/complaints", ensureAuthenticated, ensureSeller, getAllComplaints);
router.post("/complaints", ensureAuthenticated, ensureSeller, createComplaint);
router.get("/complaints/:id", ensureAuthenticated, ensureSeller, getComplaintDetails);
router.post("/complaints/:id/comment", ensureAuthenticated, ensureSeller, addComplaintComment);

module.exports = router;

