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
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                onClick={onClose} />

            {/* Drawer */}
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-background-primary z-50 shadow-2xl flex flex-col overflow-hidden border-l border-border-primary">

                {/* Header with solid color */}
                <div className="flex items-center justify-between px-6 py-5 bg-accent-brown text-white flex-shrink-0 shadow-md">
                    <div>
                        <h2 className="text-xl font-bold">User Profile</h2>
                        <p className="text-white/80 text-xs">Full Registration Details</p>
                    </div>
                    <button onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all text-xl">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-background-primary">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <LoadingSpinner size="md" message="Loading profile..." />
                        </div>
                    ) : !profile ? (
                        <div className="p-6 text-center text-text-secondary">Profile not available.</div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Avatar + name hero */}
                            <div className="flex flex-col items-center text-center py-4">
                                {profile.avatar && !profile.avatar.includes('default-avatar') ? (
                                    <img src={profile.avatar} alt={profile.name}
                                        className="w-24 h-24 rounded-full object-cover ring-4 ring-accent-brown/20 mb-4" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-accent-brown/10 flex items-center justify-center text-accent-brown text-4xl font-bold ring-4 ring-accent-brown/20 mb-4">
                                        {profile.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <h3 className="heading-2 mb-1">{profile.name}</h3>
                                <p className="text-sm text-text-secondary mb-3">{profile.email}</p>
                                <div className="flex items-center gap-2 flex-wrap justify-center">
                                    <Badge variant={roleBadgeVariant(profile.role)} size="sm">{profile.role}</Badge>
                                    <Badge variant={statusVariant(profile.verificationStatus)} size="sm">
                                        {profile.verificationStatus || 'pending'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Info grid */}
                            <div className="bg-background-secondary rounded-2xl p-5 space-y-4">
                                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Registration Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-text-tertiary mb-0.5">Phone</p>
                                        <p className="text-sm font-medium text-text-primary">{profile.phone || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-tertiary mb-0.5">Member Since</p>
                                        <p className="text-sm font-medium text-text-primary">{fmt(profile.createdAt)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-text-tertiary mb-0.5">Email Verified</p>
                                        <p className="text-sm font-medium text-text-primary">
                                            {profile.isVerified ? '✅ Verified' : '❌ Not Verified'}
                                        </p>
                                    </div>
                                    {profile.address?.street && (<>
                                        <div className="col-span-2">
                                            <p className="text-xs text-text-tertiary mb-0.5">Address</p>
                                            <p className="text-sm font-medium text-text-primary">
                                                {[profile.address.street, profile.address.city, profile.address.state, profile.address.zipCode, profile.address.country]
                                                    .filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    </>)}
                                    {profile.managedBy && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-text-tertiary mb-0.5">Managed By</p>
                                            <p className="text-sm font-medium text-text-primary">
                                                {profile.managedBy.name} <span className="text-text-tertiary">({profile.managedBy.role})</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Verification control */}
                            <div className="bg-background-secondary rounded-2xl p-5">
                                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Verification Status</h4>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-text-primary font-medium capitalize">{profile.verificationStatus || 'pending'}</p>
                                        <p className="text-xs text-text-tertiary mt-0.5">
                                            {profile.verificationStatus === 'approved' ? 'Account is fully active'
                                                : profile.verificationStatus === 'rejected' ? 'Account access denied'
                                                    : 'Awaiting moderator review'}
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
                    <div className="px-6 py-4 border-t border-border-primary flex-shrink-0 space-y-3">
                        {profile.role === 'employee' && !confirmPromote && !confirmDelete && (
                            <Button variant="success" fullWidth disabled={!!actionLoading}
                                onClick={() => setConfirmPromote(true)}>
                                ↑ Promote to Moderator
                            </Button>
                        )}

                        {confirmPromote && (
                            <div className="p-4 rounded-xl bg-success/10 border border-success/30 space-y-3">
                                <p className="text-sm text-success font-medium">Confirm promotion?</p>
                                <p className="text-xs text-text-secondary">{profile.name} will gain Moderator dashboard access.</p>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" fullWidth onClick={() => setConfirmPromote(false)}>Cancel</Button>
                                    <Button size="sm" variant="success" fullWidth disabled={actionLoading === 'promote'} onClick={handlePromote}>
                                        {actionLoading === 'promote' ? 'Promoting...' : 'Confirm Promote'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!confirmDelete && !confirmPromote && (
                            <Button variant="error" fullWidth disabled={!!actionLoading}
                                onClick={() => setConfirmDelete(true)}>
                                Remove Account
                            </Button>
                        )}

                        {confirmDelete && (
                            <div className="p-4 rounded-xl bg-error/10 border border-error/30 space-y-3">
                                <p className="text-sm text-error font-medium">Permanently delete this account?</p>
                                <p className="text-xs text-text-secondary">This cannot be undone. All data will be lost.</p>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" fullWidth onClick={() => setConfirmDelete(false)}>Cancel</Button>
                                    <Button size="sm" variant="error" fullWidth disabled={actionLoading === 'delete'} onClick={handleDelete}>
                                        {actionLoading === 'delete' ? 'Deleting...' : 'Yes, Delete'}
                                    </Button>
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
