const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const profileRoutes = require('./routes/profile.routes');
const newsRoutes = require('./routes/news.routes');

// Import webhook controller directly (must bypass JSON parsing)
const { handleStripeWebhook } = require('./controllers/order.controller');

const app = express();
connectDB();

/* ========= CORS SETUP ========= */
const allowedOrigins = [
  process.env.FRONTEND_URL, // e.g. https://your-frontend.onrender.com
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

/* ========= STRIPE WEBHOOK ROUTE ========= 
   MUST come BEFORE express.json()
   Using express.raw() so body is untouched for signature verification
*/
app.post(
  '/api/orders/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Optional test endpoint to verify raw body parsing
app.post(
  '/api/orders/webhook-test',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    console.log('🔥 WEBHOOK TEST HIT!');
    console.log('Headers:', req.headers);
    console.log('Body type:', typeof req.body);
    res.json({ success: true, message: 'Webhook test OK' });
  }
);

/* ========= JSON + OTHER MIDDLEWARE ========= */
app.use(express.json()); // Safe now that webhook route is above
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* ========= API ROUTES ========= */
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
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
