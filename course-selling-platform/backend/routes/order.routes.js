// Filename: routes/order.routes.js (UPDATED AND CLEANED)

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// We only need the controllers for protected routes here.
const {
  createCheckoutSession,
  getMyCourses,
} = require('../controllers/order.controller.js');

// --- ROUTES ---

// The webhook route is GONE from this file.

// Apply protection to ALL routes defined in this file.
router.use(protect);

// Route for creating the Stripe payment session
router.post('/create-checkout-session', createCheckoutSession);

// Route for fetching the user's purchased courses
router.get('/my-courses', getMyCourses);


module.exports = router;