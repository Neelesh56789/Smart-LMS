// Filename: app.js (FINAL AND CORRECT VERSION - THIS WILL WORK)

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config();

// --- Import all your route files ---
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const profileRoutes = require('./routes/profile.routes');
const newsRoutes = require('./routes/news.routes');

// --- Import the webhook controller function directly for special handling ---
const { handleStripeWebhook } = require('./controllers/order.controller');

// --- Initialize App and DB ---
const app = express();
connectDB();

/* ========= GLOBAL MIDDLEWARE PART 1 (Things that don't need a body) ========= */
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy does not allow this origin.'), false);
  },
  credentials: true
}));

// =========================================================================
//            *** THE FINAL, CORRECT ROUTING AND MIDDLEWARE ORDER ***
// =========================================================================

// STEP 1: Define the DEDICATED, UNPROTECTED webhook route here.
// It is completely isolated and uses its own raw body parser.
// This MUST come before app.use(express.json()).
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// STEP 2: Apply ALL GLOBAL middleware that every OTHER route in your app needs.
// This placement FIXES the "Network Error" for logout, checkout, etc.
app.use(express.json()); // Parses JSON bodies for all subsequent routes
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// STEP 3: Mount all your regular API routers. They will now correctly use
// the global middleware (like express.json) defined just above.
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/news', newsRoutes);

// =========================================================================


/* ========= ROOT ROUTE AND ERROR HANDLER (at the very end) ========= */
app.get("/", (req, res) => {
  res.send("Smart-LMS API is running successfully.");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong on the server',
  });
});

module.exports = app;