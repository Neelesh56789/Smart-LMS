const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  handleStripeWebhook,
  getMyPurchasedCourses,
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth');

// This route must be protected
router.get('/my-courses', protect, getMyPurchasedCourses);

// This route is also protected
router.post('/create-checkout-session', protect, createCheckoutSession);

// This route is for the webhook and will have special middleware applied in app.js
router.post('/stripe-webhook', handleStripeWebhook);

module.exports = router;