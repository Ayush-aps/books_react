/**
 * Auth Reducer
 */

import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE,
  LOGOUT,
  CHECK_AUTH_REQUEST,
  CHECK_AUTH_SUCCESS,
  CHECK_AUTH_FAILURE,
} from '../actions/authActions';

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  registerErrors: null,
};

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case LOGIN_REQUEST:
    case CHECK_AUTH_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case LOGIN_SUCCESS:
    case CHECK_AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };

    case CHECK_AUTH_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

    case REGISTER_REQUEST:
      return {
        ...state,
        loading: true,
        registerErrors: null,
      };

    case REGISTER_SUCCESS:
      return {
        ...state,
        loading: false,
        registerErrors: null,
      };

    case REGISTER_FAILURE:
      return {
        ...state,
        loading: false,
        registerErrors: action.payload,
      };

    case LOGOUT:
      return {
        ...initialState,
      };

    default:
      return state;
  }
}
