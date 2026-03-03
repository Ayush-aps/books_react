/**
 * Employee Controller
 * Handles employee operations: book verification and complaint management.
 *
 * Security:
 * - Employees CANNOT verify users (moderator-only).
 * - Employees CANNOT access global revenue or Stripe keys (admin-only).
 * - All routes require checkRole('employee', 'moderator', 'admin').
 */

const Book = require("../models/Book");
const Complaint = require("../models/Complaint");
const Order = require("../models/Order");

// ============================================
// BOOK VERIFICATION
// ============================================

/**
 * @desc    Get all books pending approval
 * @route   GET /api/employee/pending-books
 * @access  Private (Employee, Moderator, Admin)
 */
exports.getPendingBooks = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const query = {
            approvalStatus: "pending",
            isApproved: false,
            $or: [
                { rejectionReason: null },
                { rejectionReason: { $exists: false } },
            ],
        };

        const totalBooks = await Book.countDocuments(query);

        const pendingBooks = await Book.find(query)
            .populate("seller", "name email")
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            message: "Pending books retrieved successfully",
            data: {
                books: pendingBooks,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalBooks / parseInt(limit)),
                    totalBooks,
                    limit: parseInt(limit),
                },
            },
        });
    } catch (err) {
        console.error("Error fetching pending books:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching pending books",
            error: err.message,
        });
    }
};

/**
 * @desc    Approve or reject a book listing
 * @route   POST /api/employee/review-book
 * @access  Private (Employee, Moderator, Admin)
 */
exports.reviewBook = async (req, res) => {
    try {
        const { bookId, action, rejectionReason } = req.body;

        // Validate input
        if (!bookId || !action) {
            return res.status(400).json({
                success: false,
                message: "bookId and action ('approve' or 'reject') are required",
            });
        }

        if (!["approve", "reject"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Action must be 'approve' or 'reject'",
            });
        }

        if (action === "reject" && (!rejectionReason || rejectionReason.trim() === "")) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required when rejecting a book",
            });
        }

        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found",
            });
        }

        if (action === "approve") {
            book.approvalStatus = "approved";
            book.isApproved = true;
            book.approvalDate = new Date();
            book.rejectionReason = null;
            book.rejectionDate = null;
        } else {
            book.approvalStatus = "rejected";
            book.isApproved = false;
            book.rejectionReason = rejectionReason;
            book.rejectionDate = new Date();
            book.approvalDate = null;
        }

        book.reviewedBy = req.user._id;

        await book.save();

        await book.populate("seller", "name email");

        res.json({
            success: true,
            message: `Book ${action === "approve" ? "approved" : "rejected"} successfully`,
            data: {
                book: {
                    _id: book._id,
                    title: book.title,
                    author: book.author,
                    approvalStatus: book.approvalStatus,
                    isApproved: book.isApproved,
                    reviewedBy: book.reviewedBy,
                    rejectionReason: book.rejectionReason,
                    seller: book.seller,
                },
            },
        });
    } catch (err) {
        console.error("Error reviewing book:", err);
        res.status(500).json({
            success: false,
            message: "Error reviewing book",
            error: err.message,
        });
    }
};

// ============================================
// COMPLAINT MANAGEMENT
// ============================================

/**
 * @desc    Get open or unassigned complaint tickets
 * @route   GET /api/employee/complaints
 * @access  Private (Employee, Moderator, Admin)
 */
exports.getComplaints = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, myTickets } = req.query;

        let query;

        if (myTickets === "true") {
            // Show tickets assigned to the current employee
            query = { assignedTo: req.user._id };
        } else {
            // Show open/pending tickets that are unassigned or assigned to current user
            query = {
                status: { $in: ["open", "pending"] },
                $or: [
                    { assignedTo: null },
                    { assignedTo: { $exists: false } },
                    { assignedTo: req.user._id },
                ],
            };
        }

        // Optional status filter
        if (status && ["open", "pending", "in-progress", "resolved", "escalated"].includes(status)) {
            query.status = status;
        }

        const totalComplaints = await Complaint.countDocuments(query);

        const complaints = await Complaint.find(query)
            .populate("user", "name email role")
            .populate("assignedTo", "name email")
            .populate("order", "orderNumber")
            .populate("book", "title author")
            .sort({ priority: -1, createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            message: "Complaints retrieved successfully",
            data: {
                complaints,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalComplaints / parseInt(limit)),
                    totalComplaints,
                    limit: parseInt(limit),
                },
            },
        });
    } catch (err) {
        console.error("Error fetching complaints:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching complaints",
            error: err.message,
        });
    }
};

