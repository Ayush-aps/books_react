/**
 * Admin Routes
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require("../middleware/auth");
const {
  getAllUsers, updateUserRole, toggleUserStatus, deleteUser, seedAdmin, seedModerator,
  getReports,
  getContent, approveBook, rejectBook, getBookDetails,
  getAllComplaints, getComplaintDetails, updateComplaintStatus, addComplaintComment, resolveComplaint,
  getAllOrders, updateOrder,
  getAllBooks,
} = require("../controllers/adminController");

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (filterable by role/status/search)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *         description: Search by name or email
 *       - name: role
 *         in: query
 *         schema: { type: string, enum: [buyer, seller, admin, moderator, employee] }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: User list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/UserSummary' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/users", ensureAuthenticated, ensureAdmin, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     tags: [Admin]
 *     summary: Change the role of a user
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [buyer, seller, admin, moderator, employee]
 *                 example: moderator
 *     responses:
 *       200:
 *         description: Role updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put("/users/:id/role", ensureAuthenticated, ensureAdmin, updateUserRole);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     tags: [Admin]
 *     summary: Toggle active/inactive status of a user (no body required)
 *     description: Toggles the user's isVerified status; no request body needed.
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Status toggled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put("/users/:id/status", ensureAuthenticated, ensureAdmin, toggleUserStatus);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Permanently delete a user account
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/users/:id", ensureAuthenticated, ensureAdmin, deleteUser);

/**
 * @swagger
 * /api/admin/seed-admin:
 *   get:
 *     tags: [Admin]
 *     summary: Seed a default admin account (development utility — no auth required)
 *     responses:
 *       200:
 *         description: Admin seeded or already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/seed-admin", seedAdmin);

/**
 * @swagger
 * /api/admin/seed-moderator:
 *   get:
 *     tags: [Admin]
 *     summary: Seed a default moderator account (development utility — no auth required)
 *     responses:
 *       200:
 *         description: Moderator seeded or already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/seed-moderator", seedModerator);

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform-wide analytics and revenue reports
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Report data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/reports", ensureAuthenticated, ensureAdmin, getReports);

/**
 * @swagger
 * /api/admin/content:
 *   get:
 *     tags: [Admin]
 *     summary: List books pending content moderation
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Pending content list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/content", ensureAuthenticated, ensureAdmin, getContent);

/**
 * @swagger
 * /api/admin/content/{id}/approve:
 *   post:
 *     tags: [Admin]
 *     summary: Approve a book for publication
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Book approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/content/:id/approve", ensureAuthenticated, ensureAdmin, approveBook);

/**
 * @swagger
 * /api/admin/content/{id}/reject:
 *   post:
 *     tags: [Admin]
 *     summary: Reject a book with a reason
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string, example: Content violates community guidelines. }
 *     responses:
 *       200:
 *         description: Book rejected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/content/:id/reject", ensureAuthenticated, ensureAdmin, rejectBook);

/**
 * @swagger
 * /api/admin/content/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get full details of a book under review
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/content/:id", ensureAuthenticated, ensureAdmin, getBookDetails);

/**
 * @swagger
 * /api/admin/complaints:
 *   get:
 *     tags: [Admin]
 *     summary: List all complaints on the platform (with filtering)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [all, pending, in-progress, resolved, closed] }
 *       - name: role
 *         in: query
 *         schema: { type: string, enum: [all, buyer, seller] }
 *       - name: category
 *         in: query
 *         schema: { type: string }
 *         description: Filter by complaint category
 *       - name: priority
 *         in: query
 *         schema: { type: string, enum: [all, low, medium, high, urgent] }
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *         description: Search in subject and description
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Complaint list with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/complaints", ensureAuthenticated, ensureAdmin, getAllComplaints);

/**
 * @swagger
 * /api/admin/complaints/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get details of a specific complaint
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Complaint details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/complaints/:id", ensureAuthenticated, ensureAdmin, getComplaintDetails);

/**
 * @swagger
 * /api/admin/complaints/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update the status, priority, or assignee of a complaint
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, resolved, closed, escalated]
 *                 example: in-progress
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 example: high
 *               assignedTo:
 *                 type: string
 *                 description: User ID of moderator/admin to assign to
 *                 example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *     responses:
 *       200:
 *         description: Complaint updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch("/complaints/:id/status", ensureAuthenticated, ensureAdmin, updateComplaintStatus);

/**
 * @swagger
 * /api/admin/complaints/{id}/comment:
 *   post:
 *     tags: [Admin]
 *     summary: Add an admin comment to a complaint
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, example: We are investigating this issue. }
 *     responses:
 *       200:
 *         description: Comment added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/complaints/:id/comment", ensureAuthenticated, ensureAdmin, addComplaintComment);

/**
 * @swagger
 * /api/admin/complaints/{id}/resolve:
 *   post:
 *     tags: [Admin]
 *     summary: Mark a complaint as resolved with resolution details
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action, details]
 *             properties:
 *               action:        { type: string, example: refund, description: "Resolution action taken (e.g. refund, replacement, warning)" }
 *               details:       { type: string, example: Refund of Rs.299 processed to original payment method. }
 *               adminResponse: { type: string, example: We apologize for the inconvenience. }
 *     responses:
 *       200:
 *         description: Complaint resolved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/complaints/:id/resolve", ensureAuthenticated, ensureAdmin, resolveComplaint);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     tags: [Admin]
 *     summary: List all orders on the platform (filterable)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [all, processing, shipped, delivered, cancelled, return_requested, returned] }
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *         description: Search by order ID or shipping name
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Order list with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/orders", ensureAuthenticated, ensureAdmin, getAllOrders);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update an order (status, tracking, delivery info)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderStatus:      { type: string, enum: [processing, shipped, delivered, cancelled, return_requested, returned], example: shipped }
 *               expectedDelivery: { type: string, format: date-time, example: "2024-12-25T00:00:00Z" }
 *               trackingNumber:   { type: string, example: "TRK123456789" }
 *               carrier:          { type: string, example: "BlueDart" }
 *               trackingUrl:      { type: string, format: uri, example: "https://tracking.example.com/TRK123" }
 *               adminNotes:       { type: string, example: "Priority shipment" }
 *     responses:
 *       200:
 *         description: Order updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put("/orders/:id", ensureAuthenticated, ensureAdmin, updateOrder);

/**
 * @swagger
 * /api/admin/books:
 *   get:
 *     tags: [Admin]
 *     summary: Browse all books on the platform (with filtering and sorting)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *         description: Search by title, author, or description
 *       - name: genre
 *         in: query
 *         schema: { type: string }
 *       - name: condition
 *         in: query
 *         schema: { type: string, enum: [new, like-new, good, fair, used] }
 *       - name: minPrice
 *         in: query
 *         schema: { type: number }
 *       - name: maxPrice
 *         in: query
 *         schema: { type: number }
 *       - name: sort
 *         in: query
 *         schema: { type: string, enum: [price-asc, price-desc, rating, newest] }
 *       - name: approvalStatus
 *         in: query
 *         schema: { type: string, enum: [approved, pending] }
 *     responses:
 *       200:
 *         description: Full book list with filters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/books", ensureAuthenticated, ensureAdmin, getAllBooks);

module.exports = router;
