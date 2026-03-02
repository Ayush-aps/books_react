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

    const fetchData = async () => {
        try {
            setLoading(true);
            const [globalRes, usersRes, booksRes] = await Promise.all([
                moderatorAPI.getGlobalStats(),
                moderatorAPI.getPendingUsers(),
                employeeAPI.getPendingBooks({ limit: 1 }),
            ]);
            setStats(globalRes.data?.data || null);
            setPendingUsersCount(usersRes.data?.data?.users?.length || 0);
            setPendingBooksCount(booksRes.data?.data?.pagination?.totalBooks || 0);
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

    return (
        <div className="container-custom py-10 space-y-12">
            {/* Header */}
            <div>
                <h1 className="heading-1 mb-1">Platform Overview</h1>
                <p className="body text-text-secondary">Real-time platform metrics — click a card to dive deeper</p>
            </div>

            {error && <ErrorMessage message={error} onRetry={() => { fetchData(); setError(null); }} />}

            {/* ── Global Metrics ─────────────────────────────────────────── */}
            <section>
                <h2 className="heading-3 mb-5">Global Metrics</h2>
                <motion.div variants={staggerContainer} initial="hidden" animate="visible"
                    className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <motion.div variants={staggerItem}>
                        <StatCard label="Total Books" value={fmt(stats?.totalBooks)} color="text-info" bg="bg-info/10"
                            icon={<Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                            note="All listings"
                            onClick={() => navigate('/moderator/library')} clickLabel="View Verified Library" />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard label="Total Users" value={fmt(stats?.totalUsers)} color="text-accent-brown" bg="bg-accent-brown/10"
                            icon={<Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                            note="Buyers, sellers, employees"
                            onClick={() => navigate('/moderator/users')} clickLabel="Manage Users" />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard label="Total Orders" value={fmt(stats?.totalOrders)} color="text-success" bg="bg-success/10"
                            icon={<Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                            note="Completed payments" />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard label="Total Revenue" value={fmtCurrency(totalRev)} color="text-warning" bg="bg-warning/10"
                            icon={<Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                            note="Gross sales" />
                    </motion.div>
                </motion.div>
            </section>

            {/* ── Revenue Breakdown ──────────────────────────────────────── */}
            <section>
                <h2 className="heading-3 mb-2">Revenue Breakdown</h2>
                <p className="text-sm text-text-tertiary mb-5">Physical prices + Tax + Shipping + Subscriptions = Gross</p>

                {/* Gross card — full width stacked bar */}
                <Card elevated padding="lg" className="mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">Gross Platform Revenue</p>
                            <h3 className="heading-1 text-accent-brown">{fmtCurrency(totalRev)}</h3>
                            <p className="text-xs text-text-tertiary mt-1">All completed orders + active subscriptions</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-text-secondary">Completed Orders</p>
                            <p className="heading-3">{fmt(stats?.totalOrders)}</p>
                        </div>
                    </div>
                    <div className="mt-5 h-3 rounded-full bg-background-secondary overflow-hidden flex">
                        <div className="h-full bg-info transition-all" style={{ width: `${physicalPct}%` }} />
                        <div className="h-full bg-warning transition-all" style={{ width: `${taxPct}%` }} />
                        <div className="h-full bg-error/70 transition-all" style={{ width: `${shippingPct}%` }} />
                        <div className="h-full bg-success transition-all" style={{ width: `${subPct}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="w-3 h-3 rounded-sm bg-info inline-block" />Book Prices ({physicalPct}%)</span>
                        <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="w-3 h-3 rounded-sm bg-warning inline-block" />Tax ({taxPct}%)</span>
                        <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="w-3 h-3 rounded-sm bg-error/70 inline-block" />Shipping ({shippingPct}%)</span>
                        <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="w-3 h-3 rounded-sm bg-success inline-block" />Subscriptions ({subPct}%)</span>
                    </div>
                </Card>

                {/* 4 breakdown cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <Card elevated padding="md">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-text-secondary">Book Prices</p>
                            <Badge variant="info" size="sm">{physicalPct}%</Badge>
                        </div>
                        <h4 className="heading-3 text-info">{fmtCurrency(physical)}</h4>
                        <p className="text-xs text-text-tertiary mt-1">Order subtotals</p>
                        <div className="mt-3 h-1.5 rounded-full bg-background-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-info" style={{ width: `${physicalPct}%` }} />
                        </div>
                    </Card>
                    <Card elevated padding="md">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-text-secondary">Tax Collected</p>
                            <Badge variant="warning" size="sm">{taxPct}%</Badge>
                        </div>
                        <h4 className="heading-3 text-warning">{fmtCurrency(taxRev)}</h4>
                        <p className="text-xs text-text-tertiary mt-1">GST on orders</p>
                        <div className="mt-3 h-1.5 rounded-full bg-background-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-warning" style={{ width: `${taxPct}%` }} />
                        </div>
                    </Card>
                    <Card elevated padding="md">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-text-secondary">Shipping Fees</p>
                            <Badge variant="error" size="sm">{shippingPct}%</Badge>
                        </div>
                        <h4 className="heading-3 text-error">{fmtCurrency(shippingRev)}</h4>
                        <p className="text-xs text-text-tertiary mt-1">Delivery charges</p>
                        <div className="mt-3 h-1.5 rounded-full bg-background-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-error/70" style={{ width: `${shippingPct}%` }} />
                        </div>
                    </Card>
                    <Card elevated padding="md">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-text-secondary">Subscriptions</p>
                            <Badge variant="success" size="sm">{subPct}%</Badge>
                        </div>
                        <h4 className="heading-3 text-success">{fmtCurrency(subscriptionRev)}</h4>
                        <p className="text-xs text-text-tertiary mt-1">{fmt(stats?.activeSubscribersCount)} active plans</p>
                        <div className="mt-3 h-1.5 rounded-full bg-background-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-success" style={{ width: `${subPct}%` }} />
                        </div>
                    </Card>
                </div>
            </section>

            {/* ── Activity ──────────────────────────────────────────────── */}
            <section>
                <h2 className="heading-3 mb-5">Platform Activity</h2>
                <motion.div variants={staggerContainer} initial="hidden" animate="visible"
                    className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <motion.div variants={staggerItem}>
                        <StatCard label="Active Buyers" value={fmt(stats?.activeBuyersCount)}
                            color="text-success" bg="bg-success/10" note="Placed ≥ 1 order"
                            icon={<Icon d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />}
                            onClick={() => navigate('/moderator/users')} clickLabel="Manage Users" />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard label="Active Subscribers" value={fmt(stats?.activeSubscribersCount)}
                            color="text-info" bg="bg-info/10" note="Premium/Plus plans"
                            icon={<Icon d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />} />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard label="Pending Verifications" value={pendingUsersCount}
                            color="text-warning" bg="bg-warning/10" note="Need approval"
                            icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                            onClick={() => navigate('/moderator/verification')} clickLabel="Go to Verification" />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <StatCard label="Pending Books" value={pendingBooksCount}
                            color="text-error" bg="bg-error/10" note="Awaiting review"
                            icon={<Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                            onClick={() => navigate('/moderator/books')} clickLabel="Review Books" />
                    </motion.div>
                </motion.div>
            </section>

            {/* ── Seller Leaderboard ─────────────────────────────────────── */}
            <section>
                <h2 className="heading-3 mb-5">Seller Business Leaderboard</h2>
                <Card elevated padding="lg">
                    {!stats?.sellerLeaderboard?.length ? (
                        <p className="text-center py-10 text-text-secondary">No seller data yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border-primary">
                                        <th className="text-left py-3 px-3 font-semibold text-text-secondary">#</th>
                                        <th className="text-left py-3 px-3 font-semibold text-text-secondary">Seller</th>
                                        <th className="text-right py-3 px-3 font-semibold text-text-secondary">Units Sold</th>
                                        <th className="text-right py-3 px-3 font-semibold text-text-secondary">Revenue</th>
                                        <th className="text-right py-3 px-3 font-semibold text-text-secondary">Share</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.sellerLeaderboard.map((s, idx) => {
                                        const share = totalRev > 0 ? ((s.totalRevenue / totalRev) * 100).toFixed(1) : 0;
                                        return (
                                            <tr key={s.sellerId} className="border-b border-border-primary last:border-0 hover:bg-background-secondary">
                                                <td className="py-3 px-3">
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (
                                                        <span className="text-text-tertiary font-mono">{idx + 1}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <p className="font-medium text-text-primary">{s.name || 'Unknown Seller'}</p>
                                                    <p className="text-xs text-text-tertiary">{s.email || ''}</p>
                                                </td>
                                                <td className="py-3 px-3 text-right font-medium">{s.totalSales}</td>
                                                <td className="py-3 px-3 text-right font-bold text-accent-brown">{fmtCurrency(s.totalRevenue)}</td>
                                                <td className="py-3 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-1.5 rounded-full bg-background-secondary overflow-hidden">
                                                            <div className="h-full rounded-full bg-accent-brown" style={{ width: `${share}%` }} />
                                                        </div>
                                                        <span className="text-xs text-text-tertiary w-8 text-right">{share}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </section>
        </div>
    );
};

export default Overview;
