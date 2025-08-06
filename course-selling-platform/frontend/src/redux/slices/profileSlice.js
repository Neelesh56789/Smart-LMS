import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api'; // <-- Import the central api instance

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      // Use the pre-configured 'api' instance which handles authentication
      const res = await api.put('/profile', profileData);
      
      // Return the updated user data on success
      return res.data.data; 
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to update profile';
      return rejectWithValue(message);
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state) => {
        state.loading = false;
        // We will handle the user update in authSlice
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default profileSlice.reducer;