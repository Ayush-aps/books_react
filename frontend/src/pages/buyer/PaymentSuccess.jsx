/**
 * Payment Success Page (Buyer)
 * Display after successful payment
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data?.data || response.data?.order || response.data);
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-xl text-gray-600">
            Thank you for your order. We've received your payment.
          </p>
        </div>

        {/* Order Details Card */}
        {order && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Details</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Order ID</p>
                <p className="font-semibold text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                <p className="font-semibold text-gray-900 capitalize">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="font-semibold text-gray-900 text-xl">₹{order.totalAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* Delivery Address */}
            {order.deliveryAddress && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Delivery Address</h3>
                <p className="text-gray-600">{order.deliveryAddress.fullName}</p>
                <p className="text-gray-600">{order.deliveryAddress.phone}</p>
                <p className="text-gray-600">{order.deliveryAddress.street}</p>
                <p className="text-gray-600">
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                </p>
              </div>
            )}

            {/* Order Items */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    {(item.book?.coverImage || item.coverImage) && (
                      <img
                        src={item.book?.coverImage || item.coverImage}
                        alt={item.book?.title || item.title}
                        className="w-16 h-20 object-cover rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/img/books/default-cover.jpg';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.book?.title || item.title}</h4>
                      <p className="text-sm text-gray-600">by {item.book?.author || item.author}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* What's Next Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>You'll receive an order confirmation email shortly</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>The seller will process your order within 1-2 business days</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Track your order status in the Orders page</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Once delivered, books will be available in your Library</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {orderId && (
            <Link
              to={`/buyer/orders/${orderId}`}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
            >
              View Order Details
            </Link>
          )}
          <Link
            to="/buyer/browse"
            className="flex-1 bg-white text-blue-600 py-3 px-6 rounded-lg font-semibold text-center border-2 border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            to="/buyer/library"
            className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-lg font-semibold text-center border-2 border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Go to Library
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center text-gray-600">
          <p>
            Need help? <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-semibold">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
