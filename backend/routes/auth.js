/**
 * Authentication API routes for user registration, login, and logout
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const {
  register,
  login,
  logout,
  getMe,
  checkAuth,
} = require("../controllers/authController");

// Routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", ensureAuthenticated, getMe);
router.get("/check", checkAuth);

module.exports = router;
