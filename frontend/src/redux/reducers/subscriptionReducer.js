/**
 * Subscription Reducer
 * Manages subscription plans and user subscription status
 */

import {
  FETCH_PLANS_REQUEST,
  FETCH_PLANS_SUCCESS,
  FETCH_PLANS_FAILURE,
  FETCH_SUBSCRIPTION_STATUS_REQUEST,
  FETCH_SUBSCRIPTION_STATUS_SUCCESS,
  FETCH_SUBSCRIPTION_STATUS_FAILURE,
  CREATE_CHECKOUT_SESSION_REQUEST,
  CREATE_CHECKOUT_SESSION_SUCCESS,
  CREATE_CHECKOUT_SESSION_FAILURE,
  VERIFY_SESSION_REQUEST,
  VERIFY_SESSION_SUCCESS,
  VERIFY_SESSION_FAILURE,
  CANCEL_SUBSCRIPTION_REQUEST,
  CANCEL_SUBSCRIPTION_SUCCESS,
  CANCEL_SUBSCRIPTION_FAILURE
} from '../actions/subscriptionActions';

const initialState = {
  plans: [],
  currentSubscription: null,
  hasSubscription: false,
  checkoutSession: null,
  loading: false,
  error: null
};

const subscriptionReducer = (state = initialState, action) => {
  switch (action.type) {
    // Fetch Plans
    case FETCH_PLANS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_PLANS_SUCCESS:
      return {
        ...state,
        loading: false,
        plans: action.payload
      };
    case FETCH_PLANS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Fetch Subscription Status
    case FETCH_SUBSCRIPTION_STATUS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_SUBSCRIPTION_STATUS_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSubscription: action.payload.subscription,
        hasSubscription: action.payload.hasSubscription
      };
    case FETCH_SUBSCRIPTION_STATUS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Create Checkout Session
    case CREATE_CHECKOUT_SESSION_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case CREATE_CHECKOUT_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        checkoutSession: action.payload
      };
    case CREATE_CHECKOUT_SESSION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Verify Session
    case VERIFY_SESSION_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case VERIFY_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSubscription: action.payload
      };
    case VERIFY_SESSION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Cancel Subscription
    case CANCEL_SUBSCRIPTION_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case CANCEL_SUBSCRIPTION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSubscription: null
      };
    case CANCEL_SUBSCRIPTION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    default:
      return state;
  }
};

export default subscriptionReducer;
