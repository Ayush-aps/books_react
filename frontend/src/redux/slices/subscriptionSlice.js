
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state
const initialState = {
  subscription: null,
  plans: [],
  loading: false,
  error: null,
  plansLoading: false,
  plansError: null,
};

// Async thunks
export const fetchSubscriptionAsync = createAsyncThunk(
  'subscription/fetchSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/buyer/subscription');

      if (response.data.success) {
        return response.data.data.subscription || null;
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch subscription');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching subscription');
    }
  }
);

export const fetchSubscriptionPlansAsync = createAsyncThunk(
  'subscription/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/public/subscription-plans');

      if (response.data.success) {
        return response.data.data.plans || [];
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch subscription plans');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching subscription plans');
    }
  }
);

export const createSubscriptionAsync = createAsyncThunk(
  'subscription/createSubscription',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/buyer/subscription', subscriptionData);

      if (response.data.success) {
        return response.data.data.subscription;
      } else {
        return rejectWithValue(response.data.message || 'Failed to create subscription');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error creating subscription');
    }
  }
);

export const cancelSubscriptionAsync = createAsyncThunk(
  'subscription/cancelSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete('/buyer/subscription');

      if (response.data.success) {
        return null;
      } else {
        return rejectWithValue(response.data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error cancelling subscription');
    }
  }
);

export const renewSubscriptionAsync = createAsyncThunk(
  'subscription/renewSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/buyer/subscription/renew');

      if (response.data.success) {
        return response.data.data.subscription;
      } else {
        return rejectWithValue(response.data.message || 'Failed to renew subscription');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error renewing subscription');
    }
  }
);

export const upgradeSubscriptionAsync = createAsyncThunk(
  'subscription/upgradeSubscription',
  async (newPlanId, { rejectWithValue }) => {
    try {
      const response = await api.put('/buyer/subscription/upgrade', { planId: newPlanId });

      if (response.data.success) {
        return response.data.data.subscription;
      } else {
        return rejectWithValue(response.data.message || 'Failed to upgrade subscription');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error upgrading subscription');
    }
  }
);

// Subscription slice
const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.plansError = null;
    },
    resetSubscription: (state) => {
      state.subscription = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch subscription
      .addCase(fetchSubscriptionAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.subscription = action.payload;
      })
      .addCase(fetchSubscriptionAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch subscription plans
      .addCase(fetchSubscriptionPlansAsync.pending, (state) => {
        state.plansLoading = true;
        state.plansError = null;
      })
      .addCase(fetchSubscriptionPlansAsync.fulfilled, (state, action) => {
        state.plansLoading = false;
        state.plans = action.payload;
      })
      .addCase(fetchSubscriptionPlansAsync.rejected, (state, action) => {
        state.plansLoading = false;
        state.plansError = action.payload;
      })
      // Create subscription
      .addCase(createSubscriptionAsync.fulfilled, (state, action) => {
        state.subscription = action.payload;
      })
      .addCase(createSubscriptionAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Cancel subscription
      .addCase(cancelSubscriptionAsync.fulfilled, (state) => {
        state.subscription = null;
      })
      .addCase(cancelSubscriptionAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Renew subscription
      .addCase(renewSubscriptionAsync.fulfilled, (state, action) => {
        state.subscription = action.payload;
      })
      .addCase(renewSubscriptionAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Upgrade subscription
      .addCase(upgradeSubscriptionAsync.fulfilled, (state, action) => {
        state.subscription = action.payload;
      })
      .addCase(upgradeSubscriptionAsync.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, resetSubscription } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
