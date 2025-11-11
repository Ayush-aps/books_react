/**
 * Subscription Redux Actions
 * Handles subscription plans, checkout, and status
 */

import api from '../../services/api';

// Action Types
export const FETCH_PLANS_REQUEST = 'FETCH_PLANS_REQUEST';
export const FETCH_PLANS_SUCCESS = 'FETCH_PLANS_SUCCESS';
export const FETCH_PLANS_FAILURE = 'FETCH_PLANS_FAILURE';

export const FETCH_SUBSCRIPTION_STATUS_REQUEST = 'FETCH_SUBSCRIPTION_STATUS_REQUEST';
export const FETCH_SUBSCRIPTION_STATUS_SUCCESS = 'FETCH_SUBSCRIPTION_STATUS_SUCCESS';
export const FETCH_SUBSCRIPTION_STATUS_FAILURE = 'FETCH_SUBSCRIPTION_STATUS_FAILURE';

export const CREATE_CHECKOUT_SESSION_REQUEST = 'CREATE_CHECKOUT_SESSION_REQUEST';
export const CREATE_CHECKOUT_SESSION_SUCCESS = 'CREATE_CHECKOUT_SESSION_SUCCESS';
export const CREATE_CHECKOUT_SESSION_FAILURE = 'CREATE_CHECKOUT_SESSION_FAILURE';

export const VERIFY_SESSION_REQUEST = 'VERIFY_SESSION_REQUEST';
export const VERIFY_SESSION_SUCCESS = 'VERIFY_SESSION_SUCCESS';
export const VERIFY_SESSION_FAILURE = 'VERIFY_SESSION_FAILURE';

export const CANCEL_SUBSCRIPTION_REQUEST = 'CANCEL_SUBSCRIPTION_REQUEST';
export const CANCEL_SUBSCRIPTION_SUCCESS = 'CANCEL_SUBSCRIPTION_SUCCESS';
export const CANCEL_SUBSCRIPTION_FAILURE = 'CANCEL_SUBSCRIPTION_FAILURE';

// Fetch available subscription plans
export const fetchPlans = () => async (dispatch) => {
  dispatch({ type: FETCH_PLANS_REQUEST });
  try {
    const response = await api.get('/subscription/plans');
    dispatch({
      type: FETCH_PLANS_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_PLANS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch plans'
    });
  }
};

// Fetch current subscription status
export const fetchSubscriptionStatus = () => async (dispatch) => {
  dispatch({ type: FETCH_SUBSCRIPTION_STATUS_REQUEST });
  try {
    const response = await api.get('/subscription/status');
    dispatch({
      type: FETCH_SUBSCRIPTION_STATUS_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_SUBSCRIPTION_STATUS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch subscription status'
    });
  }
};

// Create Stripe checkout session
export const createCheckoutSession = (planId) => async (dispatch) => {
  dispatch({ type: CREATE_CHECKOUT_SESSION_REQUEST });
  try {
    const response = await api.post('/subscription/create-checkout-session', {
      planId
    });
    dispatch({
      type: CREATE_CHECKOUT_SESSION_SUCCESS,
      payload: response.data.data
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to create checkout session';
    dispatch({
      type: CREATE_CHECKOUT_SESSION_FAILURE,
      payload: message
    });
    return { success: false, message };
  }
};

// Verify Stripe session after payment
export const verifySession = (sessionId) => async (dispatch) => {
  dispatch({ type: VERIFY_SESSION_REQUEST });
  try {
    const response = await api.get(`/api/subscription/verify-session?session_id=${sessionId}`);
    dispatch({
      type: VERIFY_SESSION_SUCCESS,
      payload: response.data.data
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to verify session';
    dispatch({
      type: VERIFY_SESSION_FAILURE,
      payload: message
    });
    return { success: false, message };
  }
};

// Cancel subscription
export const cancelSubscription = () => async (dispatch) => {
  dispatch({ type: CANCEL_SUBSCRIPTION_REQUEST });
  try {
    const response = await api.post('/subscription/cancel');
    dispatch({
      type: CANCEL_SUBSCRIPTION_SUCCESS,
      payload: response.data.message
    });
    // Refresh subscription status after cancellation
    dispatch(fetchSubscriptionStatus());
    return { success: true, message: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to cancel subscription';
    dispatch({
      type: CANCEL_SUBSCRIPTION_FAILURE,
      payload: message
    });
    return { success: false, message };
  }
};
