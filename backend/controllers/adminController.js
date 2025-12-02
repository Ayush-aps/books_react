/**
 * Admin Controller
 * Handles all admin-related operations
 */

const User = require("../models/User");
const Book = require("../models/Book");
const Order = require("../models/Order");
const Complaint = require("../models/Complaint");

// ============================================
// USER MANAGEMENT
// ============================================

// @desc    Get all users for management
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) query.role = role;

    if (status === "active") {
      query.isVerified = true;
    } else if (status === "inactive") {
      query.isVerified = false;
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Users retrieved successfully",
      data: { users },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: err.message,
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["buyer", "seller", "admin"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User role updated successfully",
      data: { user },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating user role",
      error: err.message,
    });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isVerified ? "activated" : "deactivated"} successfully`,
      data: { user },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating user status",
      error: err.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: err.message,
    });
  }
};

// @desc    Create initial admin account
// @route   GET /api/admin/seed-admin
// @access  Public (only for initial setup)
exports.seedAdmin = async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: "Admin account already exists",
      });
    }

    const admin = new User({
      name: "Admin",
      email: "admin@bookish.in",
      password: "admin123",
      role: "admin",
      isVerified: true,
    });

    await admin.save();

    res.json({
      success: true,
      message: "Admin account created successfully. Please login with email: admin@bookish.in and password: admin123",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error creating admin account",
      error: err.message,
    });
  }
};

// ============================================
// REPORTS & ANALYTICS
// ============================================

// @desc    Get system health reports and analytics
// @route   GET /api/admin/reports
// @access  Private (Admin)
exports.getReports = async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const bookCount = await Book.countDocuments();
    const orderCount = await Order.countDocuments();

    // Get user distribution by role
    const buyerCount = await User.countDocuments({ role: "buyer" });
    const sellerCount = await User.countDocuments({ role: "seller" });
    const adminCount = await User.countDocuments({ role: "admin" });

    // Get book distribution by condition
    const newBookCount = await Book.countDocuments({ condition: "new" });
    const usedBookCount = await Book.countDocuments({ condition: "used" });

    // Get order distribution by status
    const processingOrderCount = await Order.countDocuments({ orderStatus: "processing" });
    const shippedOrderCount = await Order.countDocuments({ orderStatus: "shipped" });
    const deliveredOrderCount = await Order.countDocuments({ orderStatus: "delivered" });
    const cancelledOrderCount = await Order.countDocuments({ orderStatus: "cancelled" });

    // Get recent users
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);

    // Get recent orders
    const recentOrders = await Order.find().populate("buyer", "name email").sort({ orderDate: -1 }).limit(5);

    // Calculate total admin revenue (5% commission from delivered orders only)
    const allOrders = await Order.find({ orderStatus: "delivered" });
    const totalRevenue = allOrders.reduce((sum, order) => {
      // Use adminCommission if calculated, otherwise calculate 5% of subtotal
      if (order.adminCommission && order.adminCommission > 0) {
        return sum + order.adminCommission;
      } else {
        // Fallback for old orders: calculate 5% of items total
        const subtotal = order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
        return sum + (subtotal * 0.05);
      }
    }, 0);

    // Sales by genre (top 5 genres)
    const salesByGenre = await Book.aggregate([
      { $match: { isAvailable: true } },
      { $unwind: "$genres" },
      {
        $group: {
          _id: "$genres",
          count: { $sum: 1 },
          revenue: { $sum: { $ifNull: ["$discountPrice", "$price"] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
          revenue: 1,
          percentage: { $multiply: [{ $divide: ["$count", bookCount || 1] }, 100] },
        },
      },
    ]);

    // Top selling books - based on actual order data
    const topSellingBooks = await Order.aggregate([
      { $match: { orderStatus: { $in: ["delivered", "shipped", "processing"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.book",
          soldCount: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { soldCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "bookDetails"
        }
      },
      { $unwind: "$bookDetails" },
      {
        $project: {
          _id: 0,
          title: "$bookDetails.title",
          author: "$bookDetails.author",
          coverImage: "$bookDetails.coverImage",
          soldCount: 1,
          revenue: 1
        }
      }
    ]);

    // Top sellers - based on actual order data
    const topSellers = await Order.aggregate([
      { $match: { orderStatus: { $in: ["delivered", "shipped", "processing"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.seller",
          totalSales: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "sellerDetails"
        }
      },
      { $unwind: "$sellerDetails" },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "seller",
          as: "books"
        }
      },
      {
        $project: {
          _id: 0,
          sellerId: "$_id",
          name: "$sellerDetails.name",
          email: "$sellerDetails.email",
          totalSales: 1,
          revenue: 1,
          booksListed: { $size: "$books" }
        }
      }
    ]);

    // Revenue by month (last 12 months)
    const revenueByMonth = await Order.aggregate([
      {
        $match: {
          orderStatus: { $in: ["delivered", "shipped"] },
          orderDate: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $arrayElemAt: [
              ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
              { $subtract: ["$_id.month", 1] },
            ],
          },
          revenue: 1,
          orders: 1,
        },
      },
    ]);

    // User activity stats
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: firstDayOfMonth },
    });
    
    // Count active users based on isVerified status (includes buyers and sellers)
    const activeUsers = await User.countDocuments({
      isVerified: true,
      role: { $in: ["buyer", "seller"] }
    });

    const systemHealth = {
      cpu: "32%",
      memory: "1.2GB / 4GB",
      disk: "12GB / 50GB",
      uptime: "7 days, 3 hours",
      lastRestart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    res.json({
      success: true,
      message: "Reports retrieved successfully",
      data: {
        counts: { users: userCount, books: bookCount, orders: orderCount },
        userDistribution: { buyers: buyerCount, sellers: sellerCount, admins: adminCount },
        bookDistribution: { new: newBookCount, used: usedBookCount },
        orderDistribution: {
          processing: processingOrderCount,
          shipped: shippedOrderCount,
          delivered: deliveredOrderCount,
          cancelled: cancelledOrderCount,
        },
        totalRevenue,
        salesByGenre,
        topSellingBooks,
        topSellers,
        revenueByMonth,
        userActivity: { newUsersThisMonth, activeUsers, totalOrders: orderCount },
        recentUsers,
        recentOrders,
        systemHealth,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error generating reports",
      error: err.message,
    });
  }
};

// ============================================
// CONTENT MODERATION
// ============================================

// @desc    Get books for content moderation
// @route   GET /api/admin/content
// @access  Private (Admin)
exports.getContent = async (req, res) => {
  try {
    // Pending books: not approved and no rejection reason (never reviewed or re-submitted)
    const pendingBooks = await Book.find({
      isApproved: false,
      $or: [
        { rejectionReason: null },
        { rejectionReason: { $exists: false } }
      ]
    })
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    const approvedBooks = await Book.find({ isApproved: true })
      .populate("seller", "name email")
      .sort({ approvalDate: -1 });

    // Rejected books for admin reference
    const rejectedBooks = await Book.find({
      isApproved: false,
      rejectionReason: { $exists: true, $ne: null }
    })
      .populate("seller", "name email")
      .sort({ rejectionDate: -1 });

    res.json({
      success: true,
      message: "Content retrieved successfully",
      data: { pendingBooks, approvedBooks, rejectedBooks },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching content",
      error: err.message,
    });
  }
};

// @desc    Approve book
// @route   POST /api/admin/content/:id/approve
// @access  Private (Admin)
exports.approveBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: true,
        approvalDate: new Date(),
        rejectionReason: null,
        rejectionDate: null,
      },
      { new: true }
    ).populate("seller", "name email");

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.json({
      success: true,
      message: "Book approved successfully",
      data: { book },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error approving book",
      error: err.message,
    });
  }
};

// @desc    Reject book with reason (keeps in seller's inventory for reference)
// @route   POST /api/admin/content/:id/reject
// @access  Private (Admin)
exports.rejectBook = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: false,
        rejectionReason: reason,
        rejectionDate: new Date(),
        approvalDate: null,
      },
      { new: true }
    ).populate("seller", "name email");

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.json({
      success: true,
      message: "Book rejected successfully. Seller will be notified.",
      data: { book },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error rejecting book",
      error: err.message,
    });
  }
};

// @desc    Get book details for moderation
// @route   GET /api/admin/content/:id
// @access  Private (Admin)
exports.getBookDetails = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("seller", "name email")
      .populate("originalOwner", "name email");

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.json({
      success: true,
      message: "Book details retrieved successfully",
      data: { book },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching book details",
      error: err.message,
    });
  }
};

// ============================================
// COMPLAINT MANAGEMENT
// ============================================

// @desc    Get all complaints with filtering
// @route   GET /api/admin/complaints
// @access  Private (Admin)
exports.getAllComplaints = async (req, res) => {
  try {
    const { status, role, category, priority, search, page = 1, limit = 20 } = req.query;
    let filter = {};

    if (status && status !== "all") filter.status = status;
    if (role && role !== "all") filter.userRole = role;
    if (category && category !== "all") filter.category = category;
    if (priority && priority !== "all") filter.priority = priority;

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalComplaints = await Complaint.countDocuments(filter);

    const complaints = await Complaint.find(filter)
      .populate("user", "name email role")
      .populate("assignedTo", "name email")
      .populate("order", "totalAmount createdAt")
      .populate("book", "title author")
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      message: "Complaints retrieved successfully",
      data: {
        complaints,
        pagination: {
          total: totalComplaints,
          page: parseInt(page),
          pages: Math.ceil(totalComplaints / parseInt(limit)),
          limit: parseInt(limit)
        }
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error loading complaints",
      error: err.message,
    });
  }
};

// @desc    Get individual complaint details
// @route   GET /api/admin/complaints/:id
// @access  Private (Admin)
exports.getComplaintDetails = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("user", "name email role phone")
      .populate("assignedTo", "name email")
      .populate({
        path: "order",
        select: "totalAmount createdAt _id",
        populate: {
          path: "items.seller",
          select: "name email"
        }
      })
      .populate("book", "title author coverImage")
      .populate("comments.user", "name role")
      .populate("resolution.resolvedBy", "name");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    res.json({
      success: true,
      message: "Complaint details retrieved successfully",
      data: { complaint },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error loading complaint details",
      error: err.message,
    });
  }
};

// @desc    Update complaint status and priority
// @route   PATCH /api/admin/complaints/:id/status
// @access  Private (Admin)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;
    if (assignedTo) complaint.assignedTo = assignedTo;

    await complaint.save();
    await complaint.populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: "Complaint updated successfully",
      data: { complaint },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating complaint",
      error: err.message,
    });
  }
};

// @desc    Admin add comment to complaint
// @route   POST /api/admin/complaints/:id/comment
// @access  Private (Admin)
exports.addComplaintComment = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.comments.push({
      user: req.user._id,
      userRole: 'admin',
      message: message.trim()
    });

    // Auto-update status to in-progress if pending
    if (complaint.status === 'pending') {
      complaint.status = 'in-progress';
    }

    await complaint.save();
    await complaint.populate('comments.user', 'name role');

    res.json({
      success: true,
      message: "Comment added successfully",
      data: { complaint },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error adding comment",
      error: err.message,
    });
  }
};

// @desc    Resolve complaint
// @route   POST /api/admin/complaints/:id/resolve
// @access  Private (Admin)
exports.resolveComplaint = async (req, res) => {
  try {
    const { action, details, adminResponse } = req.body;

    if (!action || !details) {
      return res.status(400).json({
        success: false,
        message: "Resolution action and details are required",
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.status = 'resolved';
    complaint.adminResponse = adminResponse || details;
    complaint.resolution = {
      action,
      details,
      resolvedAt: Date.now(),
      resolvedBy: req.user._id
    };

    await complaint.save();
    await complaint.populate('resolution.resolvedBy', 'name');

    res.json({
      success: true,
      message: "Complaint resolved successfully",
      data: { complaint },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error resolving complaint",
      error: err.message,
    });
  }
};

// ============================================
// ORDER MANAGEMENT
// ============================================

// @desc    Get all orders for admin
// @route   GET /api/admin/orders
// @access  Private (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    let query = {};

    if (status && status !== "all") query.orderStatus = status;

    if (search) {
      query.$or = [{ orderId: { $regex: search, $options: "i" } }, { "shippingAddress.name": { $regex: search, $options: "i" } }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalOrders = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate("buyer", "name email")
      .populate("items.book", "title author coverImage")
      .populate("items.seller", "name email")
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      message: "Orders retrieved successfully",
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / parseInt(limit)),
          totalOrders,
          limit: parseInt(limit),
        },
        activeFilters: {
          status: status || "all",
          search: search || "",
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error loading orders",
      error: err.message,
    });
  }
};

// @desc    Update order status and delivery info
// @route   PUT /api/admin/orders/:id
// @access  Private (Admin)
exports.updateOrder = async (req, res) => {
  try {
    const { orderStatus, expectedDelivery, trackingNumber, carrier, trackingUrl, adminNotes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (adminNotes) order.adminNotes = adminNotes;
    if (expectedDelivery) order.expectedDelivery = new Date(expectedDelivery);

    if (trackingNumber || carrier) {
      order.trackingInfo = order.trackingInfo || {};
      if (trackingNumber) order.trackingInfo.trackingNumber = trackingNumber;
      if (carrier) order.trackingInfo.carrier = carrier;
      if (trackingUrl) order.trackingInfo.trackingUrl = trackingUrl;
    }

    await order.save();

    res.json({
      success: true,
      message: "Order updated successfully",
      data: { order },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating order",
      error: err.message,
    });
  }
};

// ============================================
// BOOK MANAGEMENT
// ============================================

// @desc    Browse all books with filtering and sorting
// @route   GET /api/admin/books
// @access  Private (Admin)
exports.getAllBooks = async (req, res) => {
  try {
    const { search, genre, condition, minPrice, maxPrice, sort, approvalStatus } = req.query;
    const query = {};

    if (search) {
      // Production-grade search - split terms for better matching
      const searchTerms = search.trim().split(/\s+/);
      const searchRegex = new RegExp(searchTerms.join('|'), 'i');
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { description: searchRegex }
      ];
    }

    if (genre) query.genres = genre;
    if (condition) query.condition = condition;
    if (approvalStatus) query.isApproved = approvalStatus === "approved";

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOptions = {};
    switch (sort) {
      case "price-asc":
        sortOptions = { price: 1 };
        break;
      case "price-desc":
        sortOptions = { price: -1 };
        break;
      case "rating":
        sortOptions = { rating: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const genres = await Book.distinct("genres");
    const books = await Book.find(query).populate("seller", "name email").sort(sortOptions);

    res.json({
      success: true,
      message: "Books retrieved successfully",
      data: {
        books,
        genres,
        filters: { search, genre, condition, minPrice, maxPrice, sort, approvalStatus },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching books",
      error: err.message,
    });
  }
};

