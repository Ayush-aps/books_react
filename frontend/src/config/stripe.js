/**
 * Stripe Configuration
 * Initialize Stripe with publishable key
 */

import { loadStripe } from '@stripe/stripe-js';

// Load Stripe publishable key from environment variable
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('Stripe publishable key is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.');
}

// Initialize Stripe
const stripePromise = loadStripe(stripePublishableKey);

export default stripePromise;
