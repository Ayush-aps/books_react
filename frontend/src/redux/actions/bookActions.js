/**
 * Book Actions
 * Redux actions for managing books state
 */

import api from '../../services/api';

// Action Types
export const FETCH_BOOKS_REQUEST = 'FETCH_BOOKS_REQUEST';
export const FETCH_BOOKS_SUCCESS = 'FETCH_BOOKS_SUCCESS';
export const FETCH_BOOKS_FAILURE = 'FETCH_BOOKS_FAILURE';

export const FETCH_BOOK_DETAILS_REQUEST = 'FETCH_BOOK_DETAILS_REQUEST';
export const FETCH_BOOK_DETAILS_SUCCESS = 'FETCH_BOOK_DETAILS_SUCCESS';
export const FETCH_BOOK_DETAILS_FAILURE = 'FETCH_BOOK_DETAILS_FAILURE';

export const SET_FILTERS = 'SET_FILTERS';
export const CLEAR_FILTERS = 'CLEAR_FILTERS';

export const SET_SEARCH_QUERY = 'SET_SEARCH_QUERY';
export const SET_SORT_OPTION = 'SET_SORT_OPTION';

/**
 * Fetch books with filters
 */
export const fetchBooks = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_BOOKS_REQUEST });

    // Build query params
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.condition) params.append('condition', filters.condition);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/buyer/browse?${params.toString()}`);

    if (response.data.success) {
      dispatch({
        type: FETCH_BOOKS_SUCCESS,
        payload: {
          books: response.data.data.books,
          genres: response.data.data.genres,
          pagination: response.data.data.pagination,
          filters: response.data.data.filters,
        },
      });
    } else {
      dispatch({
        type: FETCH_BOOKS_FAILURE,
        payload: response.data.message || 'Failed to fetch books',
      });
    }
  } catch (error) {
    dispatch({
      type: FETCH_BOOKS_FAILURE,
      payload: error.response?.data?.message || 'Error fetching books',
    });
  }
};

/**
 * Fetch book details by ID
 */
export const fetchBookDetails = (bookId) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_BOOK_DETAILS_REQUEST });

    const response = await api.get(`/buyer/book/${bookId}`);

    if (response.data.success) {
      dispatch({
        type: FETCH_BOOK_DETAILS_SUCCESS,
        payload: {
          book: response.data.data.book,
          recommendedBooks: response.data.data.recommendedBooks,
        },
      });
    } else {
      dispatch({
        type: FETCH_BOOK_DETAILS_FAILURE,
        payload: response.data.message || 'Failed to fetch book details',
      });
    }
  } catch (error) {
    dispatch({
      type: FETCH_BOOK_DETAILS_FAILURE,
      payload: error.response?.data?.message || 'Error fetching book details',
    });
  }
};

/**
 * Set filters
 */
export const setFilters = (filters) => ({
  type: SET_FILTERS,
  payload: filters,
});

/**
 * Clear all filters
 */
export const clearFilters = () => ({
  type: CLEAR_FILTERS,
});

/**
 * Set search query
 */
export const setSearchQuery = (query) => ({
  type: SET_SEARCH_QUERY,
  payload: query,
});

/**
 * Set sort option
 */
export const setSortOption = (sortOption) => ({
  type: SET_SORT_OPTION,
  payload: sortOption,
});
