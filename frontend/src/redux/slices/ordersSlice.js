
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import buyerService from '../../services/buyerService';
import api from '../../services/api';

// Initial state
const initialState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,
  orderDetailsLoading: false,
  orderDetailsError: null,
  createOrderLoading: false,
  createOrderError: null,
};

// Async thunks
export const fetchOrdersAsync = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await buyerService.getOrders();

      if (response.data.success) {
        return response.data.data.orders || [];
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching orders');
    }
  }
);

export const fetchOrderDetailsAsync = createAsyncThunk(
  'orders/fetchOrderDetails',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await buyerService.getOrderDetails(orderId);

      if (response.data.success) {
        return response.data.data.order;
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch order details');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching order details');
    }
  }
);

export const createOrderAsync = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await buyerService.createOrder(orderData);

      if (response.data.success) {
        return response.data.data.order;
      } else {
        return rejectWithValue(response.data.message || 'Failed to create order');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error creating order');
    }
  }
);

export const cancelOrderAsync = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await buyerService.cancelOrder(orderId);

      if (response.data.success) {
        return { orderId, order: response.data.data.order };
      } else {
        return rejectWithValue(response.data.message || 'Failed to cancel order');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error cancelling order');
    }
  }
);

export const trackOrderAsync = createAsyncThunk(
  'orders/trackOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/buyer/orders/${orderId}/track`);

      if (response.data.success) {
        return response.data.data.tracking;
      } else {
        return rejectWithValue(response.data.message || 'Failed to track order');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error tracking order');
    }
  }
);

// Orders slice
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.orderDetailsError = null;
      state.createOrderError = null;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    resetOrderState: (state) => {
      state.orders = [];
      state.selectedOrder = null;
      state.error = null;
      state.orderDetailsError = null;
      state.createOrderError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrdersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrdersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch order details
      .addCase(fetchOrderDetailsAsync.pending, (state) => {
        state.orderDetailsLoading = true;
        state.orderDetailsError = null;
      })
      .addCase(fetchOrderDetailsAsync.fulfilled, (state, action) => {
        state.orderDetailsLoading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderDetailsAsync.rejected, (state, action) => {
        state.orderDetailsLoading = false;
        state.orderDetailsError = action.payload;
      })
      // Create order
      .addCase(createOrderAsync.pending, (state) => {
        state.createOrderLoading = true;
        state.createOrderError = null;
      })
      .addCase(createOrderAsync.fulfilled, (state, action) => {
        state.createOrderLoading = false;
        state.orders.unshift(action.payload);
      })
      .addCase(createOrderAsync.rejected, (state, action) => {
        state.createOrderLoading = false;
        state.createOrderError = action.payload;
      })
      // Cancel order
      .addCase(cancelOrderAsync.fulfilled, (state, action) => {
        const index = state.orders.findIndex(order => order._id === action.payload.orderId);
        if (index !== -1) {
          state.orders[index] = action.payload.order;
        }
        if (state.selectedOrder?._id === action.payload.orderId) {
          state.selectedOrder = action.payload.order;
        }
      })
      .addCase(cancelOrderAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Track order
      .addCase(trackOrderAsync.fulfilled, (state, action) => {
        if (state.selectedOrder) {
          state.selectedOrder.tracking = action.payload;
        }
      })
      .addCase(trackOrderAsync.rejected, (state, action) => {
        state.orderDetailsError = action.payload;
      });
  },
});

export const { clearError, clearSelectedOrder, resetOrderState } = ordersSlice.actions;
export default ordersSlice.reducer;
