/**
 * Subscription Routes
 * All subscription-related routes
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const subscriptionController = require("../controllers/subscriptionController");

// ============================================
// SUBSCRIPTION PLAN ROUTES
// ============================================

// @route   GET /api/subscription/plans
// @desc    Get subscription plans
// @access  Public
router.get("/plans", subscriptionController.getPlans);

// ============================================
// SUBSCRIPTION STATUS ROUTES
// ============================================

// @route   GET /api/subscription/status
// @desc    Get user's subscription status
// @access  Private
router.get("/status", ensureAuthenticated, subscriptionController.getStatus);

// ============================================
// CHECKOUT ROUTES
// ============================================

// @route   POST /api/subscription/create-checkout-session
// @desc    Create a subscription checkout session with Stripe
// @access  Private
router.post("/create-checkout-session", ensureAuthenticated, subscriptionController.createCheckoutSession);

// @route   GET /api/subscription/verify-session
// @desc    Verify subscription session and save to database
// @access  Private
router.get("/verify-session", ensureAuthenticated, subscriptionController.verifySession);

// ============================================
// CANCELLATION ROUTES
// ============================================

// @route   POST /api/subscription/cancel
// @desc    Cancel user's subscription
// @access  Private
router.post("/cancel", ensureAuthenticated, subscriptionController.cancelSubscription);

// ============================================
// WEBHOOK ROUTES
// ============================================

// @route   POST /api/subscription/webhook
// @desc    Handle Stripe webhook events
// @access  Public (Stripe)
router.post("/webhook", express.raw({ type: "application/json" }), subscriptionController.handleWebhook);

// Export router and middleware
module.exports = { 
  router, 
  hasActiveSubscription: subscriptionController.hasActiveSubscription 
};
