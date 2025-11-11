/**
 * Auth Actions
 */

import authService from '../../services/authService';

// Action Types
export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';

export const REGISTER_REQUEST = 'REGISTER_REQUEST';
export const REGISTER_SUCCESS = 'REGISTER_SUCCESS';
export const REGISTER_FAILURE = 'REGISTER_FAILURE';

export const LOGOUT = 'LOGOUT';

export const CHECK_AUTH_REQUEST = 'CHECK_AUTH_REQUEST';
export const CHECK_AUTH_SUCCESS = 'CHECK_AUTH_SUCCESS';
export const CHECK_AUTH_FAILURE = 'CHECK_AUTH_FAILURE';

// Action Creators

/**
 * Login action
 */
export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: LOGIN_REQUEST });

    const response = await authService.login(email, password);
    const data = response.data;

    if (data.success) {
      dispatch({
        type: LOGIN_SUCCESS,
        payload: data.user,
      });
      return { success: true };
    } else {
      dispatch({
        type: LOGIN_FAILURE,
        payload: data.message,
      });
      return { success: false, message: data.message };
    }
  } catch (error) {
    dispatch({
      type: LOGIN_FAILURE,
      payload: error.message || 'Login failed',
    });
    return { success: false, message: error.message || 'Login failed' };
  }
};

/**
 * Register action
 */
export const register = (userData) => async (dispatch) => {
  try {
    dispatch({ type: REGISTER_REQUEST });

    const response = await authService.register(userData);
    const data = response.data;

    if (data.success) {
      dispatch({
        type: REGISTER_SUCCESS,
      });
      return { success: true, message: data.message };
    } else {
      dispatch({
        type: REGISTER_FAILURE,
        payload: data.errors || [{ msg: data.message }],
      });
      return { success: false, errors: data.errors };
    }
  } catch (error) {
    const errors = error.errors || [{ msg: error.message || 'Registration failed' }];
    dispatch({
      type: REGISTER_FAILURE,
      payload: errors,
    });
    return { success: false, errors };
  }
};

/**
 * Logout action
 */
export const logout = () => async (dispatch) => {
  try {
    await authService.logout();
    dispatch({ type: LOGOUT });
    return { success: true };
  } catch (error) {
    // Logout from frontend even if server call fails
    dispatch({ type: LOGOUT });
    return { success: true };
  }
};

/**
 * Check authentication status
 */
export const checkAuth = () => async (dispatch) => {
  try {
    dispatch({ type: CHECK_AUTH_REQUEST });

    const response = await authService.checkAuth();
    const data = response.data;

    if (data.success && data.authenticated) {
      dispatch({
        type: CHECK_AUTH_SUCCESS,
        payload: data.user,
      });
    } else {
      dispatch({ type: CHECK_AUTH_FAILURE });
    }
  } catch (error) {
    dispatch({ type: CHECK_AUTH_FAILURE });
  }
};
