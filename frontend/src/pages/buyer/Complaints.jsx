/**
 * Complaints Page (Buyer)
 * View all filed complaints and their status
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import buyerService from '../../services/buyerService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await buyerService.getComplaints();
      setComplaints(response.data?.data?.complaints || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = filter === 'all' 
    ? complaints 
    : complaints.filter(c => c.status === filter);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-warning/10 text-warning',
      'in-progress': 'bg-info/10 text-info',
      resolved: 'bg-success/10 text-success',
      closed: 'bg-text-tertiary/10 text-text-tertiary'
    };
    return colors[status] || 'bg-text-tertiary/10 text-text-tertiary';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading complaints..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">My Complaints</h1>
            <p className="text-text-secondary mt-2">Track and manage your complaints</p>
          </div>
          <Link
            to="/buyer/register-complaint"
            className="bg-accent-brown text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-brown/90 transition-colors shadow-sm"
          >
            Register New Complaint
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-primary">
          {['all', 'pending', 'in-progress', 'resolved', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                filter === status
                  ? 'border-b-2 border-accent-brown text-accent-brown'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('-', ' ')}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchComplaints} />
          </div>
        )}

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <div className="bg-background-secondary rounded-lg shadow-md p-12 text-center border border-border-primary">
            <svg
              className="mx-auto h-24 w-24 text-text-tertiary mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">
              No complaints found
            </h2>
            <p className="text-text-secondary mb-6">
              {filter === 'all' 
                ? "You haven't filed any complaints yet."
                : `No ${filter.replace('-', ' ')} complaints found.`}
            </p>
            <Link
              to="/buyer/register-complaint"
              className="inline-block bg-accent-brown text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-brown/90 transition-colors"
            >
              Register a Complaint
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <div key={complaint._id} className="bg-background-secondary rounded-lg shadow-md hover:shadow-lg transition-shadow border border-border-primary">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">
                          {complaint.subject}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(complaint.status)}`}>
                          {complaint.status.replace('-', ' ')}
                        </span>
                        {complaint.priority && (
                          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                            complaint.priority === 'urgent' ? 'bg-error/10 text-error' :
                            complaint.priority === 'high' ? 'bg-warning/10 text-warning' :
                            complaint.priority === 'medium' ? 'bg-accent-gold/10 text-accent-gold' :
                            'bg-text-tertiary/10 text-text-tertiary'
                          }`}>
                            {complaint.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mb-2">
                        Category: <span className="font-medium text-text-primary">{complaint.category}</span>
                      </p>
                      <p className="text-text-secondary line-clamp-2">{complaint.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border-primary">
                    <div className="flex items-center gap-4 text-sm text-text-tertiary">
                      <span>Filed on {formatDate(complaint.createdAt)}</span>
                      {complaint.comments && complaint.comments.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          {complaint.comments.length} comments
                        </span>
                      )}
                      {complaint.book && (
                        <span>• Book: {complaint.book.title}</span>
                      )}
                      {complaint.order && (
                        <span>• Order #{complaint.order._id?.slice(-8)}</span>
                      )}
                      {complaint.assignedTo && (
                        <span className="text-accent-brown">• Assigned to {complaint.assignedTo.name}</span>
                      )}
                    </div>
                    <Link
                      to={`/buyer/complaints/${complaint._id}`}
                      className="text-accent-brown hover:text-accent-brown/80 font-medium inline-flex items-center gap-1"
                    >
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>

                  {complaint.adminResponse && (
                    <div className="mt-4 p-4 bg-accent-green/10 rounded-lg border border-accent-green/20">
                      <p className="text-sm font-medium text-accent-green mb-1">Admin Response:</p>
                      <p className="text-sm text-text-primary">{complaint.adminResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Complaints;
