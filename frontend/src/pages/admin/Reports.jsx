/**
 * Admin Reports Page
 * System analytics and reports with interactive charts
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Reports = () => {
  const [reports, setReports] = useState({
    salesByGenre: [],
    topSellingBooks: [],
    topSellers: [],
    revenueByMonth: [],
    userActivity: {
      newUsersThisMonth: 0,
      activeUsers: 0,
      totalOrders: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data
      const [reportsRes, usersRes, booksRes, ordersRes] = await Promise.all([
        adminService.getReports(),
        adminService.getUsers(),
        adminService.getBooks(),
        adminService.getOrders()
      ]);
      
      const data = reportsRes.data?.data || reportsRes.data || {};
      const users = usersRes.data?.users || [];
      const books = booksRes.data?.books || [];
      const orders = ordersRes.data?.orders || [];
      
      setReports({
        salesByGenre: data.salesByGenre || [],
        topSellingBooks: data.topSellingBooks || [],
        topSellers: data.topSellers || [],
        revenueByMonth: data.revenueByMonth || [],
        userActivity: data.userActivity || {
          newUsersThisMonth: 0,
          activeUsers: 0,
          totalOrders: orders.length
        },
        users,
        books,
        orders
      });
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading reports..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <ErrorMessage message={error} onRetry={fetchReports} />
      </div>
    );
  }

  // Prepare chart data
  const userRoleData = reports.users ? [
    { name: 'Buyers', value: reports.users.filter(u => u.role === 'buyer').length, color: '#8B7355' },
    { name: 'Sellers', value: reports.users.filter(u => u.role === 'seller').length, color: '#C4B5A0' },
    { name: 'Admins', value: reports.users.filter(u => u.role === 'admin').length, color: '#2C2C2C' }
  ] : [];

  const bookStatusData = reports.books ? [
    { name: 'Approved', value: reports.books.filter(b => b.isApproved === true).length, color: '#10B981' },
    { name: 'Pending', value: reports.books.filter(b => b.isApproved === false && !b.rejectionReason).length, color: '#F59E0B' },
    { name: 'Rejected', value: reports.books.filter(b => b.isApproved === false && b.rejectionReason).length, color: '#EF4444' }
  ] : [];

  const orderStatusData = reports.orders ? [
    { name: 'Pending', value: reports.orders.filter(o => o.status === 'pending').length, color: '#F59E0B' },
    { name: 'Processing', value: reports.orders.filter(o => o.status === 'processing').length, color: '#3B82F6' },
    { name: 'Shipped', value: reports.orders.filter(o => o.status === 'shipped').length, color: '#8B5CF6' },
    { name: 'Delivered', value: reports.orders.filter(o => o.status === 'delivered').length, color: '#10B981' },
    { name: 'Cancelled', value: reports.orders.filter(o => o.status === 'cancelled').length, color: '#EF4444' }
  ].filter(item => item.value > 0) : [];

  const genreData = reports.salesByGenre?.slice(0, 5).map((genre, index) => ({
    name: genre.name || `Genre ${index + 1}`,
    value: genre.count || 0,
    color: ['#8B7355', '#C4B5A0', '#A0907A', '#6B5B3D', '#8B6F47'][index]
  })) || [];

  // Custom label for pie charts
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show label if less than 5%
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-border-light">
          <p className="text-sm font-medium text-text-primary">{payload[0].name}</p>
          <p className="text-sm text-text-secondary">{payload[0].value} items</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-cream py-6 sm:py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">System Reports & Analytics</h1>
          <p className="text-sm sm:text-base md:text-lg text-text-secondary">Comprehensive insights and performance metrics</p>
        </motion.div>

        {/* User Activity Stats */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12"
        >
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">New Users This Month</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{reports.userActivity.newUsersThisMonth}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Active Users</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{reports.userActivity.activeUsers}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sm:col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{reports.userActivity.totalOrders}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pie Charts Section */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8">Data Distribution Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* User Roles Distribution */}
            {userRoleData.filter(d => d.value > 0).length > 0 && (
              <Card elevated padding="lg">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center">Users by Role</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={userRoleData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userRoleData.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span className="text-xs sm:text-sm text-text-primary">{value}: {entry.payload.value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Book Status Distribution */}
            {bookStatusData.length > 0 && (
              <Card elevated padding="lg">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center">Books by Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={bookStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bookStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span className="text-xs sm:text-sm text-text-primary">{value}: {entry.payload.value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Order Status Distribution */}
            {orderStatusData.length > 0 && (
              <Card elevated padding="lg">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center">Orders by Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      label={renderCustomLabel}
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span className="text-xs sm:text-sm text-text-primary">{value}: {entry.payload.value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Sales by Genre */}
            {genreData.length > 0 && (
              <Card elevated padding="lg">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center">Sales by Genre</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span className="text-xs sm:text-sm text-text-primary">{value}: {entry.payload.value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Detailed Tables Section */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8">Detailed Reports</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Top Selling Books */}
            <Card elevated padding="lg">
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Top Selling Books</h3>
              {reports.topSellingBooks.length === 0 ? (
                <p className="text-text-secondary text-center py-6 sm:py-8 text-sm sm:text-base">No sales data available</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {reports.topSellingBooks.map((book, index) => (
                    <div key={index} className="flex items-center gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-border-light last:border-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-accent-brown/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-accent-brown font-bold text-xs sm:text-sm">#{index + 1}</span>
                      </div>
                      {book.coverImage && (
                        <img 
                          src={book.coverImage} 
                          alt={book.title}
                          className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded shadow-sm"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-text-primary truncate">{book.title}</p>
                        <p className="text-[10px] sm:text-xs text-text-secondary">{book.author}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-semibold text-text-primary">{book.soldCount} sold</p>
                        <p className="text-[10px] sm:text-xs text-success">₹{book.revenue?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Top Sellers */}
            <Card elevated padding="lg">
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Top Sellers</h3>
              {reports.topSellers.length === 0 ? (
                <p className="text-text-secondary text-center py-6 sm:py-8 text-sm sm:text-base">No seller data available</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {reports.topSellers.slice(0, 5).map((seller, index) => (
                    <div key={index} className="flex items-center gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-border-light last:border-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-accent-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-accent-green font-bold text-xs sm:text-sm">#{index + 1}</span>
                      </div>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-brown/10 rounded-full flex items-center justify-center">
                        <span className="text-accent-brown font-semibold text-sm sm:text-base">
                          {seller.name?.charAt(0).toUpperCase() || 'S'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-text-primary truncate">{seller.name}</p>
                        <p className="text-[10px] sm:text-xs text-text-secondary">{seller.booksListed || 0} books listed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-semibold text-text-primary">{seller.totalSales || 0} sales</p>
                        <p className="text-[10px] sm:text-xs text-success">₹{seller.revenue?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;