/**
 * @desc    Claim an unassigned complaint ticket
 * @route   PATCH /api/employee/claim-complaint
 * @access  Private (Employee, Moderator, Admin)
 */
exports.claimComplaint = async (req, res) => {
    try {
        const { complaintId } = req.body;

        if (!complaintId) {
            return res.status(400).json({
                success: false,
                message: "complaintId is required",
            });
        }

        const complaint = await Complaint.findById(complaintId);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found",
            });
        }

        // Check if already assigned to someone else
        if (
            complaint.assignedTo &&
            complaint.assignedTo.toString() !== req.user._id.toString()
        ) {
            return res.status(409).json({
                success: false,
                message: "This complaint is already assigned to another employee",
            });
        }

        complaint.assignedTo = req.user._id;
        complaint.status = "in-progress";

        await complaint.save();

        await complaint.populate("user", "name email role");
        await complaint.populate("assignedTo", "name email");

        res.json({
            success: true,
            message: "Complaint claimed successfully",
            data: { complaint },
        });
    } catch (err) {
        console.error("Error claiming complaint:", err);
        res.status(500).json({
            success: false,
            message: "Error claiming complaint",
            error: err.message,
        });
    }
};

/**
 * @desc    Resolve a complaint with resolution notes
 * @route   POST /api/employee/resolve-complaint
 * @access  Private (Employee, Moderator, Admin)
 */
exports.resolveComplaint = async (req, res) => {
    try {
        const { complaintId, resolutionNotes, resolutionAction } = req.body;

        if (!complaintId) {
            return res.status(400).json({
                success: false,
                message: "complaintId is required",
            });
        }

        if (!resolutionNotes || resolutionNotes.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Resolution notes are required",
            });
        }

        const complaint = await Complaint.findById(complaintId);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found",
            });
        }

        // Ensure the employee is assigned to this ticket (or is admin/moderator)
        if (
            complaint.assignedTo &&
            complaint.assignedTo.toString() !== req.user._id.toString() &&
            req.user.role === "employee"
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only resolve complaints assigned to you",
            });
        }

        complaint.status = "resolved";
        complaint.resolution = {
            action: resolutionAction || "other",
            details: resolutionNotes,
            resolvedAt: new Date(),
            resolvedBy: req.user._id,
        };

        await complaint.save();

        await complaint.populate("user", "name email role");
        await complaint.populate("assignedTo", "name email");

        res.json({
            success: true,
            message: "Complaint resolved successfully",
            data: { complaint },
        });
    } catch (err) {
        console.error("Error resolving complaint:", err);
        res.status(500).json({
            success: false,
            message: "Error resolving complaint",
            error: err.message,
        });
    }
};

/**
 * @desc    Escalate a complaint (will notify Admin)
 * @route   POST /api/employee/escalate-complaint
 * @access  Private (Employee, Moderator, Admin)
 */
exports.escalateComplaint = async (req, res) => {
    try {
        const { complaintId, escalationReason } = req.body;

        if (!complaintId) {
            return res.status(400).json({
                success: false,
                message: "complaintId is required",
            });
        }

        const complaint = await Complaint.findById(complaintId);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found",
            });
        }

        complaint.status = "escalated";

        // Add escalation as a comment for audit trail
        complaint.comments.push({
            user: req.user._id,
            userRole: req.user.role,
            message: `Escalated by ${req.user.name}. Reason: ${escalationReason || "Requires admin attention"}`,
        });

        await complaint.save();

        await complaint.populate("user", "name email role");
        await complaint.populate("assignedTo", "name email");

        res.json({
            success: true,
            message: "Complaint escalated successfully. Admin will be notified.",
            data: { complaint },
        });
    } catch (err) {
        console.error("Error escalating complaint:", err);
        res.status(500).json({
            success: false,
            message: "Error escalating complaint",
            error: err.message,
        });
    }
};

// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * @desc    Get all orders for employee management
 * @route   GET /api/employee/orders
 * @access  Private (Employee, Moderator, Admin)
 */
exports.getOrders = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        let query = {};

        if (status && status !== "all") query.orderStatus = status;

        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: "i" } },
                { "shippingAddress.name": { $regex: search, $options: "i" } },
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
        console.error("Error fetching employee orders:", err);
        res.status(500).json({ success: false, message: "Error fetching orders", error: err.message });
    }
};

/**
 * @desc    Update order status
 * @route   PATCH /api/employee/orders/:id/status
 * @access  Private (Employee, Moderator, Admin)
 */
exports.updateOrderStatus = async (req, res) => {
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

