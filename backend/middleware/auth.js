/**
 * Authentication middleware for role-based access control
 * API version - returns JSON instead of redirecting
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getTokenFromHeader = (req) => {
  const authHeader = req.headers?.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
};

const getSessionUser = (req) => {
  if (typeof req.isAuthenticated === "function" && req.isAuthenticated() && req.user) {
    return req.user;
  }
  return null;
};

const getTokenUser = async (req) => {
  const token = getTokenFromHeader(req);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "jwt-fallback-secret");
    const user = await User.findById(decoded.id)
      .select("_id name email role avatar isVerified verificationStatus")
      .lean();
    if (!user) return null;

    req.user = user;
    return user;
  } catch (error) {
    return null;
  }
};

const resolveUser = async (req) => {
  const sessionUser = getSessionUser(req);
  if (sessionUser) return sessionUser;
  return getTokenUser(req);
};

/**
 * Ensures user is authenticated
 */
module.exports.ensureAuthenticated = async function (req, res, next) {
  const user = await resolveUser(req);
  if (user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Please log in to access this resource'
  });
};

/**
 * Ensures user has buyer role
 */
module.exports.ensureBuyer = async function (req, res, next) {
  const user = await resolveUser(req);

  if (user && user.role === 'buyer') {
    return next();
  }

  if (user) {
    let message = 'Access denied. This resource is only accessible to buyers.';
    if (user.role === 'seller') {
      message = 'This section is only accessible to buyers. Please use the seller dashboard.';
    } else if (user.role === 'admin') {
      message = 'This section is only accessible to buyers. Please use the admin dashboard.';
    }
    return res.status(403).json({ success: false, message });
  }

  return res.status(401).json({
    success: false,
    message: 'Please log in as a buyer to access this resource'
  });
};

/**
 * Ensures user has seller role
 */
module.exports.ensureSeller = async function (req, res, next) {
  const user = await resolveUser(req);
  if (user && user.role === 'seller') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. This resource is only for sellers.'
  });
};

/**
 * Ensures user has buyer role (simplified version for videos/content)
 */
module.exports.ensureBuyerOnly = async function (req, res, next) {
  const user = await resolveUser(req);
  if (user && user.role === 'buyer') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Only buyers can access this resource'
  });
};

/**
 * Ensures user has admin role
 */
module.exports.ensureAdmin = async function (req, res, next) {
  const user = await resolveUser(req);
  if (user && user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. This resource is only for administrators.'
  });
};

/**
 * Forwards authenticated users (used for login/register routes)
 */
module.exports.forwardAuthenticated = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }

  // Return user info if already authenticated
  return res.status(200).json({
    success: true,
    message: 'User already authenticated',
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar
    }
  });
};

/**
 * Generic role-checking middleware factory
 * Usage: checkRole('admin', 'moderator')
 */
module.exports.checkRole = function (...roles) {
  return async function (req, res, next) {
    const user = await resolveUser(req);
    if (user && roles.includes(user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${roles.join(', ')}.`
    });
  };
};

/**
 * Ensures user has moderator or admin role
 */
module.exports.ensureModeratorOrAdmin = module.exports.checkRole('admin', 'moderator');

/**
 * Ensures user's verificationStatus is 'approved'
 * Only enforced for roles that require verification (seller, employee, moderator)
 * Buyers and admins bypass this check.
 */
module.exports.ensureApprovedUser = function (req, res, next) {
  const rolesRequiringApproval = ['seller', 'employee', 'moderator'];
  resolveUser(req)
    .then((user) => {
      if (
        user &&
        rolesRequiringApproval.includes(user.role) &&
        user.verificationStatus !== 'approved'
      ) {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending verification. Please wait for approval.'
        });
      }
      return next();
    })
    .catch(() => next());
};

module.exports.resolveAuthenticatedUser = resolveUser;
