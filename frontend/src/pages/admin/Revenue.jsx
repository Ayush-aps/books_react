/**
 * Admin Revenue Page
 * Displays detailed revenue statistics, charts, and transaction history
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Revenue = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    todayRevenue: 0,
    transactions: [],
    revenueByMonth: [],
    revenueByCategory: {
      commission: 0,
      deliveryCharges: 0
    }
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      
      // Fetch all delivered orders for revenue calculation
      const ordersResponse = await adminService.getOrders({ limit: 1000 });
      const orders = ordersResponse.data?.orders || [];
      
      // Filter delivered orders only
      const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered');
      
      // Calculate total revenue (5% commission + delivery charges from delivered orders)
      const totalRevenue = deliveredOrders.reduce((sum, order) => {
        const commission = order.adminCommission || (order.totalAmount * 0.05);
        const delivery = order.deliveryCharge || 0;
        return sum + commission + delivery;
      }, 0);

      // Calculate time-based revenue
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayRevenue = deliveredOrders
        .filter(order => new Date(order.deliveredAt || order.createdAt) >= todayStart)
        .reduce((sum, order) => sum + (order.adminCommission || (order.totalAmount * 0.05)) + (order.deliveryCharge || 0), 0);

      const weeklyRevenue = deliveredOrders
        .filter(order => new Date(order.deliveredAt || order.createdAt) >= weekStart)
        .reduce((sum, order) => sum + (order.adminCommission || (order.totalAmount * 0.05)) + (order.deliveryCharge || 0), 0);

      const monthlyRevenue = deliveredOrders
        .filter(order => new Date(order.deliveredAt || order.createdAt) >= monthStart)
        .reduce((sum, order) => sum + (order.adminCommission || (order.totalAmount * 0.05)) + (order.deliveryCharge || 0), 0);

      // Revenue by month (last 6 months)
      const revenueByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthRevenue = deliveredOrders
          .filter(order => {
            const orderDate = new Date(order.deliveredAt || order.createdAt);
            return orderDate >= monthDate && orderDate <= monthEnd;
          })
          .reduce((sum, order) => sum + (order.adminCommission || (order.totalAmount * 0.05)) + (order.deliveryCharge || 0), 0);
        
        revenueByMonth.push({
          month: monthDate.toLocaleString('default', { month: 'short' }),
          revenue: monthRevenue
        });
      }

      // Revenue breakdown
      const commissionRevenue = deliveredOrders.reduce((sum, order) => 
        sum + (order.adminCommission || (order.totalAmount * 0.05)), 0);
      const deliveryRevenue = deliveredOrders.reduce((sum, order) => 
        sum + (order.deliveryCharge || 0), 0);

      // Recent transactions (top 20)
      const transactions = deliveredOrders
        .sort((a, b) => new Date(b.deliveredAt || b.createdAt) - new Date(a.deliveredAt || a.createdAt))
        .slice(0, 20)
        .map(order => ({
          id: order._id,
          orderId: order._id.slice(-8),
          amount: (order.adminCommission || (order.totalAmount * 0.05)) + (order.deliveryCharge || 0),
          commission: order.adminCommission || (order.totalAmount * 0.05),
          deliveryCharge: order.deliveryCharge || 0,
          date: new Date(order.deliveredAt || order.createdAt).toLocaleString(),
          buyerName: order.buyer?.name || 'N/A'
        }));

      setRevenueData({
        totalRevenue,
        monthlyRevenue,
        weeklyRevenue,
        todayRevenue,
        transactions,
        revenueByMonth,
        revenueByCategory: {
          commission: commissionRevenue,
          deliveryCharges: deliveryRevenue
        }
      });

      setError(null);
    } catch (err) {
      console.error('Revenue fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading revenue data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-primary py-12">
        <div className="container-custom">
          <ErrorMessage message={error} onRetry={fetchRevenueData} />
        </div>
      </div>
    );
  }

  const { totalRevenue, monthlyRevenue, weeklyRevenue, todayRevenue, transactions, revenueByMonth, revenueByCategory } = revenueData;

  // Calculate percentages for pie chart
  const totalCategoryRevenue = revenueByCategory.commission + revenueByCategory.deliveryCharges;
  const commissionPercentage = totalCategoryRevenue > 0 ? (revenueByCategory.commission / totalCategoryRevenue) * 100 : 0;
  const deliveryPercentage = totalCategoryRevenue > 0 ? (revenueByCategory.deliveryCharges / totalCategoryRevenue) * 100 : 0;

  return (
    <div className="min-h-screen bg-background-primary py-6 sm:py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header - Mobile Responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Revenue Analytics</h1>
            <p className="text-sm sm:text-base md:text-lg text-text-secondary">Detailed revenue statistics and transaction history</p>
          </div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-charcoal text-xs sm:text-sm rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none hover:shadow-md whitespace-nowrap inline-flex items-center border-none w-full sm:w-auto"
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
            Back to Dashboard
          </button>
        </motion.div>

        {/* Revenue Summary Cards - Responsive Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8"
        >
          {[
            { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}`, icon: '💰', color: 'bg-success/10 text-success' },
            { label: 'This Month', value: `₹${monthlyRevenue.toFixed(2)}`, icon: '📅', color: 'bg-accent-brown/10 text-accent-brown' },
            { label: 'This Week', value: `₹${weeklyRevenue.toFixed(2)}`, icon: '📊', color: 'bg-info/10 text-info' },
            { label: 'Today', value: `₹${todayRevenue.toFixed(2)}`, icon: '⏰', color: 'bg-accent-green/10 text-accent-green' }
          ].map((stat, index) => (
            <motion.div key={index} variants={staggerItem}>
              <Card elevated padding="lg">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-xl sm:text-2xl">{stat.icon}</span>
                  <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${stat.color}`}>
                    Revenue
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary mb-0.5 sm:mb-1">{stat.label}</p>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold">{stat.value}</h3>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Section - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
          {/* Revenue Trend Chart */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2"
          >
            <Card elevated padding="lg">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">Revenue Trend (Last 6 Months)</h2>
              <div className="space-y-3 sm:space-y-4">
                {revenueByMonth.map((data, index) => {
                  const maxRevenue = Math.max(...revenueByMonth.map(m => m.revenue), 1);
                  const barWidth = (data.revenue / maxRevenue) * 100;
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <span className="text-xs sm:text-sm font-medium text-text-primary">{data.month}</span>
                        <span className="text-xs sm:text-sm font-semibold text-accent-brown">₹{data.revenue.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-background-secondary rounded-full h-2 sm:h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="h-full bg-gradient-to-r from-accent-brown to-accent-green rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Revenue Breakdown Pie Chart - Mobile Optimized */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <Card elevated padding="lg">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">Revenue Breakdown</h2>
              <div className="flex flex-col items-center">
                {/* Simple Pie Chart */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mb-4 sm:mb-6">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {/* Commission slice */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#8B4513"
                      strokeWidth="20"
                      strokeDasharray={`${commissionPercentage * 2.51} ${251 - commissionPercentage * 2.51}`}
                      className="transition-all duration-1000"
                    />
                    {/* Delivery charges slice */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#6B8E23"
                      strokeWidth="20"
                      strokeDasharray={`${deliveryPercentage * 2.51} ${251 - deliveryPercentage * 2.51}`}
                      strokeDashoffset={-commissionPercentage * 2.51}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-text-primary">100%</p>
                      <p className="text-[10px] sm:text-xs text-text-secondary">Revenue</p>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="w-full space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-background-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-accent-brown"></div>
                      <span className="text-xs sm:text-sm font-medium">Commission (5%)</span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-accent-brown">₹{revenueByCategory.commission.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-background-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-accent-green"></div>
                      <span className="text-xs sm:text-sm font-medium">Delivery Charges</span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-accent-green">₹{revenueByCategory.deliveryCharges.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Recent Transactions - Mobile Responsive */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <Card elevated padding="lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Recent Transactions</h2>
              <Badge variant="info" className="text-xs sm:text-sm">{transactions.length} transactions</Badge>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-text-secondary">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-border-primary">
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-text-secondary">Order ID</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-text-secondary hidden sm:table-cell">Buyer</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-text-secondary">Commission</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-text-secondary hidden md:table-cell">Delivery</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-text-secondary">Total</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-text-secondary hidden lg:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction, index) => (
                        <motion.tr
                          key={transaction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border-primary hover:bg-background-secondary transition-colors"
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <span className="font-mono text-xs sm:text-sm font-medium text-accent-brown">#{transaction.orderId}</span>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-text-primary hidden sm:table-cell">{transaction.buyerName}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-success">₹{transaction.commission.toFixed(2)}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-info hidden md:table-cell">₹{transaction.deliveryCharge.toFixed(2)}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold text-accent-brown">₹{transaction.amount.toFixed(2)}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-text-secondary hidden lg:table-cell">{transaction.date}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Revenue;
