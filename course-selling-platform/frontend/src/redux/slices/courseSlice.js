// src/slices/courseSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// FIX: Import the central api instance.
import api from '../../api';

const initialState = {
  courses: [],
  featuredCourses: [],
  course: null,
  loading: false,
  error: null,
  categories: [],
  pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
};

// All thunks now use the central `api` instance
export const getCourses = createAsyncThunk('courses/getCourses', async (params, { rejectWithValue }) => {
  try {
    const response = await api.get('/courses', { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch courses');
    }
    if (!response.data.data) {
      return { courses: [], total: 0, pagination: { page: 1, limit: params.limit || 8 } };
    }
    return {
      courses: response.data.data,
      total: response.data.count,
      pagination: response.data.pagination,
    };
  } catch (error) { return rejectWithValue(error.response?.data?.message || 'Something went wrong'); }
});

export const getFeaturedCourses = createAsyncThunk('courses/getFeaturedCourses', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/courses/featured');
    return response.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message || 'Something went wrong'); }
});

export const getCourse = createAsyncThunk('courses/getCourse', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message || 'Something went wrong'); }
});

export const getCategories = createAsyncThunk('courses/getCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/categories');
    return response.data.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message || 'Something went wrong'); }
});

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
      .addCase(getFeaturedCourses.fulfilled, (state, action) => { state.loading = false; state.featuredCourses = action.payload.data; })
      .addCase(getFeaturedCourses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Get Single Course
      .addCase(getCourse.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getCourse.fulfilled, (state, action) => { state.loading = false; state.course = action.payload.data; })
      .addCase(getCourse.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Get Categories
      .addCase(getCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getCategories.fulfilled, (state, action) => { state.loading = false; state.categories = action.payload; })
      .addCase(getCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { reset } = courseSlice.actions;
export default courseSlice.reducer;