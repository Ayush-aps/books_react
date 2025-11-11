/**
 * Orders Reducer
 * Manages orders state
 */

import {
  FETCH_ORDERS_REQUEST,
  FETCH_ORDERS_SUCCESS,
  FETCH_ORDERS_FAILURE,
  FETCH_ORDER_DETAILS_REQUEST,
  FETCH_ORDER_DETAILS_SUCCESS,
  FETCH_ORDER_DETAILS_FAILURE,
  CREATE_ORDER_REQUEST,
  CREATE_ORDER_SUCCESS,
  CREATE_ORDER_FAILURE,
  UPDATE_ORDER_STATUS_REQUEST,
  UPDATE_ORDER_STATUS_SUCCESS,
  UPDATE_ORDER_STATUS_FAILURE,
} from '../actions/orderActions';

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

export default function ordersReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_ORDERS_REQUEST:
    case FETCH_ORDER_DETAILS_REQUEST:
    case CREATE_ORDER_REQUEST:
    case UPDATE_ORDER_STATUS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case FETCH_ORDERS_SUCCESS:
      return {
        ...state,
        loading: false,
        orders: action.payload,
        error: null,
      };

    case FETCH_ORDER_DETAILS_SUCCESS:
      return {
        ...state,
        loading: false,
        currentOrder: action.payload,
        error: null,
      };

    case CREATE_ORDER_SUCCESS:
      return {
        ...state,
        loading: false,
        orders: [action.payload, ...state.orders],
        currentOrder: action.payload,
        error: null,
      };

    case UPDATE_ORDER_STATUS_SUCCESS:
      return {
        ...state,
        loading: false,
        orders: state.orders.map((order) =>
          order._id === action.payload.orderId
            ? { ...order, orderStatus: action.payload.status }
            : order
        ),
        error: null,
      };

    case FETCH_ORDERS_FAILURE:
    case FETCH_ORDER_DETAILS_FAILURE:
    case CREATE_ORDER_FAILURE:
    case UPDATE_ORDER_STATUS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
}
