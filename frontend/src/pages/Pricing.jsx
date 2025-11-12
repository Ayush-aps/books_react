/**
 * Pricing Page
 * Subscription plans and seller commission information
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [plans, setPlans] = useState([]);
  const [sellerRates, setSellerRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription plans
      const plansResponse = await api.get('/subscription/plans');
      setPlans(plansResponse.data.data);

      // Fetch seller pricing info
      const sellerResponse = await api.get('/public/pricing');
      setSellerRates(sellerResponse.data.data);
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (planType) => {
    if (!user) {
      navigate('/auth/login', { state: { from: '/pricing' } });
      return;
    }
    navigate(`/subscription/checkout?plan=${planType}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading pricing..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage message={error} onRetry={fetchPricingData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Choose the plan that's right for you. No hidden fees, cancel anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Subscription Plans</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get unlimited access to your library with our subscription plans
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <p className="text-gray-600 mb-6">Perfect for casual readers</p>
              
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">₹0</span>
                <span className="text-gray-600 ml-2">/ month</span>
              </div>

              <button
                disabled
                className="w-full py-3 px-6 rounded-lg font-semibold bg-gray-100 text-gray-500 cursor-not-allowed"
              >
                Current Plan
              </button>

              <div className="mt-8 space-y-4">
                <p className="font-semibold text-gray-900">Features:</p>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Browse book catalog</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Purchase individual books</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Basic customer support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Plan */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden ring-2 ring-blue-600 relative">
            <div className="bg-blue-600 text-white text-center py-2 font-semibold text-sm">
              MOST POPULAR
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Monthly</h3>
              <p className="text-gray-600 mb-6">Unlimited access, billed monthly</p>
              
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">₹9.99</span>
                <span className="text-gray-600 ml-2">/ month</span>
              </div>

              <button
                onClick={() => handleSubscribe('monthly')}
                className="w-full py-3 px-6 rounded-lg font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700"
              >
                {user ? 'Subscribe Now' : 'Get Started'}
              </button>

              <div className="mt-8 space-y-4">
                <p className="font-semibold text-gray-900">Features:</p>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Unlimited book access</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Offline reading</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Exclusive content</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Priority support</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 text-white text-center py-2 font-semibold text-sm">
              BEST VALUE
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Yearly</h3>
              <p className="text-gray-600 mb-6">Save 20% with annual billing</p>
              
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">₹99.99</span>
                <span className="text-gray-600 ml-2">/ year</span>
                <div className="text-sm text-green-600 font-semibold mt-2">
                  Save ₹20 per year
                </div>
              </div>

              <button
                onClick={() => handleSubscribe('yearly')}
                className="w-full py-3 px-6 rounded-lg font-semibold transition-colors bg-gray-100 text-gray-900 hover:bg-gray-200"
              >
                {user ? 'Subscribe Now' : 'Get Started'}
              </button>

              <div className="mt-8 space-y-4">
                <p className="font-semibold text-gray-900">Everything in Monthly, plus:</p>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">2 months free</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Early access to new releases</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Free gift book every quarter</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Pricing */}
      {sellerRates && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Seller Pricing</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Simple commission structure for selling your books
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-8">
                <div className="text-center">
                  <p className="text-gray-700 mb-4">We charge a small commission on each sale</p>
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-5xl font-bold text-blue-600">
                      {sellerRates.commissionRate || 10}%
                    </span>
                    <span className="text-xl text-gray-600">commission per sale</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">What's Included</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">Unlimited book listings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">Professional seller dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">Order management tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">Sales analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">Secure payment processing</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Example Earnings</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Book Price:</span>
                        <span className="font-semibold">₹20.00</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Commission (10%):</span>
                        <span className="text-red-600">-₹2.00</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span className="text-gray-900">You Earn:</span>
                        <span className="text-green-600">₹18.00</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      * Payment processing fees may apply
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8">
                <Link
                  to="/auth/register"
                  className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Start Selling Today
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
            <p className="text-gray-600">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">
              We accept all major credit cards and debit cards. All payments are processed securely through Stripe.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h3>
            <p className="text-gray-600">
              We offer a 7-day money-back guarantee on subscriptions. For seller commissions, all sales are final.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">How do sellers get paid?</h3>
            <p className="text-gray-600">
              Sellers receive payments directly to their connected bank account after orders are completed and the return period has passed.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Can I change my subscription plan?</h3>
            <p className="text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of book lovers and start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/books"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Browse Books
            </Link>
            <Link
              to="/contact"
              className="inline-block px-8 py-4 bg-transparent text-white rounded-lg font-semibold hover:bg-white/10 transition-colors border-2 border-white"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
