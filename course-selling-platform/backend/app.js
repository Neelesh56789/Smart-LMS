// Filename: app.js (FINAL, FOOLPROOF CONFIGURATION)

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config();

// --- Import all routes ---
const webhookRoutes = require('./routes/webhook.routes.js'); // <-- NEW dedicated router
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const profileRoutes = require('./routes/profile.routes');
const newsRoutes = require('./routes/news.routes');

// --- Initialize App and DB ---
const app = express();
connectDB();

/* ========= CORS SETUP ========= */
app.use(cors({
  // ... your cors options ...
}));

// =========================================================================
//            *** THE NEW, FOOLPROOF ROUTING ORDER ***
// =========================================================================

// STEP 1: Mount the DEDICATED, UNPROTECTED webhook router FIRST.
// It's mounted on a unique path to avoid any confusion.
// This route will NOT use the global JSON parser.
app.use('/api/webhooks', webhookRoutes);

// STEP 2: NOW, enable the global JSON parser for all OTHER routes.
app.use(express.json());

// STEP 3: Mount all your OTHER API routers that need JSON parsing and protection.
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/news', newsRoutes);

// =========================================================================

/* ========= OTHER MIDDLEWARE & ROUTES ========= */
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.get("/", (req, res) => {
  res.send("Smart-LMS API (Root) is running successfully.");
});

/* ========= ERROR HANDLER ========= */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong on the server',
  });
});

module.exports = app;