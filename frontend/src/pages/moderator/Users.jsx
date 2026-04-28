/**
 * Moderator — User Management Page
 * Full-height slide-in profile drawer with all registration info
 * Inline verification widget · Promote (employees) · Remove
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { moderatorAPI } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { fadeInUp } from '../../utils/animations';

const ROLE_FILTERS = ['all', 'buyer', 'seller', 'employee'];

// ─── Role & Status helpers ────────────────────────────────────────────────
const roleBadgeVariant = r => ({ buyer: 'default', seller: 'warning', employee: 'info' })[r] || 'default';
const statusVariant = s => ({ approved: 'success', rejected: 'error', pending: 'warning' })[s] || 'warning';
const statusDot = s => ({ approved: 'bg-success', rejected: 'bg-error', pending: 'bg-warning' })[s] || 'bg-warning';

// ─── Inline Verification Status Chip ─────────────────────────────────────
const VerificationWidget = ({ user, onStatusChange, loading }) => {
    const status = user.verificationStatus || 'pending';
    const [open, setOpen] = useState(false);
    const actions = {
        approved: [{ label: 'Revoke', action: 'reject', cls: 'text-error hover:bg-error/10' }],
        pending: [{ label: 'Approve', action: 'approve', cls: 'text-success hover:bg-success/10' },
        { label: 'Reject', action: 'reject', cls: 'text-error hover:bg-error/10' }],
        rejected: [{ label: 'Re-approve', action: 'approve', cls: 'text-success hover:bg-success/10' }],
    };
    const colorCls = {
        approved: 'bg-success/10 border-success/30 text-success hover:bg-success/20',
        rejected: 'bg-error/10 border-error/30 text-error hover:bg-error/20',
        pending: 'bg-warning/10 border-warning/30 text-warning hover:bg-warning/20',
    }[status] || '';

    return (
        <div className="relative">
            <button onClick={() => setOpen(o => !o)} disabled={loading}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${colorCls} ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot(status)}`} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {!loading && <span className="opacity-60">▾</span>}
                {loading && <span className="animate-spin">↻</span>}
            </button>
            <AnimatePresence>
                {open && (<>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute left-0 top-8 z-20 bg-background-primary border border-border-primary rounded-xl shadow-xl p-2 min-w-[140px]">
                        <p className="text-xs text-text-tertiary px-2 py-1 mb-1 border-b border-border-primary">Change Status</p>
                        {(actions[status] || actions.pending).map(a => (
                            <button key={a.action} onClick={() => { setOpen(false); onStatusChange(user._id, a.action); }}
                                className={`w-full text-left text-xs px-3 py-2 rounded-lg font-medium transition-colors ${a.cls}`}>
                                {a.label}
                            </button>
                        ))}
                    </motion.div>
                </>)}
            </AnimatePresence>
        </div>
    );
};

// ─── Profile Drawer ───────────────────────────────────────────────────────
const ProfileDrawer = ({ userId, onClose, onDelete, onPromote, onStatusChange }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmPromote, setConfirmPromote] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const res = await moderatorAPI.getUser(userId);
                setProfile(res.data?.data?.user || null);
            } catch { setProfile(null); }
            finally { setLoading(false); }
        };
        fetch();
    }, [userId]);

    const handleStatusChange = async (uid, action) => {
        try {
            setActionLoading('status');
            await moderatorAPI.verifyUser(uid, action);
            setProfile(p => ({ ...p, verificationStatus: action === 'approve' ? 'approved' : 'rejected' }));
            onStatusChange(uid, action);
        } finally { setActionLoading(null); }
    };

    const handleDelete = async () => {
        try {
            setActionLoading('delete');
            await moderatorAPI.deleteUser(userId);
            onDelete(userId);
            onClose();
        } finally { setActionLoading(null); setConfirmDelete(false); }
    };

    const handlePromote = async () => {
        try {
            setActionLoading('promote');
            await moderatorAPI.promoteEmployee(userId);
            onPromote(userId);
            onClose();
        } finally { setActionLoading(null); setConfirmPromote(false); }
    };

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                onClick={onClose} />

            {/* Drawer */}
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-background-primary/95 backdrop-blur-2xl z-50 shadow-2xl flex flex-col overflow-hidden border-l border-white/20">

                {/* Glassmorphic Header */}
                <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-border-primary/50 bg-background-primary/80 backdrop-blur-lg">
                    <div>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-brown to-charcoal">User Profile</h2>
                        <p className="text-text-tertiary text-xs font-medium uppercase tracking-wider">Moderator View</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-text-secondary hover:bg-background-tertiary hover:text-accent-brown transition-all text-sm ring-1 ring-border-primary">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto relative no-scrollbar">
                    {/* Decorative background blobs */}
                    <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-accent-brown/5 to-transparent pointer-events-none" />

                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <LoadingSpinner size="md" message="Loading profile..." />
                        </div>
                    ) : !profile ? (
                        <div className="p-6 text-center text-text-secondary">Profile not available.</div>
                    ) : (
                        <div className="p-6 space-y-6 relative z-10">
                            {/* Avatar + name hero */}
                            <div className="relative flex flex-col items-center text-center py-8 rounded-3xl bg-background-secondary/40 border border-white/20 shadow-sm overflow-hidden group">
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent-brown/10 rounded-full blur-2xl group-hover:bg-accent-brown/20 transition-all duration-700" />
                                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-info/10 rounded-full blur-xl group-hover:bg-info/20 transition-all duration-700" />

                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
                                    {profile.avatar && !profile.avatar.includes('default-avatar') ? (
                                        <img src={profile.avatar} alt={profile.name}
                                            className="relative z-10 w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg mb-4" />
                                    ) : (
                                        <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-accent-brown to-accent-brown-hover flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white shadow-lg mb-4">
                                            {profile.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </motion.div>
                                <h3 className="heading-2 mb-1 relative z-10">{profile.name}</h3>
                                <p className="text-sm text-text-secondary mb-3 relative z-10">{profile.email}</p>
                                <div className="flex items-center gap-2 flex-wrap justify-center relative z-10">
                                    <Badge variant={roleBadgeVariant(profile.role)} size="sm" className="shadow-sm">{profile.role}</Badge>
                                    <Badge variant={statusVariant(profile.verificationStatus)} size="sm" className="shadow-sm">
                                        {profile.verificationStatus || 'pending'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Info grid */}
                            <div className="bg-background-secondary/50 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-sm relative overflow-hidden">
                                <h4 className="text-[10px] font-bold text-accent-brown uppercase tracking-widest mb-4">Registration Details</h4>
                                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                                    <div className="group">
                                        <p className="text-xs text-text-tertiary mb-1 flex items-center gap-1"><span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-brown">▸</span> Phone</p>
                                        <p className="text-sm font-semibold text-text-primary">{profile.phone || '—'}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-xs text-text-tertiary mb-1 flex items-center gap-1"><span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-brown">▸</span> Member Since</p>
                                        <p className="text-sm font-semibold text-text-primary">{fmt(profile.createdAt)}</p>
                                    </div>
                                    <div className="col-span-2 group">
                                        <p className="text-xs text-text-tertiary mb-1 flex items-center gap-1"><span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-brown">▸</span> Email Verified</p>
                                        <div className="flex items-center gap-2">
                                            {profile.isVerified ? (
                                                <span className="flex items-center gap-1.5 text-sm font-semibold text-success bg-success/10 px-2 py-0.5 rounded-md"><span className="w-1.5 h-1.5 rounded-full bg-success"></span>Verified</span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-sm font-semibold text-error bg-error/10 px-2 py-0.5 rounded-md"><span className="w-1.5 h-1.5 rounded-full bg-error"></span>Not Verified</span>
                                            )}
                                        </div>
                                    </div>
                                    {profile.address?.street && (<>
                                        <div className="col-span-2 group pt-2 border-t border-border-primary/30">
                                            <p className="text-xs text-text-tertiary mb-1 flex items-center gap-1"><span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-brown">▸</span> Address</p>
                                            <p className="text-sm font-medium text-text-primary leading-relaxed">
                                                {[profile.address.street, profile.address.city, profile.address.state, profile.address.zipCode, profile.address.country]
                                                    .filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    </>)}
                                    {profile.managedBy && (
                                        <div className="col-span-2 group pt-2 border-t border-border-primary/30">
                                            <p className="text-xs text-text-tertiary mb-1 flex items-center gap-1"><span className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-brown">▸</span> Managed By</p>
                                            <p className="text-sm font-medium text-text-primary">
                                                {profile.managedBy.name} <span className="text-accent-brown">({profile.managedBy.role})</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Verification control */}
                            <div className="bg-background-secondary/50 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-sm relative overflow-hidden">
                                <h4 className="text-[10px] font-bold text-accent-brown uppercase tracking-widest mb-4">Verification Status</h4>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-text-primary font-bold capitalize mb-1">{profile.verificationStatus || 'pending'}</p>
                                        <p className="text-xs text-text-tertiary">
                                            {profile.verificationStatus === 'approved' ? 'Account is fully active'
                                                : profile.verificationStatus === 'rejected' ? 'Account access denied'
                                                    : 'Awaiting moderation'}
                                        </p>
                                    </div>
                                    <VerificationWidget
                                        user={profile}
                                        onStatusChange={handleStatusChange}
                                        loading={actionLoading === 'status'}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                {profile && (
                    <div className="px-6 py-5 border-t border-white/20 bg-background-primary/80 backdrop-blur-lg flex-shrink-0 space-y-3 z-10">
                        {profile.role === 'employee' && !confirmPromote && !confirmDelete && (
                            <button disabled={!!actionLoading} onClick={() => setConfirmPromote(true)}
                                className="w-full relative overflow-hidden rounded-xl font-semibold text-sm transition-all text-success bg-success/10 hover:bg-success hover:text-white py-3 border border-success/20 hover:border-success hover:shadow-lg hover:shadow-success/20 disabled:opacity-50 group">
                                <span className="relative z-10 flex items-center justify-center gap-2">↑ Promote to Moderator</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
                            </button>
                        )}

                        {confirmPromote && (
                            <div className="p-5 rounded-2xl bg-success/5 border border-success/20 shadow-inner">
                                <p className="text-sm text-success font-bold mb-1">Confirm promotion?</p>
                                <p className="text-xs text-text-secondary mb-4">{profile.name} will gain full Moderator access.</p>
                                <div className="flex gap-3">
                                    <button className="flex-1 py-2 rounded-lg text-xs font-semibold bg-background-secondary text-text-secondary hover:bg-background-tertiary transition-colors" onClick={() => setConfirmPromote(false)}>Cancel</button>
                                    <button disabled={actionLoading === 'promote'} onClick={handlePromote}
                                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-success text-white hover:bg-success-hover hover:shadow-md transition-all">
                                        {actionLoading === 'promote' ? 'Promoting...' : 'Confirm'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!confirmDelete && !confirmPromote && (
                            <button disabled={!!actionLoading} onClick={() => setConfirmDelete(true)}
                                className="w-full relative overflow-hidden rounded-xl font-semibold text-sm transition-all text-error bg-error/10 hover:bg-error hover:text-white py-3 border border-error/20 hover:border-error hover:shadow-lg hover:shadow-error/20 disabled:opacity-50 group">
                                <span className="relative z-10">Remove Account</span>
                            </button>
                        )}

                        {confirmDelete && (
                            <div className="p-5 rounded-2xl bg-error/5 border border-error/20 shadow-inner">
                                <p className="text-sm text-error font-bold mb-1">Delete this account?</p>
                                <p className="text-xs text-text-secondary mb-4">This action is irreversible. Data will be lost.</p>
                                <div className="flex gap-3">
                                    <button className="flex-1 py-2 rounded-lg text-xs font-semibold bg-background-secondary text-text-secondary hover:bg-background-tertiary transition-colors" onClick={() => setConfirmDelete(false)}>Cancel</button>
                                    <button disabled={actionLoading === 'delete'} onClick={handleDelete}
                                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-error text-white hover:bg-error-hover hover:shadow-md transition-all">
                                        {actionLoading === 'delete' ? 'Deleting...' : 'Yes, Delete'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────
const Users = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);
    const [drawerUserId, setDrawerUserId] = useState(null); // open drawer

    const fetchUsers = useCallback(async (q = '', role = 'all') => {
        try {
            setLoading(true);
            const params = { limit: 20 };
            if (q) params.search = q;
            if (role !== 'all') params.role = role;
            const res = await moderatorAPI.getUsers(params);
            setUsers(res.data?.data?.users || []);
            setTotal(res.data?.data?.pagination?.totalUsers || 0);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleStatusChange = (userId, action) => {
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, verificationStatus: newStatus } : u));
    };
    const handleDelete = (userId) => {
        setUsers(prev => prev.filter(u => u._id !== userId));
        setTotal(t => t - 1);
    };
    const handlePromote = (userId) => {
        setUsers(prev => prev.filter(u => u._id !== userId));
        setTotal(t => t - 1);
    };

    // Inline status change (from table widget)
    const handleTableStatusChange = async (userId, action) => {
        try {
            setActionLoading(userId);
            await moderatorAPI.verifyUser(userId, action);
            handleStatusChange(userId, action);
        } catch (err) {
            setError(err.message || 'Failed to update status');
        } finally { setActionLoading(null); }
    };

    const applySearch = () => fetchUsers(search, roleFilter);

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <LoadingSpinner size="lg" message="Loading users..." />
        </div>
    );

    return (
        <>
            <div className="container-custom py-10">
                <div className="mb-8">
                    <h1 className="heading-1 mb-1">User Management</h1>
                    <p className="body text-text-secondary">
                        Manage accounts · Click a row to open full profile · Click the status chip to approve/reject
                    </p>
                </div>

                {error && <ErrorMessage message={error} onRetry={() => { fetchUsers(search, roleFilter); setError(null); }} />}

                <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                    <Card elevated padding="lg">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <input type="text" placeholder="Search by name or email..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applySearch()}
                                className="flex-1 px-4 py-2 rounded-lg border border-border-primary bg-background-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-brown text-sm"
                            />
                            <div className="flex gap-1 p-1 bg-background-secondary rounded-lg">
                                {ROLE_FILTERS.map(r => (
                                    <button key={r} onClick={() => { setRoleFilter(r); fetchUsers(search, r); }}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize
                                            ${roleFilter === r ? 'bg-accent-brown text-white' : 'text-text-secondary hover:text-text-primary'}`}>
                                        {r}
                                    </button>
                                ))}
                            </div>
                            <Button size="sm" variant="primary" onClick={applySearch}>Search</Button>
                        </div>

                        <p className="text-xs text-text-tertiary mb-4">
                            {total} users found · <span className="text-accent-brown">Click any row</span> to open full profile
                        </p>

                        {users.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-text-secondary">No users found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-primary">
                                            <th className="text-left py-3 px-3 font-semibold text-text-secondary">User</th>
                                            <th className="text-left py-3 px-3 font-semibold text-text-secondary">Role</th>
                                            <th className="text-left py-3 px-3 font-semibold text-text-secondary">
                                                Status <span className="font-normal text-text-tertiary">(click)</span>
                                            </th>
                                            <th className="text-left py-3 px-3 font-semibold text-text-secondary">Joined</th>
                                            <th className="text-center py-3 px-3 font-semibold text-text-secondary whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user._id}
                                                className="border-b border-border-primary last:border-0 hover:bg-background-secondary transition-colors group">
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-accent-brown/10 flex items-center justify-center text-accent-brown font-semibold text-sm flex-shrink-0 group-hover:ring-2 group-hover:ring-accent-brown/30 transition-all">
                                                            {user.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-text-primary group-hover:text-accent-brown transition-colors">{user.name}</p>
                                                            <p className="text-xs text-text-tertiary">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                                                    <Badge variant={roleBadgeVariant(user.role)} size="sm">{user.role}</Badge>
                                                </td>
                                                <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                                                    <VerificationWidget
                                                        user={user}
                                                        onStatusChange={handleTableStatusChange}
                                                        loading={actionLoading === user._id}
                                                    />
                                                </td>
                                                <td className="py-3 px-3 text-xs text-text-secondary">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="!text-accent-brown hover:!bg-accent-brown/10 ring-1 ring-accent-brown/30"
                                                        onClick={() => setDrawerUserId(user._id)}
                                                    >
                                                        Profile
                                                    </Button>
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

            {/* Profile Drawer */}
            <AnimatePresence>
                {drawerUserId && (
                    <ProfileDrawer
                        key={drawerUserId}
                        userId={drawerUserId}
                        onClose={() => setDrawerUserId(null)}
                        onDelete={handleDelete}
                        onPromote={handlePromote}
                        onStatusChange={handleStatusChange}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Users;
