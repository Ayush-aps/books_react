/**
 * Seller Dashboard
 * Analytics and overview for sellers
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sellerService } from '../../services/sellerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await sellerService.getDashboard();
      setStats(response.data || response);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-primary py-12">
        <div className="container-custom">
          <ErrorMessage message={error} onRetry={fetchDashboardData} />
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statsCards = [
    {
      label: 'Total Books',
      value: stats.totalBooks || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      link: '/seller/inventory',
      linkText: 'View Inventory',
      color: 'bg-accent-brown/10 text-accent-brown'
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      link: '/seller/orders',
      linkText: 'View Orders',
      color: 'bg-accent-green/10 text-accent-green'
    },
    {
      label: 'Total Revenue',
      value: `₹${stats.totalRevenue?.toFixed(2) || '0.00'}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: `From ${stats.deliveredOrders || 0} delivered orders`,
      link: '/seller/revenue',
      linkText: 'View Details',
      color: 'bg-success/10 text-success'
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/seller/orders?status=processing',
      linkText: 'Process Orders',
      color: 'bg-warning/10 text-warning'
    }
  ];

  const quickActions = [
    {
      label: 'Upload New Book',
      description: 'Add books to your inventory',
      link: '/seller/upload',
      icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z',
      color: 'bg-accent-brown'
    },
    {
      label: 'Manage Inventory',
      description: 'Edit and organize your books',
      link: '/seller/inventory',
      icon: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z',
      color: 'bg-accent-green'
    },
    {
      label: 'Process Orders',
      description: 'Update order status',
      link: '/seller/orders',
      icon: 'M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z',
      color: 'bg-blue-600'
    },
    {
      label: 'View Complaints',
      description: 'Track your submitted complaints',
      link: '/seller/complaints',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'bg-purple-600'
    },
    {
      label: 'Register Complaint',
      description: 'Report issues or concerns',
      link: '/seller/register-complaint',
      icon: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
      color: 'bg-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-background-primary py-12">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="heading-1 mb-3">Seller Dashboard</h1>
          <p className="body-xl text-text-secondary">Welcome back! Here's your business overview</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {statsCards.map((stat, index) => (
            <motion.div key={index} variants={staggerItem}>
              <Card elevated hoverable padding="lg" className="h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
                <h3 className="heading-2 mb-3">{stat.value}</h3>
                {stat.description && (
                  <span className="text-sm text-text-tertiary block mb-3">{stat.description}</span>
                )}
                {stat.link && (
                  <Link to={stat.link} className="text-accent-brown hover:text-accent-brown/80 text-sm font-medium transition-colors inline-flex items-center gap-1">
                    {stat.linkText}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Orders & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Recent Orders */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Card elevated padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-3">Recent Orders</h2>
                <Link to="/seller/orders">
                  <Button variant="ghost" size="sm">
                    View All
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </Link>
              </div>

              {stats.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentOrders.map((order) => (
                    <div key={order._id} className="pb-4 border-b border-border-primary last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Order #{order._id.slice(-8)}</span>
                        <Badge
                          variant={
                            order.status === 'delivered' ? 'success' :
                              order.status === 'shipped' ? 'info' :
                                order.status === 'pending' ? 'warning' : 'brown'
                          }
                          size="sm"
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {order.items?.length || 0} item(s) • ₹{order.totalAmount?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-text-secondary">No recent orders</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Card elevated padding="lg">
              <h2 className="heading-3 mb-6">Quick Actions</h2>

              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className="flex items-center gap-4 p-4 bg-background-secondary hover:bg-accent-brown/5 rounded-lg transition-all border border-transparent hover:border-accent-brown group"
                  >
                    <div className={`${action.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                      <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d={action.icon} clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{action.label}</p>
                      <p className="text-sm text-text-secondary">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Stock Alerts */}
        {stats.stockAlerts && (stats.stockAlerts.outOfStock?.length > 0 || stats.stockAlerts.lowStock?.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <Card elevated padding="lg">
              <h2 className="heading-3 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Stock Alerts
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Out of Stock */}
                {stats.stockAlerts.outOfStock?.length > 0 && (
                  <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                    <h3 className="font-semibold text-error mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Out of Stock ({stats.stockAlerts.outOfStock.length})
                    </h3>
                    <div className="space-y-2">
                      {stats.stockAlerts.outOfStock.slice(0, 3).map((book) => (
                        <Link
                          key={book._id}
                          to={`/seller/inventory/edit/${book._id}`}
                          className="flex items-center gap-3 p-2 bg-background-primary rounded hover:bg-error/5 transition-colors"
                        >
                          <img src={book.coverImage} alt={book.title} className="w-10 h-14 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{book.title}</p>
                            <p className="text-xs text-error font-semibold">Restock needed</p>
                          </div>
                          <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                      {stats.stockAlerts.outOfStock.length > 3 && (
                        <Link to="/seller/inventory" className="block text-center text-sm text-accent-brown hover:underline mt-2">
                          View all {stats.stockAlerts.outOfStock.length} out of stock items
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* Low Stock */}
                {stats.stockAlerts.lowStock?.length > 0 && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <h3 className="font-semibold text-warning mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Low Stock ({stats.stockAlerts.lowStock.length})
                    </h3>
                    <div className="space-y-2">
                      {stats.stockAlerts.lowStock.slice(0, 3).map((book) => (
                        <Link
                          key={book._id}
                          to={`/seller/inventory/edit/${book._id}`}
                          className="flex items-center gap-3 p-2 bg-background-primary rounded hover:bg-warning/5 transition-colors"
                        >
                          <img src={book.coverImage} alt={book.title} className="w-10 h-14 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{book.title}</p>
                            <p className="text-xs text-warning font-semibold">Only {book.stock} left</p>
                          </div>
                          <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                      {stats.stockAlerts.lowStock.length > 3 && (
                        <Link to="/seller/inventory" className="block text-center text-sm text-accent-brown hover:underline mt-2">
                          View all {stats.stockAlerts.lowStock.length} low stock items
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Book Stats */}
        {stats.booksByStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card elevated padding="lg">
              <h2 className="heading-3 mb-6">Book Status Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-success/10 rounded-lg border border-success/20">
                  <p className="text-4xl font-bold text-success mb-2">
                    {stats.booksByStatus.approved || 0}
                  </p>
                  <p className="text-sm text-text-secondary font-medium">Approved Books</p>
                </div>
                <div className="text-center p-6 bg-warning/10 rounded-lg border border-warning/20">
                  <p className="text-4xl font-bold text-warning mb-2">
                    {stats.booksByStatus.pending || 0}
                  </p>
                  <p className="text-sm text-text-secondary font-medium">Pending Approval</p>
                </div>
                <div className="text-center p-6 bg-error/10 rounded-lg border border-error/20">
                  <p className="text-4xl font-bold text-error mb-2">
                    {stats.booksByStatus.rejected || 0}
                  </p>
                  <p className="text-sm text-text-secondary font-medium">Rejected Books</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
