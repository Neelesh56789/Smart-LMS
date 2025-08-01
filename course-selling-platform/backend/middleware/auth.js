const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Middleware to protect routes that require a logged-in user
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  console.log('Auth middleware - Request headers:', req.headers);

  // Check Authorization header first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    console.log('Auth middleware - Found token in Authorization header');
  } 
  // Then check cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('Auth middleware - Found token in cookies');
  }

  if (!token) {
    console.log('Auth middleware - No token found in headers or cookies');
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
  }

  try {
    console.log('Auth middleware - Attempting to verify token');
    
    // Verify the token's signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token verified successfully, decoded:', { 
      userId: decoded.id,
      exp: new Date(decoded.exp * 1000).toISOString()
    });

    // Check if token has expired
    if (decoded.exp * 1000 < Date.now()) {
      console.log('Auth middleware - Token has expired');
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.'
      });
    }

    // Find the user by the ID from the token payload
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log('Auth middleware - User not found in database');
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists. Please register again.'
      });
    }

    // Attach user to request object
    req.user = user;
    console.log('Auth middleware - User authenticated successfully:', { 
      userId: user._id,
      email: user.email,
      role: user.role
    });
    next();

  } catch (error) {
    console.error('Auth middleware - Token verification failed:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred while authenticating. Please try again.'
    });
  }
});


// Middleware to grant access to specific roles (e.g., 'admin')
const authorize = (...roles) => {
  return (req, res, next) => {
    // This middleware should run *after* the `protect` middleware,
    // so req.user will always be available here.
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user data is missing');
    }

    if (!roles.includes(req.user.role)) {
      // 403 Forbidden is more appropriate than 401 Unauthorized for role issues.
      res.status(403); 
      throw new Error(
        `Forbidden: Your role (${req.user.role}) is not authorized to access this resource.`
      );
    }
    
    next();
  };
};

module.exports = { protect, authorize };