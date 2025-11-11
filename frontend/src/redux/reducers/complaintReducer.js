/**
 * Complaint Reducer
 * Manages complaints submitted by users
 */

import {
  CREATE_COMPLAINT_REQUEST,
  CREATE_COMPLAINT_SUCCESS,
  CREATE_COMPLAINT_FAILURE,
  FETCH_COMPLAINTS_REQUEST,
  FETCH_COMPLAINTS_SUCCESS,
  FETCH_COMPLAINTS_FAILURE,
  FETCH_COMPLAINT_DETAILS_REQUEST,
  FETCH_COMPLAINT_DETAILS_SUCCESS,
  FETCH_COMPLAINT_DETAILS_FAILURE
} from '../actions/complaintActions';

const initialState = {
  complaints: [],
  currentComplaint: null,
  loading: false,
  error: null
};

const complaintReducer = (state = initialState, action) => {
  switch (action.type) {
    // Create Complaint
    case CREATE_COMPLAINT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case CREATE_COMPLAINT_SUCCESS:
      return {
        ...state,
        loading: false,
        complaints: [action.payload, ...state.complaints]
      };
    case CREATE_COMPLAINT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Fetch Complaints
    case FETCH_COMPLAINTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_COMPLAINTS_SUCCESS:
      return {
        ...state,
        loading: false,
        complaints: action.payload
      };
    case FETCH_COMPLAINTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Fetch Complaint Details
    case FETCH_COMPLAINT_DETAILS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_COMPLAINT_DETAILS_SUCCESS:
      return {
        ...state,
        loading: false,
        currentComplaint: action.payload
      };
    case FETCH_COMPLAINT_DETAILS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    default:
      return state;
  }
};

export default complaintReducer;
