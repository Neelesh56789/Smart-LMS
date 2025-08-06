import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Configure axios with base URL and default headers
const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

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
    totalItems: 0
  }
};

// Get all courses with filtering and pagination
export const getCourses = createAsyncThunk(
  'courses/getCourses',
  async (params, thunkAPI) => {
    try {
      console.log('Fetching courses with params:', params);
      const response = await api.get('/courses', { params });
      console.log('API Response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch courses');
      }

      // If no data is returned, return empty array with count 0
      if (!response.data.data || response.data.data.length === 0) {
        return {
          courses: [],
          total: 0,
          pagination: { page: 1, limit: params.limit || 8 }
        };
      }

      return {
        courses: response.data.data.map(course => ({
          _id: course._id,
          id: course._id,
          title: course.title || '',
          description: course.description || '',
          shortDescription: course.shortDescription || '',
          instructor: {
            name: course.instructor?.name || 'Unknown Instructor',
            image: course.instructor?.profileImage || '',
          },
          instructorImage: course.instructor?.profileImage || '',
          price: course.price || 0,
          rating: course.rating || 0,
          ratingCount: course.ratingCount || 0,
          enrolled: course.enrolled || 0,
          image: course.image || '',
          category: course.category?.name || 'Uncategorized',
          level: course.level || 'beginner',
          duration: course.duration || '',
          topics: course.topics || [],
          published: course.published
        })),
        total: response.data.count,
        pagination: response.data.pagination
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Something went wrong');
    }
  }
);

// Get featured courses
export const getFeaturedCourses = createAsyncThunk(
  'courses/getFeaturedCourses',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/courses/featured');
      console.log('Featured courses response:', response.data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch featured courses');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching featured courses:', error);
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Something went wrong');
    }
  }
);

// Get single course
export const getCourse = createAsyncThunk(
  'courses/getCourse',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/courses/${id}`);
      console.log('Single course response:', response.data);
      if (!response.data || !response.data.data) {
        throw new Error('Invalid course data received from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching course:', error);
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Something went wrong');
    }
  }
);

// Get categories
export const getCategories = createAsyncThunk(
  'courses/getCategories',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/categories');
      console.log('Categories response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Something went wrong');
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
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Courses
      .addCase(getCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.courses;
        state.error = null;
        state.pagination = {
          currentPage: action.payload.pagination?.page || 1,
          totalPages: Math.ceil(action.payload.total / (action.payload.pagination?.limit || 8)),
          totalItems: action.payload.total
        };
      })
      .addCase(getCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Featured Courses
      .addCase(getFeaturedCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFeaturedCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.featuredCourses = action.payload.data;
        state.error = null;
      })
      .addCase(getFeaturedCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Single Course
      .addCase(getCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.course = action.payload.data;
        state.error = null;
      })
      .addCase(getCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Categories
      .addCase(getCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { reset } = courseSlice.actions;
export default courseSlice.reducer;