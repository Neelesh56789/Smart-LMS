// Filename: routes/webhook.routes.js (NEW FILE)

const express = require('express');
const { handleStripeWebhook } = require('../controllers/order.controller');
const router = express.Router();

// This is the dedicated, express lane for Stripe.
// It is completely unprotected and uses the raw body parser.
router.post(
  '/stripe', // The path within this router is just /stripe
  express.raw({ type: 'application/json' }), 
  handleStripeWebhook
);

module.exports = router;