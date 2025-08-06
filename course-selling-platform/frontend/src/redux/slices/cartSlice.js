import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Create axios instance with base URL and default config
const api = axios.create({
  baseURL: `${BACKEND_URL}`,
  withCredentials: true, // This is crucial for sending cookies automatically
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper to handle API errors consistently
const handleApiError = (error, thunkAPI) => {
  const message =
    error.response?.data?.message ||
    error.message ||
    'An unknown error occurred';
    
  // If the error is 401 Unauthorized, it means the cookie is invalid or expired.
  if (error.response?.status === 401) {
    // We clean up stale data on the client to prevent inconsistent states.
    localStorage.removeItem('user');
    // We return a user-friendly message for the UI.
    return thunkAPI.rejectWithValue('Your session has expired. Please login again.');
  }

  return thunkAPI.rejectWithValue(message);
};

// Initial state for the cart slice
const initialState = {
  cart: null,
  loading: false,
  error: null
};

// Get user cart
export const getCart = createAsyncThunk('cart/getCart', async (_, thunkAPI) => {
  try {
    const response = await api.get('/cart');
    return response.data;
  } catch (error) {
    return handleApiError(error, thunkAPI);
  }
});

// Add item to cart
export const addToCart = createAsyncThunk('cart/addToCart', async (courseId, thunkAPI) => {
  try {
    const response = await api.post('/cart/add', { courseId });
    return response.data;
  } catch (error) {
    return handleApiError(error, thunkAPI);
  }
});

// Remove item from cart
export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (courseId, thunkAPI) => {
  try {
    const response = await api.delete(`/cart/${courseId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, thunkAPI);
  }
});

// Clear all items from cart
export const clearCart = createAsyncThunk('cart/clearCart', async (_, thunkAPI) => {
  try {
    const response = await api.delete('/cart');
    return response.data;
  } catch (error) {
    return handleApiError(error, thunkAPI);
  }
});

// Update quantity of an item in the cart
export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateCartItemQuantity',
  async ({ courseId, quantity }, thunkAPI) => {
    try {
      const response = await api.put(`/cart/${courseId}`, { quantity });
      return response.data;
    } catch (error) {
      return handleApiError(error, thunkAPI);
    }
  }
);

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCartError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create a generic handler for all async thunks to reduce boilerplate
    const createReducer = (thunk) => {
        builder
            .addCase(thunk.pending, (state) => {
                state.loading = true;
                state.error = null; // Clear previous errors on a new request
            })
            .addCase(thunk.fulfilled, (state, action) => {
                state.loading = false;
                // Our API consistently returns { success: true, data: {...} }
                state.cart = action.payload.data;
            })
            .addCase(thunk.rejected, (state, action) => {
                state.loading = false;
                // The payload is the error message from rejectWithValue in handleApiError
                state.error = action.payload;
            });
    };

    // Apply the generic handler to all cart-related thunks
    [getCart, addToCart, removeFromCart, clearCart, updateCartItemQuantity].forEach(createReducer);
  },
});

export const { resetCartError } = cartSlice.actions;
export default cartSlice.reducer;