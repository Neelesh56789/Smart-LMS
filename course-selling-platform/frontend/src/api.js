import axios from 'axios';
import {store} from './redux/store'; // Adjust the import path as necessary

// Determine the base URL from environment variables, with a fallback for local development.
const BASE_URL = process.env.REACT_APP_BACKEND_URL 
  ? `${process.env.REACT_APP_BACKEND_URL}` 
  : 'http://localhost:5000/api';

// Create a single, configured instance of Axios.
const api = axios.create({
  baseURL: BASE_URL,
  // This is the crucial part that tells Axios to send cookies with every request.
  withCredentials: true, 
});

api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const user = state.auth.user;

    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export default api;