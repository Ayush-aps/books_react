/**
 * Checkout Page (Buyer)
 * Address selection and order placement
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '../../config/stripe';
import { createOrder } from '../../redux/actions/orderActions';
import { clearCart } from '../../redux/actions/cartActions';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StripeCheckoutForm from '../../components/StripeCheckoutForm';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector(state => state.cart);
  const { user } = useSelector(state => state.auth);
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card'); // card or cod
  const [clientSecret, setClientSecret] = useState('');
  const [showStripeForm, setShowStripeForm] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      navigate('/buyer/cart');
      return;
    }

    fetchAddresses();
  }, [user, items, navigate]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/buyer/addresses');
      const addressList = response.data.data || [];
      setAddresses(addressList);
      
      // Select first address by default
      if (addressList.length > 0 && !selectedAddress) {
        setSelectedAddress(addressList[0]._id);
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load addresses');
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
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // If card payment, create payment intent first
      if (paymentMethod === 'card') {
        const response = await api.post('/orders/create-payment-intent', {
          amount: total,
          items: items.map(item => ({
            bookId: item._id,
            quantity: item.quantity,
            price: item.discountPercentage 
              ? item.price - (item.price * item.discountPercentage / 100)
              : item.price
          })),
          shippingAddress: selectedAddress
        });
        
        setClientSecret(response.data.data.clientSecret);
        setShowStripeForm(true);
        setSubmitting(false);
        return;
      }

      // For COD, proceed with order creation directly
      const orderData = {
        items: items.map(item => ({
          bookId: item._id,
          quantity: item.quantity,
          price: item.discountPercentage 
            ? item.price - (item.price * item.discountPercentage / 100)
            : item.price
        })),
        shippingAddress: selectedAddress,
        paymentMethod,
        totalAmount: total
      };

      const result = await dispatch(createOrder(orderData));
      
      if (result.success) {
        // Clear cart after successful order
        dispatch(clearCart());
        
        // Navigate to success page with order ID
        navigate(`/buyer/payment-success?orderId=${result.order._id}`);
      } else {
        setError(result.message || 'Failed to place order');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Clear cart after successful payment
    dispatch(clearCart());
    // Navigate to success page
    navigate('/buyer/payment-success');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading checkout..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Address and Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                <Link
                  to="/buyer/addresses"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Manage Addresses
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No addresses found</p>
                  <Link
                    to="/buyer/addresses/new"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Add Address
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedAddress === address._id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
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
                      <div className="flex items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{address.fullName}</p>
                          <p className="text-gray-600 text-sm mt-1">
                            {address.street}, {address.city}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {address.state}, {address.zipCode}
                          </p>
                          <p className="text-gray-600 text-sm mt-1">{address.phone}</p>
                        </div>
                        {selectedAddress === address._id && (
                          <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label
                  className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
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
                    }}
                    className="mr-3"
                  />
                  <span className="font-medium">Credit/Debit Card</span>
                  <div className="flex items-center gap-2 mt-2 ml-6">
                    <img src="/img/visa.svg" alt="Visa" className="h-6" onError={(e) => e.target.style.display = 'none'} />
                    <img src="/img/mastercard.svg" alt="Mastercard" className="h-6" onError={(e) => e.target.style.display = 'none'} />
                    <img src="/img/amex.svg" alt="Amex" className="h-6" onError={(e) => e.target.style.display = 'none'} />
                  </div>
                </label>
                <label
                  className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'cod'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
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
                    }}
                    className="mr-3"
                  />
                  <span className="font-medium">Cash on Delivery</span>
                  <p className="text-sm text-gray-600 mt-1 ml-6">Pay when you receive your order</p>
                </label>
              </div>

              {/* Stripe Payment Form */}
              {showStripeForm && clientSecret && paymentMethod === 'card' && (
                <div className="mt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-blue-800 font-medium">
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
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              {/* Order Items */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => {
                  const price = item.discountPercentage 
                    ? item.price - (item.price * item.discountPercentage / 100)
                    : item.price;
                  return (
                    <div key={item._id} className="flex gap-3">
                      <img
                        src={item.coverImage || '/placeholder-book.png'}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ${(price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                {shipping === 0 && (
                  <p className="text-xs text-green-600">Free shipping on orders over $50!</p>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              {!showStripeForm && (
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting || !selectedAddress}
                  className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Processing...' : paymentMethod === 'card' ? 'Continue to Payment' : 'Place Order'}
                </button>
              )}

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing your order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
