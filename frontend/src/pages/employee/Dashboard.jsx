/**
 * Employee Dashboard
 * Book approval queue, complaint ticket center, and quick stats
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { employeeAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { staggerContainer, staggerItem, fadeInUp } from '../../utils/animations';

const Dashboard = () => {
    // Book state
    const [pendingBooks, setPendingBooks] = useState([]);
    const [booksLoading, setBooksLoading] = useState(true);

    // Complaint state
    const [openTickets, setOpenTickets] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('open');

    // Quick stats
    const [booksReviewedToday, setBooksReviewedToday] = useState(0);
    const [ticketsResolvedToday, setTicketsResolvedToday] = useState(0);

    // UI state
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [resolveModal, setResolveModal] = useState({ open: false, complaintId: null });
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [resolutionAction, setResolutionAction] = useState('other');
    const [rejectModal, setRejectModal] = useState({ open: false, bookId: null });
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchBooks = useCallback(async () => {
        try {
            setBooksLoading(true);
            const res = await employeeAPI.getPendingBooks({ limit: 50 });
            setPendingBooks(res.data?.data?.books || []);
        } catch (err) {
            setError(err.message || 'Failed to load pending books');
        } finally {
            setBooksLoading(false);
        }
    }, []);

    const fetchTickets = useCallback(async () => {
        try {
            setTicketsLoading(true);
            const [openRes, myRes] = await Promise.all([
                employeeAPI.getComplaints({ limit: 50 }),
                employeeAPI.getComplaints({ myTickets: 'true', limit: 50 }),
            ]);
            setOpenTickets(openRes.data?.data?.complaints || []);
            setMyTickets(myRes.data?.data?.complaints || []);
        } catch (err) {
            setError(err.message || 'Failed to load tickets');
        } finally {
            setTicketsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBooks();
        fetchTickets();
    }, [fetchBooks, fetchTickets]);

    // ---- Book Actions ----
    const handleApproveBook = async (bookId) => {
        try {
            setActionLoading(bookId);
            await employeeAPI.reviewBook({ bookId, action: 'approve' });
            setPendingBooks(prev => prev.filter(b => b._id !== bookId));
            setBooksReviewedToday(prev => prev + 1);
        } catch (err) {
            setError(err.message || 'Failed to approve book');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectBook = async () => {
        const { bookId } = rejectModal;
        if (!rejectionReason.trim()) return;
        try {
            setActionLoading(bookId);
            await employeeAPI.reviewBook({ bookId, action: 'reject', rejectionReason });
            setPendingBooks(prev => prev.filter(b => b._id !== bookId));
            setBooksReviewedToday(prev => prev + 1);
            setRejectModal({ open: false, bookId: null });
            setRejectionReason('');
        } catch (err) {
            setError(err.message || 'Failed to reject book');
        } finally {
            setActionLoading(null);
        }
    };

    // ---- Ticket Actions ----
    const handleClaimTicket = async (complaintId) => {
        try {
            setActionLoading(complaintId);
            await employeeAPI.claimComplaint(complaintId);
            // Refresh both lists
            await fetchTickets();
        } catch (err) {
            setError(err.message || 'Failed to claim ticket');
        } finally {
            setActionLoading(null);
        }
    };

    const handleResolveTicket = async () => {
        const { complaintId } = resolveModal;
        if (!resolutionNotes.trim()) return;
        try {
            setActionLoading(complaintId);
            await employeeAPI.resolveComplaint({
                complaintId,
                resolutionNotes,
                resolutionAction,
            });
            setTicketsResolvedToday(prev => prev + 1);
            setResolveModal({ open: false, complaintId: null });
            setResolutionNotes('');
            setResolutionAction('other');
            await fetchTickets();
        } catch (err) {
            setError(err.message || 'Failed to resolve ticket');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEscalateTicket = async (complaintId) => {
        try {
            setActionLoading(complaintId);
            await employeeAPI.escalateComplaint({ complaintId, escalationReason: 'Requires admin attention' });
            await fetchTickets();
        } catch (err) {
            setError(err.message || 'Failed to escalate ticket');
        } finally {
            setActionLoading(null);
        }
    };

    const isLoading = booksLoading && ticketsLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-primary flex items-center justify-center">
                <LoadingSpinner size="lg" message="Loading dashboard..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-primary py-12">
            <div className="container-custom">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <h1 className="heading-1 mb-3">Employee Dashboard</h1>
                    <p className="body-xl text-text-secondary">Book approvals, complaint tickets & daily stats</p>
                </motion.div>

                {/* Error banner */}
                {error && (
                    <div className="mb-8">
                        <ErrorMessage message={error} onRetry={() => { fetchBooks(); fetchTickets(); setError(null); }} />
                    </div>
                )}

                {/* Quick Stats */}
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <motion.div variants={staggerItem}>
                        <Card elevated padding="lg" className="h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-green/10 text-accent-green">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-1">Books Reviewed Today</p>
                            <h3 className="heading-2">{booksReviewedToday}</h3>
                        </Card>
                    </motion.div>

                    <motion.div variants={staggerItem}>
                        <Card elevated padding="lg" className="h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-success/10 text-success">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-1">Tickets Resolved Today</p>
                            <h3 className="heading-2">{ticketsResolvedToday}</h3>
                        </Card>
                    </motion.div>

                    <motion.div variants={staggerItem}>
                        <Card elevated padding="lg" className="h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-warning/10 text-warning">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-1">Pending Books</p>
                            <h3 className="heading-2">{pendingBooks.length}</h3>
                        </Card>
                    </motion.div>

                    <motion.div variants={staggerItem}>
                        <Card elevated padding="lg" className="h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-info/10 text-info">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-1">Open Tickets</p>
                            <h3 className="heading-2">{openTickets.length}</h3>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* Book Approval Queue */}
                <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-12">
                    <Card elevated padding="lg">
                        <h2 className="heading-3 mb-6">Book Approval Queue</h2>
                        {pendingBooks.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-text-secondary">No books pending review!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {pendingBooks.map(book => (
                                    <motion.div key={book._id} layout className="p-4 bg-background-secondary rounded-lg border border-border-primary hover:border-accent-brown/30 transition-colors">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-12 h-16 bg-accent-brown/10 rounded flex items-center justify-center flex-shrink-0">
                                                <svg className="w-6 h-6 text-accent-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-medium text-text-primary truncate">{book.title}</h4>
                                                <p className="text-xs text-text-tertiary truncate">by {book.author}</p>
                                                <p className="text-xs text-text-tertiary mt-1">ISBN: {book.isbn}</p>
                                                {book.seller && (
                                                    <p className="text-xs text-text-tertiary mt-1">Seller: {book.seller.name}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="success"
                                                fullWidth
                                                onClick={() => handleApproveBook(book._id)}
                                                disabled={actionLoading === book._id}
                                            >
                                                {actionLoading === book._id ? '...' : 'Approve'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="error"
                                                fullWidth
                                                onClick={() => setRejectModal({ open: true, bookId: book._id })}
                                                disabled={actionLoading === book._id}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </Card>
                </motion.div>

                {/* Complaint Ticket Center */}
                <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
                    <Card elevated padding="lg">
                        <h2 className="heading-3 mb-6">Complaint Ticket Center</h2>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-6 p-1 bg-background-secondary rounded-lg w-fit">
                            <button
                                onClick={() => setActiveTab('open')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'open'
                                        ? 'bg-accent-brown text-white shadow-sm'
                                        : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                Open Tickets
                                {openTickets.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                                        {openTickets.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('my')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'my'
                                        ? 'bg-accent-brown text-white shadow-sm'
                                        : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                My Tickets
                                {myTickets.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                                        {myTickets.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'open' && (
                                <motion.div key="open" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    {openTickets.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-text-secondary">No open tickets available.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                            {openTickets.map(ticket => (
                                                <div key={ticket._id} className="flex items-center justify-between p-4 bg-background-secondary rounded-lg border border-border-primary">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-medium text-text-primary truncate">{ticket.subject}</h4>
                                                            <Badge
                                                                variant={ticket.priority === 'urgent' ? 'error' : ticket.priority === 'high' ? 'warning' : 'info'}
                                                                size="sm"
                                                            >
                                                                {ticket.priority}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-text-tertiary truncate">{ticket.description}</p>
                                                        <p className="text-xs text-text-tertiary mt-1">
                                                            From: {ticket.user?.name || 'Unknown'} • {ticket.category}
                                                        </p>
                                                    </div>
                                                    <div className="flex-shrink-0 ml-4">
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => handleClaimTicket(ticket._id)}
                                                            disabled={actionLoading === ticket._id}
                                                        >
                                                            {actionLoading === ticket._id ? '...' : 'Claim'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'my' && (
                                <motion.div key="my" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    {myTickets.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-text-secondary">No tickets assigned to you yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                            {myTickets.map(ticket => (
                                                <div key={ticket._id} className="flex items-center justify-between p-4 bg-background-secondary rounded-lg border border-border-primary">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-medium text-text-primary truncate">{ticket.subject}</h4>
                                                            <Badge
                                                                variant={
                                                                    ticket.status === 'resolved' ? 'success' :
                                                                        ticket.status === 'escalated' ? 'error' :
                                                                            ticket.status === 'in-progress' ? 'warning' : 'info'
                                                                }
                                                                size="sm"
                                                            >
                                                                {ticket.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-text-tertiary truncate">{ticket.description}</p>
                                                        <p className="text-xs text-text-tertiary mt-1">
                                                            From: {ticket.user?.name || 'Unknown'} • {ticket.category}
                                                        </p>
                                                    </div>
                                                    {ticket.status !== 'resolved' && ticket.status !== 'escalated' && (
                                                        <div className="flex gap-2 flex-shrink-0 ml-4">
                                                            <Button
                                                                size="sm"
                                                                variant="success"
                                                                onClick={() => setResolveModal({ open: true, complaintId: ticket._id })}
                                                                disabled={actionLoading === ticket._id}
                                                            >
                                                                Resolve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="error"
                                                                onClick={() => handleEscalateTicket(ticket._id)}
                                                                disabled={actionLoading === ticket._id}
                                                            >
                                                                {actionLoading === ticket._id ? '...' : 'Escalate'}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                </motion.div>

                {/* Resolve Ticket Modal */}
                <Modal
                    isOpen={resolveModal.open}
                    onClose={() => { setResolveModal({ open: false, complaintId: null }); setResolutionNotes(''); }}
                    title="Resolve Complaint"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">Resolution Action</label>
                            <select
                                value={resolutionAction}
                                onChange={(e) => setResolutionAction(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border-primary bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-brown"
                            >
                                <option value="refund_issued">Refund Issued</option>
                                <option value="replacement_sent">Replacement Sent</option>
                                <option value="compensation_provided">Compensation Provided</option>
                                <option value="policy_clarified">Policy Clarified</option>
                                <option value="no_action">No Action Needed</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">Resolution Notes *</label>
                            <textarea
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                rows={4}
                                placeholder="Describe how the complaint was resolved..."
                                className="w-full px-3 py-2 rounded-lg border border-border-primary bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-brown resize-none"
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => { setResolveModal({ open: false, complaintId: null }); setResolutionNotes(''); }}>
                                Cancel
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleResolveTicket}
                                disabled={!resolutionNotes.trim() || actionLoading === resolveModal.complaintId}
                            >
                                {actionLoading === resolveModal.complaintId ? 'Resolving...' : 'Resolve'}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Reject Book Modal */}
                <Modal
                    isOpen={rejectModal.open}
                    onClose={() => { setRejectModal({ open: false, bookId: null }); setRejectionReason(''); }}
                    title="Reject Book"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">Rejection Reason *</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                placeholder="Explain why this book is being rejected..."
                                className="w-full px-3 py-2 rounded-lg border border-border-primary bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-brown resize-none"
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={() => { setRejectModal({ open: false, bookId: null }); setRejectionReason(''); }}>
                                Cancel
                            </Button>
                            <Button
                                variant="error"
                                onClick={handleRejectBook}
                                disabled={!rejectionReason.trim() || actionLoading === rejectModal.bookId}
                            >
                                {actionLoading === rejectModal.bookId ? 'Rejecting...' : 'Reject Book'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default Dashboard;
