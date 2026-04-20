/**
 * Authentication Controller
 */

const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { securityLogger } = require("../middleware/logger");
const cacheService = require("../utils/cacheService");
const { resolveAuthenticatedUser } = require("../middleware/auth");

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
  const validRoles = ["buyer", "seller", "employee"];
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

    // Log successful registration
    securityLogger('USER_REGISTERED', req, {
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role
    });

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
      // Log failed login attempt
      securityLogger('LOGIN_FAILED', req, {
        email: req.body.email,
        reason: info.message || 'Invalid credentials'
      });

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

      // Log successful login
      securityLogger('LOGIN_SUCCESS', req, {
        userId: user._id,
        email: user.email,
        role: user.role
      });

      const token = jwt.sign(
        {
          id: user._id,
          role: user.role,
          email: user.email,
        },
        process.env.JWT_SECRET || "jwt-fallback-secret",
        { expiresIn: process.env.JWT_EXPIRE || "7d" }
      );

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
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

    // Log logout event
    securityLogger('LOGOUT', req, {
      userId: req.user?._id,
      email: req.user?.email
    });

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
  const userPayload = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
    phone: req.user.phone,
    address: req.user.address,
    isVerified: req.user.isVerified,
    createdAt: req.user.createdAt,
  };

  return res.status(200).json({ success: true, user: userPayload });
};

// @desc    Check if user is authenticated
// @route   GET /api/auth/check
// @access  Public
exports.checkAuth = async (req, res) => {
  const resolvedUser = await resolveAuthenticatedUser(req);

  if (resolvedUser) {
    try {
      const userId = resolvedUser._id.toString();
      const cacheKey = `user:${userId}`;
      const totalTimer = "[PERF] GET /api/auth/check total";
      const dbTimer = "[PERF] GET /api/auth/check db";
      console.time(totalTimer);

      const cachedUser = await cacheService.get(cacheKey);
      if (cachedUser) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        console.timeEnd(totalTimer);
        return res.status(200).json({
          success: true,
          authenticated: true,
          user: cachedUser,
          source: "redis",
        });
      }

      // Fetch fresh user data from database when cache misses.
      console.time(dbTimer);
      const freshUser = await User.findById(resolvedUser._id)
        .select("_id name email role avatar phone address isVerified createdAt")
        .lean();
      console.timeEnd(dbTimer);

      if (freshUser) {
        await cacheService.set(cacheKey, freshUser, 300);
        console.log(`[CACHE SET] ${cacheKey} ttl=300s`);
        console.timeEnd(totalTimer);
        return res.status(200).json({
          success: true,
          authenticated: true,
          user: freshUser,
          source: "db",
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

