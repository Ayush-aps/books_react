/**
 * Seller Complaints List Page
 * View and filter complaints raised by seller
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
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, activeFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/seller/complaints');
      setComplaints(response.data.data.complaints);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    if (activeFilter === 'all') {
      setFilteredComplaints(complaints);
    } else {
      setFilteredComplaints(
        complaints.filter((complaint) => complaint.status === activeFilter)
      );
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

  const getStatusCounts = () => {
    const counts = {
      all: complaints.length,
      pending: 0,
      'in-progress': 0,
      resolved: 0,
      closed: 0
    };

    complaints.forEach((complaint) => {
      if (counts.hasOwnProperty(complaint.status)) {
        counts[complaint.status]++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading complaints..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage message={error} onRetry={fetchComplaints} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="heading-2 text-charcoal mb-2">My Complaints</h1>
              <p className="body text-charcoal/60">
                Track and manage your platform issues
              </p>
            </div>
            <Link to="/seller/register-complaint">
              <button 
                className="text-white text-base rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none shadow-sm hover:shadow-md whitespace-nowrap inline-flex items-center"
                style={{ 
                  backgroundColor: '#8B7355',
                  padding: '0.625rem 1.5rem',
                  border: '1px solid transparent',
                  lineHeight: '1.5',
                  height: '50px',
                  fontWeight: '500'
                }}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Register New Complaint
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Card>
            <Card.Body>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      activeFilter === filter.value
                        ? 'bg-brown text-cream shadow-md'
                        : 'bg-cream text-charcoal hover:bg-brown/10'
                    }`}
                  >
                    {filter.label}
                    <span className="ml-2 text-xs opacity-75">
                      ({statusCounts[filter.value] || 0})
                    </span>
                  </button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <Card.Body>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-brown/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-brown"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="heading-4 text-charcoal mb-2">
                    No complaints found
                  </h3>
                  <p className="body text-charcoal/60 mb-6">
                    {activeFilter === 'all'
                      ? 'You haven\'t registered any complaints yet.'
                      : `No ${activeFilter} complaints at the moment.`}
                  </p>
                  {activeFilter === 'all' && (
                    <Link to="/seller/register-complaint">
                      <Button variant="primary">Register Your First Complaint</Button>
                    </Link>
                  )}
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredComplaints.map((complaint) => (
              <motion.div key={complaint._id} variants={fadeInUp}>
                <Link to={`/seller/complaints/${complaint._id}`}>
                  <Card hoverable className="transition-all hover:shadow-lg">
                    <Card.Body>
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="heading-5 text-charcoal">
                              {complaint.subject}
                            </h3>
                            {getStatusBadge(complaint.status)}
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getPriorityColor(
                                complaint.priority
                              )}`}
                            >
                              {complaint.priority}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal/60 mb-3">
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                              {complaint.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                />
                              </svg>
                              {complaint.comments?.length || 0} comments
                            </span>
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {new Date(complaint.createdAt).toLocaleDateString()}
                            </span>
                            {complaint.assignedTo && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                Assigned to {complaint.assignedTo.name}
                              </span>
                            )}
                          </div>

                          <p className="body-sm text-charcoal/80 line-clamp-2 mb-3">
                            {complaint.description}
                          </p>

                          {complaint.adminResponse && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                              <p className="text-xs font-semibold text-blue-900 mb-1">
                                Admin Response:
                              </p>
                              <p className="body-sm text-blue-800 line-clamp-2">
                                {complaint.adminResponse}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex md:flex-col gap-2">
                          <button
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
                            View Details
                            <svg
                              className="w-4 h-4 ml-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Complaints;
