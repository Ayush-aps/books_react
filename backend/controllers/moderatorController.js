/**
 * Moderator Controller
 * Handles moderator-specific operations: user verification queue,
 * verification actions, and employee complaint statistics.
 */

const User = require("../models/User");
const Complaint = require("../models/Complaint");

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
        const { userId, action } = req.body;

        // Validate input
        if (!userId || !action) {
            return res.status(400).json({
                success: false,
                message: "userId and action ('approve' or 'reject') are required",
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
