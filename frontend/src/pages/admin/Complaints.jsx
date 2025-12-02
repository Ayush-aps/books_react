/**
 * Admin Complaints Page
 * View and manage user complaints with filters and pagination
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { fadeInUp, staggerContainer } from '../../utils/animations';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComplaints, setTotalComplaints] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchComplaints();
  }, [page, statusFilter, priorityFilter, categoryFilter, roleFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);

      const response = await api.get(`/admin/complaints?${params.toString()}`);
      const data = response.data.data;

      setComplaints(data.complaints || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalComplaints(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setRoleFilter('all');
    setPage(1);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      'in-progress': 'info',
      resolved: 'success',
      rejected: 'error',
      closed: 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'text-red-600 bg-red-50',
      high: 'text-orange-600 bg-orange-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-gray-600 bg-gray-50'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50';
  };

  const getUniqueCategories = () => {
    // Must match backend Complaint model enum
    const buyerCategories = [
      'Product Quality', 'Delivery Issue', 'Wrong Item', 'Damaged Item',
      'Missing Item', 'Seller Communication', 'Refund Issue', 'Other'
    ];
    const sellerCategories = [
      'Payment Issue', 'Platform Fee Dispute', 'Buyer Issue',
      'Technical Problem', 'Account Issue', 'Policy Violation Report'
    ];
    return [...new Set([...buyerCategories, ...sellerCategories])];
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading complaints..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="heading-2 text-charcoal mb-2">Complaint Management</h1>
              <p className="body text-charcoal/60">
                Manage and resolve user complaints ({totalComplaints} total)
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 text-white rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none shadow-sm hover:shadow-md whitespace-nowrap"
              style={{ 
                backgroundColor: '#8B7355',
                padding: '0.625rem 1.5rem',
                border: '1px solid transparent',
                lineHeight: '1.5',
                height: '42px',
                fontWeight: '500'
              }}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="flex-shrink-0">Reset Filters</span>
            </button>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-6">
            <ErrorMessage message={error} onClose={() => setError(null)} />
          </motion.div>
        )}

        {/* Filters Section */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-6">
          <Card>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="form-label text-sm">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="form-control text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="form-label text-sm">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                    className="form-control text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Role Filter */}
                <div>
                  <label className="form-label text-sm">User Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    className="form-control text-sm"
                  >
                    <option value="all">All Roles</option>
                    <option value="buyer">Buyers</option>
                    <option value="seller">Sellers</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="form-label text-sm">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="form-control text-sm"
                  >
                    <option value="all">All Categories</option>
                    {getUniqueCategories().map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Complaints List */}
        {complaints.length === 0 ? (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Card>
              <Card.Body>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-brown/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="heading-4 text-charcoal mb-2">No complaints found</h3>
                  <p className="body text-charcoal/60">
                    {statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || roleFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No complaints have been submitted yet'}
                  </p>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {complaints.map(complaint => (
                <motion.div key={complaint._id} variants={fadeInUp}>
                  <Link to={`/admin/complaints/${complaint._id}`}>
                    <Card hoverable className="transition-all hover:shadow-lg">
                      <Card.Body>
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="heading-5 text-charcoal">{complaint.subject}</h3>
                              {getStatusBadge(complaint.status)}
                              <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getPriorityColor(complaint.priority)}`}>
                                {complaint.priority}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal/60 mb-3">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {complaint.user?.name || 'Unknown'}
                                <Badge variant="secondary" className="ml-1">{complaint.userRole}</Badge>
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {complaint.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                {complaint.comments?.length || 0} comments
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(complaint.createdAt).toLocaleDateString()}
                              </span>
                              {complaint.assignedTo && (
                                <span className="text-blue-600">
                                  • Assigned to {complaint.assignedTo.name}
                                </span>
                              )}
                            </div>

                            <p className="body-sm text-charcoal/80 line-clamp-2 mb-3">
                              {complaint.description}
                            </p>

                            {complaint.order && (
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cream rounded-lg text-xs">
                                <svg className="w-4 h-4 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                Order #{complaint.order._id?.slice(-8)}
                              </div>
                            )}
                          </div>

                          <button
                            className="inline-flex items-center gap-2 text-white rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none shadow-sm hover:shadow-md whitespace-nowrap"
                            style={{ 
                              backgroundColor: '#8B7355',
                              padding: '0.5rem 1.25rem',
                              border: '1px solid transparent',
                              lineHeight: '1.5',
                              height: '36px',
                              fontWeight: '500',
                              fontSize: '0.875rem'
                            }}
                          >
                            <span className="flex-shrink-0">Manage</span>
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mt-8">
                <Card>
                  <Card.Body>
                    <div className="flex items-center justify-between">
                      <p className="body-sm text-charcoal/60">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1 || loading}
                          className="inline-flex items-center gap-2 text-white rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none shadow-sm hover:shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ 
                            backgroundColor: '#8B7355',
                            padding: '0.5rem 1.25rem',
                            border: '1px solid transparent',
                            lineHeight: '1.5',
                            height: '36px',
                            fontWeight: '500',
                            fontSize: '0.875rem'
                          }}
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span className="flex-shrink-0">Previous</span>
                        </button>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages || loading}
                          className="inline-flex items-center gap-2 text-white rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none shadow-sm hover:shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ 
                            backgroundColor: '#8B7355',
                            padding: '0.5rem 1.25rem',
                            border: '1px solid transparent',
                            lineHeight: '1.5',
                            height: '36px',
                            fontWeight: '500',
                            fontSize: '0.875rem'
                          }}
                        >
                          <span className="flex-shrink-0">Next</span>
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default Complaints;
