/**
 * Subscription Checkout Page
 * Handle subscription plan selection and Stripe payment
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const SubscriptionCheckout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planType = searchParams.get('plan') || 'monthly';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const subscriptionPlans = {
    monthly: {
      name: 'Premium Monthly',
      price: 199,
      interval: 'month',
      planId: 'premium',
      features: [
        'Access to e-books and audiobooks',
        'Advanced recommendation system',
        'Priority delivery',
        'Exclusive discounts',
        'Cancel anytime'
      ]
    },
    yearly: {
      name: 'Premium Plus Yearly',
      price: 499,
      interval: 'month',
      planId: 'premium_plus',
      features: [
        'Unlimited e-book access',
        'Monthly free physical book',
        'Free express delivery',
        'Early access to new releases',
        'Cancel anytime'
      ]
    }
  };

  const selectedPlan = subscriptionPlans[planType];

  const handleSubscribe = async () => {
    setError(null);
    setLoading(true);

    try {
      // Map plan type to plan ID for backend
      const planId = planType === 'monthly' ? 'premium' : 'premium_plus';

      // Create Stripe checkout session on backend
      const response = await api.post('/subscription/create-checkout-session', {
        planId
      });

      // Redirect to Stripe hosted checkout page
      if (response.data.data.url) {
        window.location.href = response.data.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.response?.data?.message || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Subscribe to Bookish Premium</h1>
          <p className="text-xl text-gray-600">
            Unlimited access to thousands of books for one low price
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.name}</h2>
                  <p className="text-gray-600 mt-1">
                    Billed {selectedPlan.interval}ly
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-600">
                    ₹{selectedPlan.price}
                  </div>
                  <div className="text-sm text-gray-600">per {selectedPlan.interval}</div>
                  {selectedPlan.savings && (
                    <div className="text-sm text-green-600 font-semibold mt-1">
                      Save {selectedPlan.savings}%
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h3>
                <ul className="space-y-3">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stripe Payment Button */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    Redirecting to Stripe...
                  </span>
                ) : (
                  'Continue to Payment'
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secure payment powered by Stripe</span>
              </div>
            </div>

            {/* Change Plan Link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/pricing')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                ← Choose a different plan
              </button>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subscription Plan</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Billing Cycle</span>
                  <span className="font-semibold capitalize">{selectedPlan.interval}ly</span>
                </div>
                {selectedPlan.savings && (
                  <div className="flex justify-between text-green-600">
                    <span>Savings</span>
                    <span className="font-semibold">-{selectedPlan.savings}%</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ₹{selectedPlan.price}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Due today, then ₹{selectedPlan.price} every {selectedPlan.interval}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Money-back guarantee:</strong> Try it risk-free for 30 days
                </p>
                <p>
                  <strong>Cancel anytime:</strong> No long-term commitment required
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
