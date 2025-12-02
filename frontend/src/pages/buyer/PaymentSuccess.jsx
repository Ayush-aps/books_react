import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn, staggerContainer, staggerItem } from '../../utils/animations';
import { roundPrice } from '../../utils/priceUtils';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Utility function to format payment method text
  const formatPaymentMethod = (method) => {
    if (!method) return 'Card';
    return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Check if order is COD
  const isCOD = order?.paymentMethod === 'cash_on_delivery';

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/buyer/orders/${orderId}`);
      setOrder(response.data?.data?.order || response.data?.order || response.data);
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Animation & Icon */}
        <motion.div
          className="text-center mb-12"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green/20 to-green/10 rounded-full mb-6 relative"
            variants={scaleIn}
          >
            {/* Decorative rings */}
            <div className="absolute inset-0 rounded-full border-2 border-green/20 animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 rounded-full border-2 border-green/30"></div>

            <svg
              className="w-12 h-12 text-green relative z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>

          <motion.h1
            className="heading-1 text-charcoal mb-3"
            variants={fadeInUp}
          >
            {isCOD ? 'Order Placed Successfully!' : 'Payment Successful!'}
          </motion.h1>
          <motion.p
            className="body-lg text-charcoal/70"
            variants={fadeInUp}
          >
            {isCOD
              ? 'Thank you for your order. Please keep cash ready for delivery.'
              : 'Thank you for your order. We\'ve received your payment.'}
          </motion.p>
        </motion.div>

        {/* Order Details Card */}
        {order && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card elevated className="mb-6">
              <Card.Header>
                <h2 className="heading-2 text-charcoal">Order Details</h2>
              </Card.Header>
              <Card.Body>
                {/* Order Info Grid */}
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div className="bg-cream/50 rounded-lg p-4 border border-surface">
                    <p className="body-sm text-charcoal/60 mb-1">Order ID</p>
                    <p className="heading-4 text-charcoal font-mono">#{order._id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="bg-cream/50 rounded-lg p-4 border border-surface">
                    <p className="body-sm text-charcoal/60 mb-1">Order Date</p>
                    <p className="heading-4 text-charcoal">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="bg-cream/50 rounded-lg p-4 border border-surface">
                    <p className="body-sm text-charcoal/60 mb-1">Payment Method</p>
                    <div className="flex items-center gap-2">
                      <p className="heading-4 text-charcoal">{formatPaymentMethod(order.paymentMethod)}</p>
                      {!isCOD && <Badge variant="success" size="sm">Paid</Badge>}
                      {isCOD && <Badge variant="warning" size="sm">Pay on Delivery</Badge>}
                    </div>
                  </div>
                  <div className="bg-brown/5 rounded-lg p-4 border-2 border-brown/20">
                    <p className="body-sm text-brown/70 mb-1">Total Amount</p>
                    <p className="heading-2 text-brown">₹{roundPrice(order.totalAmount)}</p>
                  </div>
                </div>

                {/* Delivery Address */}
                {order.deliveryAddress && (
                  <div className="border-t-2 border-surface pt-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="heading-4 text-charcoal">Delivery Address</h3>
                    </div>
                    <div className="bg-surface/50 rounded-lg p-4">
                      <p className="body font-semibold text-charcoal mb-1">{order.deliveryAddress.fullName}</p>
                      <p className="body-sm text-charcoal/70">{order.deliveryAddress.phone}</p>
                      <p className="body-sm text-charcoal/70 mt-2">{order.deliveryAddress.street}</p>
                      <p className="body-sm text-charcoal/70">
                        {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="border-t-2 border-surface pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-brown/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="heading-4 text-charcoal">Items Ordered ({order.items.length})</h3>
                  </div>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-surface/30 rounded-lg border border-surface hover:border-taupe/40 transition-colors">
                        {item.book.coverImage && (
                          <img
                            src={item.book.coverImage}
                            alt={item.book.title}
                            className="w-16 h-20 object-cover rounded shadow-sm"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="body font-semibold text-charcoal truncate">{item.book.title}</h4>
                          <p className="body-sm text-charcoal/60">by {item.book.author}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="body-sm text-charcoal/60">Qty: {item.quantity}</span>
                            <span className="text-charcoal/40">•</span>
                            <span className="body-sm text-charcoal/60">₹{roundPrice(item.price)} each</span>
                          </div>
                        </div>
                        <p className="heading-4 text-brown">₹{roundPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        )}

        {/* What's Next Section */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <Card className="mb-8 border-2 border-green/20 bg-green/5">
            <Card.Body>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="heading-3 text-green">What happens next?</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="body text-charcoal/80">You'll receive an order confirmation email shortly</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="body text-charcoal/80">The seller will process your order within 1-2 business days</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="body text-charcoal/80">Track your order status in the Orders page</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="body text-charcoal/80">Once delivered, books will be available in your Library</span>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="grid sm:grid-cols-3 gap-4 mb-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {orderId && (
            <motion.div variants={staggerItem}>
              <Link to={`/buyer/orders/${orderId}`}>
                <Button variant="primary" size="lg" fullWidth>
                  View Order Details
                </Button>
              </Link>
            </motion.div>
          )}
          <motion.div variants={staggerItem}>
            <Link to="/buyer/browse">
              <Button variant="outline" size="lg" fullWidth>
                Continue Shopping
              </Button>
            </Link>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Link to="/buyer/library">
              <Button variant="ghost" size="lg" fullWidth>
                Go to Library
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          className="text-center"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <p className="body text-charcoal/60">
            Need help?{' '}
            <Link to="/contact" className="text-brown hover:text-accent-brown font-semibold transition-colors">
              Contact Support
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
