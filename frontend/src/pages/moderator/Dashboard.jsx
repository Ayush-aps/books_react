/**
 * Moderator Dashboard
 * User verification, staff performance, and content oversight
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { moderatorAPI, employeeAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { staggerContainer, staggerItem, fadeInUp } from '../../utils/animations';

const Dashboard = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [employeeStats, setEmployeeStats] = useState([]);
    const [pendingBooksCount, setPendingBooksCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [usersRes, statsRes, booksRes] = await Promise.all([
                moderatorAPI.getPendingUsers(),
                moderatorAPI.getEmployeeStats(),
                employeeAPI.getPendingBooks({ limit: 1 }),
            ]);

            setPendingUsers(usersRes.data?.data?.users || []);
            setEmployeeStats(statsRes.data?.data?.employees || []);
            setPendingBooksCount(booksRes.data?.data?.pagination?.totalBooks || 0);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyUser = async (userId, action) => {
        try {
            setActionLoading(userId);
            await moderatorAPI.verifyUser(userId, action);
            setPendingUsers(prev => prev.filter(u => u._id !== userId));
        } catch (err) {
            setError(err.message || `Failed to ${action} user`);
        } finally {
            setActionLoading(null);
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

    return (
        <div className="min-h-screen bg-background-primary py-12">
            <div className="container-custom">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <h1 className="heading-1 mb-3">Moderator Dashboard</h1>
                    <p className="body-xl text-text-secondary">User verification, staff oversight & content moderation</p>
                </motion.div>

                {/* Content Oversight Cards */}
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <motion.div variants={staggerItem}>
                        <Card elevated padding="lg" className="h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-warning/10 text-warning">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-1">Pending Users</p>
                            <h3 className="heading-2 mb-1">{pendingUsers.length}</h3>
                            <p className="text-xs text-text-tertiary">Awaiting verification</p>
                        </Card>
                    </motion.div>

                    <motion.div variants={staggerItem}>
                        <Card elevated padding="lg" className="h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-info/10 text-info">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-1">Pending Books</p>
                            <h3 className="heading-2 mb-1">{pendingBooksCount}</h3>
                            <p className="text-xs text-text-tertiary">Waiting for Employee review</p>
                        </Card>
                    </motion.div>

                    <motion.div variants={staggerItem}>
                        <Card elevated padding="lg" className="h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-brown/10 text-accent-brown">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-1">Reported Reels</p>
                            <h3 className="heading-2 mb-1">0</h3>
                            <Badge variant="info" size="sm">Coming Soon</Badge>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* User Verification Table */}
                    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                        <Card elevated padding="lg">
                            <h2 className="heading-3 mb-6">User Verification Queue</h2>
                            {pendingUsers.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-text-secondary">All users have been verified!</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                    {pendingUsers.map(user => (
                                        <div key={user._id} className="flex items-center justify-between p-4 bg-background-secondary rounded-lg border border-border-primary">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 bg-accent-brown/10 rounded-full flex items-center justify-center text-accent-brown font-medium flex-shrink-0">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-text-primary truncate">{user.name}</p>
                                                    <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                                                    <Badge variant={user.role === 'seller' ? 'warning' : 'info'} size="sm" className="mt-1">
                                                        {user.role}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0 ml-4">
                                                <Button
                                                    size="sm"
                                                    variant="success"
                                                    onClick={() => handleVerifyUser(user._id, 'approve')}
                                                    disabled={actionLoading === user._id}
                                                >
                                                    {actionLoading === user._id ? '...' : 'Approve'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="error"
                                                    onClick={() => handleVerifyUser(user._id, 'reject')}
                                                    disabled={actionLoading === user._id}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </motion.div>

                    {/* Staff Performance */}
                    <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
                        <Card elevated padding="lg">
                            <h2 className="heading-3 mb-6">Staff Performance</h2>
                            {employeeStats.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-text-secondary">No employee data available yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border-primary">
                                                <th className="text-left py-3 px-2 font-semibold text-text-secondary">Employee</th>
                                                <th className="text-center py-3 px-2 font-semibold text-text-secondary">Resolved</th>
                                                <th className="text-center py-3 px-2 font-semibold text-text-secondary">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employeeStats.map(emp => (
                                                <tr key={emp.employeeId} className="border-b border-border-primary last:border-0">
                                                    <td className="py-3 px-2">
                                                        <p className="font-medium text-text-primary">{emp.name}</p>
                                                        <p className="text-xs text-text-tertiary">{emp.email}</p>
                                                    </td>
                                                    <td className="py-3 px-2 text-center">
                                                        <span className="font-bold text-accent-brown text-lg">{emp.totalResolved}</span>
                                                    </td>
                                                    <td className="py-3 px-2 text-center">
                                                        <Badge variant={emp.verificationStatus === 'approved' ? 'success' : 'warning'} size="sm">
                                                            {emp.verificationStatus}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
