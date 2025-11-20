/**
 * Books Reducer
 * Manages books state
 */

import {
  FETCH_BOOKS_REQUEST,
  FETCH_BOOKS_SUCCESS,
  FETCH_BOOKS_FAILURE,
  FETCH_BOOK_DETAILS_REQUEST,
  FETCH_BOOK_DETAILS_SUCCESS,
  FETCH_BOOK_DETAILS_FAILURE,
  SET_FILTERS,
  CLEAR_FILTERS,
  SET_SEARCH_QUERY,
  SET_SORT_OPTION,
} from '../actions/bookActions';

const initialState = {
  books: [],
  currentBook: null,
  recommendedBooks: [],
  genres: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    genre: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    sort: '',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0,
    limit: 12,
  },
};

export default function booksReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_BOOKS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case FETCH_BOOKS_SUCCESS:
      return {
        ...state,
        loading: false,
        books: action.payload.books,
        genres: action.payload.genres || state.genres,
        pagination: action.payload.pagination || state.pagination,
        filters: action.payload.filters || state.filters,
        error: null,
      };

    case FETCH_BOOKS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case FETCH_BOOK_DETAILS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case FETCH_BOOK_DETAILS_SUCCESS:
      return {
        ...state,
        loading: false,
        currentBook: action.payload.book,
        recommendedBooks: action.payload.recommendedBooks || [],
        error: null,
      };

    case FETCH_BOOK_DETAILS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };

    case CLEAR_FILTERS:
      return {
        ...state,
        filters: {
          search: '',
          genre: '',
          condition: '',
          minPrice: '',
          maxPrice: '',
          sort: '',
        },
      };

    case SET_SEARCH_QUERY:
      return {
        ...state,
        filters: {
          ...state.filters,
          search: action.payload,
        },
      };

    case SET_SORT_OPTION:
      return {
        ...state,
        filters: {
          ...state.filters,
          sort: action.payload,
        },
      };

    default:
      return state;
  }
}
