// Filename: app.js (UPDATED)

const express = require('express');
const cors = require('cors');
const morgan = 'morgan';
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config();

// --- Import all routes (we'll use them later)
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes'); // This will now contain ONLY the non-webhook routes
const profileRoutes = require('./routes/profile.routes');
const newsRoutes = require('./routes/news.routes');

// --- Import the webhook controller function directly
const { handleStripeWebhook } = require('./controllers/order.controller');

// --- Initialize App and DB
const app = express();
connectDB();

/* ========= CORS SETUP ========= */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy does not allow this origin.'), false);
  },
  credentials: true
}));

// =========================================================================
//                  *** CRITICAL FIX APPLIED HERE ***
// =========================================================================

// 1. DEFINE THE STRIPE WEBHOOK ROUTE *BEFORE* THE GLOBAL JSON PARSER
// We use its full path and `express.raw()` to ensure the body is not parsed.
app.post(
  '/orders/stripe-webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// 2. NOW, ENABLE THE GLOBAL JSON PARSER FOR ALL *OTHER* ROUTES
// Any request that is not for the webhook will be parsed as JSON.
app.use(express.json());

// =========================================================================

/* ========= OTHER GLOBAL MIDDLEWARE ========= */
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'development') {
  app.use(require('morgan')('dev')); // Fixed morgan import
}

/* ========= MOUNT ALL OTHER API ROUTES ========= */
// These routes will now correctly use the JSON parser defined above.
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes); // This router no longer contains the webhook route
app.use('/api/profile', profileRoutes);
app.use('/api/news', newsRoutes);

/* ========= ROOT ROUTE ========= */
app.get("/", (req, res) => {
  res.send("Smart-LMS API is running successfully.");
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