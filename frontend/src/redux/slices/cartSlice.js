
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import buyerService from '../../services/buyerService';

// Initial state
const initialState = {
  cart: {
    items: [],
    savedItems: [],
    totalAmount: 0,
  },
  loading: false,
  error: null,
};

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await buyerService.getCart();
      return response.data?.data?.cart || response.data?.cart || { 
        items: [], 
        savedItems: [], 
        totalAmount: 0 
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch cart');
    }
  }
);

export const addItemToCart = createAsyncThunk(
  'cart/addItem',
  async ({ bookId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const response = await buyerService.addToCart(bookId, quantity);
      return response.data?.data?.cart || response.data?.cart || { 
        items: [], 
        savedItems: [], 
        totalAmount: 0 
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add item to cart');
    }
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const response = await buyerService.updateCartItem(itemId, quantity);
      return response.data?.data?.cart || response.data?.cart || { 
        items: [], 
        savedItems: [], 
        totalAmount: 0 
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update cart item');
    }
  }
);

export const removeItemFromCart = createAsyncThunk(
  'cart/removeItem',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await buyerService.removeFromCart(itemId);
      return response.data?.data?.cart || response.data?.cart || { 
        items: [], 
        savedItems: [], 
        totalAmount: 0 
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove item from cart');
    }
  }
);

export const clearCartItems = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await buyerService.clearCart();
      return response.data?.data?.cart || { items: [], savedItems: [], totalAmount: 0 };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to clear cart');
    }
  }
);

export const saveItemForLater = createAsyncThunk(
  'cart/saveForLater',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await buyerService.saveForLater(itemId);
      return response.data?.data?.cart || response.data?.cart || { 
        items: [], 
        savedItems: [], 
        totalAmount: 0 
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to save item for later');
    }
  }
);

export const moveItemToCart = createAsyncThunk(
  'cart/moveToCart',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await buyerService.moveToCart(itemId);
      return response.data?.data?.cart || response.data?.cart || { 
        items: [], 
        savedItems: [], 
        totalAmount: 0 
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to move item to cart');
    }
  }
);

export const removeFromSaved = createAsyncThunk(
  'cart/removeFromSaved',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await buyerService.removeFromSaved(itemId);
      return response.data?.data?.cart || response.data?.cart || { 
        items: [], 
        savedItems: [], 
        totalAmount: 0 
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove saved item');
    }
  }
);

// Cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetCart: (state) => {
      state.cart = {
        items: [],
        savedItems: [],
        totalAmount: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to cart
      .addCase(addItemToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(addItemToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update cart item
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Remove from cart
      .addCase(removeItemFromCart.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(removeItemFromCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Clear cart
      .addCase(clearCartItems.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(clearCartItems.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Save for later
      .addCase(saveItemForLater.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(saveItemForLater.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Move to cart
      .addCase(moveItemToCart.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(moveItemToCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Remove from saved
      .addCase(removeFromSaved.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(removeFromSaved.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
