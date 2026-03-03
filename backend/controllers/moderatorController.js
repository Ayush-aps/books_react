/**
 * Moderator Controller
 * Handles moderator-specific operations: user verification queue,
 * verification actions, and employee complaint statistics.
 */

const User = require("../models/User");
const Complaint = require("../models/Complaint");
const Book = require("../models/Book");
const Order = require("../models/Order");

// ============================================
// USER VERIFICATION QUEUE
// ============================================

/**
 * @desc    Get all users with pending verification status
 * @route   GET /api/admin/moderator/pending-users
 * @access  Private (Admin, Moderator)
 */
exports.getPendingUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role } = req.query;

        // Build query: only sellers, employees, and moderators can be pending
        const query = {
            verificationStatus: "pending",
            role: { $in: ["seller", "employee", "moderator"] },
        };

        // Optionally filter by specific role
        if (role && ["seller", "employee", "moderator"].includes(role)) {
            query.role = role;
        }

        const totalUsers = await User.countDocuments(query);

        const pendingUsers = await User.find(query)
            .select("name email role verificationStatus phone createdAt")
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            message: "Pending users retrieved successfully",
            data: {
                users: pendingUsers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalUsers / parseInt(limit)),
                    totalUsers,
                    limit: parseInt(limit),
                },
            },
        });
    } catch (err) {
        console.error("Error fetching pending users:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching pending users",
            error: err.message,
        });
    }
};

// ============================================
// USER VERIFICATION ACTION
// ============================================

/**
 * @desc    Approve or reject a user's verification
 * @route   POST /api/admin/moderator/verify-user
 * @access  Private (Admin, Moderator)
 */
exports.verifyUser = async (req, res) => {
    try {
        const userId = req.body.userId || req.params.id;
        const { action } = req.body;

        // Validate input
        if (!userId || !action) {
            return res.status(400).json({
                success: false,
                message: "User ID and action ('approve' or 'reject') are required",
            });
        }

        if (!["approve", "reject"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Action must be 'approve' or 'reject'",
            });
        }

        // Find the target user
        const targetUser = await User.findById(userId);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // SAFETY: Moderator cannot verify an Admin account
        if (targetUser.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Cannot verify or modify an admin account",
            });
        }

        // SAFETY: Buyers don't need verification
        if (targetUser.role === "buyer") {
            return res.status(400).json({
                success: false,
                message: "Buyer accounts do not require verification",
            });
        }

        // Update verification status
        targetUser.verificationStatus =
            action === "approve" ? "approved" : "rejected";
        targetUser.managedBy = req.user._id;

        await targetUser.save();

        res.json({
            success: true,
            message: `User ${action === "approve" ? "approved" : "rejected"} successfully`,
            data: {
                user: {
                    _id: targetUser._id,
                    name: targetUser.name,
                    email: targetUser.email,
                    role: targetUser.role,
                    verificationStatus: targetUser.verificationStatus,
                    managedBy: targetUser.managedBy,
                },
            },
        });
    } catch (err) {
        console.error("Error verifying user:", err);
        res.status(500).json({
            success: false,
            message: "Error verifying user",
            error: err.message,
        });
    }
};

// ============================================
// EMPLOYEE COMPLAINT STATISTICS
// ============================================

/**
 * @desc    Get resolved complaint statistics per employee
 * @route   GET /api/admin/moderator/employee-stats
 * @access  Private (Admin, Moderator)
 */
exports.getEmployeeStats = async (req, res) => {
    try {
        const stats = await Complaint.aggregate([
            // Match only resolved complaints that have a resolvedBy field
            {
                $match: {
                    status: "resolved",
                    "resolution.resolvedBy": { $exists: true, $ne: null },
                },
            },
            // Group by the user who resolved the complaint
            {
                $group: {
                    _id: "$resolution.resolvedBy",
                    totalResolved: { $sum: 1 },
                    lastResolvedAt: { $max: "$resolution.resolvedAt" },
                },
            },
            // Lookup user details
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "employee",
                },
            },
            { $unwind: "$employee" },
            // Filter only employees
            {
                $match: {
                    "employee.role": "employee",
                },
            },
            // Shape the output
            {
                $project: {
                    _id: 0,
                    employeeId: "$employee._id",
                    name: "$employee.name",
                    email: "$employee.email",
                    verificationStatus: "$employee.verificationStatus",
                    totalResolved: 1,
                    lastResolvedAt: 1,
                },
            },
            // Sort by most resolutions first
            { $sort: { totalResolved: -1 } },
        ]);

        res.json({
            success: true,
            message: "Employee statistics retrieved successfully",
            data: {
                employees: stats,
                totalEmployees: stats.length,
            },
        });
    } catch (err) {
        console.error("Error fetching employee stats:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching employee statistics",
            error: err.message,
        });
    }
};

