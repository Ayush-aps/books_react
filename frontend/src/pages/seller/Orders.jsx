/**
 * Orders Page (Seller)
 * Manage and process seller orders
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SuccessToast from '../../components/SuccessToast';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getOrders();
      // Backend returns: { success: true, data: { orders: [...], totalSales, etc } }
      const ordersData = response.data?.orders || response.orders || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await sellerService.updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, orderStatus: newStatus, status: newStatus } : order
      ));
      
      setSuccessMessage(`Order status updated to ${newStatus}`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusVariant = (status) => {
    const variants = {
      ordered: 'info',
      pending: 'warning',
      processing: 'info',
      shipped: 'default',
      delivered: 'success',
      cancelled: 'error'
    };
    return variants[status] || 'default';
  };

  const getOrderStatus = (order) => order.orderStatus || order.status || 'ordered';

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => getOrderStatus(order) === filter);

  const filterTabs = [
    { value: 'all', label: 'All Orders', count: orders.length },
    { value: 'ordered', label: 'Ordered', count: orders.filter(o => getOrderStatus(o) === 'ordered').length },
    { value: 'processing', label: 'Processing', count: orders.filter(o => getOrderStatus(o) === 'processing').length },
    { value: 'shipped', label: 'Shipped', count: orders.filter(o => getOrderStatus(o) === 'shipped').length },
    { value: 'delivered', label: 'Delivered', count: orders.filter(o => getOrderStatus(o) === 'delivered').length },
    { value: 'cancelled', label: 'Cancelled', count: orders.filter(o => getOrderStatus(o) === 'cancelled').length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mb-12"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="heading-1 text-charcoal mb-2">Orders</h1>
          <p className="body text-charcoal/70">Manage and process your orders</p>
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

        {/* Filter Tabs */}
        <motion.div 
          className="mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <Card.Body className="p-0">
              <nav className="flex space-x-1 overflow-x-auto p-2">
                {filterTabs.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`px-6 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      filter === tab.value
                        ? 'bg-brown text-white shadow-sm'
                        : 'text-charcoal/70 hover:bg-taupe/10'
                    }`}
                  >
                    {tab.label}
                    <Badge 
                      variant={filter === tab.value ? 'light' : 'default'} 
                      size="sm" 
                      className="ml-2"
                    >
                      {tab.count}
                    </Badge>
                  </button>
                ))}
              </nav>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <Card.Body className="py-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-taupe/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="heading-4 text-charcoal mb-3">
                    {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
                  </h3>
                  <p className="body text-charcoal/70">
                    {filter === 'all' 
                      ? 'Orders will appear here when customers purchase your books.'
                      : `There are no orders with status "${filter}" at the moment.`
                    }
                  </p>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredOrders.map(order => (
              <motion.div key={order._id} variants={staggerItem}>
                <Card hoverable>
                  <Card.Body>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="heading-4 text-charcoal">
                            Order #{order.orderId || order._id.slice(-8)}
                          </h3>
                          <Badge variant={getStatusVariant(getOrderStatus(order))}>
                            {getOrderStatus(order).charAt(0).toUpperCase() + getOrderStatus(order).slice(1)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div>
                            <p className="body-sm text-charcoal/60 mb-1">Date</p>
                            <p className="body-sm font-medium text-charcoal">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="body-sm text-charcoal/60 mb-1">Items</p>
                            <p className="body-sm font-medium text-charcoal">
                              {order.items?.length || 0} book{(order.items?.length || 0) > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div>
                            <p className="body-sm text-charcoal/60 mb-1">Total</p>
                            <p className="heading-5 text-brown">
                              ₹{order.totalAmount?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="body-sm text-charcoal/60 mb-1">Buyer</p>
                            <p className="body-sm font-medium text-charcoal">
                              {order.buyer?.name || order.userId?.name || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div>
                          <p className="body-sm font-medium text-charcoal mb-3">Items in this order:</p>
                          <div className="space-y-3">
                            {order.items && order.items.slice(0, 2).map((item, index) => (
                              <div key={index} className="flex items-center gap-4">
                                {item.book?.coverImage && (
                                  <img 
                                    src={item.book.coverImage} 
                                    alt={item.book.title}
                                    className="w-12 h-16 object-cover rounded shadow-sm"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="body-sm font-medium text-charcoal truncate">
                                    {item.book?.title || item.bookId?.title || 'Unknown Book'}
                                  </p>
                                  <p className="body-sm text-charcoal/60">
                                    Qty: {item.quantity} × ₹{item.price?.toFixed(2) || '0.00'}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {order.items && order.items.length > 2 && (
                              <p className="body-sm text-charcoal/60 italic">
                                + {order.items.length - 2} more item(s)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-4 lg:w-64">
                        {/* Status Update Dropdown */}
                        {getOrderStatus(order) !== 'delivered' && getOrderStatus(order) !== 'cancelled' && (
                          <Input.Select
                            id={`status-${order._id}`}
                            label="Update Status"
                            value={getOrderStatus(order)}
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                            disabled={updatingOrderId === order._id}
                          >
                            <option value="ordered">Ordered</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </Input.Select>
                        )}

                        {/* View Details Button */}
                        <Link
                          to={`/seller/orders/${order._id}`}
                          className="btn btn-outline btn-md w-full text-center inline-flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </Link>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

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

export default Orders;
