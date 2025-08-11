// Filename: app.js (FINAL CORRECTED VERSION)

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config();

// --- Import all routes
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
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
//            *** THE ABSOLUTELY CRITICAL ORDERING FIX ***
// =========================================================================

// STEP 1: Define the specific, unprotected webhook route FIRST.
// It uses its full path and express.raw() to bypass everything else.
app.post(
  '/api/orders/stripe-webhook', // The full path
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

app.get('/orders/stripe-webhook', (req, res) => {
  console.log('✅ DIAGNOSTIC GET ROUTE HIT SUCCESSFULLY! Routing is correct.');
  res.send('Success! The unprotected webhook route is reachable.');
});

// STEP 2: Now, enable the global JSON parser for all other routes.
app.use(express.json());

// STEP 3: Now, mount all your routers. Any request that doesn't match
// the webhook route above will fall through to these routers.
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes); // This router contains the `protect` middleware
app.use('/api/profile', profileRoutes);
app.use('/api/news', newsRoutes);

// =========================================================================

/* ========= OTHER GLOBAL MIDDLEWARE ========= */
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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