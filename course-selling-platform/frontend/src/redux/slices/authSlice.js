// src/redux/slices/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api'; // Use the central api instance

// Helper to safely get and parse items from localStorage
const getStorageItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    // Check for null or the string 'undefined' which can sometimes be stored
    if (item === null || item === 'undefined') return null;
    return JSON.parse(item);
  } catch (err) {
    // If parsing fails, remove the invalid item
    localStorage.removeItem(key);
    return null;
  }
};

// Load the initial user state from localStorage
const user = getStorageItem('user');

const initialState = {
  user: user,
  isAuthenticated: !!user,
  loading: false,
  error: null,
};

// --- ASYNC THUNKS ---

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data.user;
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return rejectWithValue(message);
  }
});

export const login = createAsyncThunk('auth/login', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', userData);
    return response.data.user;
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return rejectWithValue(message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
});

export const sendPasswordResetEmail = createAsyncThunk(
  'auth/sendPasswordResetEmail',
  async (email, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return rejectWithValue(message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      return rejectWithValue(message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const res = await api.put('/profile', profileData);
      return res.data.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to update profile';
      return rejectWithValue(message);
    }
  }
);

export const updateProfilePhoto = createAsyncThunk(
  'auth/updateProfilePhoto',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.put('/profile/photo', formData);
      return res.data.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to upload photo';
      return rejectWithValue(message);
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Login
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        localStorage.removeItem('user');
      })
      // Password Reset Email
      .addCase(sendPasswordResetEmail.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(sendPasswordResetEmail.fulfilled, (state) => { state.loading = false; })
      .addCase(sendPasswordResetEmail.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Update Profile
      .addCase(updateProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = { ...state.user, ...action.payload };
        state.user = updatedUser;
        localStorage.setItem('user', JSON.stringify(updatedUser));
      })
      .addCase(updateProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Update Profile Photo
      .addCase(updateProfilePhoto.pending, (state) => { state.loading = true; })
      .addCase(updateProfilePhoto.fulfilled, (state, action) => {
        state.loading = false;
        // *** THE FIX ***
        // This now correctly MERGES the user data, which preserves the token,
        // instead of REPLACING it.
        const updatedUser = { ...state.user, ...action.payload };
        state.user = updatedUser;
        localStorage.setItem('user', JSON.stringify(updatedUser));
      })
      .addCase(updateProfilePhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetAuthError } = authSlice.actions;
export default authSlice.reducer;