/**
 * Seller Revenue Page
 * Displays detailed revenue statistics, charts, and transaction history for sellers
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sellerService } from '../../services/sellerService';
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
    revenueByBook: [],
    stats: {
      totalSales: 0,
      avgOrderValue: 0,
      platformCommission: 0,
      netEarnings: 0
    }
  });

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      
      // Fetch seller's orders
      const ordersResponse = await sellerService.getOrders({ limit: 1000 });
      const orders = ordersResponse.data?.orders || [];
      
      // Filter delivered orders only (seller gets paid for delivered orders)
      const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered');
      
      // Calculate seller revenue (95% of order total - after 5% platform commission)
      const totalRevenue = deliveredOrders.reduce((sum, order) => {
        // Seller gets: Total - Admin Commission - Delivery Charge
        const sellerShare = order.totalAmount - (order.adminCommission || order.totalAmount * 0.05) - (order.deliveryCharge || 0);
        return sum + sellerShare;
      }, 0);

      const totalSales = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const platformCommission = deliveredOrders.reduce((sum, order) => sum + (order.adminCommission || order.totalAmount * 0.05), 0);
      const avgOrderValue = deliveredOrders.length > 0 ? totalSales / deliveredOrders.length : 0;

      // Calculate time-based revenue
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayRevenue = deliveredOrders
        .filter(order => new Date(order.deliveredAt || order.createdAt) >= todayStart)
        .reduce((sum, order) => {
          const sellerShare = order.totalAmount - (order.adminCommission || order.totalAmount * 0.05) - (order.deliveryCharge || 0);
          return sum + sellerShare;
        }, 0);

      const weeklyRevenue = deliveredOrders
        .filter(order => new Date(order.deliveredAt || order.createdAt) >= weekStart)
        .reduce((sum, order) => {
          const sellerShare = order.totalAmount - (order.adminCommission || order.totalAmount * 0.05) - (order.deliveryCharge || 0);
          return sum + sellerShare;
        }, 0);

      const monthlyRevenue = deliveredOrders
        .filter(order => new Date(order.deliveredAt || order.createdAt) >= monthStart)
        .reduce((sum, order) => {
          const sellerShare = order.totalAmount - (order.adminCommission || order.totalAmount * 0.05) - (order.deliveryCharge || 0);
          return sum + sellerShare;
        }, 0);

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
          .reduce((sum, order) => {
            const sellerShare = order.totalAmount - (order.adminCommission || order.totalAmount * 0.05) - (order.deliveryCharge || 0);
            return sum + sellerShare;
          }, 0);
        
        revenueByMonth.push({
          month: monthDate.toLocaleString('default', { month: 'short' }),
          revenue: monthRevenue
        });
      }

      // Revenue by book (top 5 performing books)
      const bookRevenue = {};
      deliveredOrders.forEach(order => {
        order.items?.forEach(item => {
          const bookId = item.book?._id || item.book;
          const bookTitle = item.book?.title || 'Unknown Book';
          const sellerShare = (item.price * item.quantity) - ((item.price * item.quantity) * 0.05);
          
          if (!bookRevenue[bookId]) {
            bookRevenue[bookId] = {
              title: bookTitle,
              revenue: 0,
              quantity: 0
            };
          }
          bookRevenue[bookId].revenue += sellerShare;
          bookRevenue[bookId].quantity += item.quantity;
        });
      });

      const revenueByBook = Object.values(bookRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Recent transactions (top 20)
      const transactions = deliveredOrders
        .sort((a, b) => new Date(b.deliveredAt || b.createdAt) - new Date(a.deliveredAt || a.createdAt))
        .slice(0, 20)
        .map(order => {
          const sellerShare = order.totalAmount - (order.adminCommission || order.totalAmount * 0.05) - (order.deliveryCharge || 0);
          return {
            id: order._id,
            orderId: order._id.slice(-8),
            totalAmount: order.totalAmount,
            sellerEarning: sellerShare,
            commission: order.adminCommission || order.totalAmount * 0.05,
            deliveryCharge: order.deliveryCharge || 0,
            date: new Date(order.deliveredAt || order.createdAt).toLocaleString(),
            buyerName: order.buyer?.name || 'N/A',
            itemCount: order.items?.length || 0
          };
        });

      setRevenueData({
        totalRevenue,
        monthlyRevenue,
        weeklyRevenue,
        todayRevenue,
        transactions,
        revenueByMonth,
        revenueByBook,
        stats: {
          totalSales,
          avgOrderValue,
          platformCommission,
          netEarnings: totalRevenue
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

  const { totalRevenue, monthlyRevenue, weeklyRevenue, todayRevenue, transactions, revenueByMonth, revenueByBook, stats } = revenueData;

  // Calculate percentages for book performance chart
  const totalBookRevenue = revenueByBook.reduce((sum, book) => sum + book.revenue, 0);

  return (
    <div className="min-h-screen bg-background-primary py-12">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="heading-1 mb-2">Revenue Analytics</h1>
            <p className="body-lg text-text-secondary">Your earnings and sales performance</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/seller/dashboard')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Button>
        </motion.div>

        {/* Revenue Summary Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            { label: 'Total Earnings', value: `₹${totalRevenue.toFixed(2)}`, icon: '💰', color: 'bg-success/10 text-success', subtitle: 'Net after commission' },
            { label: 'This Month', value: `₹${monthlyRevenue.toFixed(2)}`, icon: '📅', color: 'bg-accent-brown/10 text-accent-brown', subtitle: 'Current month' },
            { label: 'This Week', value: `₹${weeklyRevenue.toFixed(2)}`, icon: '📊', color: 'bg-info/10 text-info', subtitle: 'Last 7 days' },
            { label: 'Today', value: `₹${todayRevenue.toFixed(2)}`, icon: '⏰', color: 'bg-accent-green/10 text-accent-green', subtitle: 'Today\'s sales' }
          ].map((stat, index) => (
            <motion.div key={index} variants={staggerItem}>
              <Card elevated padding="lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${stat.color}`}>
                    Earnings
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
                <h3 className="heading-2 mb-1">{stat.value}</h3>
                <p className="text-xs text-text-tertiary">{stat.subtitle}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Financial Overview */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <Card elevated padding="lg">
            <h2 className="heading-3 mb-6">Financial Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-background-secondary rounded-lg">
                <p className="text-sm text-text-secondary mb-2">Total Sales</p>
                <p className="text-2xl font-bold text-accent-brown">₹{stats.totalSales.toFixed(2)}</p>
                <p className="text-xs text-text-tertiary mt-1">Gross revenue</p>
              </div>
              <div className="text-center p-4 bg-background-secondary rounded-lg">
                <p className="text-sm text-text-secondary mb-2">Platform Fee (5%)</p>
                <p className="text-2xl font-bold text-warning">₹{stats.platformCommission.toFixed(2)}</p>
                <p className="text-xs text-text-tertiary mt-1">Commission paid</p>
              </div>
              <div className="text-center p-4 bg-background-secondary rounded-lg">
                <p className="text-sm text-text-secondary mb-2">Net Earnings</p>
                <p className="text-2xl font-bold text-success">₹{stats.netEarnings.toFixed(2)}</p>
                <p className="text-xs text-text-tertiary mt-1">Your share (95%)</p>
              </div>
              <div className="text-center p-4 bg-background-secondary rounded-lg">
                <p className="text-sm text-text-secondary mb-2">Avg Order Value</p>
                <p className="text-2xl font-bold text-info">₹{stats.avgOrderValue.toFixed(2)}</p>
                <p className="text-xs text-text-tertiary mt-1">Per transaction</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Trend Chart */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2"
          >
            <Card elevated padding="lg">
              <h2 className="heading-3 mb-6">Revenue Trend (Last 6 Months)</h2>
              <div className="space-y-4">
                {revenueByMonth.map((data, index) => {
                  const maxRevenue = Math.max(...revenueByMonth.map(m => m.revenue), 1);
                  const barWidth = (data.revenue / maxRevenue) * 100;
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">{data.month}</span>
                        <span className="text-sm font-semibold text-accent-brown">₹{data.revenue.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-background-secondary rounded-full h-3 overflow-hidden">
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

          {/* Top Performing Books */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <Card elevated padding="lg">
              <h2 className="heading-3 mb-6">Top 5 Books</h2>
              {revenueByBook.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary">No sales data yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {revenueByBook.map((book, index) => {
                    const percentage = totalBookRevenue > 0 ? (book.revenue / totalBookRevenue) * 100 : 0;
                    const colors = ['bg-accent-brown', 'bg-accent-green', 'bg-success', 'bg-info', 'bg-warning'];
                    return (
                      <div key={index} className="p-3 bg-background-secondary rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate" title={book.title}>
                              {book.title}
                            </p>
                            <p className="text-xs text-text-tertiary mt-1">{book.quantity} sold</p>
                          </div>
                          <span className="text-sm font-bold text-accent-brown ml-2">₹{book.revenue.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-background-primary rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <Card elevated padding="lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-3">Recent Transactions</h2>
              <Badge variant="info">{transactions.length} transactions</Badge>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-text-tertiary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-text-secondary">No transactions found</p>
                <p className="text-sm text-text-tertiary mt-2">Your sales will appear here once orders are delivered</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-primary">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Order ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Buyer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Items</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Order Total</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Commission</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Your Earning</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Date</th>
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
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm font-medium text-accent-brown">#{transaction.orderId}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-text-primary">{transaction.buyerName}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" size="sm">{transaction.itemCount} {transaction.itemCount === 1 ? 'item' : 'items'}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-text-primary">₹{transaction.totalAmount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-warning">-₹{transaction.commission.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm font-bold text-success">₹{transaction.sellerEarning.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm text-text-secondary">{transaction.date}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Revenue;
