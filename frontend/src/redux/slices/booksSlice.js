

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state
const initialState = {
  books: [],
  selectedBook: null,
  genres: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0,
  },
  filters: {
    search: '',
    genre: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
  },
  loading: false,
  error: null,
  bookDetailsLoading: false,
  bookDetailsError: null,
};

// Async thunks
export const fetchBooksAsync = createAsyncThunk(
  'books/fetchBooks',
  async (filters = {}, { rejectWithValue }) => {
    try {
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
        return {
          books: response.data.data.books,
          genres: response.data.data.genres,
          pagination: response.data.data.pagination,
          filters: response.data.data.filters,
        };
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch books');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching books');
    }
  }
);

export const fetchBookDetailsAsync = createAsyncThunk(
  'books/fetchBookDetails',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/buyer/book/${bookId}`);

      if (response.data.success) {
        return {
          book: response.data.data.book,
          relatedBooks: response.data.data.relatedBooks || [],
        };
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch book details');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching book details');
    }
  }
);

export const searchBooksAsync = createAsyncThunk(
  'books/searchBooks',
  async (searchQuery, { rejectWithValue }) => {
    try {
      const response = await api.get(`/buyer/browse?search=${encodeURIComponent(searchQuery)}`);

      if (response.data.success) {
        return {
          books: response.data.data.books,
          pagination: response.data.data.pagination,
        };
      } else {
        return rejectWithValue(response.data.message || 'Search failed');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search error');
    }
  }
);

// Books slice
const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        genre: '',
        condition: '',
        minPrice: '',
        maxPrice: '',
        sort: 'newest',
      };
    },
    setSearchQuery: (state, action) => {
      state.filters.search = action.payload;
    },
    setSortOption: (state, action) => {
      state.filters.sort = action.payload;
    },
    clearError: (state) => {
      state.error = null;
      state.bookDetailsError = null;
    },
    clearSelectedBook: (state) => {
      state.selectedBook = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch books
      .addCase(fetchBooksAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBooksAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.books = action.payload.books;
        state.genres = action.payload.genres;
        state.pagination = action.payload.pagination;
        state.filters = { ...state.filters, ...action.payload.filters };
      })
      .addCase(fetchBooksAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch book details
      .addCase(fetchBookDetailsAsync.pending, (state) => {
        state.bookDetailsLoading = true;
        state.bookDetailsError = null;
      })
      .addCase(fetchBookDetailsAsync.fulfilled, (state, action) => {
        state.bookDetailsLoading = false;
        state.selectedBook = {
          ...action.payload.book,
          relatedBooks: action.payload.relatedBooks,
        };
      })
      .addCase(fetchBookDetailsAsync.rejected, (state, action) => {
        state.bookDetailsLoading = false;
        state.bookDetailsError = action.payload;
      })
      // Search books
      .addCase(searchBooksAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchBooksAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.books = action.payload.books;
        state.pagination = action.payload.pagination;
      })
      .addCase(searchBooksAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setSearchQuery,
  setSortOption,
  clearError,
  clearSelectedBook,
} = booksSlice.actions;

export default booksSlice.reducer;
