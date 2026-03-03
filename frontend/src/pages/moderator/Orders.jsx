/**
 * Moderator Orders Page
 * View and manage all orders in the system
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { moderatorAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 10,
                status: statusFilter !== 'all' ? statusFilter : undefined
            };
            const response = await moderatorAPI.getOrders(params);
            setOrders(response.data?.data?.orders || []);
            setTotalPages(response.data?.data?.pagination?.totalPages || 1);
            setTotalOrders(response.data?.data?.pagination?.totalOrders || 0);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [currentPage, statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            setUpdatingOrderId(orderId);
            await moderatorAPI.updateOrderStatus(orderId, { orderStatus: newStatus });
            setOrders(prev => prev.map(order =>
                order._id === orderId ? { ...order, orderStatus: newStatus } : order
            ));
        } catch (err) {
            setError(err.message || 'Failed to update order status');
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

    const filterTabs = [
        { value: 'all', label: 'All Orders' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    if (loading && orders.length === 0) {
        return (
            <div className="flex items-center justify-center py-32">
                <LoadingSpinner size="lg" message="Loading orders..." />
            </div>
        );
    }

    return (
        <div className="container-custom py-10 space-y-8">
            {/* Header */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                <h1 className="heading-1 mb-1">Order Management</h1>
                <p className="body text-text-secondary">Monitor and update delivery status for all customer orders</p>
            </motion.div>

            {error && <ErrorMessage message={error} onRetry={fetchOrders} />}

            {/* Filters */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex gap-2 p-1 bg-background-secondary rounded-xl w-fit">
                {filterTabs.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => { setStatusFilter(tab.value); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === tab.value
                                ? 'bg-accent-brown text-white shadow-md'
                                : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </motion.div>

            {/* Orders List */}
            {orders.length === 0 ? (
                <Card elevated padding="lg" className="text-center py-20">
                    <p className="text-text-secondary">No orders found.</p>
                </Card>
            ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
                    {orders.map(order => (
                        <motion.div key={order._id} variants={staggerItem}>
                            <Card elevated padding="0" className="overflow-hidden">
                                <div className="p-5 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-text-primary">Order #{order.orderId || order._id.slice(-8)}</h3>
                                            <Badge variant={getStatusVariant(order.orderStatus)}>{order.orderStatus}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-medium">
                                            <div>
                                                <p className="text-xs text-text-tertiary uppercase mb-1">Buyer</p>
                                                <p className="text-text-primary">{order.buyer?.name || 'Guest'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-tertiary uppercase mb-1">Total Amount</p>
                                                <p className="text-accent-brown font-bold">₹{order.totalAmount.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-tertiary uppercase mb-1">Items</p>
                                                <p className="text-text-primary">{order.items.length} Books</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-tertiary uppercase mb-1">Date</p>
                                                <p className="text-text-secondary">{new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 md:w-64">
                                        <select
                                            value={order.orderStatus}
                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                            disabled={updatingOrderId === order._id}
                                            className="px-3 py-2 rounded-lg border border-border-primary bg-background-primary text-sm focus:ring-2 focus:ring-accent-brown focus:outline-none disabled:opacity-50"
                                        >
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        <Button variant="ghost" size="sm" className="whitespace-nowrap">Details</Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center pt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
};

export default Orders;
