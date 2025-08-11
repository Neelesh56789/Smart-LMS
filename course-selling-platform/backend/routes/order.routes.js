// Filename: routes/order.routes.js (UPDATED)

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// This is the controller that handles the logic
const {
  createCheckoutSession,
  getMyCourses,
  // handleStripeWebhook is no longer needed here as it's called directly from app.js
} = require('../controllers/order.controller.js');

// --- ROUTES ---

// The Stripe webhook route has been MOVED to app.js to ensure it's loaded
// before the global express.json() parser. This is the correct pattern.

// All routes below this line require a user to be logged in.
router.use(protect);

// Route for creating the Stripe payment session
router.post('/create-checkout-session', createCheckoutSession);

// Route for fetching the user's purchased courses
router.get('/my-courses', getMyCourses);

// Your test route, which also requires protection and JSON parsing now
router.post('/webhook-test', (req, res) => {
  console.log('🔥 WEBHOOK TEST ROUTE HIT!');
  console.log('🔥 Method:', req.method);
  console.log('🔥 Body (parsed):', req.body); // Should now be a parsed JSON object
  console.log('🔥 Timestamp:', new Date().toISOString());
  
  res.status(200).json({
    message: 'Webhook test successful!',
    timestamp: new Date().toISOString(),
    received: true
  });
});

module.exports = router;