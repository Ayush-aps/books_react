/**
 * Authentication middleware for role-based access control
 * API version - returns JSON instead of redirecting
 */

/**
 * Ensures user is authenticated
 */
module.exports.ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
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
module.exports.ensureBuyer = function (req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'buyer') {
    return next();
  }

  if (req.isAuthenticated()) {
    let message = 'Access denied. This resource is only accessible to buyers.';
    if (req.user.role === 'seller') {
      message = 'This section is only accessible to buyers. Please use the seller dashboard.';
    } else if (req.user.role === 'admin') {
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
module.exports.ensureSeller = function (req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'seller') {
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
module.exports.ensureBuyerOnly = function (req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'buyer') {
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
module.exports.ensureAdmin = function (req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
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
