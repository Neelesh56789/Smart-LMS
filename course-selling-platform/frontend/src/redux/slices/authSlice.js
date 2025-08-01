import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api'; // Use the central api instance

// Helper to safely get and parse items from localStorage
const getStorageItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === 'undefined') return null;
    return JSON.parse(item);
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

// --- AUTHENTICATION THUNKS ---

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data.user;
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return rejectWithValue(message);
  }
});

export const login = createAsyncThunk('auth/login', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', userData);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data.user;
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    return rejectWithValue(message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
  localStorage.removeItem('user');
});

// --- START: THE FIX ---
// Adding the missing 'sendPasswordResetEmail' async thunk back.
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
// --- END: THE FIX ---

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
      const updatedUser = res.data.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
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
      // The api instance is already configured. We don't need to set headers manually.
      const res = await api.put('/profile/photo', formData);
      const updatedUser = res.data.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
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
      })
      // --- START: THE FIX ---
      // Adding the extra reducers for the forgot password flow.
      .addCase(sendPasswordResetEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendPasswordResetEmail.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendPasswordResetEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // --- END: THE FIX ---
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfilePhoto.pending, (state) => {
      state.loading = true;
    })
    .addCase(updateProfilePhoto.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload; // Update user state with new photo URL
    })
    .addCase(updateProfilePhoto.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { resetAuthError } = authSlice.actions;
export default authSlice.reducer;