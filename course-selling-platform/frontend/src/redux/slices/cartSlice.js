// src/redux/slices/cartSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// FIX: Using the central api instance ensures the auth token is sent.
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
    const response = await api.get('/cart');
    return response.data;
  } catch (error) { return handleApiError(error, thunkAPI); }
});

export const addToCart = createAsyncThunk('cart/addToCart', async (courseId, thunkAPI) => {
  try {
    const response = await api.post('/cart/add', { courseId });
    return response.data;
  } catch (error) { return handleApiError(error, thunkAPI); }
});

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (courseId, thunkAPI) => {
  try {
    const response = await api.delete(`/cart/${courseId}`);
    return response.data;
  } catch (error) { return handleApiError(error, thunkAPI); }
});

export const clearCart = createAsyncThunk('cart/clearCart', async (_, thunkAPI) => {
  try {
    const response = await api.delete('/cart');
    return response.data;
  } catch (error) { return handleApiError(error, thunkAPI); }
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
    const createReducer = (thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.loading = false;
          state.cart = action.payload.data;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        });
    };
    [getCart, addToCart, removeFromCart, clearCart].forEach(createReducer);
  },
});

export const { resetCartError } = cartSlice.actions;
export default cartSlice.reducer;