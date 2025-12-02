/**
 * Order Details Page (Buyer)
 * Detailed view of a specific order
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderDetails } from '../../redux/actions/orderActions';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SuccessToast from '../../components/SuccessToast';
import ReturnRequestModal from '../../components/ReturnRequestModal';
import { roundPrice } from '../../utils/priceUtils';

const OrderDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentOrder, loading, error } = useSelector(state => state.orders);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Utility function to format text (replace underscores with spaces)
  const formatText = (text) => {
    if (!text) return '';
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  useEffect(() => {
    dispatch(fetchOrderDetails(id));

    // Show success toast if redirected from successful order
    if (searchParams.get('success') === 'true') {
      setShowSuccessToast(true);
    }
  }, [dispatch, id, searchParams]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? Stock will be restored.')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`http://localhost:3000/api/orders/${id}/cancel`, {
        method: 'PUT',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || 'Order cancelled successfully');
        dispatch(fetchOrderDetails(id)); // Refresh order details
      } else {
        alert(data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReturn = async (reason) => {
    try {
      setActionLoading(true);
      const response = await fetch(`http://localhost:3000/api/orders/${id}/return`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || 'Return request submitted successfully');
        setShowReturnModal(false);
        dispatch(fetchOrderDetails(id)); // Refresh order details
      } else {
        alert(data.message || 'Failed to submit return request');
      }
    } catch (error) {
      console.error('Request return error:', error);
      alert('Failed to submit return request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ordered: 'bg-accent-brown/10 text-accent-brown',
      pending: 'bg-warning/10 text-warning',
      processing: 'bg-info/10 text-info',
      shipped: 'bg-accent-gold/10 text-accent-gold',
      delivered: 'bg-success/10 text-success',
      cancelled: 'bg-error/10 text-error'
    };
    return colors[status] || 'bg-text-tertiary/10 text-text-tertiary';
  };

  const getStatusSteps = (currentStatus) => {
    const steps = ['ordered', 'processing', 'shipped', 'delivered'];
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
  const orderStatus = order.orderStatus || order.status || 'ordered';
  const statusSteps = getStatusSteps(orderStatus);

  return (
    <div className="min-h-screen bg-background-primary py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/buyer/orders')}
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

        <div className="bg-background-secondary rounded-lg shadow-md overflow-hidden">
          {/* Order Header */}
          <div className="bg-gradient-to-r from-accent-brown to-accent-brown/90 px-6 py-8 text-white">
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
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(orderStatus)}`}>
                {formatText(orderStatus)}
              </span>
            </div>
          </div>

          {/* Order Status Timeline */}
          {orderStatus !== 'cancelled' && (
            <div className="px-6 py-8 border-b border-border-primary">
              <h2 className="text-lg font-semibold text-text-primary mb-6">Order Status</h2>
              <div className="relative flex items-center justify-between">
                {statusSteps.map((step, index) => (
                  <div key={step.name} className="flex-1 flex items-center relative">
                    <div className="flex flex-col items-center flex-1 relative z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-background-secondary shadow-lg ${step.completed ? 'bg-accent-green text-white' : 'bg-background-secondary text-text-tertiary border-border-primary'
                        }`}>
                        {step.completed ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="font-semibold">{index + 1}</span>
                        )}
                      </div>
                      <p className={`mt-3 text-sm font-medium text-center ${step.completed ? 'text-accent-green' : 'text-text-tertiary'
                        }`}>
                        {formatText(step.name)}
                      </p>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`absolute top-6 left-1/2 right-0 h-1 -z-0 ${step.completed && statusSteps[index + 1]?.completed ? 'bg-accent-green' : 'bg-border-primary'
                        }`} style={{ width: 'calc(100% - 24px)', marginLeft: '12px' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="px-6 py-8 border-b border-border-primary">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex gap-4">
                  <img
                    src={item.book?.coverImage || '/placeholder-book.png'}
                    alt={item.book?.title}
                    className="w-20 h-28 object-cover rounded"
                  />
                  <div className="flex-1">
                    <Link
                      to={`/buyer/book/${item.book?._id}`}
                      className="font-semibold text-text-primary hover:text-accent-brown transition-colors"
                    >
                      {item.book?.title || 'Book Title'}
                    </Link>
                    <p className="text-sm text-text-secondary mt-1">
                      by {item.book?.author || 'Unknown'}
                    </p>
                    {item.seller && (
                      <p className="text-sm text-text-secondary mt-1">
                        Seller: <span className="font-medium text-text-primary">{item.seller.name}</span>
                      </p>
                    )}
                    <p className="text-sm text-text-secondary mt-1">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm text-text-secondary mt-1 capitalize">
                      Condition: {item.book?.condition}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text-primary">
                      ₹{roundPrice(item.price * item.quantity)}
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      ₹{roundPrice(item.price)} each
                    </p>
                    {orderStatus === 'delivered' && item.book?._id && (
                      <Link
                        to={`/buyer/book/${item.book._id}?review=true`}
                        className="mt-3 inline-block px-4 py-2 bg-accent-brown text-white text-sm rounded-lg hover:bg-accent-brown/90 transition-colors"
                      >
                        Write Review
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="px-6 py-8 border-b border-border-primary">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Shipping Address</h2>
            <div className="bg-background-primary rounded-lg p-4 border border-border-primary">
              <p className="font-medium text-text-primary">{order.shippingAddress?.fullName}</p>
              <p className="text-text-secondary mt-2">
                {order.shippingAddress?.street}
              </p>
              <p className="text-text-secondary">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
              </p>
              <p className="text-text-secondary mt-2">
                Phone: {order.shippingAddress?.phone}
              </p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="px-6 py-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Payment Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>₹{roundPrice(order.totalAmount / 1.08)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Tax (8%)</span>
                <span>₹{roundPrice(order.totalAmount - (order.totalAmount / 1.08))}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span>FREE</span>
              </div>
              <div className="border-t border-border-primary pt-2 flex justify-between text-lg font-bold text-text-primary">
                <span>Total</span>
                <span className="text-accent-brown">₹{roundPrice(order.totalAmount)}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-border-primary">
                <p className="text-sm text-text-secondary">
                  Payment Method: <span className="font-medium text-text-primary">
                    {formatText(order.paymentMethod) || 'Card'}
                  </span>
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Payment Status: <span className="font-medium text-success">Paid</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="px-6 py-6 border-t-2 border-border-primary bg-background-primary">
            <div className="flex flex-wrap gap-3">
              {/* Cancel Button - Show for ordered/processing orders */}
              {(orderStatus === 'ordered' || orderStatus === 'processing') && (
                <button
                  onClick={handleCancelOrder}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel Order
                    </>
                  )}
                </button>
              )}

              {/* Return Button - Show for delivered orders */}
              {orderStatus === 'delivered' && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Requesting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Request Return
                    </>
                  )}
                </button>
              )}

              {/* Return Status Info */}
              {orderStatus === 'return_requested' && (
                <div className="px-6 py-3 bg-yellow-100 text-yellow-800 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Return Requested - Pending Admin Review</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-accent-brown/5 border border-accent-brown/20 rounded-lg p-6">
          <h3 className="font-semibold text-text-primary mb-2">Need Help?</h3>
          <p className="text-sm text-text-secondary mb-3">
            If you have any questions about your order, please contact our support team.
          </p>
          <Link
            to="/contact"
            className="text-accent-brown hover:text-accent-brown/80 font-medium text-sm inline-flex items-center gap-1"
          >
            Contact Support
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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

      {/* Return Request Modal */}
      <ReturnRequestModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onSubmit={handleRequestReturn}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default OrderDetails;
