/**
 * Library Redux Actions
 * Handles user's book library, reading progress, and bookmarks
 */

import api from '../../services/api';

// Action Types
export const FETCH_LIBRARY_REQUEST = 'FETCH_LIBRARY_REQUEST';
export const FETCH_LIBRARY_SUCCESS = 'FETCH_LIBRARY_SUCCESS';
export const FETCH_LIBRARY_FAILURE = 'FETCH_LIBRARY_FAILURE';

export const ADD_BOOK_TO_LIBRARY_REQUEST = 'ADD_BOOK_TO_LIBRARY_REQUEST';
export const ADD_BOOK_TO_LIBRARY_SUCCESS = 'ADD_BOOK_TO_LIBRARY_SUCCESS';
export const ADD_BOOK_TO_LIBRARY_FAILURE = 'ADD_BOOK_TO_LIBRARY_FAILURE';

export const REMOVE_BOOK_FROM_LIBRARY_REQUEST = 'REMOVE_BOOK_FROM_LIBRARY_REQUEST';
export const REMOVE_BOOK_FROM_LIBRARY_SUCCESS = 'REMOVE_BOOK_FROM_LIBRARY_SUCCESS';
export const REMOVE_BOOK_FROM_LIBRARY_FAILURE = 'REMOVE_BOOK_FROM_LIBRARY_FAILURE';

export const FETCH_BOOK_FOR_READING_REQUEST = 'FETCH_BOOK_FOR_READING_REQUEST';
export const FETCH_BOOK_FOR_READING_SUCCESS = 'FETCH_BOOK_FOR_READING_SUCCESS';
export const FETCH_BOOK_FOR_READING_FAILURE = 'FETCH_BOOK_FOR_READING_FAILURE';

export const UPDATE_READING_PROGRESS_REQUEST = 'UPDATE_READING_PROGRESS_REQUEST';
export const UPDATE_READING_PROGRESS_SUCCESS = 'UPDATE_READING_PROGRESS_SUCCESS';
export const UPDATE_READING_PROGRESS_FAILURE = 'UPDATE_READING_PROGRESS_FAILURE';

export const ADD_BOOKMARK_REQUEST = 'ADD_BOOKMARK_REQUEST';
export const ADD_BOOKMARK_SUCCESS = 'ADD_BOOKMARK_SUCCESS';
export const ADD_BOOKMARK_FAILURE = 'ADD_BOOKMARK_FAILURE';

export const FETCH_BOOKMARKS_REQUEST = 'FETCH_BOOKMARKS_REQUEST';
export const FETCH_BOOKMARKS_SUCCESS = 'FETCH_BOOKMARKS_SUCCESS';
export const FETCH_BOOKMARKS_FAILURE = 'FETCH_BOOKMARKS_FAILURE';

export const FETCH_PROGRESS_DATA_REQUEST = 'FETCH_PROGRESS_DATA_REQUEST';
export const FETCH_PROGRESS_DATA_SUCCESS = 'FETCH_PROGRESS_DATA_SUCCESS';
export const FETCH_PROGRESS_DATA_FAILURE = 'FETCH_PROGRESS_DATA_FAILURE';

// Fetch user's library
export const fetchLibrary = () => async (dispatch) => {
  dispatch({ type: FETCH_LIBRARY_REQUEST });
  try {
    const response = await api.get('/library');
    dispatch({
      type: FETCH_LIBRARY_SUCCESS,
      payload: response.data.data.library || []
    });
  } catch (error) {
    dispatch({
      type: FETCH_LIBRARY_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch library'
    });
  }
};

// Add book to library
export const addBookToLibrary = (bookId) => async (dispatch) => {
  dispatch({ type: ADD_BOOK_TO_LIBRARY_REQUEST });
  try {
    const response = await api.post(`/library/add/${bookId}`);
    dispatch({
      type: ADD_BOOK_TO_LIBRARY_SUCCESS,
      payload: response.data.data
    });
    return { success: true, message: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to add book to library';
    dispatch({
      type: ADD_BOOK_TO_LIBRARY_FAILURE,
      payload: message
    });
    return { success: false, message };
  }
};

// Remove book from library
export const removeBookFromLibrary = (bookId) => async (dispatch) => {
  dispatch({ type: REMOVE_BOOK_FROM_LIBRARY_REQUEST });
  try {
    const response = await api.delete(`/library/remove/${bookId}`);
    dispatch({
      type: REMOVE_BOOK_FROM_LIBRARY_SUCCESS,
      payload: bookId
    });
    return { success: true, message: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to remove book from library';
    dispatch({
      type: REMOVE_BOOK_FROM_LIBRARY_FAILURE,
      payload: message
    });
    return { success: false, message };
  }
};

// Fetch book for reading (with access check)
export const fetchBookForReading = (bookId) => async (dispatch) => {
  dispatch({ type: FETCH_BOOK_FOR_READING_REQUEST });
  try {
    const response = await api.get(`/library/book/${bookId}`);
    dispatch({
      type: FETCH_BOOK_FOR_READING_SUCCESS,
      payload: response.data.data
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch book';
    dispatch({
      type: FETCH_BOOK_FOR_READING_FAILURE,
      payload: message
    });
    return { success: false, message };
  }
};

// Update reading progress
export const updateReadingProgress = (bookId, progress) => async (dispatch) => {
  dispatch({ type: UPDATE_READING_PROGRESS_REQUEST });
  try {
    const response = await api.put('/library/update-progress', {
      bookId,
      progress
    });
    dispatch({
      type: UPDATE_READING_PROGRESS_SUCCESS,
      payload: { bookId, progress }
    });
    return { success: true };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to update progress';
    dispatch({
      type: UPDATE_READING_PROGRESS_FAILURE,
      payload: message
    });
    return { success: false, message };
  }
};

// Add bookmark
export const addBookmark = (bookId, page, note) => async (dispatch) => {
  dispatch({ type: ADD_BOOKMARK_REQUEST });
  try {
    const response = await api.post('/library/bookmark', {
      bookId,
      page,
      note
    });
    dispatch({
      type: ADD_BOOKMARK_SUCCESS,
      payload: response.data.data
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to add bookmark';
    dispatch({
      type: ADD_BOOKMARK_FAILURE,
      payload: message
    });
    return { success: false, message };
  }
};

// Fetch bookmarks for a book
export const fetchBookmarks = (bookId) => async (dispatch) => {
  dispatch({ type: FETCH_BOOKMARKS_REQUEST });
  try {
    const response = await api.get(`/library/bookmark/${bookId}`);
    dispatch({
      type: FETCH_BOOKMARKS_SUCCESS,
      payload: { bookId, bookmarks: response.data.data }
    });
  } catch (error) {
    dispatch({
      type: FETCH_BOOKMARKS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch bookmarks'
    });
  }
};

// Fetch progress data (for charts/analytics)
export const fetchProgressData = () => async (dispatch) => {
  dispatch({ type: FETCH_PROGRESS_DATA_REQUEST });
  try {
    const response = await api.get('/library/progress-data');
    dispatch({
      type: FETCH_PROGRESS_DATA_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_PROGRESS_DATA_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch progress data'
    });
  }
};
