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
    console.log('🛒 Full response:', response);
    console.log('🛒 Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('🛒 Cart error:', error);
    console.error('🛒 Error response:', error.response?.data);
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

// Helper function to extract cart data from different response structures
const extractCartData = (payload) => {
  console.log('🛒 Extracting cart data from payload:', payload);
  
  // Try different possible structures
  if (payload.data && payload.data.cart) {
    console.log('🛒 Found cart in payload.data.cart');
    return payload.data.cart;
  } else if (payload.data && payload.data.items) {
    console.log('🛒 Found cart in payload.data (direct)');
    return payload.data;
  } else if (payload.cart) {
    console.log('🛒 Found cart in payload.cart');
    return payload.cart;
  } else if (payload.items) {
    console.log('🛒 Found cart in payload (direct)');
    return payload;
  } else if (payload.data) {
    console.log('🛒 Found cart in payload.data');
    return payload.data;
  } else {
    console.log('🛒 Using payload as cart data');
    return payload;
  }
};

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
        console.log('🛒 getCart pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        console.log('🛒 getCart fulfilled with payload:', action.payload);
        state.loading = false;
        state.cart = extractCartData(action.payload);
        console.log('🛒 Cart set to:', state.cart);
      })
      .addCase(getCart.rejected, (state, action) => {
        console.log('🛒 getCart rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
        // Initialize empty cart to prevent infinite loading
        state.cart = { items: [] };
      })
      
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.cart = extractCartData(action.payload);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.cart = extractCartData(action.payload);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        // After clearing, cart should be empty
        state.cart = { items: [] };
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { resetCartError } = cartSlice.actions;
export default cartSlice.reducer;