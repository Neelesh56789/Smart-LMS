const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  // updateCartQuantity is no longer exported or used
} = require('../controllers/cart.controller');

const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getCart)
  .delete(clearCart);

router.route('/add')
  .post(addToCart);

// The PUT route for updating quantity is removed.
router.route('/:courseId')
  .delete(removeFromCart);

module.exports = router;