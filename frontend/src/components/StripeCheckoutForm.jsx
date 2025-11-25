/**
 * Reusable Stripe Checkout Form Component
 * Uses Stripe Elements for secure card input
 */

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const StripeCheckoutForm = ({ onSuccess, amount }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Confirm the payment
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/buyer/payment-success`,
        },
        redirect: 'if_required'
      });

      if (submitError) {
        setError(submitError.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful - pass payment intent ID to callback
        onSuccess(paymentIntent.id);
      } else {
        setError('Payment was not completed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorMessage message={error} />}

      <div className="bg-gray-50 p-4 rounded-lg">
        <PaymentElement />
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <img src="/img/visa.svg" alt="Visa" className="h-8" onError={(e) => e.target.style.display = 'none'} />
        <img src="/img/mastercard.svg" alt="Mastercard" className="h-8" onError={(e) => e.target.style.display = 'none'} />
        <img src="/img/amex.svg" alt="Amex" className="h-8" onError={(e) => e.target.style.display = 'none'} />
        <span className="ml-auto">Accepted cards</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            Processing Payment...
          </span>
        ) : (
          `Pay ₹${amount.toFixed(2)}`
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your payment information is encrypted and secure. We never store your card details.
      </p>
    </form>
  );
};

export default StripeCheckoutForm;
