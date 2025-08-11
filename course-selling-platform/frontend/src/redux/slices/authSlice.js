// Filename: src/redux/slices/authSlice.js (FINAL AND COMPLETE VERSION)

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

// --- ASYNCHRONOUS THUNKS ---

// ** THIS IS THE MISSING THUNK THAT CAUSED THE ERROR **
// It fetches the latest user data from the server.
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

// Correctly handles user registration
export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data; // IMPORTANT: Return the whole payload { user, token }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// Correctly handles user login
export const login = createAsyncThunk('auth/login', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', userData);
    return response.data; // IMPORTANT: Return the whole payload { user, token }
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
      // Corrected the template literal syntax
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
      // ** THE KEY FIX FOR THE "AUTHENTICATION REQUIRED" ERROR **
      .addCase(register.fulfilled, (state, action) => {
        // Combine the user data from the payload with the token
        const userWithToken = { ...action.payload.user, token: action.payload.token };
        state.isAuthenticated = true;
        state.user = userWithToken;
        localStorage.setItem('user', JSON.stringify(userWithToken));
      })
      .addCase(login.fulfilled, (state, action) => {
        // Combine the user data from the payload with the token
        const userWithToken = { ...action.payload.user, token: action.payload.token };
        state.isAuthenticated = true;
        state.user = userWithToken;
        localStorage.setItem('user', JSON.stringify(userWithToken));
      })

      // Reducer for the newly added getMe thunk
      .addCase(getMe.fulfilled, (state, action) => {
        const freshUser = { ...state.user, ...action.payload }; // Merge to preserve the token
        state.user = freshUser;
        localStorage.setItem('user', JSON.stringify(freshUser));
      })

      // Correctly update profile while preserving the token
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

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('user');
      })
      
      // Generic matchers for pending/fulfilled/rejected states
      .addMatcher((action) => action.type.endsWith('/pending'), (state) => { state.loading = true; state.error = null; })
      .addMatcher((action) => action.type.endsWith('/fulfilled'), (state) => { state.loading = false; })
      .addMatcher((action) => action.type.endsWith('/rejected'), (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // If getting user data fails, it implies the token is bad, so log them out completely.
        if (action.type === 'auth/getMe/rejected') {
          state.user = null;
          state.isAuthenticated = false;
          localStorage.removeItem('user');
        }
      });
  },
});

export const { resetAuthError } = authSlice.actions;
export default authSlice.reducer;