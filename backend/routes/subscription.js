/**
 * Subscription API routes
 */

const express = require("express");
const router = express.Router();
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const { ensureAuthenticated } = require("../middleware/auth");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Middleware to check subscription status
 */
const hasActiveSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
      isActive: true,
      endDate: { $gt: new Date() },
    });

    if (subscription && (subscription.plan === "premium" || subscription.plan === "premium_plus")) {
      req.subscription = subscription;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You need an active subscription to access this feature",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error checking subscription status",
      error: err.message,
    });
  }
};

/**
 * @route   GET /api/subscription/plans
 * @desc    Get subscription plans
 * @access  Public
 */
router.get("/plans", (req, res) => {
  const plans = {
    premium: {
      name: "Premium",
      price: 199,
      interval: "month",
      features: [
        "Access to e-books and audiobooks",
        "Advanced recommendation system",
        "Priority delivery",
        "Exclusive discounts",
      ],
    },
    premium_plus: {
      name: "Premium Plus",
      price: 499,
      interval: "month",
      features: [
        "Unlimited e-book access",
        "Monthly free physical book",
        "Free express delivery",
        "Early access to new releases",
      ],
    },
  };

  res.json({
    success: true,
    message: "Subscription plans retrieved successfully",
    data: { plans },
  });
});

/**
 * @route   GET /api/subscription/status
 * @desc    Get user's subscription status
 * @access  Private
 */
router.get("/status", ensureAuthenticated, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Subscription status retrieved successfully",
      data: {
        hasSubscription: !!subscription,
        subscription: subscription || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching subscription status",
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/subscription/create-checkout-session
 * @desc    Create a subscription checkout session with Stripe
 * @access  Private
 */
router.post("/create-checkout-session", ensureAuthenticated, async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId || !["premium", "premium_plus"].includes(planId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    // Determine price ID based on plan
    let priceId;
    switch (planId) {
      case "premium":
        priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
        break;
      case "premium_plus":
        priceId = process.env.STRIPE_PREMIUM_PLUS_PRICE_ID;
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    if (!priceId) {
      return res.status(500).json({
        success: false,
        message: "Stripe price ID not configured for this plan",
      });
    }

    // Check if user already has a Stripe customer ID
    let customer;
    let existingSubscription = await Subscription.findOne({ user: req.user._id });

    if (existingSubscription && existingSubscription.stripeCustomerId) {
      customer = existingSubscription.stripeCustomerId;
    } else {
      // Create a new customer
      const customerData = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: {
          userId: req.user._id.toString(),
        },
      });
      customer = customerData.id;
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId: req.user._id.toString(),
        planId: planId,
      },
    });

    res.json({
      success: true,
      message: "Checkout session created successfully",
      data: { sessionId: session.id, url: session.url },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating checkout session",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/subscription/verify-session
 * @desc    Verify subscription session and save to database
 * @access  Private
 */
router.get("/verify-session", ensureAuthenticated, async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "Invalid session",
      });
    }

    // Retrieve the session to get subscription details
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const planId = session.metadata.planId;

    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    // Calculate subscription end date (1 month from now)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Save subscription to database
    let userSubscription = await Subscription.findOne({ user: req.user._id });

    if (userSubscription) {
      // Update existing subscription
      userSubscription.plan = planId;
      userSubscription.startDate = new Date();
      userSubscription.endDate = endDate;
      userSubscription.renewalDate = endDate;
      userSubscription.isActive = true;
      userSubscription.stripeSubscriptionId = subscription.id;
      userSubscription.stripeCustomerId = session.customer;
      userSubscription.paymentDetails = {
        paymentId: session.payment_intent,
        amount: subscription.items.data[0].price.unit_amount / 100,
        status: "completed",
      };
    } else {
      // Create new subscription
      userSubscription = new Subscription({
        user: req.user._id,
        plan: planId,
        startDate: new Date(),
        endDate: endDate,
        renewalDate: endDate,
        isActive: true,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: session.customer,
        paymentDetails: {
          paymentId: session.payment_intent,
          amount: subscription.items.data[0].price.unit_amount / 100,
          status: "completed",
        },
      });
    }

    await userSubscription.save();

    res.json({
      success: true,
      message: "Subscription activated successfully",
      data: {
        subscription: userSubscription,
        planName: planId === "premium" ? "Premium" : "Premium Plus",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error activating subscription",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/subscription/cancel
 * @desc    Cancel user's subscription
 * @access  Private
 */
router.post("/cancel", ensureAuthenticated, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    // Cancel subscription in Stripe
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    // Deactivate subscription
    subscription.isActive = false;
    subscription.cancelledAt = new Date();
    await subscription.save();

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      data: { subscription },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error cancelling subscription",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/subscription/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe)
 */
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      const subscription = event.data.object;
      // Update subscription status in database
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          isActive: subscription.status === "active",
          status: subscription.status,
        }
      );
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = { router, hasActiveSubscription };
