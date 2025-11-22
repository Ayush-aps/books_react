/**
 * Admin Orders Page
 * View and manage all orders in the system
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminService.getOrders();
      setOrders(response.data?.orders || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await adminService.updateOrder(orderId, { orderStatus: newStatus });
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

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => getOrderStatus(order) === statusFilter);

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
          <h1 className="heading-1 text-charcoal mb-2">Order Management</h1>
          <p className="body text-charcoal/70">View and manage all orders in the system</p>
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
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-6 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      statusFilter === tab.value
                        ? 'bg-brown text-white shadow-sm'
                        : 'text-charcoal/70 hover:bg-taupe/10'
                    }`}
                  >
                    {tab.label}
                    <Badge 
                      variant={statusFilter === tab.value ? 'light' : 'default'} 
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
                    {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
                  </h3>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredOrders.map(order => (
              <motion.div key={order._id} variants={staggerItem}>
                <Card hoverable>
                  <Card.Body>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="body-sm text-charcoal/60 mb-1">Buyer</p>
                            <p className="body-sm font-medium text-charcoal">{order.buyer?.name || 'N/A'}</p>
                            <p className="body-sm text-charcoal/50 truncate">{order.buyer?.email || ''}</p>
                          </div>
                          <div>
                            <p className="body-sm text-charcoal/60 mb-1">Items</p>
                            <p className="body-sm font-medium text-charcoal">{order.items.length} item(s)</p>
                          </div>
                          <div>
                            <p className="body-sm text-charcoal/60 mb-1">Total</p>
                            <p className="heading-5 text-brown">₹{order.totalAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="body-sm text-charcoal/60 mb-1">Date</p>
                            <p className="body-sm font-medium text-charcoal">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-4 lg:w-64">
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

                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="btn btn-outline btn-md w-full text-center inline-block"
                        >
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
