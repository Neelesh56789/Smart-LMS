// src/slices/courseSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// FIX: Using the single, central api instance. This part is correct.
import api from '../../api';

const initialState = {
  courses: [],
  featuredCourses: [],
  course: null,
  loading: false,
  error: null,
  categories: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  },
};

// --- ASYNC THUNKS ---

export const getCourses = createAsyncThunk(
  'courses/getCourses',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/courses', { params });
      // FIX: This now returns the exact object structure the reducer expects.
      return {
        courses: response.data.data,
        total: response.data.count,
        pagination: response.data.pagination,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const getFeaturedCourses = createAsyncThunk(
  'courses/getFeaturedCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/courses/featured');
      // *** THE MAIN FIX ***
      // The thunk now returns response.data.data (the array) instead of the whole object.
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured courses');
    }
  }
);

export const getCourse = createAsyncThunk(
  'courses/getCourse',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/courses/${id}`);
      // *** THE MAIN FIX ***
      // The thunk now returns response.data.data (the course object) directly.
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch course');
    }
  }
);

export const getCategories = createAsyncThunk(
  'courses/getCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/categories');
      // This was already correct, but kept for consistency.
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    reset: (state) => {
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Courses
      .addCase(getCourses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getCourses.fulfilled, (state, action) => {
        state.loading = false;
        // This reducer logic now correctly matches the thunk's return value.
        state.courses = action.payload.courses;
        state.pagination = {
          currentPage: action.payload.pagination?.page || 1,
          totalPages: Math.ceil(action.payload.total / (action.payload.pagination?.limit || 8)),
          totalItems: action.payload.total,
        };
      })
      .addCase(getCourses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      // Get Featured Courses
      .addCase(getFeaturedCourses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getFeaturedCourses.fulfilled, (state, action) => {
        state.loading = false;
        // The payload is now correctly the array of courses.
        state.featuredCourses = action.payload;
      })
      .addCase(getFeaturedCourses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      // Get Single Course
      .addCase(getCourse.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getCourse.fulfilled, (state, action) => {
        state.loading = false;
        // The payload is now correctly the single course object.
        state.course = action.payload;
      })
      .addCase(getCourse.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      // Get Categories
      .addCase(getCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.loading = false;
        // The payload is now correctly the array of categories.
        state.categories = action.payload;
      })
      .addCase(getCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { reset } = courseSlice.actions;
export default courseSlice.reducer;