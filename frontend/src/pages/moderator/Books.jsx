/**
 * Moderator — Pending Books Page
 * Claim / Release locking mechanism
 */
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
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
            setActionLoading(bookId);
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
            setActionLoading(bookId);
            await moderatorAPI.releaseBook(bookId);
            setBooks(prev => prev.map(b =>
                b._id === bookId ? { ...b, lockedBy: null, lockedAt: null } : b
            ));
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to release');
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
                <p className="body text-text-secondary">Claim a book to lock it for your review — prevents duplicate work</p>
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
                                            <th className="text-center py-3 px-3 font-semibold text-text-secondary">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {books.map(book => {
                                            const lockedByMe = book.lockedBy?._id?.toString() === currentUser?._id?.toString();
                                            const lockedByOther = book.lockedBy && !lockedByMe;
                                            const isActing = actionLoading === book._id;
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
                                                    <td className="py-4 px-3 text-center">
                                                        {lockedByMe ? (
                                                            <Button size="sm" variant="ghost" disabled={isActing}
                                                                onClick={() => handleRelease(book._id)}>
                                                                {isActing ? '...' : 'Release'}
                                                            </Button>
                                                        ) : lockedByOther ? (
                                                            <span className="text-xs text-text-tertiary italic">Locked</span>
                                                        ) : (
                                                            <Button size="sm" variant="primary" disabled={isActing}
                                                                onClick={() => handleClaim(book._id)}>
                                                                {isActing ? '...' : 'Pick for Review'}
                                                            </Button>
                                                        )}
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
        </div>
    );
};

export default Books;
