// src/slices/orderSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// FIX: Import the central api instance. Do not use global axios or manual headers.
import api from '../../api';

const initialState = {
  orders: [],
  order: null,
  loading: false,
  success: false,
  error: null,
};

// All thunks now use the central `api` instance.
// The interceptor in `api.js` will automatically attach the token.
export const createOrder = createAsyncThunk('orders/createOrder', async (orderData, { rejectWithValue }) => {
  try {
    const response = await api.post('/orders', orderData);
    return response.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

export const getUserOrders = createAsyncThunk('orders/getUserOrders', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/orders/my-orders');
    return response.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

export const getOrderById = createAsyncThunk('orders/getOrderById', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message || error.message); }
});

export const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    reset: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => { state.loading = true; state.success = false; })
      .addCase(createOrder.fulfilled, (state, action) => { state.loading = false; state.success = true; state.order = action.payload; })
      .addCase(createOrder.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(getUserOrders.pending, (state) => { state.loading = true; })
      .addCase(getUserOrders.fulfilled, (state, action) => { state.loading = false; state.orders = action.payload; })
      .addCase(getUserOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(getOrderById.pending, (state) => { state.loading = true; })
      .addCase(getOrderById.fulfilled, (state, action) => { state.loading = false; state.order = action.payload; })
      .addCase(getOrderById.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { reset } = orderSlice.actions;
export default orderSlice.reducer;