/**
 * Admin Complaint Details Page
 * Full complaint management interface with status updates, comments, and resolution
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { complaintCommentSchema, complaintResolutionSchema } from '../../schemas/allFormSchemas';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import SuccessToast from '../../components/SuccessToast';
import { fadeInUp } from '../../utils/animations';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Status update state
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [assignedAdmin, setAssignedAdmin] = useState('');
  const [admins, setAdmins] = useState([]);

  // Resolution state
  const [showResolutionForm, setShowResolutionForm] = useState(false);

  // React Hook Form for comment
  const { register: registerComment, handleSubmit: handleSubmitComment, formState: { errors: commentErrors }, reset: resetComment } = useForm({
    resolver: zodResolver(complaintCommentSchema),
    defaultValues: { message: '' }
  });

  // React Hook Form for resolution
  const { register: registerResolution, handleSubmit: handleSubmitResolution, formState: { errors: resolutionErrors }, reset: resetResolution } = useForm({
    resolver: zodResolver(complaintResolutionSchema),
    defaultValues: { action: '', details: '' }
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchComplaintDetails();
    fetchAdmins();
  }, [id]);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/complaints/${id}`);
      const complaintData = response.data.data.complaint;
      setComplaint(complaintData);
      setNewStatus(complaintData.status);
      setNewPriority(complaintData.priority);
      setAssignedAdmin(complaintData.assignedTo?._id || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/admin/users?role=admin');
      setAdmins(response.data.data?.users || []);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setSubmitting(true);
      const updateData = {
        status: newStatus,
        priority: newPriority
      };
      if (assignedAdmin) {
        updateData.assignedTo = assignedAdmin;
      }

      const response = await api.patch(`/admin/complaints/${id}/status`, updateData);
      setComplaint(response.data.data.complaint);
      setToastMessage('Status updated successfully');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      setToastMessage(err.response?.data?.message || 'Failed to update status');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (data) => {
    try {
      setSubmitting(true);
      const response = await api.post(`/admin/complaints/${id}/comment`, {
        message: data.message
      });

      setComplaint(response.data.data.complaint);
      resetComment();
      setToastMessage('Comment added successfully');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      setToastMessage(err.response?.data?.message || 'Failed to add comment');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (data) => {
    try {
      setSubmitting(true);
      const response = await api.post(`/admin/complaints/${id}/resolve`, {
        action: data.action,
        details: data.details
      });

      setComplaint(response.data.data.complaint);
      setNewStatus(response.data.data.complaint.status);
      setShowResolutionForm(false);
      resetResolution();
      setToastMessage('Complaint resolved successfully');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      setToastMessage(err.response?.data?.message || 'Failed to resolve complaint');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading complaint details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage message={error} onRetry={fetchComplaintDetails} />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <Card.Body>
            <p className="text-center text-charcoal">Complaint not found</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-6">
          <button 
            onClick={() => navigate('/admin/complaints')}
            className="text-charcoal text-xs sm:text-sm rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none hover:shadow-md whitespace-nowrap inline-flex items-center border-none"
            style={{ 
              backgroundColor: 'transparent',
              padding: '0.625rem 1.5rem',
              border: 'none',
              lineHeight: '1.5',
              height: '50px',
              fontWeight: '500',
              outline: 'none'
            }}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Complaints
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Header */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <Card.Body>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h1 className="heading-3 text-charcoal">{complaint.subject}</h1>
                        {getStatusBadge(complaint.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal/60">
                        <span className={`px-3 py-1 rounded-full font-semibold uppercase text-xs ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority} Priority
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {complaint.user?.name}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Filed {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Related Information */}
                  {(complaint.order || complaint.book) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border-light">
                      {complaint.order && (
                        <Link 
                          to={`/admin/orders/${complaint.order._id}`}
                          className="flex items-center gap-3 p-3 bg-cream rounded-lg hover:bg-cream/80 transition-colors cursor-pointer group"
                        >
                          <div className="w-10 h-10 bg-brown/10 rounded-lg flex items-center justify-center group-hover:bg-brown/20 transition-colors">
                            <svg className="w-5 h-5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-charcoal/60">Related Order</p>
                            <p className="body-sm font-semibold text-charcoal">
                              #{complaint.order._id?.slice(-8)} - ₹{complaint.order.totalAmount?.toFixed(2)}
                            </p>
                            {complaint.order.items && complaint.order.items.length > 0 && (
                              <p className="text-xs text-charcoal/50 mt-1">
                                Seller: {(() => {
                                  const sellers = complaint.order.items
                                    .map(item => item.seller?.name)
                                    .filter((name, index, self) => name && self.indexOf(name) === index);
                                  return sellers.length > 0 ? sellers.join(', ') : 'N/A';
                                })()}
                              </p>
                            )}
                          </div>
                          <svg className="w-5 h-5 text-charcoal/40 group-hover:text-brown transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                      {complaint.book && (
                        <div className="flex items-center gap-3 p-3 bg-cream rounded-lg">
                          <div className="w-10 h-10 bg-brown/10 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-charcoal/60">Related Book</p>
                            <p className="body-sm font-semibold text-charcoal">{complaint.book.title}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>

            {/* Complaint Description */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <Card.Header className="bg-brown">
                  <h2 className="heading-5 text-white font-serif">Description</h2>
                </Card.Header>
                <Card.Body>
                  <p className="body text-charcoal whitespace-pre-wrap">{complaint.description}</p>
                </Card.Body>
              </Card>
            </motion.div>

            {/* Resolution Details */}
            {complaint.resolution && complaint.resolution.action && (
              <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                <Card className="border-l-4 border-green-500">
                  <Card.Header className="bg-brown">
                    <h2 className="heading-5 text-white font-serif">Resolution</h2>
                  </Card.Header>
                  <Card.Body>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-green-900">Action Taken:</p>
                        <p className="body text-green-800">{complaint.resolution.action.replace(/_/g, ' ').toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900">Details:</p>
                        <p className="body text-green-800 whitespace-pre-wrap">{complaint.resolution.details}</p>
                      </div>
                      <div className="text-sm text-green-700">
                        Resolved on {new Date(complaint.resolution.resolvedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {complaint.resolution.resolvedBy && ` by ${complaint.resolution.resolvedBy.name}`}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            )}

            {/* Comments Thread */}
            {complaint.comments && complaint.comments.length > 0 && (
              <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                <Card>
                  <Card.Header className="bg-brown">
                    <h2 className="heading-5 text-white font-serif">
                      Communication Thread ({complaint.comments.length})
                    </h2>
                  </Card.Header>
                  <Card.Body>
                    <div className="space-y-4">
                      {complaint.comments.map((comment, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg ${comment.userRole === 'admin'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 border border-gray-200'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-charcoal">
                                {comment.user?.name || 'Unknown User'}
                              </span>
                              <Badge variant={comment.userRole === 'admin' ? 'info' : 'secondary'}>
                                {comment.userRole}
                              </Badge>
                            </div>
                            <span className="text-xs text-charcoal/60">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="body-sm text-charcoal whitespace-pre-wrap">{comment.message}</p>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            )}

            {/* Add Comment Form */}
            {complaint.status !== 'closed' && (
              <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                <Card>
                  <Card.Header className="bg-brown">
                    <h2 className="heading-5 text-white font-serif">Add Comment</h2>
                  </Card.Header>
                  <Card.Body>
                    <form onSubmit={handleSubmitComment(handleAddComment)}>
                      <textarea
                        {...registerComment('message')}
                        rows="4"
                        className="form-control resize-none mb-4"
                        placeholder="Add a comment or update..."
                        disabled={submitting}
                      />
                      {commentErrors.message && (
                        <p className="text-red-600 text-sm mb-2">{commentErrors.message.message}</p>
                      )}
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={submitting}
                          isLoading={submitting}
                        >
                          {submitting ? 'Posting...' : 'Post Comment'}
                        </Button>
                      </div>
                    </form>
                  </Card.Body>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Management Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Management */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <Card.Header className="bg-brown">
                  <h2 className="heading-6 text-white font-serif">Manage Complaint</h2>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    {/* Status */}
                    <div>
                      <label className="form-label">Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="form-control"
                        disabled={submitting}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="form-label">Priority</label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                        className="form-control"
                        disabled={submitting}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    {/* Assign Admin */}
                    <div>
                      <label className="form-label">Assign To</label>
                      <select
                        value={assignedAdmin}
                        onChange={(e) => setAssignedAdmin(e.target.value)}
                        className="form-control"
                        disabled={submitting}
                      >
                        <option value="">Unassigned</option>
                        {admins.map(admin => (
                          <option key={admin._id} value={admin._id}>
                            {admin.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleUpdateStatus}
                      disabled={submitting || (newStatus === complaint.status && newPriority === complaint.priority && assignedAdmin === (complaint.assignedTo?._id || ''))}
                      isLoading={submitting}
                      className="w-full"
                    >
                      Update Status
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>

            {/* Resolution Form */}
            {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
              <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                <Card>
                  <Card.Header className="bg-brown">
                    <h2 className="heading-6 text-white font-serif">Resolve Complaint</h2>
                  </Card.Header>
                  <Card.Body>
                    {!showResolutionForm ? (
                      <button
                        onClick={() => setShowResolutionForm(true)}
                        className="text-white text-base rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none shadow-sm hover:shadow-md whitespace-nowrap inline-flex items-center w-full justify-center"
                        style={{ 
                          backgroundColor: '#5A7C5D',
                          padding: '0.625rem 1.5rem',
                          border: '1px solid transparent',
                          lineHeight: '1.5',
                          height: '50px',
                          fontWeight: '500'
                        }}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Resolve This Complaint
                      </button>
                    ) : (
                      <form onSubmit={handleSubmitResolution(handleResolve)} className="space-y-4">
                        <div>
                          <label className="form-label">Resolution Action</label>
                          <select
                            {...registerResolution('action')}
                            className="form-control"
                          >
                            <option value="">Select action...</option>
                            <option value="refund_issued">Refund Issued</option>
                            <option value="replacement_sent">Replacement Sent</option>
                            <option value="compensation_provided">Compensation Provided</option>
                            <option value="policy_clarified">Policy Clarified</option>
                            <option value="no_action">No Action Required</option>
                            <option value="other">Other</option>
                          </select>
                          {resolutionErrors.action && (
                            <p className="text-red-600 text-sm mt-1">{resolutionErrors.action.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="form-label">Resolution Details</label>
                          <textarea
                            {...registerResolution('details')}
                            rows="4"
                            className="form-control resize-none"
                            placeholder="Provide details about the resolution..."
                          />
                          {resolutionErrors.details && (
                            <p className="text-red-600 text-sm mt-1">{resolutionErrors.details.message}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowResolutionForm(false);
                              resetResolution();
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="success"
                            disabled={submitting}
                            isLoading={submitting}
                            className="flex-1"
                          >
                            Resolve
                          </Button>
                        </div>
                      </form>
                    )}
                  </Card.Body>
                </Card>
              </motion.div>
            )}

            {/* User Info */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
                <Card.Header className="bg-brown">
                  <h2 className="heading-6 text-white font-serif">User Information</h2>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-charcoal/60">Name</p>
                      <p className="font-semibold text-charcoal">{complaint.user?.name}</p>
                    </div>
                    <div>
                      <p className="text-charcoal/60">Email</p>
                      <p className="font-semibold text-charcoal">{complaint.user?.email}</p>
                    </div>
                    <div>
                      <p className="text-charcoal/60">Role</p>
                      <Badge variant="secondary">{complaint.userRole}</Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <SuccessToast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ComplaintDetails;
