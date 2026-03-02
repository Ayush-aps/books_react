/**
 * Moderator — Verified Library Page
 * Tabbed view: Approved Books + Approved Users with search & pagination
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

const Library = () => {
    const [tab, setTab] = useState('books');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [books, setBooks] = useState([]);
    const [users, setUsers] = useState([]);
    const [booksTotal, setBooksTotal] = useState(0);
    const [usersTotal, setUsersTotal] = useState(0);
    const LIMIT = 12;

    const fetchBooks = useCallback(async (p = 1, q = '') => {
        try {
            setLoading(true);
            const res = await moderatorAPI.getApprovedBooks({ page: p, limit: LIMIT, search: q });
            setBooks(res.data?.data?.books || []);
            setBooksTotal(res.data?.data?.pagination?.totalBooks || 0);
            setError(null);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    const fetchUsers = useCallback(async (p = 1, q = '') => {
        try {
            setLoading(true);
            const res = await moderatorAPI.getApprovedUsers({ page: p, limit: LIMIT, search: q });
            setUsers(res.data?.data?.users || []);
            setUsersTotal(res.data?.data?.pagination?.totalUsers || 0);
            setError(null);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        setSearch('');
        setPage(1);
        if (tab === 'books') fetchBooks(1, '');
        else fetchUsers(1, '');
    }, [tab]);

    const handleSearch = () => {
        setPage(1);
        if (tab === 'books') fetchBooks(1, search);
        else fetchUsers(1, search);
    };

    const handlePage = (p) => {
        setPage(p);
        if (tab === 'books') fetchBooks(p, search);
        else fetchUsers(p, search);
    };

    const total = tab === 'books' ? booksTotal : usersTotal;
    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="container-custom py-10">
            <div className="mb-8">
                <h1 className="heading-1 mb-1">Verified Library</h1>
                <p className="body text-text-secondary">Browse all approved books and verified user accounts</p>
            </div>

            {error && <ErrorMessage message={error} onRetry={() => { if (tab === 'books') fetchBooks(page, search); else fetchUsers(page, search); setError(null); }} />}

            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                <Card elevated padding="lg">
                    {/* Tab toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex gap-1 p-1 bg-background-secondary rounded-xl w-fit">
                            {['books', 'users'].map(t => (
                                <button key={t} onClick={() => setTab(t)}
                                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-accent-brown text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}>
                                    Approved {t}
                                </button>
                            ))}
                        </div>
                        <Badge variant="success" size="sm">{total} approved</Badge>
                    </div>

                    {/* Search */}
                    <div className="flex gap-2 mb-6">
                        <input type="text"
                            placeholder={tab === 'books' ? 'Search by title, ISBN, or author...' : 'Search by name or email...'}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="flex-1 px-4 py-2 rounded-lg border border-border-primary bg-background-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-brown text-sm"
                        />
                        <Button size="sm" variant="primary" onClick={handleSearch}>Search</Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16"><LoadingSpinner size="md" /></div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {tab === 'books' && (
                                <motion.div key="books" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                                    {books.length === 0 ? (
                                        <p className="text-center py-12 text-text-secondary">No approved books found.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border-primary">
                                                        {['Book', 'ISBN', 'Seller', 'Reviewed By', 'Date', 'Status'].map(h => (
                                                            <th key={h} className={`${h === 'Status' ? 'text-center' : 'text-left'} py-3 px-3 font-semibold text-text-secondary`}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {books.map(b => (
                                                        <tr key={b._id} className="border-b border-border-primary last:border-0 hover:bg-background-secondary">
                                                            <td className="py-3 px-3"><p className="font-medium">{b.title}</p><p className="text-xs text-text-tertiary">{b.author}</p></td>
                                                            <td className="py-3 px-3 font-mono text-xs text-text-secondary">{b.isbn}</td>
                                                            <td className="py-3 px-3 text-xs text-text-secondary">{b.seller?.name || '—'}</td>
                                                            <td className="py-3 px-3 text-xs text-text-secondary">{b.reviewedBy?.name || 'System'}</td>
                                                            <td className="py-3 px-3 text-xs text-text-secondary">{b.approvalDate ? new Date(b.approvalDate).toLocaleDateString() : '—'}</td>
                                                            <td className="py-3 px-3 text-center"><Badge variant="success" size="sm">Approved</Badge></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {tab === 'users' && (
                                <motion.div key="users" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                                    {users.length === 0 ? (
                                        <p className="text-center py-12 text-text-secondary">No approved users found.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border-primary">
                                                        {['User', 'Role', 'Managed By', 'Joined', 'Status'].map(h => (
                                                            <th key={h} className={`${h === 'Status' ? 'text-center' : 'text-left'} py-3 px-3 font-semibold text-text-secondary`}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {users.map(u => (
                                                        <tr key={u._id} className="border-b border-border-primary last:border-0 hover:bg-background-secondary">
                                                            <td className="py-3 px-3"><p className="font-medium">{u.name}</p><p className="text-xs text-text-tertiary">{u.email}</p></td>
                                                            <td className="py-3 px-3"><Badge variant={u.role === 'seller' ? 'warning' : 'info'} size="sm">{u.role}</Badge></td>
                                                            <td className="py-3 px-3 text-xs text-text-secondary">{u.managedBy?.name || 'System'}</td>
                                                            <td className="py-3 px-3 text-xs text-text-secondary">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                            <td className="py-3 px-3 text-center"><Badge variant="success" size="sm">Verified</Badge></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && !loading && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-primary">
                            <p className="text-sm text-text-tertiary">Page {page} of {totalPages} ({total} total)</p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => handlePage(page - 1)}>Previous</Button>
                                <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => handlePage(page + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </motion.div>
        </div>
    );
};

export default Library;
