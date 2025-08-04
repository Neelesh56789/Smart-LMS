const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// This is the controller that handles the logic
const {
  createCheckoutSession,
  handleStripeWebhook,
  getMyCourses,
} = require('../controllers/order.controller.js'); // NOTE: The filename is order.controller.js

// --- ROUTES ---

// The webhook route must not be protected by user auth and must handle the raw request body.
// It should be defined before any global express.json() middleware if possible.
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// All routes below this line require a user to be logged in.
router.use(protect);

// Route for creating the Stripe payment session
router.post('/create-checkout-session', createCheckoutSession);

// Route for fetching the user's purchased courses
router.get('/my-courses', getMyCourses);

module.exports = router;