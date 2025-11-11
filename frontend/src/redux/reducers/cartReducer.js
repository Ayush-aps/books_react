/**
 * Cart Reducer
 */

import {
  GET_CART_REQUEST,
  GET_CART_SUCCESS,
  GET_CART_FAILURE,
  ADD_TO_CART_REQUEST,
  ADD_TO_CART_SUCCESS,
  ADD_TO_CART_FAILURE,
  UPDATE_CART_ITEM_SUCCESS,
  REMOVE_FROM_CART_SUCCESS,
  CLEAR_CART_SUCCESS,
} from '../actions/cartActions';

const initialState = {
  items: [],
  totalAmount: 0,
  loading: false,
  error: null,
};

export default function cartReducer(state = initialState, action) {
  switch (action.type) {
    case GET_CART_REQUEST:
    case ADD_TO_CART_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_CART_SUCCESS:
    case ADD_TO_CART_SUCCESS:
    case UPDATE_CART_ITEM_SUCCESS:
    case REMOVE_FROM_CART_SUCCESS:
      return {
        ...state,
        items: action.payload.items || [],
        totalAmount: action.payload.totalAmount || 0,
        loading: false,
        error: null,
      };

    case GET_CART_FAILURE:
    case ADD_TO_CART_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case CLEAR_CART_SUCCESS:
      return {
        ...state,
        items: [],
        totalAmount: 0,
        loading: false,
        error: null,
      };

    default:
      return state;
  }
}
