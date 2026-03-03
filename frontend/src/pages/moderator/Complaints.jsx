/**
 * Moderator Complaints Page
 * View and manage user complaints for staff
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { employeeAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const Complaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalComplaints, setTotalComplaints] = useState(0);

    const fetchComplaints = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 10,
                status: statusFilter !== 'all' ? statusFilter : undefined
            };
            const response = await employeeAPI.getComplaints(params);
            setComplaints(response.data?.data?.complaints || []);
            setTotalPages(response.data?.data?.pagination?.totalPages || 1);
            setTotalComplaints(response.data?.data?.pagination?.totalComplaints || 0);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load complaints');
        } finally {
            setLoading(false);
        }
    }, [currentPage, statusFilter]);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    const getStatusBadge = (status) => {
        const variants = {
            open: 'warning',
            pending: 'warning',
            'in-progress': 'info',
            resolved: 'success',
            escalated: 'error'
        };
        return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            urgent: 'text-red-500 bg-red-500/10',
            high: 'text-orange-500 bg-orange-500/10',
            medium: 'text-yellow-500 bg-yellow-500/10',
            low: 'text-green-500 bg-green-500/10'
        };
        return colors[priority] || 'text-text-tertiary bg-background-tertiary';
    };

    const filterTabs = [
        { value: 'all', label: 'All Open' },
        { value: 'pending', label: 'Pending' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'escalated', label: 'Escalated' }
    ];

    if (loading && complaints.length === 0) {
        return (
            <div className="flex items-center justify-center py-32">
                <LoadingSpinner size="lg" message="Loading support tickets..." />
            </div>
        );
    }

    return (
        <div className="container-custom py-10 space-y-8">
            {/* Header */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                <h1 className="heading-1 mb-1">Support Tickets</h1>
                <p className="body text-text-secondary">Manage and resolve user complaints and platform issues</p>
            </motion.div>

            {error && <ErrorMessage message={error} onRetry={fetchComplaints} />}

            {/* Filters */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex gap-2 p-1 bg-background-secondary rounded-xl w-fit overflow-x-auto scrollbar-hide">
                {filterTabs.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => { setStatusFilter(tab.value); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${statusFilter === tab.value
                                ? 'bg-accent-brown text-white shadow-md'
                                : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </motion.div>

            {/* Complaints List */}
            {complaints.length === 0 ? (
                <Card elevated padding="lg" className="text-center py-20">
                    <p className="text-text-secondary">No tickets found for this status.</p>
                </Card>
            ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
                    <AnimatePresence mode='popLayout'>
                        {complaints.map(complaint => (
                            <motion.div key={complaint._id} variants={staggerItem} layout>
                                <Card elevated padding="0" className="overflow-hidden hover:border-accent-brown/30 transition-colors">
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-lg font-bold text-text-primary">{complaint.subject}</h3>
                                                    {getStatusBadge(complaint.status)}
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(complaint.priority)}`}>
                                                        {complaint.priority}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-text-tertiary">
                                                    Submitted by <span className="text-text-secondary font-medium">{complaint.user?.name}</span> ({complaint.user?.role})
                                                    • {new Date(complaint.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm">Details</Button>
                                                <Button variant="primary" size="sm">Resolve</Button>
                                            </div>
                                        </div>

                                        <p className="text-sm text-text-secondary line-clamp-2 mb-4 bg-background-secondary p-3 rounded-lg border border-border-primary">
                                            {complaint.description}
                                        </p>

                                        <div className="flex items-center gap-6 text-xs text-text-tertiary">
                                            {complaint.order && (
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-brown"></span>
                                                    Order #{complaint.order.orderNumber || complaint.order._id?.slice(-8)}
                                                </span>
                                            )}
                                            {complaint.assignedTo && (
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
                                                    Assigned to: {complaint.assignedTo.name}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                </svg>
                                                {complaint.comments?.length || 0} Comments
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center pt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
};

export default Complaints;
