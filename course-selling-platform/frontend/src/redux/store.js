// src/store.js or src/app/store.js

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import cartReducer from './slices/cartSlice';
// The profileReducer was in your authSlice file, but assuming it might be separate one day
// import profileReducer from './slices/profileSlice';

// Renamed to 'store' and added 'export' so it can be imported elsewhere
export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    cart: cartReducer,
    // If you had a separate profileReducer, it would go here.
    // profile: profileReducer,
  },
});

// The default export is kept for providing the store to your React app in index.js
export default store;