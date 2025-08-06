// src/redux/slices/cartSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

const handleApiError = (error, thunkAPI) => {
  const message = error.response?.data?.message || error.message || 'An unknown error occurred';
  if (error.response?.status === 401) {
    return thunkAPI.rejectWithValue('Your session has expired. Please login again.');
  }
  return thunkAPI.rejectWithValue(message);
};

const initialState = {
  cart: null,
  loading: false,
  error: null,
};

export const getCart = createAsyncThunk('cart/getCart', async (_, thunkAPI) => {
  try {
    console.log('🛒 Fetching cart...');
    const response = await api.get('/cart');
    console.log('🛒 Cart response:', response.data);
    return response.data;
  } catch (error) {
    console.error('🛒 Cart error:', error.response?.data || error.message);
    return handleApiError(error, thunkAPI);
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async (courseId, thunkAPI) => {
  try {
    const response = await api.post('/cart/add', { courseId });
    return response.data;
  } catch (error) {
    return handleApiError(error, thunkAPI);
  }
});

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (courseId, thunkAPI) => {
  try {
    const response = await api.delete(`/cart/${courseId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, thunkAPI);
  }
});

export const clearCart = createAsyncThunk('cart/clearCart', async (_, thunkAPI) => {
  try {
    const response = await api.delete('/cart');
    return response.data;
  } catch (error) {
    return handleApiError(error, thunkAPI);
  }
});

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCartError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Cart
      .addCase(getCart.pending, (state) => {
        console.log('🛒 Cart loading started');
        state.loading = true;
        state.error = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        console.log('🛒 Cart loaded successfully:', action.payload);
        state.loading = false;
        // FIX: Handle different response structures
        if (action.payload.data) {
          state.cart = action.payload.data;
        } else if (action.payload.cart) {
          state.cart = action.payload.cart;
        } else {
          state.cart = action.payload;
        }
      })
      .addCase(getCart.rejected, (state, action) => {
        console.log('🛒 Cart loading failed:', action.payload);
        state.loading = false;
        state.error = action.payload;
        // Set empty cart on error to prevent infinite loading
        state.cart = { items: [] };
      })
      
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.cart = action.payload.data;
        } else if (action.payload.cart) {
          state.cart = action.payload.cart;
        } else {
          state.cart = action.payload;
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.cart = action.payload.data;
        } else if (action.payload.cart) {
          state.cart = action.payload.cart;
        } else {
          state.cart = action.payload;
        }
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = { items: [] };
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetCartError } = cartSlice.actions;
export default cartSlice.reducer;