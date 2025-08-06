// src/redux/slices/courseSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// FIX: Using the central api instance.
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

export const getCourses = createAsyncThunk('courses/getCourses', async (params, { rejectWithValue }) => {
  try {
    const response = await api.get('/courses', { params });
    return {
      courses: response.data.data,
      total: response.data.count,
      pagination: response.data.pagination,
    };
  } catch (error) { return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses'); }
});

export const getFeaturedCourses = createAsyncThunk('courses/getFeaturedCourses', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/courses/featured');
    return response.data.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured courses'); }
});

export const getCourse = createAsyncThunk('courses/getCourse', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/courses/${id}`);
    return response.data.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message || 'Failed to fetch course'); }
});

export const getCategories = createAsyncThunk('courses/getCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/categories');
    return response.data.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories'); }
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
      .addCase(getFeaturedCourses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getFeaturedCourses.fulfilled, (state, action) => { state.loading = false; state.featuredCourses = action.payload; })
      .addCase(getFeaturedCourses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(getCourse.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getCourse.fulfilled, (state, action) => { state.loading = false; state.course = action.payload; })
      .addCase(getCourse.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(getCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getCategories.fulfilled, (state, action) => { state.loading = false; state.categories = action.payload; })
      .addCase(getCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { reset } = courseSlice.actions;
export default courseSlice.reducer;