const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // Corrected the require statement
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config();

// Import all routes
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const profileRoutes = require('./routes/profile.routes');
const newsRoutes = require('./routes/news.routes');

// We need the controller directly for the special webhook route
const { handleStripeWebhook } = require('./controllers/order.controller');

const app = express();
connectDB();


// --- CHANGE 1 START: MAKE CORS PRODUCTION-READY ---
// This will allow requests from your deployed frontend URL and localhost
const allowedOrigins = [
  process.env.FRONTEND_URL, // You will set this in Render (e.g., https://your-frontend.onrender.com)
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
// --- CHANGE 1 END ---


// This route MUST come before express.json()
app.post(
  '/api/orders/webhook',  // ✅ This matches what your Stripe dashboard should have
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

app.post(
  '/api/orders/webhook-test',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    console.log('🔥🔥🔥 WEBHOOK TEST HIT! 🔥🔥🔥');
    console.log('Time:', new Date().toISOString());
    console.log('Headers:', req.headers);
    console.log('Body type:', typeof req.body);
    res.json({ success: true, message: 'Test working!' });
  }
);

// Standard Middleware (after the special webhook route)
app.use(express.json()); // Now, parse JSON for all other routes
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- Define ALL API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/news', newsRoutes);


// --- CHANGE 2 START: REMOVE FRONTEND SERVING LOGIC & ADD ROOT ROUTE ---
// The old code caused the file-not-found error because the backend service
// shouldn't be responsible for serving the frontend files in this architecture.

app.get("/", (req, res) => {
  res.send("Smart-LMS API is running successfully.");
});

// The old `if (process.env.NODE_ENV === 'production')` block has been removed.
// --- CHANGE 2 END ---


// Final error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong on the server',
  });
});

module.exports = app;