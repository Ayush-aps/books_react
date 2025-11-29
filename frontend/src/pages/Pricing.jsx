/**
 * Pricing Page - Premium Design
 * Subscription plans and seller commission information with elevated styling
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/actions/authActions';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SuccessToast from '../components/SuccessToast';

const Pricing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [plans, setPlans] = useState([]);
  const [sellerRates, setSellerRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRestrictedMessage, setShowRestrictedMessage] = useState(false);
  const [showBuyerSellerModal, setShowBuyerSellerModal] = useState(false);

  useEffect(() => {
    // Check if user is seller or admin
    if (user && (user.role === 'seller' || user.role === 'admin')) {
      setShowRestrictedMessage(true);
      setLoading(false);
      return;
    }
    fetchPricingData();
  }, [user]);

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
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }
    navigate(`/subscription/checkout?plan=${planType}`);
  };

  const handleStartSelling = () => {
    if (user && user.role === 'buyer') {
      // Show modal explaining they need a separate seller account
      setShowBuyerSellerModal(true);
      return;
    }
    
    if (user) {
      // If already logged in as another role, redirect to home
      navigate('/');
      return;
    }
    
    // Not logged in - redirect to registration
    navigate('/register');
  };

  const handleCreateSellerAccount = async () => {
    // Close modal first
    setShowBuyerSellerModal(false);
    
    // Logout the current user
    await dispatch(logout());
    
    // Redirect to registration page
    navigate('/register');
  };

  const features = {
    free: [
      'Browse book catalog',
      'Purchase individual books',
      'Basic customer support'
    ],
    monthly: [
      'Unlimited book access',
      'Offline reading',
      'Exclusive content',
      'Priority support',
      'Cancel anytime'
    ],
    yearly: [
      '2 months free',
      'Early access to new releases',
      'Free gift book every quarter'
    ]
  };

  const faqs = [
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your current billing period.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards and debit cards. All payments are processed securely through Stripe.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 7-day money-back guarantee on subscriptions. For seller commissions, all sales are final.'
    },
    {
      question: 'How do sellers get paid?',
      answer: 'Sellers receive payments directly to their connected bank account after orders are completed and the return period has passed.'
    },
    {
      question: 'Can I change my subscription plan?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.'
    }
  ];

  // Show restricted access message for sellers and admins
  if (showRestrictedMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card elevated className="text-center">
            <Card.Body className="p-8">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="heading-3 mb-3 text-error">Access Restricted</h2>
              <p className="body-lg text-text-secondary mb-6">
                This page is only available for buyers. {user?.role === 'seller' ? 'Sellers' : 'Admins'} are not allowed to access subscription pricing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="primary" 
                  onClick={() => navigate(user?.role === 'seller' ? '/seller/dashboard' : '/admin/dashboard')}
                >
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                >
                  Go to Home
                </Button>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <LoadingSpinner size="lg" message="Loading pricing..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-cream">
        <ErrorMessage message={error} onRetry={fetchPricingData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <motion.div 
        className="relative bg-charcoal text-cream overflow-hidden pt-20"
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-96 h-96 bg-brown/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-green/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <motion.div 
            className="text-center"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 
              variants={staggerItem}
              className="font-serif font-bold text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight mb-4"
              style={{ color: '#F5F1E8' }}
            >
              Simple, Transparent Pricing
            </motion.h1>
            <motion.p 
              variants={staggerItem}
              className="text-lg md:text-xl max-w-3xl mx-auto"
              style={{ color: '#C4B5A0' }}
            >
              Choose the plan that's right for you. No hidden fees, cancel anytime.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Subscription Plans */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div 
          className="text-center mb-12"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="heading-2 mb-4">Subscription Plans</h2>
          <p className="body-lg text-text-secondary max-w-2xl mx-auto">
            Get unlimited access to your library with our subscription plans
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Free Plan */}
          <motion.div variants={staggerItem}>
            <Card className="h-full">
              <Card.Body className="flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="heading-3 mb-2">Free</h3>
                  <p className="body text-text-secondary">Perfect for casual readers</p>
                </div>
                
                <div className="mb-6">
                  <span className="text-5xl font-serif font-bold text-charcoal">₹0</span>
                  <span className="body text-text-secondary ml-2">/ month</span>
                </div>

                <Button
                  variant="ghost"
                  size="lg"
                  disabled
                  className="w-full mb-8"
                >
                  Current Plan
                </Button>

                <div className="space-y-4 mt-auto">
                  <p className="heading-5">Features:</p>
                  {features.free.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="body text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Monthly Plan */}
          <motion.div variants={staggerItem}>
            <Card elevated className="h-full ring-2 ring-brown">
              <div className="bg-brown text-white text-center py-3 rounded-t-lg">
                <Badge variant="primary" className="bg-white text-brown">
                  MOST POPULAR
                </Badge>
              </div>
              <Card.Body className="flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="heading-3 mb-2">Premium Monthly</h3>
                  <p className="body text-text-secondary">Unlimited access, billed monthly</p>
                </div>
                
                <div className="mb-6">
                  <span className="text-5xl font-serif font-bold text-brown">₹199</span>
                  <span className="body text-text-secondary ml-2">/ month</span>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleSubscribe('monthly')}
                  className="w-full mb-8"
                >
                  {user ? 'Subscribe Now' : 'Get Started'}
                </Button>

                <div className="space-y-4 mt-auto">
                  <p className="heading-5">Features:</p>
                  {features.monthly.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="body text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Yearly Plan */}
          <motion.div variants={staggerItem}>
            <Card elevated className="h-full ring-2 ring-success">
              <div className="bg-success text-white text-center py-3 rounded-t-lg">
                <Badge variant="success" className="bg-white text-success">
                  BEST VALUE
                </Badge>
              </div>
              <Card.Body className="flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="heading-3 mb-2">Premium Plus Yearly</h3>
                  <p className="body text-text-secondary">Best value with annual billing</p>
                </div>
                
                <div className="mb-2">
                  <span className="text-5xl font-serif font-bold text-success">₹499</span>
                  <span className="body text-text-secondary ml-2">/ year</span>
                </div>
                <div className="mb-6">
                  <Badge variant="success" size="sm">Save ₹880 per year</Badge>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleSubscribe('yearly')}
                  className="w-full mb-8 border-success text-success hover:bg-success/10"
                >
                  {user ? 'Subscribe Now' : 'Get Started'}
                </Button>

                <div className="space-y-4 mt-auto">
                  <p className="heading-5">Everything in Monthly, plus:</p>
                  {features.yearly.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="body text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Seller Pricing */}
      {sellerRates && (
        <div className="bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-12"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h2 className="heading-2 mb-4">Seller Pricing</h2>
              <p className="body-lg text-text-secondary max-w-2xl mx-auto">
                Simple commission structure for selling your books
              </p>
            </motion.div>

            <motion.div 
              className="max-w-4xl mx-auto"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={staggerItem}>
                <Card className="mb-8 bg-gradient-to-r from-brown/5 to-green/5">
                  <Card.Body className="text-center p-8">
                    <p className="body-lg text-text-secondary mb-6">
                      We charge a small commission on each sale
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-6xl font-serif font-bold text-brown">
                        {sellerRates.commissionRate || 10}%
                      </span>
                      <span className="heading-4 text-text-secondary">commission per sale</span>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>

              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
                variants={staggerContainer}
              >
                {/* What's Included */}
                <motion.div variants={staggerItem}>
                  <Card elevated className="h-full">
                    <Card.Header className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="heading-4">What's Included</h3>
                    </Card.Header>
                    <Card.Body>
                      <ul className="space-y-3">
                        {[
                          'Unlimited book listings',
                          'Professional seller dashboard',
                          'Order management tools',
                          'Sales analytics',
                          'Secure payment processing'
                        ].map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="text-success mt-1">•</span>
                            <span className="body">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Card.Body>
                  </Card>
                </motion.div>

                {/* Example Earnings */}
                <motion.div variants={staggerItem}>
                  <Card elevated className="h-full">
                    <Card.Header className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-brown/10 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="heading-4">Example Earnings</h3>
                    </Card.Header>
                    <Card.Body>
                      <div className="space-y-4">
                        <div className="border-b border-border pb-4">
                          <div className="flex justify-between mb-2">
                            <span className="body text-text-secondary">Book Price:</span>
                            <span className="heading-5">₹20.00</span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span className="body text-text-secondary">Commission (10%):</span>
                            <span className="body text-error">-₹2.00</span>
                          </div>
                          <div className="flex justify-between pt-2">
                            <span className="heading-4">You Earn:</span>
                            <span className="heading-4 text-success">₹18.00</span>
                          </div>
                        </div>
                        <p className="body-sm text-text-secondary italic">
                          * Payment processing fees may apply
                        </p>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </motion.div>

              <motion.div 
                className="text-center"
                variants={staggerItem}
              >
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={handleStartSelling}
                  className="text-white"
                >
                  Start Selling Today
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div 
          className="text-center mb-12"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="heading-2 mb-4">Frequently Asked Questions</h2>
        </motion.div>

        <motion.div 
          className="max-w-3xl mx-auto space-y-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {faqs.map((faq, index) => (
            <motion.div key={index} variants={staggerItem}>
              <Card hoverable>
                <Card.Body>
                  <h3 className="heading-5 mb-3">{faq.question}</h3>
                  <p className="body text-text-secondary">{faq.answer}</p>
                </Card.Body>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA Section */}
      <motion.div 
        className="relative bg-charcoal text-cream py-24 overflow-hidden"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-brown/20 to-green/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif font-bold text-4xl md:text-5xl leading-tight mb-6" style={{ color: '#F5F1E8' }}>
            Ready to Get Started?
          </h2>
          <p className="text-lg md:text-xl mb-10" style={{ color: '#C4B5A0' }}>
            Join thousands of book lovers and start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white text-charcoal hover:bg-cream border-white"
              asChild
            >
              <Link to="/books">Browse Books</Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-cream border-cream hover:bg-white/10"
              asChild
            >
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Buyer to Seller Modal */}
      {showBuyerSellerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <Card elevated>
              <Card.Body className="p-8">
                <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="heading-3 text-center mb-4">Already a Buyer?</h3>
                <p className="body text-text-secondary text-center mb-6">
                  You're currently logged in as a buyer. To become a seller, you'll need to create a separate seller account for security and account management purposes.
                </p>
                <div className="space-y-4 mb-6 bg-cream p-4 rounded-lg">
                  <p className="body-sm font-medium">To create a seller account:</p>
                  <ol className="list-decimal list-inside space-y-2 body-sm text-text-secondary">
                    <li>Logout from your current buyer account</li>
                    <li>Register a new account with the seller role</li>
                    <li>Complete the seller verification process</li>
                  </ol>
                </div>
                <div className="flex flex-col gap-3">
                  <Button 
                    variant="primary"
                    size="lg"
                    onClick={handleCreateSellerAccount}
                    fullWidth
                  >
                    Create One Now
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => setShowBuyerSellerModal(false)}
                    fullWidth
                  >
                    Got It
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