// ============================================
// VERIFIED LIBRARY — APPROVED BOOKS
// ============================================

/**
 * @desc    Get approved books (Verified Library) with search
 * @route   GET /api/admin/moderator/approved-books
 * @access  Private (Admin, Moderator)
 */
exports.getApprovedBooks = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;

        const query = { approvalStatus: "approved" };

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [
                { title: regex },
                { isbn: regex },
                { author: regex },
            ];
        }

        const totalBooks = await Book.countDocuments(query);

        const books = await Book.find(query)
            .populate("seller", "name email")
            .populate("reviewedBy", "name email")
            .select("title author isbn coverImage approvalStatus approvalDate reviewedBy seller createdAt")
            .sort({ approvalDate: -1, createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            message: "Approved books retrieved successfully",
            data: {
                books,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalBooks / parseInt(limit)),
                    totalBooks,
                    limit: parseInt(limit),
                },
            },
        });
    } catch (err) {
        console.error("Error fetching approved books:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching approved books",
            error: err.message,
        });
    }
};

// ============================================
// VERIFIED LIBRARY — APPROVED USERS
// ============================================

/**
 * @desc    Get approved users (Verified Library) with search
 * @route   GET /api/admin/moderator/approved-users
 * @access  Private (Admin, Moderator)
 */
exports.getApprovedUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role } = req.query;

        const query = { verificationStatus: "approved" };

        if (role && ["seller", "employee", "moderator", "buyer"].includes(role)) {
            query.role = role;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [
                { name: regex },
                { email: regex },
            ];
        }

        const totalUsers = await User.countDocuments(query);

        const users = await User.find(query)
            .select("name email role verificationStatus managedBy createdAt")
            .populate("managedBy", "name email")
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            message: "Approved users retrieved successfully",
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalUsers / parseInt(limit)),
                    totalUsers,
                    limit: parseInt(limit),
                },
            },
        });
    } catch (err) {
        console.error("Error fetching approved users:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching approved users",
            error: err.message,
        });
    }
};

// ============================================
// USER MANAGEMENT (MODERATOR-SCOPED)
// ============================================



/**
 * @desc    Get all manageable users (excludes Admin and Moderator accounts)
 * @route   GET /api/admin/moderator/users
 * @access  Private (Admin, Moderator)
 */
exports.getModeratorUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role } = req.query;

        // Moderators can only see and manage buyer/seller/employee
        const query = {
            role: { $in: ["buyer", "seller", "employee"] },
        };

        if (role && ["buyer", "seller", "employee"].includes(role)) {
            query.role = role;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [{ name: regex }, { email: regex }];
        }

        const totalUsers = await User.countDocuments(query);
        const users = await User.find(query)
            .select("name email role verificationStatus createdAt")
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            message: "Users retrieved successfully",
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalUsers / parseInt(limit)),
                    totalUsers,
                    limit: parseInt(limit),
                },
            },
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ success: false, message: "Error fetching users", error: err.message });
    }
};

/**
 * @desc    Get a single user's full profile
 * @route   GET /api/admin/moderator/users/:id
 * @access  Private (Admin, Moderator)
 */
exports.getModeratorUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("name email role verificationStatus avatar phone address managedBy createdAt isVerified")
            .populate("managedBy", "name email role");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Hierarchy guard
        if (["moderator", "admin"].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: "Cannot view Moderator or Admin profiles.",
            });
        }

        res.json({ success: true, message: "User profile retrieved", data: { user } });
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ success: false, message: "Error fetching user", error: err.message });
    }
};

/**
 * @desc    Delete a user (Buyer, Seller, or Employee only — not Moderator/Admin)
 * @route   DELETE /api/admin/moderator/users/:id
 * @access  Private (Admin, Moderator)
 */
exports.moderatorDeleteUser = async (req, res) => {
    try {
        const target = await User.findById(req.params.id);

        if (!target) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // HIERARCHY GUARD: Moderators cannot remove other Moderators or Admins
        if (["moderator", "admin"].includes(target.role)) {
            return res.status(403).json({
                success: false,
                message: "Moderators cannot remove Admin or Moderator accounts. Only an Admin can do this.",
            });
        }

        await User.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: `User "${target.name}" (${target.role}) deleted successfully`,
        });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ success: false, message: "Error deleting user", error: err.message });
    }
};

/**
 * @desc    Promote an Employee to Moderator
 * @route   PUT /api/admin/moderator/users/:id/promote
 * @access  Private (Admin, Moderator)
 */
