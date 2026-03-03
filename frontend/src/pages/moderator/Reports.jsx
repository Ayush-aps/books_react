/**
 * Moderator Reports Page
 * System analytics and reports for staff
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { moderatorAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Reports = () => {
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            const response = await moderatorAPI.getReports();
            setReports(response.data?.data || {});
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <LoadingSpinner size="lg" message="Generating platform reports..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-custom py-10">
                <ErrorMessage message={error} onRetry={fetchReports} />
            </div>
        );
    }

    // Chart Data Preparation
    const roleData = [
        { name: 'Buyers', value: reports.userDistribution?.buyers || 0, color: '#8B7355' },
        { name: 'Sellers', value: reports.userDistribution?.sellers || 0, color: '#C4B5A0' },
        { name: 'Employees', value: reports.userDistribution?.employees || 0, color: '#2C2C2C' }
    ].filter(d => d.value > 0);

    const orderData = [
        { name: 'Processing', value: reports.orderDistribution?.processing || 0, color: '#3B82F6' },
        { name: 'Delivered', value: reports.orderDistribution?.delivered || 0, color: '#10B981' },
        { name: 'Cancelled', value: reports.orderDistribution?.cancelled || 0, color: '#EF4444' }
    ].filter(d => d.value > 0);

    return (
        <div className="container-custom py-10 space-y-12">
            {/* Header */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                <h1 className="heading-1 mb-1">Platform Analytics</h1>
                <p className="body text-text-secondary">Visual insights into platform growth and operational health</p>
            </motion.div>

            {/* Top Cards */}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={staggerItem}>
                    <Card elevated className="text-center py-8">
                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Total Platform Users</p>
                        <h2 className="heading-1 text-accent-brown">{reports.counts?.users || 0}</h2>
                    </Card>
                </motion.div>
                <motion.div variants={staggerItem}>
                    <Card elevated className="text-center py-8">
                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Books in Library</p>
                        <h2 className="heading-1 text-accent-brown">{reports.counts?.books || 0}</h2>
                    </Card>
                </motion.div>
                <motion.div variants={staggerItem}>
                    <Card elevated className="text-center py-8">
                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">All-time Orders</p>
                        <h2 className="heading-1 text-accent-brown">{reports.counts?.orders || 0}</h2>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card elevated padding="lg" className="flex flex-col items-center">
                    <h3 className="heading-3 mb-8 text-center">User Role Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={roleData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {roleData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                <Card elevated padding="lg" className="flex flex-col items-center">
                    <h3 className="heading-3 mb-8 text-center">Order Status Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={orderData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {orderData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Revenue Trend */}
            <Card elevated padding="lg">
                <h3 className="heading-3 mb-6">Revenue Trend (Last 6 Months)</h3>
                <div className="space-y-4">
                    {reports.revenueByMonth?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-background-secondary rounded-xl">
                            <span className="font-bold text-text-primary">{item.month}</span>
                            <div className="flex-1 mx-8 h-2 bg-background-tertiary rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.revenue / (Math.max(...reports.revenueByMonth.map(r => r.revenue)) || 1)) * 100}%` }}
                                    className="h-full bg-accent-brown"
                                />
                            </div>
                            <span className="font-mono font-bold text-accent-brown">₹{item.revenue.toFixed(2)}</span>
                        </div>
                    ))}
                    {(!reports.revenueByMonth || reports.revenueByMonth.length === 0) && (
                        <p className="text-center text-text-tertiary py-10">No revenue data for the selected period.</p>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Reports;
