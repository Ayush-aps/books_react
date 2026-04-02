/**
 * Subscription Routes
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const subscriptionController = require("../controllers/subscriptionController");

/**
 * @swagger
 * /api/subscription/plans:
 *   get:
 *     tags: [Subscription]
 *     summary: Get all available subscription plans
 *     responses:
 *       200:
 *         description: Subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     plans:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:       { type: string, example: premium }
 *                           name:     { type: string, example: Premium }
 *                           price:    { type: number, example: 199 }
 *                           period:   { type: string, example: month }
 *                           features: { type: array, items: { type: string } }
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/plans", subscriptionController.getPlans);

/**
 * @swagger
 * /api/subscription/status:
 *   get:
 *     tags: [Subscription]
 *     summary: Get the current user's active subscription status
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasSubscription: { type: boolean, example: true }
 *                     plan:            { type: string, example: premium }
 *                     endDate:         { type: string, format: date-time }
 *                     daysRemaining:   { type: integer, example: 21 }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/status", ensureAuthenticated, subscriptionController.getStatus);

/**
 * @swagger
 * /api/subscription/create-checkout-session:
 *   post:
 *     tags: [Subscription]
 *     summary: Create a Stripe checkout session for a subscription plan
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId]
 *             properties:
 *               planId:
 *                 type: string
 *                 enum: [premium, premium_plus]
 *                 example: premium
 *     responses:
 *       200:
 *         description: Checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId: { type: string }
 *                     url:       { type: string, format: uri }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/create-checkout-session", ensureAuthenticated, subscriptionController.createCheckoutSession);

/**
 * @swagger
 * /api/subscription/verify-session:
 *   get:
 *     tags: [Subscription]
 *     summary: Verify a completed Stripe checkout session and activate subscription
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: session_id
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         description: Stripe checkout session ID returned in the success redirect URL
 *         example: cs_test_xxx
 *     responses:
 *       200:
 *         description: Subscription verified and activated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid or already used session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/verify-session", ensureAuthenticated, subscriptionController.verifySession);

/**
 * @swagger
 * /api/subscription/cancel:
 *   post:
 *     tags: [Subscription]
 *     summary: Cancel the current user's subscription (effective at period end)
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Subscription cancellation scheduled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/cancel", ensureAuthenticated, subscriptionController.cancelSubscription);

/**
 * @swagger
 * /api/subscription/webhook:
 *   post:
 *     tags: [Subscription]
 *     summary: Stripe webhook — DO NOT call manually
 *     description: >
 *       This endpoint is called by Stripe's servers to deliver payment events.
 *       It expects a raw request body and a valid `Stripe-Signature` header.
 *       Do not test this from Swagger UI.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Invalid signature
 */
router.post("/webhook", express.raw({ type: "application/json" }), subscriptionController.handleWebhook);

module.exports = {
  router,
  hasActiveSubscription: subscriptionController.hasActiveSubscription
};
