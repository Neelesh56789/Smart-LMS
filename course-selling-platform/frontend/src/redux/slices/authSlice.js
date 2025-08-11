// Filename: src/redux/slices/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

const getStorageItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (err) {
    localStorage.removeItem(key);
    return null;
  }
};

const user = getStorageItem('user');

const initialState = {
  user: user,
  isAuthenticated: !!user,
  loading: false,
  error: null,
};

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Your session has expired. Please log in again.');
    }
  }
);

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const login = createAsyncThunk('auth/login', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', userData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
     console.error("Logout API call failed, but logging out client-side anyway.", error);
  }
});

export const sendPasswordResetEmail = createAsyncThunk('auth/sendPasswordResetEmail', async (email, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (profileData, { rejectWithValue }) => {
  try {
    const res = await api.put('/profile', profileData);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update profile');
  }
});

export const updateProfilePhoto = createAsyncThunk('auth/updateProfilePhoto', async (formData, { rejectWithValue }) => {
  try {
    const res = await api.put('/profile/photo', formData);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to upload photo');
  }
});

export const updateUserProgress = createAsyncThunk(
  'auth/updateUserProgress',
  async ({ lessonId, status }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/courses/lessons/${lessonId}/status`, { status });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not update progress.');
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
      .addCase(register.fulfilled, (state, action) => {
        const userWithToken = action.payload.user;
        state.isAuthenticated = true;
        state.user = userWithToken;
        localStorage.setItem('user', JSON.stringify(userWithToken));
      })
      .addCase(login.fulfilled, (state, action) => {
        const userWithToken = action.payload.user;
        state.isAuthenticated = true;
        state.user = userWithToken;
        localStorage.setItem('user', JSON.stringify(userWithToken));
      })
      .addCase(getMe.fulfilled, (state, action) => {
        const freshUser = { ...state.user, ...action.payload };
        state.user = freshUser;
        localStorage.setItem('user', JSON.stringify(freshUser));
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        const updatedUser = { ...state.user, ...action.payload };
        state.user = updatedUser;
        localStorage.setItem('user', JSON.stringify(updatedUser));
      })
      .addCase(updateProfilePhoto.fulfilled, (state, action) => {
        const updatedUser = { ...state.user, ...action.payload };
        state.user = updatedUser;
        localStorage.setItem('user', JSON.stringify(updatedUser));
      })
      .addCase(updateUserProgress.fulfilled, (state, action) => {
        if (state.user) {
          state.user.lessonStatuses = action.payload;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('user');
      })
      .addMatcher((action) => action.type.endsWith('/pending'), (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addMatcher((action) => action.type.endsWith('/fulfilled'), (state) => { 
        state.loading = false; 
      })
      .addMatcher((action) => action.type.endsWith('/rejected'), (state, action) => {
        state.loading = false;
        state.error = action.payload;
        if (action.type.includes('getMe/rejected')) {
           state.user = null;
           state.isAuthenticated = false;
           localStorage.removeItem('user');
        }
      });
  },
});

export const { resetAuthError } = authSlice.actions;
export default authSlice.reducer;