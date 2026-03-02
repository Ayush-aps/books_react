/**
 * Moderator — Verification Page
 * User Verification Queue + Staff Performance
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { moderatorAPI } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { fadeInUp } from '../../utils/animations';

const Verification = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [employeeStats, setEmployeeStats] = useState([]);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, statsRes] = await Promise.all([
                moderatorAPI.getPendingUsers(),
                moderatorAPI.getEmployeeStats(),
            ]);
            setPendingUsers(usersRes.data?.data?.users || []);
            setEmployeeStats(statsRes.data?.data?.employees || []);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load verification data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleVerify = async (userId, action) => {
        try {
            setActionLoading(userId);
            await moderatorAPI.verifyUser(userId, action);
            setPendingUsers(prev => prev.filter(u => u._id !== userId));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <LoadingSpinner size="lg" message="Loading verification queue..." />
        </div>
    );

    return (
        <div className="container-custom py-10 space-y-8">
            <div>
                <h1 className="heading-1 mb-1">Verification</h1>
                <p className="body text-text-secondary">Review and approve pending accounts · Monitor staff performance</p>
            </div>

            {error && <ErrorMessage message={error} onRetry={() => { fetchData(); setError(null); }} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Verification Queue */}
                <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                    <Card elevated padding="lg">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="heading-3">User Verification Queue</h2>
                            <Badge variant={pendingUsers.length > 0 ? 'warning' : 'success'} size="sm">
                                {pendingUsers.length} pending
                            </Badge>
                        </div>
                        {pendingUsers.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="font-medium text-text-primary mb-1">All clear!</p>
                                <p className="text-sm text-text-secondary">No users are pending verification.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                                {pendingUsers.map(user => (
                                    <div key={user._id}
                                        className="flex items-center justify-between p-4 bg-background-secondary rounded-xl border border-border-primary hover:border-accent-brown/30 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-accent-brown/10 flex items-center justify-center text-accent-brown font-semibold flex-shrink-0">
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
                                        <div className="flex gap-2 ml-4 flex-shrink-0">
                                            <Button size="sm" variant="success" disabled={actionLoading === user._id}
                                                onClick={() => handleVerify(user._id, 'approve')}>
                                                {actionLoading === user._id ? '...' : 'Approve'}
                                            </Button>
                                            <Button size="sm" variant="error" disabled={actionLoading === user._id}
                                                onClick={() => handleVerify(user._id, 'reject')}>Reject</Button>
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
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="heading-3">Staff Performance</h2>
                            <Badge variant="info" size="sm">{employeeStats.length} employees</Badge>
                        </div>
                        {employeeStats.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-text-secondary">No employee stats yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-primary">
                                            <th className="text-left py-3 px-2 font-semibold text-text-secondary">Employee</th>
                                            <th className="text-center py-3 px-2 font-semibold text-text-secondary">Tickets Resolved</th>
                                            <th className="text-center py-3 px-2 font-semibold text-text-secondary">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employeeStats.map(emp => (
                                            <tr key={emp.employeeId} className="border-b border-border-primary last:border-0 hover:bg-background-secondary">
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
    );
};

export default Verification;
