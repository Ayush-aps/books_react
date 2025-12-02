
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import buyerService from '../../services/buyerService';

// Initial state
const initialState = {
  library: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchLibraryAsync = createAsyncThunk(
  'library/fetchLibrary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await buyerService.getLibrary();

      if (response.data.success) {
        return response.data.data.library || [];
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch library');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching library');
    }
  }
);

export const addToLibraryAsync = createAsyncThunk(
  'library/addToLibrary',
  async (bookId, { rejectWithValue }) => {
    try {
      const response = await buyerService.addToLibrary(bookId);

      if (response.data.success) {
        return response.data.data.libraryItem;
      } else {
        return rejectWithValue(response.data.message || 'Failed to add to library');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error adding to library');
    }
  }
);

export const removeFromLibraryAsync = createAsyncThunk(
  'library/removeFromLibrary',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await buyerService.removeFromLibrary(itemId);

      if (response.data.success) {
        return itemId;
      } else {
        return rejectWithValue(response.data.message || 'Failed to remove from library');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error removing from library');
    }
  }
);

export const markAsReadAsync = createAsyncThunk(
  'library/markAsRead',
  async ({ itemId, isRead }, { rejectWithValue }) => {
    try {
      const response = await buyerService.markAsRead(itemId, isRead);

      if (response.data.success) {
        return { itemId, isRead };
      } else {
        return rejectWithValue(response.data.message || 'Failed to update read status');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error updating read status');
    }
  }
);

export const rateLibraryBookAsync = createAsyncThunk(
  'library/rateBook',
  async ({ itemId, rating }, { rejectWithValue }) => {
    try {
      const response = await buyerService.rateBook(itemId, rating);

      if (response.data.success) {
        return { itemId, rating };
      } else {
        return rejectWithValue(response.data.message || 'Failed to rate book');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error rating book');
    }
  }
);

// Library slice
const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetLibrary: (state) => {
      state.library = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch library
      .addCase(fetchLibraryAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLibraryAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.library = action.payload;
      })
      .addCase(fetchLibraryAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to library
      .addCase(addToLibraryAsync.fulfilled, (state, action) => {
        state.library.push(action.payload);
      })
      .addCase(addToLibraryAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Remove from library
      .addCase(removeFromLibraryAsync.fulfilled, (state, action) => {
        state.library = state.library.filter(item => item._id !== action.payload);
      })
      .addCase(removeFromLibraryAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Mark as read
      .addCase(markAsReadAsync.fulfilled, (state, action) => {
        const item = state.library.find(item => item._id === action.payload.itemId);
        if (item) {
          item.isRead = action.payload.isRead;
        }
      })
      .addCase(markAsReadAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Rate book
      .addCase(rateLibraryBookAsync.fulfilled, (state, action) => {
        const item = state.library.find(item => item._id === action.payload.itemId);
        if (item) {
          item.rating = action.payload.rating;
        }
      })
      .addCase(rateLibraryBookAsync.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, resetLibrary } = librarySlice.actions;
export default librarySlice.reducer;
