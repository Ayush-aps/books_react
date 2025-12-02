import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../../redux/actions/orderActions';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';
import { roundPrice } from '../../utils/priceUtils';
import ReturnRequestModal from '../../components/ReturnRequestModal';

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orders);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Utility function to format text (replace underscores with spaces)
  const formatText = (text) => {
    if (!text) return '';
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const getStatusVariant = (status) => {
    const variants = {
      ordered: 'info',
      pending: 'warning',
      processing: 'info',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'error',
      return_requested: 'warning',
      returned: 'info'
    };
    return variants[status] || 'default';
  };

  const getOrderStatus = (order) => order.orderStatus || order.status || 'ordered';

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? Stock will be restored.')) {
      return;
    }

    try {
      setActionLoading(orderId);
      const response = await fetch(`http://localhost:3000/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || 'Order cancelled successfully');
        dispatch(fetchOrders()); // Refresh orders
      } else {
        alert(data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestReturn = async (reason) => {
    if (!selectedOrderId) return;

    try {
      setActionLoading(selectedOrderId);
      const response = await fetch(`http://localhost:3000/api/orders/${selectedOrderId}/return`, {
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
        setSelectedOrderId(null);
        dispatch(fetchOrders()); // Refresh orders
      } else {
        alert(data.message || 'Failed to submit return request');
      }
    } catch (error) {
      console.error('Request return error:', error);
      alert('Failed to submit return request. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => getOrderStatus(order) === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <LoadingSpinner size="lg" message="Loading orders..." />
      </div>
    );
  }

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
          <h1 className="heading-1 text-charcoal mb-2">My Orders</h1>
          <p className="body text-charcoal/70">Track and manage your book orders</p>
        </motion.div>

        {error && (
          <motion.div
            className="mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <ErrorMessage message={error} onRetry={() => dispatch(fetchOrders())} />
          </motion.div>
        )}

        {/* Filter Tabs */}
        <motion.div
          className="mb-8 flex gap-2 overflow-x-auto pb-2"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          {['all', 'ordered', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested'].map((status) => {
            const isActive = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-5 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${isActive
                  ? 'bg-brown text-cream shadow-md'
                  : 'bg-white text-charcoal/70 hover:bg-surface hover:text-charcoal border border-surface'
                  }`}
              >
                {formatText(status)}
              </button>
            );
          })}
        </motion.div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card elevated className="text-center py-16">
              <svg
                className="mx-auto h-24 w-24 text-taupe/40 mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h2 className="heading-2 text-charcoal mb-3">
                {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
              </h2>
              <p className="body text-charcoal/60 mb-6">
                {filter === 'all'
                  ? 'Start shopping to see your orders here'
                  : `You don't have any ${filter} orders`}
              </p>
              {filter === 'all' && (
                <Link to="/browse">
                  <Button variant="primary" size="lg">Browse Books</Button>
                </Link>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredOrders.map((order) => (
              <motion.div key={order._id} variants={staggerItem}>
                <Card hoverable>
                  <Card.Body>
                    {/* Order Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="body text-charcoal mb-2">
                            Order ID: <span className="font-mono font-semibold text-charcoal">#{order.orderId || order._id.slice(-8).toUpperCase()}</span>
                          </p>
                          <Badge variant={getStatusVariant(getOrderStatus(order))} size="md">
                            {formatText(getOrderStatus(order))}
                          </Badge>
                        </div>
                        <p className="body-sm text-charcoal/60">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <Link to={`/buyer/orders/${order._id}`}>
                        <button
                          className="text-white text-base rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none shadow-sm hover:shadow-md whitespace-nowrap flex items-center gap-1"
                          style={{
                            backgroundColor: '#8B7355',
                            padding: '0.3rem 1.3rem',
                            border: '1px solid transparent',
                            lineHeight: '1.5',
                            height: '40px',
                            fontWeight: '500'
                          }}
                        >
                          View Details
                          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </Link>
                    </div>

                    {/* Order Items */}
                    <div className="border-t-2 border-surface pt-6 mb-6">
                      <div className="space-y-4">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={item._id || index} className="flex gap-4">
                            <img
                              src={item.book?.coverImage || '/placeholder-book.png'}
                              alt={item.book?.title || 'Book'}
                              className="w-16 h-20 object-cover rounded shadow-sm flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="body font-semibold text-charcoal truncate mb-1">
                                {item.book?.title || 'Book Title'}
                              </p>
                              {item.seller && (
                                <p className="body-sm text-charcoal/50 mb-1">
                                  Seller: <span className="font-medium text-charcoal/70">{item.seller.name}</span>
                                </p>
                              )}
                              <p className="body-sm text-charcoal/60 mb-2">
                                Quantity: {item.quantity}
                              </p>
                              <p className="body font-semibold text-brown">
                                ₹{roundPrice(item.price)}
                              </p>
                              {getOrderStatus(order) === 'delivered' && item.book?._id && (
                                <Link
                                  to={`/buyer/book/${item.book._id}?review=true`}
                                  className="mt-2 inline-block px-3 py-1 bg-brown text-white text-xs rounded hover:bg-brown/90 transition-colors"
                                >
                                  Write Review
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="flex items-center gap-2 text-charcoal/60 body-sm pt-2 border-t border-surface">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <span>+ {order.items.length - 2} more item(s)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t-2 border-surface pt-4 pb-4 flex flex-wrap gap-3">
                      {/* Cancel Button - Show for ordered/processing orders */}
                      {(getOrderStatus(order) === 'ordered' || getOrderStatus(order) === 'processing') && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={actionLoading === order._id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {actionLoading === order._id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel Order
                            </>
                          )}
                        </button>
                      )}

                      {/* Return Button - Show for delivered orders */}
                      {getOrderStatus(order) === 'delivered' && (
                        <button
                          onClick={() => {
                            setSelectedOrderId(order._id);
                            setShowReturnModal(true);
                          }}
                          disabled={actionLoading === order._id}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {actionLoading === order._id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Requesting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Request Return
                            </>
                          )}
                        </button>
                      )}

                      {/* Return Status Badge */}
                      {getOrderStatus(order) === 'return_requested' && (
                        <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Return Requested - Pending Admin Review</span>
                        </div>
                      )}
                    </div>

                    {/* Order Footer */}
                    <div className="border-t-2 border-surface pt-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-charcoal/60 body-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span>{formatText(order.paymentMethod)}</span>
                        </div>
                        <span className="text-charcoal/40">•</span>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="body text-charcoal/70">Total:</span>
                        <span className="heading-3 text-brown">
                          ₹{roundPrice(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Return Request Modal */}
      <ReturnRequestModal
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false);
          setSelectedOrderId(null);
        }}
        onSubmit={handleRequestReturn}
        isLoading={actionLoading === selectedOrderId}
      />
    </div>
  );
};

export default Orders;