exports.moderatorPromoteEmployee = async (req, res) => {
    try {
        const target = await User.findById(req.params.id);

        if (!target) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (target.role !== "employee") {
            return res.status(400).json({
                success: false,
                message: `Only employees can be promoted to moderator. Target user is: ${target.role}`,
            });
        }

        target.role = "moderator";
        target.managedBy = req.user._id;
        await target.save();

        res.json({
            success: true,
            message: `"${target.name}" has been promoted to Moderator`,
            data: { user: { _id: target._id, name: target.name, email: target.email, role: target.role } },
        });
    } catch (err) {
        console.error("Error promoting user:", err);
        res.status(500).json({ success: false, message: "Error promoting user", error: err.message });
    }
};

// ============================================
// GLOBAL ANALYTICS
// ============================================

/**
 * @desc    Get platform-wide stats (total books, orders, revenue + breakdowns)
 * @route   GET /api/admin/moderator/global-stats
 * @access  Private (Admin, Moderator)
 */
exports.getGlobalStats = async (req, res) => {
    try {
        const Subscription = require("../models/Subscription");

        const [
            totalBooks,
            totalUsers,
            orderAgg,
            subscriptionAgg,
            sellerLeaderboard,
            activeBuyers,
            activeSubscribers,
        ] = await Promise.all([
            // Total books
            Book.countDocuments(),
            // Total manageable users
            User.countDocuments({ role: { $in: ["buyer", "seller", "employee"] } }),
            // Orders aggregate — total + physical revenue
            Order.aggregate([
                { $match: { paymentStatus: "completed" } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        ordersRevenue: { $sum: "$totalAmount" },
                        // Use $cond not $ifNull — schema defaults subtotal/tax/shipping to 0, not null
                        physicalRevenue: {
                            $sum: {
                                $cond: [{ $gt: ["$subtotal", 0] }, "$subtotal", "$totalAmount"]
                            }
                        },
                        taxRevenue: { $sum: { $ifNull: ["$tax", 0] } },
                        shippingRevenue: { $sum: { $ifNull: ["$shippingCost", 0] } },
                        // count orders that have a breakdown (subtotal > 0)
                        ordersWithBreakdown: {
                            $sum: { $cond: [{ $gt: ["$subtotal", 0] }, 1, 0] }
                        },
                    },
                },
            ]),
            // Subscription revenue aggregate
            Subscription.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: null,
                        activeSubscriptions: { $sum: 1 },
                        subscriptionRevenue: { $sum: { $ifNull: ["$paymentDetails.amount", 0] } },
                    },
                },
            ]),
            // Top 10 sellers by order revenue
            Order.aggregate([
                { $match: { paymentStatus: "completed" } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.seller",
                        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                        totalSales: { $sum: "$items.quantity" },
                    },
                },
                { $sort: { totalRevenue: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "seller",
                    },
                },
                { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        sellerId: "$_id",
                        name: "$seller.name",
                        email: "$seller.email",
                        totalRevenue: 1,
                        totalSales: 1,
                    },
                },
            ]),
            // Active buyers (placed at least 1 order)
            Order.distinct("buyer", { paymentStatus: "completed" }),
            // Active subscribers
            Subscription.countDocuments({ isActive: true }),
        ]);

        const {
            totalOrders = 0,
            ordersRevenue = 0,
            physicalRevenue = 0,
            taxRevenue = 0,
            shippingRevenue = 0,
        } = orderAgg[0] || {};

        const {
            activeSubscriptions = 0,
            subscriptionRevenue = 0,
        } = subscriptionAgg[0] || {};

        // True gross = all completed order payments + all subscription payments
        const platformRevenue = ordersRevenue + subscriptionRevenue;

        res.json({
            success: true,
            message: "Global stats retrieved successfully",
            data: {
                totalBooks,
                totalUsers,
                totalOrders,
                totalRevenue: platformRevenue,
                // Revenue breakdown (all parts add up to totalRevenue)
                revenue: {
                    platform: platformRevenue,
                    physical: physicalRevenue,
                    tax: taxRevenue,
                    shipping: shippingRevenue,
                    subscriptions: subscriptionRevenue,
                },
                // Seller leaderboard
                sellerLeaderboard,
                // Activity
                activeBuyersCount: activeBuyers.length,
                activeSubscribersCount: activeSubscribers,
            },
        });
    } catch (err) {
        console.error("Error fetching global stats:", err);
        res.status(500).json({ success: false, message: "Error fetching global stats", error: err.message });
    }
};


// ============================================
// BOOK LOCKING (CLAIM / RELEASE)
// ============================================

/**
 * @desc    Claim/lock a pending book for review
 * @route   PATCH /api/admin/moderator/books/:id/claim
 * @access  Private (Admin, Moderator)
 */
