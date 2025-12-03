/**
 * Library Reducer
 * Manages user's book library, reading progress, and bookmarks
 */

import {
  FETCH_LIBRARY_REQUEST,
  FETCH_LIBRARY_SUCCESS,
  FETCH_LIBRARY_FAILURE,
  ADD_BOOK_TO_LIBRARY_REQUEST,
  ADD_BOOK_TO_LIBRARY_SUCCESS,
  ADD_BOOK_TO_LIBRARY_FAILURE,
  REMOVE_BOOK_FROM_LIBRARY_REQUEST,
  REMOVE_BOOK_FROM_LIBRARY_SUCCESS,
  REMOVE_BOOK_FROM_LIBRARY_FAILURE,
  FETCH_BOOK_FOR_READING_REQUEST,
  FETCH_BOOK_FOR_READING_SUCCESS,
  FETCH_BOOK_FOR_READING_FAILURE,
  UPDATE_READING_PROGRESS_REQUEST,
  UPDATE_READING_PROGRESS_SUCCESS,
  UPDATE_READING_PROGRESS_FAILURE,
  ADD_BOOKMARK_REQUEST,
  ADD_BOOKMARK_SUCCESS,
  ADD_BOOKMARK_FAILURE,
  FETCH_BOOKMARKS_REQUEST,
  FETCH_BOOKMARKS_SUCCESS,
  FETCH_BOOKMARKS_FAILURE,
  FETCH_PROGRESS_DATA_REQUEST,
  FETCH_PROGRESS_DATA_SUCCESS,
  FETCH_PROGRESS_DATA_FAILURE
} from '../actions/libraryActions';

const initialState = {
  books: [], // Books in user's library
  currentBook: null, // Book currently being read
  bookmarks: {}, // Bookmarks organized by bookId
  progressData: null, // Analytics data
  loading: false,
  error: null
};

const libraryReducer = (state = initialState, action) => {
  switch (action.type) {
    // Fetch Library
    case FETCH_LIBRARY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_LIBRARY_SUCCESS:
      return {
        ...state,
        loading: false,
        books: action.payload
      };
    case FETCH_LIBRARY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Add Book to Library
    case ADD_BOOK_TO_LIBRARY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ADD_BOOK_TO_LIBRARY_SUCCESS:
      return {
        ...state,
        loading: false,
        books: [...state.books, action.payload]
      };
    case ADD_BOOK_TO_LIBRARY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Remove Book from Library
    case REMOVE_BOOK_FROM_LIBRARY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case REMOVE_BOOK_FROM_LIBRARY_SUCCESS:
      return {
        ...state,
        loading: false,
        books: state.books.filter(item => {
          // Handle different possible structures
          const book = item.bookId || item.book;
          const bookId = book?._id || book;
          return bookId !== action.payload && bookId?.toString() !== action.payload;
        })
      };
    case REMOVE_BOOK_FROM_LIBRARY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Fetch Book for Reading
    case FETCH_BOOK_FOR_READING_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_BOOK_FOR_READING_SUCCESS:
      return {
        ...state,
        loading: false,
        currentBook: action.payload
      };
    case FETCH_BOOK_FOR_READING_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Update Reading Progress
    case UPDATE_READING_PROGRESS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case UPDATE_READING_PROGRESS_SUCCESS:
      return {
        ...state,
        loading: false,
        books: state.books.map(book =>
          book.bookId._id === action.payload.bookId
            ? { ...book, progress: action.payload.progress }
            : book
        )
      };
    case UPDATE_READING_PROGRESS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Add Bookmark
    case ADD_BOOKMARK_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ADD_BOOKMARK_SUCCESS:
      const bookIdForBookmark = action.payload.bookId;
      return {
        ...state,
        loading: false,
        bookmarks: {
          ...state.bookmarks,
          [bookIdForBookmark]: [
            ...(state.bookmarks[bookIdForBookmark] || []),
            action.payload
          ]
        }
      };
    case ADD_BOOKMARK_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Fetch Bookmarks
    case FETCH_BOOKMARKS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_BOOKMARKS_SUCCESS:
      return {
        ...state,
        loading: false,
        bookmarks: {
          ...state.bookmarks,
          [action.payload.bookId]: action.payload.bookmarks
        }
      };
    case FETCH_BOOKMARKS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Fetch Progress Data
    case FETCH_PROGRESS_DATA_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_PROGRESS_DATA_SUCCESS:
      return {
        ...state,
        loading: false,
        progressData: action.payload
      };
    case FETCH_PROGRESS_DATA_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    default:
      return state;
  }
};

export default libraryReducer;
