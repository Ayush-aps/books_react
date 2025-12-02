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
      setOrder(response.data?.order);
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
      setOrder({ ...order, orderStatus: newStatus });
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
      pending: 'bg-warning/10 text-warning',
      processing: 'bg-info/10 text-info',
      shipped: 'bg-accent-gold/10 text-accent-gold',
      delivered: 'bg-success/10 text-success',
      cancelled: 'bg-error/10 text-error'
    };
    return colors[status] || 'bg-text-tertiary/10 text-text-tertiary';
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
            className="text-charcoal text-xs sm:text-sm rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none hover:shadow-md whitespace-nowrap inline-flex items-center border-none"
            style={{ 
              backgroundColor: 'transparent',
              padding: '0.625rem 1.5rem',
              border: 'none',
              lineHeight: '1.5',
              height: '50px',
              fontWeight: '500',
              outline: 'none'
            }}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const subtotal = order.totalAmount / 1.08; // Reverse calculate from total (8% tax)
  const tax = order.totalAmount - subtotal;
  const steps = getStatusSteps(order.orderStatus);

  return (
    <div className="min-h-screen bg-background-primary py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/seller/orders')}
            className="text-charcoal text-xs sm:text-sm rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none hover:shadow-md whitespace-nowrap inline-flex items-center border-none"
            style={{ 
              backgroundColor: 'transparent',
              padding: '0.625rem 1.5rem',
              border: 'none',
              lineHeight: '1.5',
              height: '50px',
              fontWeight: '500',
              outline: 'none'
            }}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          
          <div className="bg-gradient-to-r from-accent-brown to-accent-brown/90 rounded-lg p-6 text-white shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Order #{order._id.slice(-8)}</h1>
                <p className="text-white/80">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm mb-1">Order Status</p>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.orderStatus)} bg-white`}>
                  {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update */}
        {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
          <div className="bg-background-secondary rounded-lg shadow-sm p-6 mb-6 border border-border-primary">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Update Order Status</h2>
            <div className="flex flex-wrap gap-3">
              {['processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating || order.orderStatus === status}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    order.orderStatus === status
                      ? 'bg-background-primary text-text-tertiary cursor-not-allowed border border-border-primary'
                      : 'bg-accent-brown text-white hover:bg-accent-brown/90 disabled:bg-background-primary disabled:text-text-tertiary disabled:cursor-not-allowed'
                  }`}
                >
                  {updating ? 'Updating...' : `Mark as ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Timeline */}
        {order.orderStatus !== 'cancelled' && (
          <div className="bg-background-secondary rounded-lg shadow-sm p-6 mb-6 border border-border-primary">
            <h2 className="text-lg font-semibold text-text-primary mb-6">Order Progress</h2>
            <div className="relative flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.name} className="flex-1 flex items-center relative">
                  <div className="flex flex-col items-center flex-1 relative z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-background-secondary shadow-lg ${
                      step.completed ? 'bg-accent-green text-white' : 'bg-background-secondary text-text-tertiary border-border-primary'
                    }`}>
                      {step.completed ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <p className={`mt-3 text-sm font-medium text-center ${
                      step.completed ? 'text-accent-green' : 'text-text-tertiary'
                    }`}>
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`absolute top-6 left-1/2 right-0 h-1 -z-0 ${
                      step.completed && steps[index + 1]?.completed ? 'bg-accent-green' : 'bg-border-primary'
                    }`} style={{ width: 'calc(100% - 24px)', marginLeft: '12px' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-background-secondary rounded-lg shadow-sm p-6 border border-border-primary">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-border-primary last:border-0 last:pb-0">
                    {item.book?.coverImage && (
                      <img
                        src={item.book.coverImage}
                        alt={item.book.title}
                        className="w-20 h-28 object-cover rounded-lg shadow"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary">{item.book?.title || 'Unknown Book'}</h3>
                      <p className="text-sm text-text-secondary mt-1">by {item.book?.author || 'Unknown Author'}</p>
                      <p className="text-sm text-text-tertiary mt-2">Quantity: {item.quantity}</p>
                      <p className="text-lg font-semibold text-accent-brown mt-2">
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
            <div className="bg-background-secondary rounded-lg shadow-sm p-6 border border-border-primary">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Buyer Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-text-secondary">Name</p>
                  <p className="font-medium text-text-primary">{order.buyer?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Email</p>
                  <p className="font-medium text-text-primary">{order.buyer?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-background-secondary rounded-lg shadow-sm p-6 border border-border-primary">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Shipping Address</h2>
              <div className="bg-background-primary rounded-lg p-4 text-sm border border-border-primary">
                <p className="font-medium text-text-primary">{order.shippingAddress.fullName}</p>
                <p className="text-text-secondary mt-2">{order.shippingAddress.street}</p>
                <p className="text-text-secondary">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p className="text-text-secondary mt-2">{order.shippingAddress.phone}</p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-background-secondary rounded-lg shadow-sm p-6 border border-border-primary">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Payment Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Tax</span>
                  <span className="text-text-primary">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="text-accent-green font-medium">FREE</span>
                </div>
                <div className="pt-2 border-t border-border-primary">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-text-primary">Total</span>
                    <span className="text-xl font-bold text-accent-brown">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-border-primary">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Payment Method</span>
                    <span className="text-text-primary capitalize">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-text-secondary">Payment Status</span>
                    <span className={`font-medium ${
                      order.paymentStatus === 'paid' ? 'text-success' : 'text-warning'
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