exports.claimBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate("lockedBy", "name");

        if (!book) {
            return res.status(404).json({ success: false, message: "Book not found" });
        }

        if (book.approvalStatus !== "pending") {
            return res.status(400).json({ success: false, message: "Book is not pending review" });
        }

        // Already claimed by another user
        if (book.lockedBy && book.lockedBy._id.toString() !== req.user._id.toString()) {
            return res.status(409).json({
                success: false,
                message: `This book is already under review by ${book.lockedBy.name}`,
            });
        }

        book.lockedBy = req.user._id;
        book.lockedAt = new Date();
        await book.save();

        res.json({
            success: true,
            message: `Book "${book.title}" claimed for review`,
            data: { bookId: book._id, lockedBy: req.user._id, lockedAt: book.lockedAt },
        });
    } catch (err) {
        console.error("Error claiming book:", err);
        res.status(500).json({ success: false, message: "Error claiming book", error: err.message });
    }
};

/**
 * @desc    Release a book back to the general pool
 * @route   PATCH /api/admin/moderator/books/:id/release
 * @access  Private (Admin, Moderator)
 */
exports.releaseBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ success: false, message: "Book not found" });
        }

        if (!book.lockedBy) {
            return res.status(400).json({ success: false, message: "Book is not currently claimed" });
        }

        // Only the claiming moderator or an Admin can release
        const isOwner = book.lockedBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You can only release a book that you have claimed",
            });
        }

        book.lockedBy = null;
        book.lockedAt = null;
        await book.save();

        res.json({
            success: true,
            message: `Book "${book.title}" released back to the review pool`,
        });
    } catch (err) {
        console.error("Error releasing book:", err);
        res.status(500).json({ success: false, message: "Error releasing book", error: err.message });
    }
};


// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * @desc    Get all orders for moderation
 * @route   GET /api/admin/moderator/orders
 * @access  Private (Admin, Moderator, Employee)
 */
exports.getModeratorOrders = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        let query = {};

        if (status && status !== "all") query.orderStatus = status;

        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: "i" } },
                { "shippingAddress.name": { $regex: search, $options: "i" } }
            ];
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
            },
        });
    } catch (err) {
        console.error("Error fetching moderator orders:", err);
        res.status(500).json({ success: false, message: "Error fetching orders", error: err.message });
    }
};

/**
 * @desc    Update order status
 * @route   PATCH /api/admin/moderator/orders/:id/status
 * @access  Private (Admin, Moderator, Employee)
 */
exports.updateModeratorOrderStatus = async (req, res) => {
    try {
        const { orderStatus, adminNotes } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (orderStatus) order.orderStatus = orderStatus;
        if (adminNotes) order.adminNotes = adminNotes;

        await order.save();

        res.json({
            success: true,
            message: "Order status updated successfully",
            data: { order },
        });
    } catch (err) {
        console.error("Error updating order status:", err);
        res.status(500).json({ success: false, message: "Error updating order status", error: err.message });
    }
};

// ============================================
// REPORTS & ANALYTICS
// ============================================

/**
 * @desc    Get platform reports and analytics
 * @route   GET /api/admin/moderator/reports
 * @access  Private (Admin, Moderator, Employee)
 */
exports.getModeratorReports = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const bookCount = await Book.countDocuments();
        const orderCount = await Order.countDocuments();

        // Role distribution
        const buyerCount = await User.countDocuments({ role: "buyer" });
        const sellerCount = await User.countDocuments({ role: "seller" });
        const employeeCount = await User.countDocuments({ role: "employee" });

        // Order distribution
        const processingOrderCount = await Order.countDocuments({ orderStatus: "processing" });
        const deliveredOrderCount = await Order.countDocuments({ orderStatus: "delivered" });
        const cancelledOrderCount = await Order.countDocuments({ orderStatus: "cancelled" });

        // Recent activity
        const recentOrders = await Order.find()
            .populate("buyer", "name email")
            .sort({ orderDate: -1 })
            .limit(10);

        // Revenue by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const revenueByMonth = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $in: ["delivered", "shipped", "processing"] },
                    orderDate: { $gte: sixMonthsAgo },
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

        res.json({
            success: true,
            message: "Reports retrieved successfully",
            data: {
                counts: { users: userCount, books: bookCount, orders: orderCount },
                userDistribution: { buyers: buyerCount, sellers: sellerCount, employees: employeeCount },
                orderDistribution: {
                    processing: processingOrderCount,
                    delivered: deliveredOrderCount,
                    cancelled: cancelledOrderCount,
                },
                recentOrders,
                revenueByMonth,
            },
        });
    } catch (err) {
        console.error("Error fetching moderator reports:", err);
        res.status(500).json({ success: false, message: "Error fetching reports", error: err.message });
    }
};
