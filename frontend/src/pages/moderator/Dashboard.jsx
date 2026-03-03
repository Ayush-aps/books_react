/**
 * Moderator — Overview Page
 * Clickable platform stats · Revenue breakdown · Seller leaderboard
 * Active buyers · Active subscribers
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { moderatorAPI, employeeAPI } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { staggerContainer, staggerItem } from '../../utils/animations';

// ─── Clickable Stat Card ────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, bg, note, onClick, clickLabel }) => (
    <motion.div whileHover={onClick ? { scale: 1.02, y: -2 } : {}} whileTap={onClick ? { scale: 0.98 } : {}}>
        <Card elevated padding="lg" className={`h-full ${onClick ? 'cursor-pointer hover:border-accent-brown/40 transition-colors' : ''}`} onClick={onClick}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg} ${color} mb-4`}>{icon}</div>
            <p className="text-sm text-text-secondary mb-1">{label}</p>
            <h3 className="heading-2 mb-1">{value ?? '—'}</h3>
            {note && <p className="text-xs text-text-tertiary">{note}</p>}
            {onClick && clickLabel && (
                <p className="text-xs text-accent-brown font-medium mt-2 flex items-center gap-1">
                    {clickLabel} <span>→</span>
                </p>
            )}
        </Card>
    </motion.div>
);

const Icon = ({ d }) => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);

const fmtCurrency = (n) => n ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0';
const fmt = (n) => n?.toLocaleString('en-IN') ?? '0';

const Overview = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [pendingUsersCount, setPendingUsersCount] = useState(0);
    const [pendingBooksCount, setPendingBooksCount] = useState(0);
    const [pendingComplaintsCount, setPendingComplaintsCount] = useState(0);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [globalRes, usersRes, booksRes, complaintsRes] = await Promise.all([
                moderatorAPI.getGlobalStats(),
                moderatorAPI.getPendingUsers(),
                employeeAPI.getPendingBooks({ limit: 1 }),
                employeeAPI.getComplaints({ limit: 1, status: 'pending' })
            ]);
            setStats(globalRes.data?.data || null);
            setPendingUsersCount(usersRes.data?.data?.users?.length || 0);
            setPendingBooksCount(booksRes.data?.data?.pagination?.totalBooks || 0);
            setPendingComplaintsCount(complaintsRes.data?.data?.pagination?.totalComplaints || 0);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <LoadingSpinner size="lg" message="Loading overview..." />
        </div>
    );

    const physical = stats?.revenue?.physical || 0;
    const taxRev = stats?.revenue?.tax || 0;
    const shippingRev = stats?.revenue?.shipping || 0;
    const subscriptionRev = stats?.revenue?.subscriptions || 0;
    const totalRev = stats?.revenue?.platform || stats?.totalRevenue || 0;
    const physicalPct = totalRev > 0 ? Math.round((physical / totalRev) * 100) : 0;
    const taxPct = totalRev > 0 ? Math.round((taxRev / totalRev) * 100) : 0;
    const shippingPct = totalRev > 0 ? Math.round((shippingRev / totalRev) * 100) : 0;
    const subPct = totalRev > 0 ? Math.round((subscriptionRev / totalRev) * 100) : 0;

    const quickActions = [
        {
            label: 'Manage Users',
            link: '/moderator/users',
            icon: 'M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z',
            color: 'bg-accent-brown'
        },
        {
            label: 'Moderate Content',
            link: '/moderator/books',
            icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
            badge: pendingBooksCount > 0 ? `${pendingBooksCount} pending` : null,
            color: 'bg-accent-green'
        },
        {
            label: 'View All Orders',
            link: '/moderator/orders',
            icon: 'M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z',
            color: 'bg-info'
        },
        {
            label: 'View Complaints',
            link: '/moderator/complaints',
            icon: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
            badge: pendingComplaintsCount > 0 ? `${pendingComplaintsCount} pending` : null,
            color: 'bg-error'
        },
        {
            label: 'View Reports',
            link: '/moderator/reports',
            icon: 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z',
            color: 'bg-warning'
        }
    ];

    return (
        <div className="container-custom py-10 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="heading-1 mb-1 text-text-primary">Staff Dashboard</h1>
                    <p className="body text-text-secondary italic">Manage orders, books, and user relations</p>
                </div>
                <div className="flex gap-3">
                    <Badge variant="info" size="lg">Role: {stats?.currentUserRole || 'Employee'}</Badge>
                    <button onClick={fetchData} className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center hover:bg-background-tertiary transition-colors">
                        🔄
                    </button>
                </div>
            </div>

            {error && <ErrorMessage message={error} onRetry={() => { fetchData(); setError(null); }} />}

            {/* Global Metrics */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-accent-brown rounded-full" />
                    <h2 className="heading-3">Real-time Performance</h2>
                </div>
                <motion.div variants={staggerContainer} initial="hidden" animate="visible"
                    className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total Books" value={fmt(stats?.totalBooks)} color="text-info" bg="bg-info/10"
                        icon={<Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                        note="Verified library size"
                        onClick={() => navigate('/moderator/library')} clickLabel="View Library" />

                    <StatCard label="Total Users" value={fmt(stats?.totalUsers)} color="text-accent-brown" bg="bg-accent-brown/10"
                        icon={<Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                        note="Onboarded platform members"
                        onClick={() => navigate('/moderator/users')} clickLabel="Manage Users" />

                    <StatCard label="Platform Orders" value={fmt(stats?.totalOrders)} color="text-success" bg="bg-success/10"
                        icon={<Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                        note="Completed transactions"
                        onClick={() => navigate('/moderator/orders')} clickLabel="Track Orders" />

                    <StatCard label="Gross Revenue" value={fmtCurrency(totalRev)} color="text-warning" bg="bg-warning/10"
                        icon={<Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                        note="Lifetime platform value"
                        onClick={() => navigate('/moderator/reports')} clickLabel="View Analytics" />
                </motion.div>
            </section>

            {/* Two Column Section: Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <Card elevated padding="lg" className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="heading-3">Recent Activity</h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/moderator/orders')}>See All</Button>
                    </div>
                    {/* Placeholder for now or actual recent orders from global stats if available */}
                    <div className="space-y-4">
                        {stats?.recentOrders?.length > 0 ? stats.recentOrders.slice(0, 5).map(order => (
                            <div key={order._id} className="flex items-center gap-4 p-4 bg-background-secondary rounded-xl hover:bg-background-tertiary transition-colors">
                                <div className="w-10 h-10 rounded-full bg-accent-brown/10 flex items-center justify-center text-accent-brown">📦</div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-text-primary">Order #{order.orderId || order._id.slice(-8)}</p>
                                    <p className="text-xs text-text-tertiary">{fmtCurrency(order.totalAmount)} • {order.buyer?.name}</p>
                                </div>
                                <Badge variant={order.orderStatus === 'delivered' ? 'success' : 'info'}>{order.orderStatus}</Badge>
                            </div>
                        )) : (
                            <div className="text-center py-10 opacity-50">No recent orders found.</div>
                        )}
                    </div>
                </Card>

                {/* Quick Actions Card */}
                <Card elevated padding="lg" className="h-fit">
                    <h2 className="heading-3 mb-6">Quick Actions</h2>
                    <div className="space-y-3">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => navigate(action.link)}
                                className="w-full flex items-center gap-4 p-4 bg-background-secondary rounded-xl border border-transparent hover:border-accent-brown hover:bg-accent-brown/5 transition-all group"
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d={action.icon} clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-bold text-text-primary">{action.label}</p>
                                    {action.badge && (
                                        <p className="text-[10px] text-accent-brown font-bold mt-0.5">{action.badge}</p>
                                    )}
                                </div>
                                <div className="text-text-tertiary group-hover:text-accent-brown opacity-0 group-hover:opacity-100 transition-all">
                                    →
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Revenue Deep Dive */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-accent-brown rounded-full" />
                    <h2 className="heading-3">Revenue Deep Dive</h2>
                </div>
                <Card elevated padding="lg" className="mb-6 bg-gradient-to-br from-background-primary to-background-secondary">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">Gross Cumulative Revenue</p>
                            <h3 className="text-4xl font-black text-accent-brown">{fmtCurrency(totalRev)}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="success">+{subPct}% Subscriptions</Badge>
                                <span className="text-xs text-text-tertiary">Platform Growth Mode</span>
                            </div>
                        </div>
                        <div className="flex-1 w-full space-y-4">
                            <div className="h-4 rounded-full bg-background-tertiary overflow-hidden flex shadow-inner">
                                <div className="h-full bg-info" style={{ width: `${physicalPct}%` }} />
                                <div className="h-full bg-warning" style={{ width: `${taxPct}%` }} />
                                <div className="h-full bg-error/70" style={{ width: `${shippingPct}%` }} />
                                <div className="h-full bg-success" style={{ width: `${subPct}%` }} />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-info" /><span className="text-[10px] text-text-secondary">Books {physicalPct}%</span></div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-warning" /><span className="text-[10px] text-text-secondary">Tax {taxPct}%</span></div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-error/70" /><span className="text-[10px] text-text-secondary">Shipping {shippingPct}%</span></div>
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success" /><span className="text-[10px] text-text-secondary">Subs {subPct}%</span></div>
                            </div>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Seller Leaderboard */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-accent-brown rounded-full" />
                        <h2 className="heading-3">Top Performing Sellers</h2>
                    </div>
                    <Button variant="ghost" size="sm">Download CSV</Button>
                </div>
                <Card elevated padding="0" className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-background-secondary text-text-tertiary border-b border-border-primary">
                                <tr>
                                    <th className="py-4 px-6 font-bold uppercase tracking-tight">Rank</th>
                                    <th className="py-4 px-6 font-bold uppercase tracking-tight">Seller Account</th>
                                    <th className="py-4 px-6 font-bold uppercase tracking-tight text-center">Units</th>
                                    <th className="py-4 px-6 font-bold uppercase tracking-tight text-right">Revenue Generated</th>
                                    <th className="py-4 px-6 font-bold uppercase tracking-tight text-right">Mkt Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.sellerLeaderboard?.map((s, idx) => {
                                    const share = totalRev > 0 ? ((s.totalRevenue / totalRev) * 100).toFixed(1) : 0;
                                    return (
                                        <tr key={s.sellerId} className="border-b border-border-primary last:border-0 hover:bg-background-secondary transition-colors">
                                            <td className="py-4 px-6">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono ${idx < 3 ? 'bg-accent-brown text-white shadow-sm' : 'bg-background-tertiary text-text-secondary'}`}>
                                                    {idx + 1}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="font-bold text-text-primary">{s.name}</p>
                                                <p className="text-xs text-text-tertiary">{s.email}</p>
                                            </td>
                                            <td className="py-4 px-6 text-center font-medium bg-background-secondary/30">{s.totalSales}</td>
                                            <td className="py-4 px-6 text-right font-black text-accent-brown">{fmtCurrency(s.totalRevenue)}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="w-20 h-1.5 rounded-full bg-background-tertiary overflow-hidden shadow-inner">
                                                        <div className="h-full bg-accent-brown rounded-full" style={{ width: `${share}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-text-primary w-8">{share}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </section>
        </div>
    );
};

export default Overview;
