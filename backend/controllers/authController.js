/**
 * Authentication Controller
 */

const passport = require("passport");
const User = require("../models/User");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { name, email, password, password2, role } = req.body;
  const errors = [];

  // Check required fields
  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please fill in all fields" });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters" });
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
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = (req, res, next) => {
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
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res, next) => {
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
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = (req, res) => {
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
};

// @desc    Check if user is authenticated
// @route   GET /api/auth/check
// @access  Public
exports.checkAuth = async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      // Fetch fresh user data from database to get updated avatar and other fields
      const User = require('../models/User');
      const freshUser = await User.findById(req.user._id).select('-password');
      
      if (freshUser) {
        return res.status(200).json({
          success: true,
          authenticated: true,
          user: {
            _id: freshUser._id,
            name: freshUser.name,
            email: freshUser.email,
            role: freshUser.role,
            avatar: freshUser.avatar,
            phone: freshUser.phone,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching fresh user data:', error);
    }
    
    // Fallback to session user if database fetch fails
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
};

