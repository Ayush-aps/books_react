/**
 * Employee Routes
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated, checkRole } = require("../middleware/auth");
const { getPendingBooks, reviewBook, getComplaints, claimComplaint, resolveComplaint, escalateComplaint, getOrders, updateOrderStatus } = require("../controllers/employeeController");

const ensureEmployeeAccess = checkRole("employee", "moderator", "admin");

/**
 * @swagger
 * /api/employee/pending-books:
 *   get:
 *     tags: [Employee]
 *     summary: Get books queued for quality review
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Pending book list
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
router.get("/pending-books", ensureAuthenticated, ensureEmployeeAccess, getPendingBooks);

/**
 * @swagger
 * /api/employee/review-book:
 *   post:
 *     tags: [Employee]
 *     summary: Submit a quality-check review for a book
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId, action]
 *             properties:
 *               bookId:
 *                 type: string
 *                 example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 example: approve
 *               rejectionReason:
 *                 type: string
 *                 description: Required when action is 'reject'
 *                 example: Content violates community guidelines
 *     responses:
 *       200:
 *         description: Review submitted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/review-book", ensureAuthenticated, ensureEmployeeAccess, reviewBook);

/**
 * @swagger
 * /api/employee/orders:
 *   get:
 *     tags: [Employee]
 *     summary: Get orders for employee fulfilment handling
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
router.get("/orders", ensureAuthenticated, ensureEmployeeAccess, getOrders);

/**
 * @swagger
 * /api/employee/orders/{id}/status:
 *   patch:
 *     tags: [Employee]
 *     summary: Update the status of an order
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
 *                 example: shipped
 *               adminNotes:
 *                 type: string
 *                 example: "Dispatched via courier"
 *     responses:
 *       200:
 *         description: Status updated
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
router.patch("/orders/:id/status", ensureAuthenticated, ensureEmployeeAccess, updateOrderStatus);

/**
 * @swagger
 * /api/employee/complaints:
 *   get:
 *     tags: [Employee]
 *     summary: Get unassigned or assigned complaints visible to the employee
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [open, pending, in-progress, resolved, escalated] }
 *       - name: myTickets
 *         in: query
 *         schema: { type: string, enum: ["true", "false"] }
 *         description: Set to 'true' to show only tickets assigned to current employee
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
router.get("/complaints", ensureAuthenticated, ensureEmployeeAccess, getComplaints);

/**
 * @swagger
 * /api/employee/claim-complaint:
 *   patch:
 *     tags: [Employee]
 *     summary: Claim ownership of a complaint for handling
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [complaintId]
 *             properties:
 *               complaintId: { type: string, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *     responses:
 *       200:
 *         description: Complaint claimed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch("/claim-complaint", ensureAuthenticated, ensureEmployeeAccess, claimComplaint);

/**
 * @swagger
 * /api/employee/resolve-complaint:
 *   post:
 *     tags: [Employee]
 *     summary: Mark a claimed complaint as resolved
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [complaintId, resolutionNotes]
 *             properties:
 *               complaintId:      { type: string, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *               resolutionNotes:  { type: string, example: Issue resolved by issuing a refund. }
 *               resolutionAction: { type: string, example: refund, description: "Action type (e.g. refund, replacement). Defaults to 'other'" }
 *     responses:
 *       200:
 *         description: Complaint resolved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not assigned to this ticket
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/resolve-complaint", ensureAuthenticated, ensureEmployeeAccess, resolveComplaint);

/**
 * @swagger
 * /api/employee/escalate-complaint:
 *   post:
 *     tags: [Employee]
 *     summary: Escalate a complaint to moderator/admin
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [complaintId]
 *             properties:
 *               complaintId:      { type: string, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *               escalationReason: { type: string, example: Customer is requesting a refund above my authority level. }
 *     responses:
 *       200:
 *         description: Complaint escalated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/escalate-complaint", ensureAuthenticated, ensureEmployeeAccess, escalateComplaint);

module.exports = router;
