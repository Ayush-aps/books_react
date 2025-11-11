/**
 * Complaint Redux Actions
 * Handles complaint submission and viewing
 */

import api from '../../services/api';

// Action Types
export const CREATE_COMPLAINT_REQUEST = 'CREATE_COMPLAINT_REQUEST';
export const CREATE_COMPLAINT_SUCCESS = 'CREATE_COMPLAINT_SUCCESS';
export const CREATE_COMPLAINT_FAILURE = 'CREATE_COMPLAINT_FAILURE';

export const FETCH_COMPLAINTS_REQUEST = 'FETCH_COMPLAINTS_REQUEST';
export const FETCH_COMPLAINTS_SUCCESS = 'FETCH_COMPLAINTS_SUCCESS';
export const FETCH_COMPLAINTS_FAILURE = 'FETCH_COMPLAINTS_FAILURE';

export const FETCH_COMPLAINT_DETAILS_REQUEST = 'FETCH_COMPLAINT_DETAILS_REQUEST';
export const FETCH_COMPLAINT_DETAILS_SUCCESS = 'FETCH_COMPLAINT_DETAILS_SUCCESS';
export const FETCH_COMPLAINT_DETAILS_FAILURE = 'FETCH_COMPLAINT_DETAILS_FAILURE';

// Create complaint (for buyers/sellers)
export const createComplaint = (complaintData) => async (dispatch) => {
  dispatch({ type: CREATE_COMPLAINT_REQUEST });
  try {
    // Determine which endpoint to use based on user role
    // For sellers: POST /api/seller/complaints
    // For buyers: POST /api/public/contact (contact form creates complaints)
    // This action can be used for both
    const response = await api.post('/seller/complaints', complaintData);
    dispatch({
      type: CREATE_COMPLAINT_SUCCESS,
      payload: response.data.data
    });
    return { success: true, message: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to submit complaint';
    dispatch({
      type: CREATE_COMPLAINT_FAILURE,
      payload: message
    });
    return { success: false, message };
  }
};

// Fetch user's complaints (for sellers/buyers to view their own)
export const fetchComplaints = () => async (dispatch) => {
  dispatch({ type: FETCH_COMPLAINTS_REQUEST });
  try {
    const response = await api.get('/seller/complaints');
    dispatch({
      type: FETCH_COMPLAINTS_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_COMPLAINTS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch complaints'
    });
  }
};

// Fetch complaint details
export const fetchComplaintDetails = (complaintId) => async (dispatch) => {
  dispatch({ type: FETCH_COMPLAINT_DETAILS_REQUEST });
  try {
    // This would need to be implemented in the backend if viewing single complaint
    // For now, complaints are fetched as a list
    const response = await api.get(`/api/seller/complaints/${complaintId}`);
    dispatch({
      type: FETCH_COMPLAINT_DETAILS_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_COMPLAINT_DETAILS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch complaint details'
    });
  }
};
