/**
 * Subscription Controller
 * Handles all subscription-related operations including Stripe integration
 */

const Subscription = require("../models/Subscription");
const User = require("../models/User");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ============================================
// SUBSCRIPTION PLANS
// ============================================

// @desc    Get subscription plans
// @route   GET /api/subscription/plans
// @access  Public
exports.getPlans = (req, res) => {
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
};

// ============================================
// SUBSCRIPTION STATUS
// ============================================

// @desc    Get user's subscription status
// @route   GET /api/subscription/status
// @access  Private
exports.getStatus = async (req, res) => {
  try {
    // First, try to find an active subscription (isActive=true and endDate in future)
    let subscription = await Subscription.findOne({
      user: req.user._id,
      isActive: true,
      endDate: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    // If no active subscription found, get the most recent subscription (for display purposes)
    if (!subscription) {
      subscription = await Subscription.findOne({
        user: req.user._id,
      }).sort({ createdAt: -1 });
    }

    // Determine if user has an active subscription
    const hasActiveSubscription = subscription && 
      subscription.isActive && 
      new Date(subscription.endDate) > new Date();

    res.json({
      success: true,
      message: "Subscription status retrieved successfully",
      data: {
        hasSubscription: !!subscription,
        hasActiveSubscription: hasActiveSubscription,
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
};

// ============================================
// STRIPE CHECKOUT
// ============================================

// @desc    Create a subscription checkout session with Stripe
// @route   POST /api/subscription/create-checkout-session
// @access  Private
exports.createCheckoutSession = async (req, res) => {
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
};

// ============================================
// SESSION VERIFICATION
// ============================================

// @desc    Verify subscription session and save to database
// @route   GET /api/subscription/verify-session
// @access  Private
exports.verifySession = async (req, res) => {
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
    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

    console.log(`📝 Processing subscription verification for user ${req.user._id}, Stripe ID: ${stripeSubscription.id}`);

    // Check if this exact Stripe subscription was already processed
    const alreadyProcessed = await Subscription.findOne({ 
      stripeSubscriptionId: stripeSubscription.id 
    });

    if (alreadyProcessed) {
      console.log('⚠️ This Stripe subscription already exists in DB, skipping...');
      return res.json({
        success: true,
        message: "Subscription already activated",
        data: {
          subscription: alreadyProcessed,
          planName: planId === "premium" ? "Premium" : "Premium Plus",
        },
      });
    }

    // Check if user has an ACTIVE subscription (isActive=true and endDate in future)
    const activeSubscription = await Subscription.findOne({
      user: req.user._id,
      isActive: true,
      endDate: { $gt: new Date() }
    });

    let startDate, endDate, isActive;

    if (activeSubscription) {
      // User has active subscription - QUEUE the new one
      startDate = new Date(activeSubscription.endDate);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      isActive = false; // Will be activated by cron job when startDate arrives
      
      console.log(`🔄 Queueing subscription for user ${req.user._id}. Current ends: ${activeSubscription.endDate.toDateString()}, New starts: ${startDate.toDateString()}`);
    } else {
      // No active subscription - activate immediately
      startDate = new Date();
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      isActive = true;
      
      console.log(`✨ Activating subscription immediately for user ${req.user._id}: ${planId}, Ends: ${endDate.toDateString()}`);
    }

    // Create new subscription
    const userSubscription = new Subscription({
      user: req.user._id,
      plan: planId,
      startDate: startDate,
      endDate: endDate,
      renewalDate: endDate,
      isActive: isActive,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: session.customer,
      paymentDetails: {
        paymentId: session.payment_intent,
        amount: stripeSubscription.items.data[0].price.unit_amount / 100,
        status: "completed",
      }
    });

    await userSubscription.save();

    console.log('✅ Subscription saved:', {
      _id: userSubscription._id,
      user: userSubscription.user,
      plan: userSubscription.plan,
      isActive: userSubscription.isActive,
      startDate: userSubscription.startDate,
      endDate: userSubscription.endDate,
      queued: !isActive
    });

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
};

// ============================================
// SUBSCRIPTION CANCELLATION
// ============================================

// @desc    Cancel user's subscription
// @route   POST /api/subscription/cancel
// @access  Private
exports.cancelSubscription = async (req, res) => {
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
};

// ============================================
// STRIPE WEBHOOK
// ============================================

// @desc    Handle Stripe webhook events
// @route   POST /api/subscription/webhook
// @access  Public (Stripe)
exports.handleWebhook = async (req, res) => {
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
};

// ============================================
// MIDDLEWARE
// ============================================

// @desc    Middleware to check if user has active subscription
exports.hasActiveSubscription = async (req, res, next) => {
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

