import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../config/stripe';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StripeCheckoutForm from '../../components/StripeCheckoutForm';
import { clearCart } from '../../redux/actions/cartActions';
import { createOrder } from '../../redux/actions/orderActions';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';
import { roundPrice } from '../../utils/priceUtils';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Debug Stripe configuration
  useEffect(() => {
    stripePromise.then(stripe => {
      console.log('Stripe loaded:', !!stripe);
      if (!stripe) {
        console.error('Stripe failed to load. Check your publishable key.');
      }
    });
  }, []);
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [clientSecret, setClientSecret] = useState('');
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    console.log('Checkout state changed:', {
      showStripeForm,
      hasClientSecret: !!clientSecret,
      paymentMethod,
      selectedAddress: !!selectedAddress
    });
  }, [showStripeForm, clientSecret, paymentMethod, selectedAddress]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/buyer/addresses');
      const addressesData = response.data.data.addresses || [];
      setAddresses(addressesData);
      if (addressesData.length > 0) {
        setSelectedAddress(addressesData[0]._id);
      }
    } catch (err) {
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      const price = item.discountPercentage
        ? item.price - (item.price * item.discountPercentage / 100)
        : item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.08;
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (paymentMethod === 'card') {
        // Create payment intent for Stripe
        console.log('Creating payment intent for amount:', total);

        // Get the full address object
        const fullAddress = addresses.find(addr => addr._id === selectedAddress);

        const response = await api.post('/orders/create-payment-intent', {
          amount: total,
          items: items.map(item => ({
            bookId: item.book?._id || item._id,
            quantity: item.quantity,
            price: item.discountPercentage
              ? item.price - (item.price * item.discountPercentage / 100)
              : item.price
          })),
          shippingAddress: fullAddress
        });

        console.log('Payment intent response:', response.data);

        // Extract client secret from nested data object
        const clientSecretValue = response.data?.data?.clientSecret || response.data?.clientSecret;
        console.log('Client secret:', clientSecretValue);

        if (clientSecretValue) {
          setClientSecret(clientSecretValue);
          setShowStripeForm(true);
          console.log('Stripe form should now be visible');
        } else {
          throw new Error('No client secret received from server');
        }
      } else {
        // Handle COD
        // Get the full address object
        const fullAddress = addresses.find(addr => addr._id === selectedAddress);

        // Transform address to match Order model schema
        const transformedAddress = {
          name: fullAddress.name,
          address: fullAddress.street, // street -> address
          city: fullAddress.city,
          state: fullAddress.state,
          pincode: fullAddress.zipCode, // zipCode -> pincode
          phone: fullAddress.phone
        };

        const orderData = {
          items: items.map(item => ({
            book: item.book?._id || item._id,
            quantity: item.quantity,
            price: item.discountPercentage
              ? item.price - (item.price * item.discountPercentage / 100)
              : item.price
          })),
          shippingAddress: transformedAddress,
          paymentMethod: 'cash_on_delivery', // Use enum value from Order model
          totalAmount: total,
          subtotal,
          tax,
          shippingCost: shipping
        };

        console.log('Creating COD order with data:', orderData);

        // Don't use .unwrap() - handle the promise directly
        const response = await dispatch(createOrder(orderData));

        console.log('COD order creation response:', response);

        if (response && response._id) {
          await dispatch(clearCart());
          navigate(`/buyer/payment-success?orderId=${response._id}`);
        } else {
          throw new Error('Order creation failed - no order ID returned');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to process order');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      setSubmitting(true);

      // Get the full address object
      const fullAddress = addresses.find(addr => addr._id === selectedAddress);

      // Transform address to match Order model schema
      const transformedAddress = {
        name: fullAddress.name,
        address: fullAddress.street, // street -> address
        city: fullAddress.city,
        state: fullAddress.state,
        pincode: fullAddress.zipCode, // zipCode -> pincode
        phone: fullAddress.phone
      };

      const orderData = {
        items: items.map(item => ({
          book: item.book?._id || item._id,
          quantity: item.quantity,
          price: item.discountPercentage
            ? item.price - (item.price * item.discountPercentage / 100)
            : item.price
        })),
        shippingAddress: transformedAddress,
        paymentMethod: 'credit_card', // Use enum value from Order model
        paymentIntentId,
        totalAmount: total,
        subtotal,
        tax,
        shippingCost: shipping
      };

      console.log('Creating order with data:', orderData);

      // Don't use .unwrap() - handle the promise directly
      const response = await dispatch(createOrder(orderData));

      console.log('Order creation response:', response);

      if (response && response._id) {
        await dispatch(clearCart());
        navigate(`/buyer/payment-success?orderId=${response._id}`);
      } else {
        throw new Error('Order creation failed - no order ID returned');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setError(err.message || 'Failed to create order');
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          className="mb-12"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="heading-1 text-charcoal mb-2">Checkout</h1>
          <p className="body text-charcoal/70">Complete your order</p>
        </motion.div>

        {error && (
          <motion.div
            className="mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <ErrorMessage message={error} />
          </motion.div>
        )}

        {items.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card elevated className="text-center py-16">
              <svg className="w-24 h-24 mx-auto text-taupe/40 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h2 className="heading-2 text-charcoal mb-3">Your cart is empty</h2>
              <p className="body text-charcoal/60 mb-6">Add some books to get started</p>
              <Link to="/browse">
                <Button variant="primary" size="lg">Browse Books</Button>
              </Link>
            </Card>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Address & Payment Divs*/}
            <motion.div
              className="lg:col-span-2 space-y-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Shipping Address */}
              <motion.div variants={staggerItem}>
                <Card>
                  <Card.Header>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brown/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h2 className="heading-3 text-charcoal">Shipping Address</h2>
                      </div>
                      <Link to="/buyer/addresses">
                        <Button variant="ghost" size="sm">Manage</Button>
                      </Link>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {addresses.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="body text-charcoal/60 mb-4">No addresses saved</p>
                        <Link to="/buyer/addresses">
                          <Button variant="outline">Add New Address</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <label
                            key={address._id}
                            className={`block border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${selectedAddress === address._id
                              ? 'border-brown bg-brown/5 shadow-sm'
                              : 'border-surface hover:border-taupe/40'
                              }`}
                          >
                            <input
                              type="radio"
                              name="address"
                              value={address._id}
                              checked={selectedAddress === address._id}
                              onChange={() => setSelectedAddress(address._id)}
                              className="sr-only"
                            />
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-charcoal mb-1">{address.name || address.fullName}</p>
                                <p className="body-sm text-charcoal/70">
                                  {address.street}, {address.city}
                                </p>
                                <p className="body-sm text-charcoal/70">
                                  {address.state}, {address.zipCode}
                                </p>
                                <p className="body-sm text-charcoal/70 mt-1">{address.phone}</p>
                              </div>
                              {selectedAddress === address._id && (
                                <div className="w-6 h-6 rounded-full bg-brown flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-cream" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </motion.div>

              {/* Payment Method */}
              <motion.div variants={staggerItem}>
                <Card>
                  <Card.Header>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <h2 className="heading-3 text-charcoal">Payment Method</h2>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div className="space-y-3">
                      {/* Card Payment */}
                      <label
                        className={`block border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${paymentMethod === 'card'
                          ? 'border-brown bg-brown/5 shadow-sm'
                          : 'border-surface hover:border-taupe/40'
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={() => {
                            setPaymentMethod('card');
                            setShowStripeForm(false);
                            setClientSecret('');
                          }}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-charcoal">Credit/Debit Card</span>
                              <Badge variant="success" size="sm">Secure</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-6 px-2 bg-charcoal/5 rounded flex items-center">
                                <span className="text-xs font-semibold text-charcoal/60">VISA</span>
                              </div>
                              <div className="h-6 px-2 bg-charcoal/5 rounded flex items-center">
                                <span className="text-xs font-semibold text-charcoal/60">MC</span>
                              </div>
                              <div className="h-6 px-2 bg-charcoal/5 rounded flex items-center">
                                <span className="text-xs font-semibold text-charcoal/60">AMEX</span>
                              </div>
                            </div>
                          </div>
                          {paymentMethod === 'card' && (
                            <div className="w-6 h-6 rounded-full bg-brown flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-cream" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </label>

                      {/* COD Payment */}
                      <label
                        className={`block border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${paymentMethod === 'cod'
                          ? 'border-brown bg-brown/5 shadow-sm'
                          : 'border-surface hover:border-taupe/40'
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => {
                            setPaymentMethod('cod');
                            setShowStripeForm(false);
                            setClientSecret('');
                          }}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-charcoal">Cash on Delivery</span>
                              <Badge variant="info" size="sm">Available</Badge>
                            </div>
                            <p className="body-sm text-charcoal/60">Pay when you receive your order</p>
                          </div>
                          {paymentMethod === 'cod' && (
                            <div className="w-6 h-6 rounded-full bg-brown flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-cream" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Stripe Payment Form */}
                    {showStripeForm && clientSecret && paymentMethod === 'card' && (
                      <motion.div
                        className="mt-6"
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                      >
                        <div className="bg-green/5 border-2 border-green/20 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-green" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <span className="body-sm text-green font-medium">
                              Secure payment powered by Stripe
                            </span>
                          </div>
                        </div>

                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                          <StripeCheckoutForm
                            onSuccess={handlePaymentSuccess}
                            amount={total}
                          />
                        </Elements>
                      </motion.div>
                    )}
                  </Card.Body>
                </Card>
              </motion.div>
            </motion.div>

            {/* Right Column - Order Summary */}
            <motion.div
              className="lg:col-span-1"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <Card className="sticky top-24">
                <Card.Header>
                  <h2 className="heading-3 text-charcoal">Order Summary</h2>
                </Card.Header>
                <Card.Body>
                  {/* Order Items */}
                  <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
                    {items.map((item) => {
                      const book = item.book || item;
                      const price = item.discountPercentage
                        ? item.price - (item.price * item.discountPercentage / 100)
                        : item.price;
                      return (
                        <div key={item._id} className="flex gap-3 pb-4 border-b border-surface last:border-0 last:pb-0">
                          <img
                            src={book.coverImage || item.coverImage || '/placeholder-book.png'}
                            alt={book.title || item.title}
                            className="w-16 h-20 object-cover rounded shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="body font-medium text-charcoal truncate mb-1">{book.title || item.title}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="body-sm text-charcoal/60">Qty: {item.quantity}</span>
                              {item.discountPercentage > 0 && (
                                <Badge variant="success" size="sm">{item.discountPercentage}% OFF</Badge>
                              )}
                            </div>
                            <p className="body font-semibold text-brown">
                              ₹{roundPrice(price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t-2 border-surface pt-4 space-y-3">
                    <div className="flex justify-between body text-charcoal/70">
                      <span>Subtotal</span>
                      <span className="font-medium text-charcoal">₹{roundPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between body text-charcoal/70">
                      <span>Tax (8%)</span>
                      <span className="font-medium text-charcoal">₹{roundPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between body text-charcoal/70">
                      <span>Shipping</span>
                      <span className="font-medium text-charcoal">
                        {shipping === 0 ? (
                          <Badge variant="success" size="sm">FREE</Badge>
                        ) : (
                          `₹${roundPrice(shipping)}`
                        )}
                      </span>
                    </div>
                    {shipping === 0 && (
                      <p className="body-sm text-green flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Free shipping on orders over ₹50!
                      </p>
                    )}
                    <div className="border-t-2 border-surface pt-3 flex justify-between items-center">
                      <span className="heading-4 text-charcoal">Total</span>
                      <span className="heading-3 text-brown">₹{roundPrice(total)}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  {!showStripeForm && (
                    <div className="mt-6">
                      <Button
                        onClick={handlePlaceOrder}
                        disabled={submitting || !selectedAddress}
                        isLoading={submitting}
                        variant="primary"
                        size="lg"
                        fullWidth
                      >
                        {paymentMethod === 'card' ? 'Continue to Payment' : 'Place Order'}
                      </Button>
                    </div>
                  )}

                  <p className="body-sm text-charcoal/50 text-center mt-4">
                    By placing your order, you agree to our terms and conditions
                  </p>
                </Card.Body>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
