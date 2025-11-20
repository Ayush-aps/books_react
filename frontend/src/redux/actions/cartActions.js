/**
 * Cart Actions
 */

import buyerService from '../../services/buyerService';

// Action Types
export const GET_CART_REQUEST = 'GET_CART_REQUEST';
export const GET_CART_SUCCESS = 'GET_CART_SUCCESS';
export const GET_CART_FAILURE = 'GET_CART_FAILURE';

export const ADD_TO_CART_REQUEST = 'ADD_TO_CART_REQUEST';
export const ADD_TO_CART_SUCCESS = 'ADD_TO_CART_SUCCESS';
export const ADD_TO_CART_FAILURE = 'ADD_TO_CART_FAILURE';

export const UPDATE_CART_ITEM_SUCCESS = 'UPDATE_CART_ITEM_SUCCESS';
export const REMOVE_FROM_CART_SUCCESS = 'REMOVE_FROM_CART_SUCCESS';
export const CLEAR_CART_SUCCESS = 'CLEAR_CART_SUCCESS';

export const SAVE_FOR_LATER_SUCCESS = 'SAVE_FOR_LATER_SUCCESS';
export const MOVE_TO_CART_SUCCESS = 'MOVE_TO_CART_SUCCESS';
export const REMOVE_FROM_SAVED_SUCCESS = 'REMOVE_FROM_SAVED_SUCCESS';

// Action Creators

/**
 * Get cart
 */
export const getCart = () => async (dispatch) => {
  try {
    dispatch({ type: GET_CART_REQUEST });

    const response = await buyerService.getCart();

    dispatch({
      type: GET_CART_SUCCESS,
      payload: response.data?.data?.cart || response.data?.cart || { items: [], savedItems: [], totalAmount: 0 },
    });
  } catch (error) {
    dispatch({
      type: GET_CART_FAILURE,
      payload: error.message || 'Failed to fetch cart',
    });
  }
};

/**
 * Add item to cart
 */
export const addToCart = (bookId, quantity = 1) => async (dispatch) => {
  try {
    dispatch({ type: ADD_TO_CART_REQUEST });

    const response = await buyerService.addToCart(bookId, quantity);

    dispatch({
      type: ADD_TO_CART_SUCCESS,
      payload: response.data?.data?.cart || response.data?.cart || { items: [], savedItems: [], totalAmount: 0 },
    });

    return { success: true, message: response.data?.message || 'Added to cart' };
  } catch (error) {
    dispatch({
      type: ADD_TO_CART_FAILURE,
      payload: error.message || 'Failed to add item to cart',
    });

    return { success: false, message: error.message || 'Failed to add item to cart' };
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItem = (itemId, quantity) => async (dispatch) => {
  try {
    const response = await buyerService.updateCartItem(itemId, quantity);

    dispatch({
      type: UPDATE_CART_ITEM_SUCCESS,
      payload: response.data?.data?.cart || response.data?.cart || { items: [], savedItems: [], totalAmount: 0 },
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = (itemId) => async (dispatch) => {
  try {
    const response = await buyerService.removeFromCart(itemId);

    dispatch({
      type: REMOVE_FROM_CART_SUCCESS,
      payload: response.data?.data?.cart || response.data?.cart || { items: [], savedItems: [], totalAmount: 0 },
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Clear cart
 */
export const clearCart = () => async (dispatch) => {
  try {
    await buyerService.clearCart();

    dispatch({ type: CLEAR_CART_SUCCESS });

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Save item for later
 */
export const saveForLater = (itemId) => async (dispatch) => {
  try {
    const response = await buyerService.saveForLater(itemId);

    dispatch({
      type: SAVE_FOR_LATER_SUCCESS,
      payload: response.data?.data?.cart || response.data?.cart || { items: [], savedItems: [], totalAmount: 0 },
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Move item to cart
 */
export const moveToCart = (itemId) => async (dispatch) => {
  try {
    const response = await buyerService.moveToCart(itemId);

    dispatch({
      type: MOVE_TO_CART_SUCCESS,
      payload: response.data?.data?.cart || response.data?.cart || { items: [], savedItems: [], totalAmount: 0 },
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Remove item from saved list
 */
export const removeFromSaved = (itemId) => async (dispatch) => {
  try {
    const response = await buyerService.removeFromSaved(itemId);

    dispatch({
      type: REMOVE_FROM_SAVED_SUCCESS,
      payload: response.data?.data?.cart || response.data?.cart || { items: [], savedItems: [], totalAmount: 0 },
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
