import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';
import { roundPrice } from '../../utils/priceUtils';

function BuyerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    recentOrders: [],
    libraryCount: 0,
    activeOrders: 0,
    completedOrders: 0,
    complaints: [],
    recentlyViewed: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/buyer/dashboard');
      setDashboardData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <LoadingSpinner size="lg" />
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

  const statsCards = [
    {
      label: 'My Library',
      value: dashboardData.libraryCount,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      link: '/buyer/library',
      linkText: 'View Library',
      color: 'bg-accent-brown/10 text-accent-brown'
    },
    {
      label: 'Active Orders',
      value: dashboardData.activeOrders,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      link: '/buyer/orders',
      linkText: 'View Orders',
      color: 'bg-accent-green/10 text-accent-green'
    },
    {
      label: 'Completed Orders',
      value: dashboardData.completedOrders,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Total delivered',
      color: 'bg-success/10 text-success'
    },
    {
      label: 'Open Complaints',
      value: dashboardData.complaints.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/buyer/complaints',
      linkText: 'View Complaints',
      color: 'bg-warning/10 text-warning'
    }
  ];

  const quickActions = [
    { label: 'Browse Books', link: '/buyer/browse', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { label: 'My Cart', link: '/buyer/cart', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'My Library', link: '/buyer/library', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { label: 'Video Feed', link: '/buyer/video-feed', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { label: 'My Profile', link: '/buyer/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Addresses', link: '/buyer/addresses', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Register Complaint', link: '/buyer/register-complaint', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { label: 'Upgrade Plan', link: '/subscription/checkout', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' }
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
          <h1 className="heading-1 mb-3">My Dashboard</h1>
          <p className="body-xl text-text-secondary">Welcome back! Here's your reading overview</p>
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
                <h3 className="heading-2 mb-4">{stat.value}</h3>
                {stat.link && (
                  <Link to={stat.link} className="text-accent-brown hover:text-accent-brown/80 text-sm font-medium transition-colors inline-flex items-center gap-1">
                    {stat.linkText}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
                {stat.description && (
                  <span className="text-sm text-text-tertiary">{stat.description}</span>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Orders & Recently Viewed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Recent Orders */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Card elevated padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-3">Recent Orders</h2>
                <Link to="/buyer/orders">
                  <button
                    className="text-white text-base rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none shadow-sm hover:shadow-md whitespace-nowrap flex items-center gap-1"
                    style={{
                      backgroundColor: '#8B7355',
                      padding: '0.625rem 1.5rem',
                      border: '1px solid transparent',
                      lineHeight: '1.5',
                      height: '40px',
                      fontWeight: '500'
                    }}
                  >
                    View All
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </Link>
              </div>
              {dashboardData.recentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text-secondary">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentOrders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between pb-4 border-b border-border-primary last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium">Order #{order._id.slice(-6)}</p>
                        <p className="text-sm text-text-secondary">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="font-bold">₹{order.total}</p>
                        <Badge
                          variant={
                            (() => {
                              const orderStatus = order.orderStatus || order.status || 'ordered';
                              switch (orderStatus) {
                                case 'delivered': return 'success';
                                case 'shipped': return 'info';
                                case 'processing': return 'warning';
                                case 'cancelled': return 'error';
                                case 'ordered':
                                default: return 'brown';
                              }
                            })()
                          }
                          size="sm"
                        >
                          {(() => {
                            const orderStatus = order.orderStatus || order.status || 'ordered';
                            return orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1);
                          })()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Recently Viewed Books */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Card elevated padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-3">Recently Viewed</h2>
                <Link to="/buyer/browse">
                  <button
                    className="text-white text-base rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none shadow-sm hover:shadow-md whitespace-nowrap flex items-center gap-1"
                    style={{
                      backgroundColor: '#8B7355',
                      padding: '0.625rem 1.5rem',
                      border: '1px solid transparent',
                      lineHeight: '1.5',
                      height: '40px',
                      fontWeight: '500'
                    }}
                  >
                    Browse More
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </Link>
              </div>
              {dashboardData.recentlyViewed.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text-secondary">No recently viewed books</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentlyViewed.map((book) => (
                    <Link
                      key={book._id}
                      to={`/buyer/book/${book._id}`}
                      className="flex items-center gap-4 hover:bg-background-secondary p-3 rounded-lg transition-colors"
                    >
                      <img
                        src={book.coverImage || '/img/books/default-cover.jpg'}
                        alt={book.title}
                        className="w-16 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{book.title}</p>
                        <p className="text-sm text-text-secondary">{book.author}</p>
                        <p className="font-bold text-accent-brown mt-1">₹{roundPrice(book.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card elevated padding="lg">
            <h2 className="heading-3 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="flex flex-col items-center justify-center p-6 border-2 border-border-primary rounded-lg hover:border-accent-brown hover:bg-background-secondary transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-accent-brown/10 text-accent-brown flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-center">{action.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Active Complaints (if any) */}
        {dashboardData.complaints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Card elevated padding="lg">
              <h2 className="heading-3 mb-6">Active Complaints</h2>
              <div className="space-y-4">
                {dashboardData.complaints.map((complaint) => (
                  <div key={complaint._id} className="flex items-center justify-between pb-4 border-b border-border-primary last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium">{complaint.subject}</p>
                      <p className="text-sm text-text-secondary">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          complaint.status === 'resolved' ? 'success' :
                            complaint.status === 'in-progress' ? 'info' : 'warning'
                        }
                        size="sm"
                      >
                        {complaint.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default BuyerDashboard;
