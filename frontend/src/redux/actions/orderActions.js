/**
 * Order Actions
 * Redux actions for managing orders
 */

import api from '../../services/api';

// Action Types
export const FETCH_ORDERS_REQUEST = 'FETCH_ORDERS_REQUEST';
export const FETCH_ORDERS_SUCCESS = 'FETCH_ORDERS_SUCCESS';
export const FETCH_ORDERS_FAILURE = 'FETCH_ORDERS_FAILURE';

export const FETCH_ORDER_DETAILS_REQUEST = 'FETCH_ORDER_DETAILS_REQUEST';
export const FETCH_ORDER_DETAILS_SUCCESS = 'FETCH_ORDER_DETAILS_SUCCESS';
export const FETCH_ORDER_DETAILS_FAILURE = 'FETCH_ORDER_DETAILS_FAILURE';

export const CREATE_ORDER_REQUEST = 'CREATE_ORDER_REQUEST';
export const CREATE_ORDER_SUCCESS = 'CREATE_ORDER_SUCCESS';
export const CREATE_ORDER_FAILURE = 'CREATE_ORDER_FAILURE';

export const UPDATE_ORDER_STATUS_REQUEST = 'UPDATE_ORDER_STATUS_REQUEST';
export const UPDATE_ORDER_STATUS_SUCCESS = 'UPDATE_ORDER_STATUS_SUCCESS';
export const UPDATE_ORDER_STATUS_FAILURE = 'UPDATE_ORDER_STATUS_FAILURE';

/**
 * Fetch user's orders
 */
export const fetchOrders = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_ORDERS_REQUEST });

    const response = await api.get('/buyer/orders');

    if (response.data.success) {
      dispatch({
        type: FETCH_ORDERS_SUCCESS,
        payload: response.data.data.orders,
      });
    } else {
      dispatch({
        type: FETCH_ORDERS_FAILURE,
        payload: response.data.message || 'Failed to fetch orders',
      });
    }
  } catch (error) {
    dispatch({
      type: FETCH_ORDERS_FAILURE,
      payload: error.response?.data?.message || 'Error fetching orders',
    });
  }
};

/**
 * Fetch order details by ID
 */
export const fetchOrderDetails = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_ORDER_DETAILS_REQUEST });

    const response = await api.get(`/buyer/orders/${orderId}`);

    if (response.data.success) {
      dispatch({
        type: FETCH_ORDER_DETAILS_SUCCESS,
        payload: response.data.data.order,
      });
    } else {
      dispatch({
        type: FETCH_ORDER_DETAILS_FAILURE,
        payload: response.data.message || 'Failed to fetch order details',
      });
    }
  } catch (error) {
    dispatch({
      type: FETCH_ORDER_DETAILS_FAILURE,
      payload: error.response?.data?.message || 'Error fetching order details',
    });
  }
};

/**
 * Create a new order
 */
export const createOrder = (orderData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_ORDER_REQUEST });

    const response = await api.post('/orders', orderData);

    if (response.data.success) {
      const orderData = response.data.data || response.data;
      dispatch({
        type: CREATE_ORDER_SUCCESS,
        payload: orderData,
      });
      return orderData; // Return the order directly for .unwrap()
    } else {
      dispatch({
        type: CREATE_ORDER_FAILURE,
        payload: response.data.message || 'Failed to create order',
      });
      throw new Error(response.data.message || 'Failed to create order');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error creating order';
    dispatch({
      type: CREATE_ORDER_FAILURE,
      payload: errorMessage,
    });
    throw new Error(errorMessage);
  }
};

/**
 * Update order status (for sellers/admin)
 */
export const updateOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_ORDER_STATUS_REQUEST });

    const response = await api.put(`/seller/order/${orderId}/status`, { status });

    if (response.data.success) {
      dispatch({
        type: UPDATE_ORDER_STATUS_SUCCESS,
        payload: { orderId, status },
      });
      return { success: true };
    } else {
      dispatch({
        type: UPDATE_ORDER_STATUS_FAILURE,
        payload: response.data.message || 'Failed to update order status',
      });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error updating order status';
    dispatch({
      type: UPDATE_ORDER_STATUS_FAILURE,
      payload: errorMessage,
    });
    return { success: false, message: errorMessage };
  }
};
