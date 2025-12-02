/**
 * Buyer Routes
 * All buyer-related routes
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { ensureAuthenticated, ensureBuyer } = require("../middleware/auth");

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/img/users');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
    }
  }
});

const {
  // Dashboard
  getDashboard,
  trackBookView,
  // Cart Management
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  // Checkout
  getCheckout,
  // Address Management
  getAllAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  // Profile Management
  getProfile,
  updateProfile,
  // Complaint Management
  getAllComplaints,
  createComplaint,
  getComplaintDetails,
  addComplaintComment,
  // Book Browsing
  browseBooks,
  getBookDetails,
  // Order Management
  getAllOrders,
  getOrderDetails,
} = require("../controllers/buyerController");

// ============================================
// DASHBOARD ROUTES
// ============================================
router.get("/dashboard", ensureAuthenticated, ensureBuyer, getDashboard);
router.post("/track-view/:bookId", ensureAuthenticated, ensureBuyer, trackBookView);

// ============================================
// CART MANAGEMENT ROUTES
// ============================================
// Cart operations available to all authenticated users
router.get("/cart", ensureAuthenticated, getCart);
router.post("/cart/add/:bookId", ensureAuthenticated, addToCart);
router.put("/cart/update/:itemId", ensureAuthenticated, updateCartItem);
router.delete("/cart/remove/:itemId", ensureAuthenticated, removeFromCart);
router.delete("/cart/clear", ensureAuthenticated, clearCart);

// Save for Later
const { saveForLater, moveToCart, removeFromSaved } = require("../controllers/buyerController");
router.post("/cart/save-for-later/:itemId", ensureAuthenticated, saveForLater);
router.post("/cart/move-to-cart/:itemId", ensureAuthenticated, moveToCart);
router.delete("/cart/saved/:itemId", ensureAuthenticated, removeFromSaved);

// ============================================
// CHECKOUT ROUTES
// ============================================
router.get("/checkout", ensureAuthenticated, ensureBuyer, getCheckout);

// ============================================
// ADDRESS MANAGEMENT ROUTES
// ============================================
router.get("/addresses", ensureAuthenticated, ensureBuyer, getAllAddresses);
router.post("/addresses", ensureAuthenticated, ensureBuyer, createAddress);
router.put("/addresses/:id", ensureAuthenticated, ensureBuyer, updateAddress);
router.delete("/addresses/:id", ensureAuthenticated, ensureBuyer, deleteAddress);

// ============================================
// PROFILE MANAGEMENT ROUTES
// ============================================
router.get("/profile", ensureAuthenticated, ensureBuyer, getProfile);
router.put("/profile", ensureAuthenticated, ensureBuyer, upload.single('avatar'), updateProfile);

// ============================================
// COMPLAINT MANAGEMENT ROUTES
// ============================================
router.get("/complaints", ensureAuthenticated, ensureBuyer, getAllComplaints);
router.post("/complaints", ensureAuthenticated, ensureBuyer, createComplaint);
router.get("/complaints/:id", ensureAuthenticated, ensureBuyer, getComplaintDetails);
router.post("/complaints/:id/comment", ensureAuthenticated, ensureBuyer, addComplaintComment);

// ============================================
// BOOK BROWSING ROUTES
// ============================================
// Browsing available to all authenticated users
router.get("/browse", ensureAuthenticated, browseBooks);
router.get("/browse/:id", ensureAuthenticated, getBookDetails);
// Alias route for book details (frontend uses /buyer/book/:id)
router.get("/book/:id", ensureAuthenticated, getBookDetails);

// ============================================
// ORDER MANAGEMENT ROUTES
// ============================================
router.get("/orders", ensureAuthenticated, ensureBuyer, getAllOrders);
router.get("/orders/:id", ensureAuthenticated, ensureBuyer, getOrderDetails);

module.exports = router;

