/**
 * Admin Complaints Page
 * View and respond to user complaints
 */

import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import SuccessToast from '../../components/SuccessToast';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [response, setResponse] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await adminService.getComplaints();
      setComplaints(response.data?.complaints || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (complaintId) => {
    try {
      const response = await adminService.getComplaintDetails(complaintId);
      setSelectedComplaint(response.data?.complaint || response.data);
      setShowResponseModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaint details');
    }
  };

  const handleRespondToComplaint = async () => {
    if (!selectedComplaint || !response.trim()) {
      setError('Please provide a response');
      return;
    }

    try {
      setProcessing(true);
      await adminService.respondToComplaint(selectedComplaint._id, response);
      
      // Update complaint in list
      setComplaints(complaints.map(c => 
        c._id === selectedComplaint._id 
          ? { ...c, status: 'resolved', adminResponse: response } 
          : c
      ));
      
      setSuccessMessage('Response sent successfully');
      setShowSuccessToast(true);
      setShowResponseModal(false);
      setResponse('');
      setSelectedComplaint(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond to complaint');
    } finally {
      setProcessing(false);
    }
  };

  const filteredComplaints = statusFilter === 'all' 
    ? complaints 
    : complaints.filter(complaint => complaint.status === statusFilter);

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading complaints..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complaint Management</h1>
          <p className="text-gray-600 mt-2">View and respond to user complaints</p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { value: 'pending', label: 'Pending', count: complaints.filter(c => c.status === 'pending').length },
              { value: 'resolved', label: 'Resolved', count: complaints.filter(c => c.status === 'resolved').length },
              { value: 'closed', label: 'Closed', count: complaints.filter(c => c.status === 'closed').length },
              { value: 'all', label: 'All', count: complaints.length }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  statusFilter === tab.value
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                  statusFilter === tab.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {statusFilter === 'all' ? 'No complaints' : `No ${statusFilter} complaints`}
              </h3>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map(complaint => (
              <div key={complaint._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Complaint Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{complaint.subject || 'No Subject'}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(complaint.status)}`}>
                        {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <p>
                        <span className="font-medium">From:</span> {complaint.userId?.name || 'Unknown'} ({complaint.userId?.email || 'N/A'})
                      </p>
                      <p>
                        <span className="font-medium">Date:</span> {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <p className="text-gray-700 line-clamp-2">{complaint.message || complaint.description}</p>

                    {complaint.adminResponse && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Admin Response:</p>
                        <p className="text-sm text-blue-800">{complaint.adminResponse}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:w-48">
                    <button
                      onClick={() => handleViewDetails(complaint._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      View & Respond
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && selectedComplaint && (
          <Modal
            isOpen={showResponseModal}
            onClose={() => {
              setShowResponseModal(false);
              setResponse('');
              setSelectedComplaint(null);
            }}
            title="Complaint Details"
            size="lg"
          >
            <div className="p-6">
              {/* Complaint Details */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedComplaint.subject || 'No Subject'}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(selectedComplaint.status)}`}>
                    {selectedComplaint.status.charAt(0).toUpperCase() + selectedComplaint.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <p>
                    <span className="font-medium text-gray-700">From:</span>{' '}
                    <span className="text-gray-900">{selectedComplaint.userId?.name || 'Unknown'}</span>{' '}
                    ({selectedComplaint.userId?.email || 'N/A'})
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Date:</span>{' '}
                    <span className="text-gray-900">
                      {new Date(selectedComplaint.createdAt).toLocaleString()}
                    </span>
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Message:</p>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedComplaint.message || selectedComplaint.description}
                  </p>
                </div>

                {selectedComplaint.adminResponse && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">Previous Response:</p>
                    <p className="text-blue-800">{selectedComplaint.adminResponse}</p>
                  </div>
                )}
              </div>

              {/* Response Form */}
              {selectedComplaint.status !== 'closed' && (
                <div>
                  <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Response {selectedComplaint.status === 'pending' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    id="response"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Type your response here..."
                  />
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowResponseModal(false);
                        setResponse('');
                        setSelectedComplaint(null);
                      }}
                      disabled={processing}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRespondToComplaint}
                      disabled={processing || !response.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {processing ? 'Sending...' : 'Send Response'}
                    </button>
                  </div>
                </div>
              )}

              {selectedComplaint.status === 'closed' && (
                <div className="text-center py-4">
                  <p className="text-gray-500">This complaint has been closed and cannot be responded to.</p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Success Toast */}
        {showSuccessToast && (
          <SuccessToast
            message={successMessage}
            onClose={() => setShowSuccessToast(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Complaints;
