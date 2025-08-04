const express = require('express');
const cors = require('cors');
const morgan = ('morgan');
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



// 1. CORS should be first
app.use(cors({
  origin:'http://localhost:3000',
  credentials: true
}));

app.post(
  '/api/orders/stripe-webhook',
  express.raw({ type: 'application/json' }), // Stripe needs the raw body
  handleStripeWebhook
);

// --- END: THE FIX ---

// 3. Standard Middleware (after the special webhook route)
 // Now, parse JSON for all other routes
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- Define ALL OTHER API Routes ---
// The orderRoutes file will now handle everything EXCEPT the webhook.
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/news', newsRoutes);


// --- Serve Frontend & Handle Errors (Keep at the end) ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong on the server',
  });
});

module.exports = app;