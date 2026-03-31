/**
 * Moderator — Pending Books Page
 * Claim / Release locking + Approve / Reject review
 */
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { moderatorAPI, employeeAPI } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { fadeInUp } from '../../utils/animations';

const LockIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const Books = () => {
    const { user: currentUser } = useSelector(state => state.auth);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [books, setBooks] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [actionLoading, setActionLoading] = useState(null);
    const LIMIT = 15;

    // Reject modal state
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectError, setRejectError] = useState(null);

    const fetchBooks = async (p = 1) => {
        try {
            setLoading(true);
            const res = await employeeAPI.getPendingBooks({ page: p, limit: LIMIT });
            const data = res.data?.data;
            setBooks(data?.books || []);
            setTotal(data?.pagination?.totalBooks || 0);
            setPage(p);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load pending books');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBooks(); }, []);

    const handleClaim = async (bookId) => {
        try {
            setActionLoading(bookId + '-claim');
            await moderatorAPI.claimBook(bookId);
            setBooks(prev => prev.map(b =>
                b._id === bookId
                    ? { ...b, lockedBy: { _id: currentUser._id, name: currentUser.name }, lockedAt: new Date() }
                    : b
            ));
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to claim');
        } finally { setActionLoading(null); }
    };

    const handleRelease = async (bookId) => {
        try {
            setActionLoading(bookId + '-release');
            await moderatorAPI.releaseBook(bookId);
            setBooks(prev => prev.map(b =>
                b._id === bookId ? { ...b, lockedBy: null, lockedAt: null } : b
            ));
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to release');
        } finally { setActionLoading(null); }
    };

    const handleApprove = async (bookId) => {
        try {
            setActionLoading(bookId + '-approve');
            await moderatorAPI.reviewBook(bookId, { action: 'approve' });
            setBooks(prev => prev.filter(b => b._id !== bookId));
            setTotal(t => t - 1);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to approve book');
        } finally { setActionLoading(null); }
    };

    const openRejectModal = (book) => {
        setRejectModal(book);
        setRejectionReason('');
        setRejectError(null);
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            setRejectError('Rejection reason is required');
            return;
        }
        try {
            setActionLoading(rejectModal._id + '-reject');
            await moderatorAPI.reviewBook(rejectModal._id, { action: 'reject', rejectionReason });
            setBooks(prev => prev.filter(b => b._id !== rejectModal._id));
            setTotal(t => t - 1);
            setRejectModal(null);
        } catch (err) {
            setRejectError(err.response?.data?.message || err.message || 'Failed to reject book');
        } finally { setActionLoading(null); }
    };

    const totalPages = Math.ceil(total / LIMIT);

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <LoadingSpinner size="lg" message="Loading pending books..." />
        </div>
    );

    return (
        <div className="container-custom py-10">
            <div className="mb-8">
                <h1 className="heading-1 mb-1">Pending Books</h1>
                <p className="body text-text-secondary">Claim a book to lock it for your review, then approve or reject it</p>
            </div>

            {error && <ErrorMessage message={error} onRetry={() => { fetchBooks(page); setError(null); }} />}

            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                <Card elevated padding="lg">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="heading-3">Review Queue</h2>
                        <Badge variant="warning" size="sm">{total} pending</Badge>
                    </div>

                    {books.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="font-medium text-text-primary mb-1">Queue is empty</p>
                            <p className="text-sm text-text-secondary">No books are awaiting review.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-primary">
                                            <th className="text-left py-3 px-3 font-semibold text-text-secondary">Book</th>
                                            <th className="text-left py-3 px-3 font-semibold text-text-secondary">Seller</th>
                                            <th className="text-left py-3 px-3 font-semibold text-text-secondary">Price</th>
                                            <th className="text-center py-3 px-3 font-semibold text-text-secondary">Lock Status</th>
                                            <th className="text-center py-3 px-3 font-semibold text-text-secondary">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {books.map(book => {
                                            const lockedByMe = book.lockedBy?._id?.toString() === currentUser?._id?.toString();
                                            const lockedByOther = book.lockedBy && !lockedByMe;
                                            const isActing = actionLoading?.startsWith(book._id);
                                            return (
                                                <tr key={book._id}
                                                    className={`border-b border-border-primary last:border-0 transition-colors ${lockedByOther ? 'opacity-60 bg-background-secondary' : 'hover:bg-background-secondary'}`}>
                                                    <td className="py-4 px-3">
                                                        <p className="font-medium text-text-primary">{book.title}</p>
                                                        <p className="text-xs text-text-tertiary">{book.author}</p>
                                                        <p className="text-xs text-text-tertiary font-mono mt-0.5">{book.isbn}</p>
                                                    </td>
                                                    <td className="py-4 px-3 text-sm text-text-secondary">{book.seller?.name || '—'}</td>
                                                    <td className="py-4 px-3 text-sm font-medium">₹{book.price}</td>
                                                    <td className="py-4 px-3 text-center">
                                                        {lockedByMe && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">
                                                                <LockIcon /> Claimed by you
                                                            </span>
                                                        )}
                                                        {lockedByOther && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning bg-warning/10 px-2.5 py-1 rounded-full">
                                                                <LockIcon /> {book.lockedBy?.name || 'Another mod'}
                                                            </span>
                                                        )}
                                                        {!book.lockedBy && (
                                                            <span className="text-xs text-text-tertiary">Available</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-3">
                                                        <div className="flex items-center justify-center gap-2 flex-wrap">
                                                            {!book.lockedBy && (
                                                                <Button size="sm" variant="primary" disabled={isActing}
                                                                    onClick={() => handleClaim(book._id)}>
                                                                    {isActing ? '...' : 'Claim'}
                                                                </Button>
                                                            )}
                                                            {lockedByMe && (
                                                                <>
                                                                    <Button size="sm" variant="success" disabled={isActing}
                                                                        onClick={() => handleApprove(book._id)}>
                                                                        {actionLoading === book._id + '-approve' ? '...' : '✓ Approve'}
                                                                    </Button>
                                                                    <Button size="sm" variant="danger" disabled={isActing}
                                                                        onClick={() => openRejectModal(book)}>
                                                                        ✕ Reject
                                                                    </Button>
                                                                    <Button size="sm" variant="ghost" disabled={isActing}
                                                                        onClick={() => handleRelease(book._id)}>
                                                                        Release
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {lockedByOther && (
                                                                <span className="text-xs text-text-tertiary italic">Locked</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-primary">
                                    <p className="text-sm text-text-tertiary">Page {page} of {totalPages} ({total} books)</p>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => fetchBooks(page - 1)}>Previous</Button>
                                        <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => fetchBooks(page + 1)}>Next</Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </motion.div>

            {/* Reject Modal */}
            <AnimatePresence>
                {rejectModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => { if (e.target === e.currentTarget) setRejectModal(null); }}
                    >
                        <motion.div
                            className="bg-background-primary border border-border-primary rounded-2xl w-full max-w-lg p-6 shadow-2xl"
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                        >
                            <h2 className="text-lg font-bold text-text-primary mb-1">Reject Book</h2>
                            <p className="text-sm text-text-secondary mb-5">
                                <span className="font-medium text-text-primary">{rejectModal.title}</span>
                                {' '}by {rejectModal.author}
                            </p>

                            {rejectError && (
                                <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2 mb-4">{rejectError}</p>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                                    Rejection Reason <span className="text-error">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Explain why this book is being rejected (visible to the seller)..."
                                    className="w-full bg-background-secondary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-error resize-none"
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button variant="ghost" size="sm" onClick={() => setRejectModal(null)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button variant="danger" size="sm" onClick={handleReject}
                                    disabled={!!actionLoading} className="flex-1">
                                    {actionLoading?.includes('-reject') ? 'Rejecting...' : 'Confirm Reject'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Books;
