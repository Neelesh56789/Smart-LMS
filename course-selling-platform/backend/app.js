// Filename: app.js (FINAL, CORRECTED, AND FULLY FUNCTIONAL)

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config();

// --- Import all routes ---
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

/* ========= CORS SETUP (Should come early) ========= */
app.use(cors({
  // your cors options...
}));


app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// STEP 3: Mount all your regular API routers. They will now correctly use
// the global middleware defined above.
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/news', newsRoutes);

// =========================================================================


/* ========= ROOT ROUTE AND ERROR HANDLER ========= */
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