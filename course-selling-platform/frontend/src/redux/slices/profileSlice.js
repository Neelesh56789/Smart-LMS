// src/slices/profileSlice.js

import { createSlice } from '@reduxjs/toolkit';
// FIX: Import the single, authoritative `updateProfile` thunk from authSlice.
import { updateProfile } from './authSlice';

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    loading: false,
    error: null,
    isSuccess: false,
  },
  reducers: {
    // Action to reset the success/error state when the user navigates away
    resetProfileStatus: (state) => {
      state.isSuccess = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.isSuccess = false;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state) => {
        state.loading = false;
        state.isSuccess = true;
        // The actual user object update is now handled correctly and solely by authSlice.
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// This slice no longer defines its own thunk.
export const { resetProfileStatus } = profileSlice.actions;

export default profileSlice.reducer;