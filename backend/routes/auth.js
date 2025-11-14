/**
 * Authentication API routes for user registration, login, and logout
 */

const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");
const { ensureAuthenticated, forwardAuthenticated } = require("../middleware/auth");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", async (req, res) => {
  const { name, email, password, password2, role } = req.body;
  const errors = [];
  
  // Trim inputs
  req.body.name = name?.trim();
  req.body.email = email?.trim();
  
  // Check required fields
  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please fill in all fields" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push({ msg: "Invalid email format" });
  }
  
  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters" });
  }

  // Name should contain only alphabets and spaces
  if (!/^[A-Za-z\s]+$/.test(name)) {
    errors.push({ msg: "Name should contain only alphabets" });
  }

  // Validate role
  const validRoles = ["buyer", "seller"];
  if (!validRoles.includes(role)) {
    errors.push({ msg: "Invalid role selected" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        errors: [{ msg: "Email is already registered" }],
      });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "You are now registered and can log in",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "An error occurred during registration",
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "An error occurred during login",
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info.message || "Invalid credentials",
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "An error occurred during login",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
        },
      });
    });
  })(req, res, next);
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error logging out",
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get("/me", ensureAuthenticated, (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      phone: req.user.phone,
      address: req.user.address,
      isVerified: req.user.isVerified,
      createdAt: req.user.createdAt,
    },
  });
});

/**
 * @route   GET /api/auth/check
 * @desc    Check if user is authenticated
 * @access  Public
 */
router.get("/check", (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
      },
    });
  }
  
  return res.status(200).json({
    success: true,
    authenticated: false,
    user: null,
  });
});

module.exports = router;
