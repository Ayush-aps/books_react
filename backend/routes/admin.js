/**
 * Admin API routes for user management, content moderation, and system reports
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Book = require("../models/Book");
const Order = require("../models/Order");
const Complaint = require("../models/Complaint");
const { ensureAuthenticated, ensureAdmin } = require("../middleware/auth");

/**
 * @route   GET /api/admin/users
 * @desc    Get all users for management
 * @access  Private (Admin)
 */
router.get("/users", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { search, role, status } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

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
});

/**
 * @route   PUT /api/admin/user/:id/role
 * @desc    Update user role
 * @access  Private (Admin)
 */
router.put("/user/:id/role", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
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
});

/**
 * @route   PUT /api/admin/user/:id/status
 * @desc    Toggle user active status
 * @access  Private (Admin)
 */
router.put("/user/:id/status", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Toggle isVerified status
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
});

/**
 * @route   DELETE /api/admin/user/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete("/user/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    await user.remove();

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
});

/**
 * @route   GET /api/admin/reports
 * @desc    Get system health reports and analytics
 * @access  Private (Admin)
 */
router.get("/reports", ensureAuthenticated, ensureAdmin, async (req, res) => {
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

    // Calculate total revenue
    const allOrders = await Order.find({ orderStatus: { $in: ["delivered", "shipped"] } });
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Sales by genre (top 5 genres)
    const salesByGenre = await Book.aggregate([
      { $match: { isAvailable: true } },
      { $unwind: "$genres" },
      { $group: {
          _id: "$genres",
          count: { $sum: 1 },
          revenue: { $sum: { $ifNull: ["$discountPrice", "$price"] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: {
          _id: 0,
          name: "$_id",
          count: 1,
          revenue: 1,
          percentage: { $multiply: [{ $divide: ["$count", bookCount || 1] }, 100] }
        }
      }
    ]);

    // Top selling books (by review count as proxy)
    const topSellingBooks = await Book.find({ isAvailable: true })
      .sort({ reviewCount: -1, sold: -1 })
      .limit(5)
      .select('title author coverImage price discountPrice reviewCount sold');

    // Top sellers (users with most books sold)
    const topSellers = await Book.aggregate([
      { $match: { isAvailable: true } },
      { $group: {
          _id: "$seller",
          totalBooks: { $sum: 1 },
          totalSold: { $sum: { $ifNull: ["$sold", 0] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "seller"
        }
      },
      { $unwind: "$seller" },
      { $project: {
          _id: 0,
          sellerId: "$_id",
          name: "$seller.name",
          email: "$seller.email",
          totalBooks: 1,
          totalSold: 1
        }
      }
    ]);

    // Revenue by month (last 12 months)
    const revenueByMonth = await Order.aggregate([
      { $match: { 
          orderStatus: { $in: ["delivered", "shipped"] },
          orderDate: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
        }
      },
      { $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" }
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $project: {
          _id: 0,
          month: {
            $arrayElemAt: [
              ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
              { $subtract: ["$_id.month", 1] }
            ]
          },
          revenue: 1,
          orders: 1
        }
      }
    ]);

    // User activity stats
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = await User.countDocuments({ 
      createdAt: { $gte: firstDayOfMonth } 
    });
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    });

    // Mock system health data (in production, this would come from actual system monitoring)
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
        counts: {
          users: userCount,
          books: bookCount,
          orders: orderCount,
        },
        userDistribution: {
          buyers: buyerCount,
          sellers: sellerCount,
          admins: adminCount,
        },
        bookDistribution: {
          new: newBookCount,
          used: usedBookCount,
        },
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
        userActivity: {
          newUsersThisMonth,
          activeUsers,
          totalOrders: orderCount
        },
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
});

/**
 * @route   GET /api/admin/content
 * @desc    Get books for content moderation
 * @access  Private (Admin)
 */
router.get("/content", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status === "pending") {
      query.isApproved = false;
    } else if (status === "approved") {
      query.isApproved = true;
    }

    // Get pending books
    const pendingBooks = await Book.find({ isApproved: false })
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    // Get approved books
    const approvedBooks = await Book.find({ isApproved: true })
      .populate("seller", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      message: "Content retrieved successfully",
      data: {
        pendingBooks,
        approvedBooks,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching content",
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/admin/content/:id/approve
 * @desc    Approve book
 * @access  Private (Admin)
 */
router.post("/content/:id/approve", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });

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
});

/**
 * @route   POST /api/admin/content/:id/reject
 * @desc    Reject and delete book
 * @access  Private (Admin)
 */
router.post("/content/:id/reject", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.json({
      success: true,
      message: "Book rejected and removed",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error rejecting book",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/admin/content/:id
 * @desc    Get book details for moderation
 * @access  Private (Admin)
 */
router.get("/content/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
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
});

/**
 * @route   GET /api/admin/complaints
 * @desc    Get all complaints with filtering
 * @access  Private (Admin)
 */
router.get("/complaints", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { status, role, source, search } = req.query;

    // Build filter object
    let filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (role && role !== "all") {
      filter.userRole = role;
    }

    if (source && source !== "all") {
      filter.source = source;
    }

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const complaints = await Complaint.find(filter).populate("user", "name email").sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Complaints retrieved successfully",
      data: { complaints },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error loading complaints",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/admin/complaints/:id
 * @desc    Get individual complaint details
 * @access  Private (Admin)
 */
router.get("/complaints/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate("user", "name email");

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
});

/**
 * @route   POST /api/admin/complaints/:id/respond
 * @desc    Admin response to a complaint
 * @access  Private (Admin)
 */
router.post("/complaints/:id/respond", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const complaintId = req.params.id;

    if (!status || !adminResponse) {
      return res.status(400).json({
        success: false,
        message: "Status and response are required",
      });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Update complaint with admin response
    complaint.status = status;
    complaint.adminResponse = adminResponse;
    complaint.updatedAt = Date.now();

    await complaint.save();

    res.json({
      success: true,
      message: "Response submitted successfully",
      data: { complaint },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error submitting response",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders for admin
 * @access  Private (Admin)
 */
router.get("/orders", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    let query = {};

    // Apply status filter
    if (status && status !== "all") {
      query.orderStatus = status;
    }

    // Apply search filter
    if (search) {
      query.$or = [{ orderId: { $regex: search, $options: "i" } }, { "shippingAddress.name": { $regex: search, $options: "i" } }];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalOrders = await Order.countDocuments(query);

    // Get orders with user and book details
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
});

/**
 * @route   PUT /api/admin/order/:id
 * @desc    Update order status and delivery info
 * @access  Private (Admin)
 */
router.put("/order/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { orderStatus, expectedDelivery, trackingNumber, carrier, trackingUrl, adminNotes } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update order details
    if (orderStatus) order.orderStatus = orderStatus;
    if (adminNotes) order.adminNotes = adminNotes;

    if (expectedDelivery) {
      order.expectedDelivery = new Date(expectedDelivery);
    }

    // Update tracking information
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
});

/**
 * @route   GET /api/admin/books
 * @desc    Browse all books with filtering and sorting
 * @access  Private (Admin)
 */
router.get("/books", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { search, genre, condition, minPrice, maxPrice, sort, approvalStatus } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { author: { $regex: search, $options: "i" } }];
    }

    if (genre) {
      query.genres = genre;
    }

    if (condition) query.condition = condition;
    if (approvalStatus) query.isApproved = approvalStatus === "approved";

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Build sort options
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
        sortOptions = { createdAt: -1 }; // newest first
    }

    // Get all unique genres for filter dropdown
    const genres = await Book.distinct("genres");

    // Get books with populated seller info
    const books = await Book.find(query).populate("seller", "name email").sort(sortOptions);

    res.json({
      success: true,
      message: "Books retrieved successfully",
      data: {
        books,
        genres,
        filters: {
          search,
          genre,
          condition,
          minPrice,
          maxPrice,
          sort,
          approvalStatus,
        },
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
});

/**
 * @route   GET /api/admin/seed-admin
 * @desc    Create initial admin account
 * @access  Public (only for initial setup)
 */
router.get("/seed-admin", async (req, res) => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: "Admin account already exists",
      });
    }

    // Create admin account
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
});

module.exports = router;
