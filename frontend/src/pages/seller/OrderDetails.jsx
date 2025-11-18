/**
 * Order Details Page (Seller)
 * View detailed information about a specific order
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SuccessToast from '../../components/SuccessToast';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getOrderDetails(id);
      setOrder(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      await sellerService.updateOrderStatus(id, newStatus);
      setOrder({ ...order, status: newStatus });
      setSuccessMessage(`Order status updated to ${newStatus}`);
      setShowSuccessToast(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

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
    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statuses.indexOf(currentStatus);
    
    return statuses.map((status, index) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      completed: currentStatus === 'cancelled' ? false : index <= currentIndex,
      current: status === currentStatus
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <ErrorMessage message={error} />
          <button
            onClick={() => navigate('/seller/orders')}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const subtotal = order.totalAmount / 1.08; // Reverse calculate from total (8% tax)
  const tax = order.totalAmount - subtotal;
  const steps = getStatusSteps(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/seller/orders')}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Order #{order._id.slice(-8)}</h1>
                <p className="text-blue-100">
                  Placed on {(order.createdAt || order.orderDate) ? new Date(order.createdAt || order.orderDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm mb-1">Order Status</p>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Order Status</h2>
            <div className="flex flex-wrap gap-3">
              {['processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating || order.status === status}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    order.status === status
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                  }`}
                >
                  {updating ? 'Updating...' : `Mark as ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Timeline */}
        {order.status !== 'cancelled' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h2>
            <div className="relative">
              <div className="flex justify-between items-center">
                {steps.map((step, index) => (
                  <div key={step.name} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {step.completed ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-gray-500 font-semibold">{index + 1}</span>
                        )}
                      </div>
                      <p className={`mt-2 text-sm font-medium ${
                        step.completed ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.name}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`absolute top-5 left-1/2 w-full h-0.5 ${
                        steps[index + 1].completed ? 'bg-green-500' : 'bg-gray-200'
                      }`} style={{ zIndex: -1 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                    {item.bookId?.coverImage && (
                      <img
                        src={item.bookId.coverImage}
                        alt={item.bookId.title}
                        className="w-20 h-28 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.bookId?.title || 'Unknown Book'}</h3>
                      <p className="text-sm text-gray-600 mt-1">by {item.bookId?.author || 'Unknown Author'}</p>
                      <p className="text-sm text-gray-500 mt-2">Quantity: {item.quantity}</p>
                      <p className="text-lg font-semibold text-gray-900 mt-2">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Buyer Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Buyer Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{order.userId?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{order.userId?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                <p className="text-gray-600 mt-2">{order.shippingAddress.street}</p>
                <p className="text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p className="text-gray-600 mt-2">{order.shippingAddress.phone}</p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="text-gray-900 capitalize">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`font-medium ${
                      order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <SuccessToast
            message={successMessage}
            onClose={() => setShowSuccessToast(false)}
          />
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
