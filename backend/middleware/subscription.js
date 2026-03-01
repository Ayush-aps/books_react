/**
 * Subscription Middleware
 * Netflix-like subscription validation for premium features
 */

const Subscription = require("../models/Subscription");

/**
 * Middleware to check active subscription (Netflix-like)
 * Blocks access if subscription expired or doesn't exist
 * Attaches subscription object to req.subscription for use in route handlers
 */
module.exports.requireActiveSubscription = async (req, res, next) => {
    try {
        const subscription = await Subscription.findOne({
            user: req.user._id,
            isActive: true,
            endDate: { $gt: new Date() },
        });

        if (!subscription || subscription.plan === 'free') {
            return res.status(403).json({
                success: false,
                message: "Library access is only available for subscribed users. Please subscribe to access your library.",
                requiresSubscription: true,
                redirectTo: "/pricing"
            });
        }

        // Attach subscription to request for use in route handlers
        req.subscription = subscription;
        next();
    } catch (err) {
        console.error("Subscription check error:", err);
        res.status(500).json({
            success: false,
            message: "Error verifying subscription status",
            error: err.message,
        });
    }
};
