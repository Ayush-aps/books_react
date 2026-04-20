/**
 * Admin Dashboard
 * System-wide statistics and overview
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    usersByRole: { buyers: 0, sellers: 0, admins: 0 },
    totalBooks: 0,
    booksByStatus: { approved: 0, pending: 0, rejected: 0 },
    totalOrders: 0,
    totalRevenue: 0,
    pendingComplaints: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboard();
      const payload = response.data || {};

      setStats({
        totalUsers: payload.totalUsers || 0,
        usersByRole: payload.usersByRole || { buyers: 0, sellers: 0, admins: 0 },
        totalBooks: payload.totalBooks || 0,
        booksByStatus: payload.booksByStatus || { approved: 0, pending: 0, rejected: 0 },
        totalOrders: payload.totalOrders || 0,
        totalRevenue: payload.totalRevenue || 0,
        pendingComplaints: payload.pendingComplaints || 0
      });

      setRecentActivity(payload.recentActivity || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary py-12">
        <div className="container-custom animate-pulse space-y-8">
          <div className="space-y-3">
            <div className="h-10 w-72 bg-background-secondary rounded-lg" />
            <div className="h-5 w-96 bg-background-secondary rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 rounded-2xl bg-background-secondary" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 rounded-2xl bg-background-secondary" />
            <div className="h-96 rounded-2xl bg-background-secondary" />
          </div>
        </div>
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
      label: 'Total Users',
      value: stats.totalUsers,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      details: `Buyers: ${stats.usersByRole.buyers} • Sellers: ${stats.usersByRole.sellers} • Admins: ${stats.usersByRole.admins}`,
      link: '/admin/users',
      color: 'bg-accent-brown/10 text-accent-brown'
    },
    {
      label: 'Total Books',
      value: stats.totalBooks,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      badges: [
        { label: stats.booksByStatus.approved, variant: 'success' },
        { label: stats.booksByStatus.pending, variant: 'warning' },
        { label: stats.booksByStatus.rejected, variant: 'error' }
      ],
      link: '/admin/content',
      color: 'bg-accent-green/10 text-accent-green'
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      details: 'All time orders',
      link: '/admin/orders',
      color: 'bg-info/10 text-info'
    },
    {
      label: 'Total Revenue',
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      details: 'From delivered orders',
      color: 'bg-success/10 text-success',
      link: '/admin/revenue' // Changed from showButton to link
    }
  ];

  const quickActions = [
    {
      label: 'Manage Users',
      link: '/admin/users',
      icon: 'M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z',
      color: 'bg-accent-brown'
    },
    {
      label: 'Moderate Content',
      link: '/admin/content',
      icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
      badge: stats.booksByStatus.pending > 0 ? `${stats.booksByStatus.pending} pending` : null,
      color: 'bg-accent-green'
    },
    {
      label: 'View All Orders',
      link: '/admin/orders',
      icon: 'M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z',
      color: 'bg-secondary-600'
    },
    {
      label: 'View Complaints',
      link: '/admin/complaints',
      icon: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
      badge: stats.pendingComplaints > 0 ? `${stats.pendingComplaints} pending` : null,
      color: 'bg-primary-600'
    },
    {
      label: 'View Reports',
      link: '/admin/reports',
      icon: 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z',
      color: 'bg-accent-gold'
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
          <h1 className="heading-1 mb-3">Admin Dashboard</h1>
          <p className="body-xl text-text-secondary">System overview and statistics</p>
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
              <Link to={stat.link} className="block h-full group">
                <Card elevated hoverable padding="lg" className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                      {stat.icon}
                    </div>
                    <svg className="w-5 h-5 text-text-tertiary group-hover:text-accent-brown group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
                  <h3 className="heading-2 mb-3 group-hover:text-accent-brown transition-colors">{stat.value}</h3>
                  {stat.details && (
                    <p className="text-xs text-text-tertiary mb-3">{stat.details}</p>
                  )}
                  {stat.badges && (
                    <div className="flex gap-2 mt-3">
                      {stat.badges.map((badge, idx) => (
                        <Badge key={idx} variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2"
          >
            <Card elevated padding="lg">
              <h2 className="heading-3 mb-6">Recent Activity</h2>
              {recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text-secondary">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b border-border-primary last:border-0">
                      <div className="w-10 h-10 bg-accent-brown/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-accent-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-text-tertiary mt-1">{activity.time}</p>
                      </div>
                      <Badge
                        variant={
                          activity.status === 'delivered' ? 'success' :
                            activity.status === 'pending' ? 'warning' : 'info'
                        }
                        size="sm"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <Card elevated padding="lg">
              <h2 className="heading-3 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className="block w-full px-4 py-3 bg-background-secondary hover:bg-accent-brown/5 rounded-lg transition-all border border-transparent hover:border-accent-brown group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${action.color} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d={action.icon} clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-text-primary">{action.label}</span>
                        {action.badge && (
                          <p className="text-xs text-text-secondary mt-1">{action.badge}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
