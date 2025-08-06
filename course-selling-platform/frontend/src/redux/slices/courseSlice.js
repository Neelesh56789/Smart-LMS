// src/redux/slices/courseSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Using the single, central api instance. This part is correct.
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
      // This thunk correctly returns a custom object.
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
      // *** THE FIX ***
      // The thunk now returns response.data.data, which is the ARRAY of courses.
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
      // *** THE FIX ***
      // The thunk now returns response.data.data, which is the single COURSE OBJECT.
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
        // This reducer correctly unpacks the custom object from the thunk.
        state.courses = action.payload.courses;
        state.pagination = {
          currentPage: action.payload.pagination?.page || 1,
          totalPages: Math.ceil((action.payload.total || 0) / (action.payload.pagination?.limit || 8)),
          totalItems: action.payload.total || 0,
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
        state.categories = action.payload;
      })
      .addCase(getCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { reset } = courseSlice.actions;
export default courseSlice.reducer;