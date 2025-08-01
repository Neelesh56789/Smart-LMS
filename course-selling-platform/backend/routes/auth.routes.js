const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  logout, 
  forgotPassword,
  resetPassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
