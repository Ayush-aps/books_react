/**
 * Order Details Page (Buyer)
 * Detailed view of a specific order
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderDetails } from '../../redux/actions/orderActions';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SuccessToast from '../../components/SuccessToast';

const OrderDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { currentOrder, loading, error } = useSelector(state => state.orders);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    dispatch(fetchOrderDetails(id));
    
    // Show success toast if redirected from successful order
    if (searchParams.get('success') === 'true') {
      setShowSuccessToast(true);
    }
  }, [dispatch, id, searchParams]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusSteps = (currentStatus) => {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(currentStatus);
    
    if (currentStatus === 'cancelled') {
      return steps.map(step => ({ name: step, completed: false, cancelled: true }));
    }
    
    return steps.map((step, index) => ({
      name: step,
      completed: index <= currentIndex,
      cancelled: false
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading order details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage message={error} onRetry={() => dispatch(fetchOrderDetails(id))} />
      </div>
    );
  }

  if (!currentOrder) {
    return null;
  }

  const order = currentOrder;
  const statusSteps = getStatusSteps(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link to="/buyer/orders" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            ← Back to Orders
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Order Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Order Details</h1>
                <p className="text-blue-100">Order ID: {order._id}</p>
                <p className="text-blue-100 text-sm mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Order Status Timeline */}
          {order.status !== 'cancelled' && (
            <div className="px-6 py-8 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => (
                  <div key={step.name} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step.completed ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <p className={`mt-2 text-sm font-medium ${
                        step.completed ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.name.charAt(0).toUpperCase() + step.name.slice(1)}
                      </p>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`h-1 flex-1 ${
                        step.completed ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="px-6 py-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex gap-4">
                  <img
                    src={item.bookId?.coverImage || '/placeholder-book.png'}
                    alt={item.bookId?.title}
                    className="w-20 h-28 object-cover rounded"
                  />
                  <div className="flex-1">
                    <Link
                      to={`/buyer/books/${item.bookId?._id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {item.bookId?.title || 'Book Title'}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">
                      by {item.bookId?.author || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 capitalize">
                      Condition: {item.bookId?.condition}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="px-6 py-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
              <p className="text-gray-700 mt-2">
                {order.shippingAddress?.street}
              </p>
              <p className="text-gray-700">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
              </p>
              <p className="text-gray-700 mt-2">
                Phone: {order.shippingAddress?.phone}
              </p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="px-6 py-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>${(order.totalAmount / 1.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax (8%)</span>
                <span>${(order.totalAmount - (order.totalAmount / 1.08)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span>FREE</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Payment Method: <span className="font-medium text-gray-900 capitalize">
                    {order.paymentMethod || 'Card'}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Payment Status: <span className="font-medium text-green-600">Paid</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-700 mb-3">
            If you have any questions about your order, please contact our support team.
          </p>
          <Link
            to="/contact"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Contact Support →
          </Link>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          message="Order placed successfully! We'll send you updates via email."
          onClose={() => setShowSuccessToast(false)}
          duration={5000}
        />
      )}
    </div>
  );
};

export default OrderDetails;
