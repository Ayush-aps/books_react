/**
 * Admin Orders Page
 * View and manage all orders in the system
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { useToast } from '../../components/Toast';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Orders = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminService.getOrders({
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setOrders(response.data?.orders || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setTotalOrders(response.data?.pagination?.totalOrders || 0);
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
      toast.success(`Order status updated to ${newStatus}`, 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update order status';
      setError(errorMessage);
      toast.error(errorMessage, 3000);
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

  const handleFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterTabs = [
    { value: 'all', label: 'All Orders', count: statusFilter === 'all' ? totalOrders : null },
    { value: 'ordered', label: 'Ordered', count: statusFilter === 'ordered' ? totalOrders : null },
    { value: 'processing', label: 'Processing', count: statusFilter === 'processing' ? totalOrders : null },
    { value: 'shipped', label: 'Shipped', count: statusFilter === 'shipped' ? totalOrders : null },
    { value: 'delivered', label: 'Delivered', count: statusFilter === 'delivered' ? totalOrders : null },
    { value: 'cancelled', label: 'Cancelled', count: statusFilter === 'cancelled' ? totalOrders : null }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-6 sm:py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mb-8 sm:mb-12"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-1 sm:mb-2">Order Management</h1>
          <p className="text-sm sm:text-base text-charcoal/70">View and manage all orders in the system</p>
        </motion.div>

        {error && (
          <motion.div 
            className="mb-4 sm:mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <ErrorMessage message={error} />
          </motion.div>
        )}

        {/* Filter Tabs - Mobile Optimized */}
        <motion.div 
          className="mb-6 sm:mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <Card.Body className="p-1 sm:p-2">
              <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
                {filterTabs.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => handleFilterChange(tab.value)}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                      statusFilter === tab.value
                        ? 'bg-brown text-white shadow-sm'
                        : 'text-charcoal/70 hover:bg-taupe/10'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <Badge 
                        variant={statusFilter === tab.value ? 'light' : 'default'} 
                        size="sm" 
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </nav>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Orders List - Mobile Optimized */}
        {orders.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <Card.Body className="py-12 sm:py-16 text-center">
                <div className="max-w-md mx-auto px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-taupe/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-charcoal mb-2 sm:mb-3">
                    {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
                  </h3>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-3 sm:space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {orders.map(order => (
              <motion.div key={order._id} variants={staggerItem}>
                <Card hoverable>
                  <Card.Body className="p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-charcoal">
                            Order #{order.orderId || order._id.slice(-8)}
                          </h3>
                          <Badge variant={getStatusVariant(getOrderStatus(order))} className="text-xs sm:text-sm">
                            {getOrderStatus(order).charAt(0).toUpperCase() + getOrderStatus(order).slice(1)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                          <div>
                            <p className="text-xs sm:text-sm text-charcoal/60 mb-1">Buyer</p>
                            <p className="text-xs sm:text-sm font-medium text-charcoal">{order.buyer?.name || 'N/A'}</p>
                            <p className="text-xs sm:text-sm text-charcoal/50 truncate">{order.buyer?.email || ''}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-charcoal/60 mb-1">Items</p>
                            <p className="text-xs sm:text-sm font-medium text-charcoal">{order.items.length} item(s)</p>
                            {order.items && order.items.length > 0 && (() => {
                              const sellers = order.items
                                .map(item => item.seller?.name)
                                .filter((name, index, self) => name && self.indexOf(name) === index);
                              return sellers.length > 0 && (
                                <p className="text-xs text-charcoal/50 mt-1 truncate" title={sellers.join(', ')}>
                                  Seller{sellers.length > 1 ? 's' : ''}: {sellers.length > 1 ? `${sellers.length} sellers` : sellers[0]}
                                </p>
                              );
                            })()}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-charcoal/60 mb-1">Total</p>
                            <p className="text-base sm:text-lg font-bold text-brown">₹{order.totalAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-charcoal/60 mb-1">Date</p>
                            <p className="text-xs sm:text-sm font-medium text-charcoal">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-4 lg:w-64">
                        {/* Status Update Dropdown - Only show if not delivered or cancelled */}
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

                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="btn btn-outline btn-md w-full text-center inline-flex items-center justify-center text-sm sm:text-base mt-6 sm:mt-0"
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

        {/* Pagination */}
        {totalPages > 1 && orders.length > 0 && (
          <motion.div
            className="mt-6 sm:mt-8"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Orders;
