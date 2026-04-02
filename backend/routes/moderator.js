/**
 * Moderator Routes — mounted at /api/admin/moderator
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureModeratorOrAdmin, checkRole } = require("../middleware/auth");
const {
  getPendingUsers, verifyUser, getEmployeeStats, getApprovedBooks, getApprovedUsers,
  getModeratorUsers, getModeratorUser, moderatorDeleteUser, moderatorPromoteEmployee,
  getGlobalStats,
  claimBook, releaseBook, moderatorReviewBook,
  resolveComplaint,
  getModeratorOrders, updateModeratorOrderStatus, getModeratorReports,
} = require("../controllers/moderatorController");

const ensureStaffAccess = checkRole("admin", "moderator", "employee");

/**
 * @swagger
 * /api/admin/moderator/pending-users:
 *   get:
 *     tags: [Moderator]
 *     summary: List users with pending verification (sellers, employees awaiting approval)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: role
 *         in: query
 *         schema: { type: string, enum: [seller, employee, moderator] }
 *         description: Filter by specific role
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Pending user list with pagination
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
router.get("/pending-users", ensureAuthenticated, ensureModeratorOrAdmin, getPendingUsers);

/**
 * @swagger
 * /api/admin/moderator/verify-user:
 *   post:
 *     tags: [Moderator]
 *     summary: Approve or reject a user's verification request
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, action]
 *             properties:
 *               userId: { type: string, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 example: approve
 *     responses:
 *       200:
 *         description: User verification updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/verify-user", ensureAuthenticated, ensureModeratorOrAdmin, verifyUser);

/**
 * @swagger
 * /api/admin/moderator/employee-stats:
 *   get:
 *     tags: [Moderator]
 *     summary: Get complaint-handling statistics per employee
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Employee stats
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
router.get("/employee-stats", ensureAuthenticated, ensureModeratorOrAdmin, getEmployeeStats);

/**
 * @swagger
 * /api/admin/moderator/approved-books:
 *   get:
 *     tags: [Moderator]
 *     summary: List all approved books (with search)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *         description: Search by title, author, or ISBN
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Approved book list with pagination
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
router.get("/approved-books", ensureAuthenticated, ensureModeratorOrAdmin, getApprovedBooks);

/**
 * @swagger
 * /api/admin/moderator/approved-users:
 *   get:
 *     tags: [Moderator]
 *     summary: List all approved users (with search and role filter)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *         description: Search by name or email
 *       - name: role
 *         in: query
 *         schema: { type: string, enum: [seller, employee, moderator, buyer] }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Approved user list with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/approved-users", ensureAuthenticated, ensureModeratorOrAdmin, getApprovedUsers);

/**
 * @swagger
 * /api/admin/moderator/users:
 *   get:
 *     tags: [Moderator]
 *     summary: List all manageable users (buyers, sellers, employees)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *         description: Search by name or email
 *       - name: role
 *         in: query
 *         schema: { type: string, enum: [buyer, seller, employee] }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: User list with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/users", ensureAuthenticated, ensureModeratorOrAdmin, getModeratorUsers);

/**
 * @swagger
 * /api/admin/moderator/users/{id}:
 *   get:
 *     tags: [Moderator]
 *     summary: Get a specific user's profile
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Moderator]
 *     summary: Delete a user (moderator-scoped)
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
 */
router.get("/users/:id", ensureAuthenticated, ensureModeratorOrAdmin, getModeratorUser);
router.delete("/users/:id", ensureAuthenticated, ensureModeratorOrAdmin, moderatorDeleteUser);

/**
 * @swagger
 * /api/admin/moderator/users/{id}/promote:
 *   put:
 *     tags: [Moderator]
 *     summary: Promote an employee to moderator
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Employee promoted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put("/users/:id/promote", ensureAuthenticated, ensureModeratorOrAdmin, moderatorPromoteEmployee);

/**
 * @swagger
 * /api/admin/moderator/users/{id}/verify:
 *   post:
 *     tags: [Moderator]
 *     summary: Verify a specific user (path-based variant)
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
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *     responses:
 *       200:
 *         description: User verification updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/users/:id/verify", ensureAuthenticated, ensureModeratorOrAdmin, verifyUser);

/**
 * @swagger
 * /api/admin/moderator/global-stats:
 *   get:
 *     tags: [Moderator]
 *     summary: Get platform-wide analytics for the moderator dashboard
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Global stats
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
router.get("/global-stats", ensureAuthenticated, ensureModeratorOrAdmin, getGlobalStats);

/**
 * @swagger
 * /api/admin/moderator/books/{id}/claim:
 *   patch:
 *     tags: [Moderator]
 *     summary: Claim a book review task (lock it to the moderator)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Book claimed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch("/books/:id/claim", ensureAuthenticated, ensureModeratorOrAdmin, claimBook);

/**
 * @swagger
 * /api/admin/moderator/books/{id}/release:
 *   patch:
 *     tags: [Moderator]
 *     summary: Release a claimed book review task back to the queue
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Book released
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch("/books/:id/release", ensureAuthenticated, ensureModeratorOrAdmin, releaseBook);

/**
 * @swagger
 * /api/admin/moderator/books/{id}/review:
 *   patch:
 *     tags: [Moderator]
 *     summary: Approve or reject a book after moderator review
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
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 example: approve
 *               rejectionReason:
 *                 type: string
 *                 description: Required when action is 'reject'
 *                 example: Inappropriate content detected
 *     responses:
 *       200:
 *         description: Book reviewed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch("/books/:id/review", ensureAuthenticated, ensureModeratorOrAdmin, moderatorReviewBook);

/**
 * @swagger
 * /api/admin/moderator/complaints/{id}/resolve:
 *   patch:
 *     tags: [Moderator]
 *     summary: Resolve a complaint with resolution notes
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
 *             required: [resolutionNotes]
 *             properties:
 *               resolutionNotes:  { type: string, example: Refund issued successfully. }
 *               resolutionAction: { type: string, example: refund, description: "Action type (e.g. refund, replacement, warning). Defaults to 'other'" }
 *     responses:
 *       200:
 *         description: Complaint resolved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Resolution notes are required or complaint is already resolved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch("/complaints/:id/resolve", ensureAuthenticated, ensureModeratorOrAdmin, resolveComplaint);

/**
 * @swagger
 * /api/admin/moderator/orders:
 *   get:
 *     tags: [Moderator]
 *     summary: List all orders (admin / moderator / employee view)
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
router.get("/orders", ensureAuthenticated, ensureStaffAccess, getModeratorOrders);

/**
 * @swagger
 * /api/admin/moderator/orders/{id}/status:
 *   patch:
 *     tags: [Moderator]
 *     summary: Update order status (staff action)
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
 *               orderStatus:
 *                 type: string
 *                 enum: [processing, shipped, delivered, cancelled, return_requested, returned]
 *                 example: delivered
 *               adminNotes:
 *                 type: string
 *                 example: "Expedited delivery approved"
 *     responses:
 *       200:
 *         description: Order status updated
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
router.patch("/orders/:id/status", ensureAuthenticated, ensureStaffAccess, updateModeratorOrderStatus);

/**
 * @swagger
 * /api/admin/moderator/reports:
 *   get:
 *     tags: [Moderator]
 *     summary: Get reports and analytics (staff view)
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
router.get("/reports", ensureAuthenticated, ensureStaffAccess, getModeratorReports);

module.exports = router;
