
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import buyerService from '../../services/buyerService';

// Initial state
const initialState = {
  complaints: [],
  selectedComplaint: null,
  loading: false,
  error: null,
  complaintDetailsLoading: false,
  complaintDetailsError: null,
};

// Async thunks
export const fetchComplaintsAsync = createAsyncThunk(
  'complaints/fetchComplaints',
  async (_, { rejectWithValue }) => {
    try {
      const response = await buyerService.getComplaints();

      if (response.data.success) {
        return response.data.data.complaints || [];
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch complaints');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching complaints');
    }
  }
);

export const fetchComplaintDetailsAsync = createAsyncThunk(
  'complaints/fetchComplaintDetails',
  async (complaintId, { rejectWithValue }) => {
    try {
      const response = await buyerService.getComplaintDetails(complaintId);

      if (response.data.success) {
        return response.data.data.complaint;
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch complaint details');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching complaint details');
    }
  }
);

export const createComplaintAsync = createAsyncThunk(
  'complaints/createComplaint',
  async (complaintData, { rejectWithValue }) => {
    try {
      const response = await buyerService.createComplaint(complaintData);

      if (response.data.success) {
        return response.data.data.complaint;
      } else {
        return rejectWithValue(response.data.message || 'Failed to create complaint');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error creating complaint');
    }
  }
);

export const updateComplaintAsync = createAsyncThunk(
  'complaints/updateComplaint',
  async ({ complaintId, complaintData }, { rejectWithValue }) => {
    try {
      const response = await buyerService.updateComplaint(complaintId, complaintData);

      if (response.data.success) {
        return response.data.data.complaint;
      } else {
        return rejectWithValue(response.data.message || 'Failed to update complaint');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error updating complaint');
    }
  }
);

export const deleteComplaintAsync = createAsyncThunk(
  'complaints/deleteComplaint',
  async (complaintId, { rejectWithValue }) => {
    try {
      const response = await buyerService.deleteComplaint(complaintId);

      if (response.data.success) {
        return complaintId;
      } else {
        return rejectWithValue(response.data.message || 'Failed to delete complaint');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error deleting complaint');
    }
  }
);

export const addComplaintMessageAsync = createAsyncThunk(
  'complaints/addMessage',
  async ({ complaintId, message }, { rejectWithValue }) => {
    try {
      const response = await buyerService.addComplaintMessage(complaintId, message);

      if (response.data.success) {
        return response.data.data.complaint;
      } else {
        return rejectWithValue(response.data.message || 'Failed to add message');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error adding message');
    }
  }
);

// Complaint slice
const complaintSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.complaintDetailsError = null;
    },
    clearSelectedComplaint: (state) => {
      state.selectedComplaint = null;
    },
    resetComplaintState: (state) => {
      state.complaints = [];
      state.selectedComplaint = null;
      state.error = null;
      state.complaintDetailsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch complaints
      .addCase(fetchComplaintsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplaintsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.complaints = action.payload;
      })
      .addCase(fetchComplaintsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch complaint details
      .addCase(fetchComplaintDetailsAsync.pending, (state) => {
        state.complaintDetailsLoading = true;
        state.complaintDetailsError = null;
      })
      .addCase(fetchComplaintDetailsAsync.fulfilled, (state, action) => {
        state.complaintDetailsLoading = false;
        state.selectedComplaint = action.payload;
      })
      .addCase(fetchComplaintDetailsAsync.rejected, (state, action) => {
        state.complaintDetailsLoading = false;
        state.complaintDetailsError = action.payload;
      })
      // Create complaint
      .addCase(createComplaintAsync.fulfilled, (state, action) => {
        state.complaints.unshift(action.payload);
      })
      .addCase(createComplaintAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Update complaint
      .addCase(updateComplaintAsync.fulfilled, (state, action) => {
        const index = state.complaints.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
        if (state.selectedComplaint?._id === action.payload._id) {
          state.selectedComplaint = action.payload;
        }
      })
      .addCase(updateComplaintAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete complaint
      .addCase(deleteComplaintAsync.fulfilled, (state, action) => {
        state.complaints = state.complaints.filter(c => c._id !== action.payload);
        if (state.selectedComplaint?._id === action.payload) {
          state.selectedComplaint = null;
        }
      })
      .addCase(deleteComplaintAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Add complaint message
      .addCase(addComplaintMessageAsync.fulfilled, (state, action) => {
        const index = state.complaints.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
        if (state.selectedComplaint?._id === action.payload._id) {
          state.selectedComplaint = action.payload;
        }
      })
      .addCase(addComplaintMessageAsync.rejected, (state, action) => {
        state.complaintDetailsError = action.payload;
      });
  },
});

export const { clearError, clearSelectedComplaint, resetComplaintState } = complaintSlice.actions;
export default complaintSlice.reducer;
