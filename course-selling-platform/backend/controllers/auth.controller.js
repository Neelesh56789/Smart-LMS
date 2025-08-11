const User = require('../models/User');
const jwt = require('jsonwebtoken');
const transporter = require('../config/emailConfig');
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    // Create user
    user = await User.create({
      name,
      email,
      password,
      role: role || 'student'
    });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Validation
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide an email and password' });
  }

  // 2. Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // 3. Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // 4. If everything is okay, send the token response
  sendTokenResponse(user, 200, res);
});
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  console.log(req);
  try {
    const user = await User.findById(req.query.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Clear the cookie by setting it to expire immediately
    res.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    // localStorage.clear();
    res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Create password reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
    // Send the email
    try {
      await transporter.sendMail(mailOptions);
      console.log('Password reset email sent to:', email);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      throw new Error('Failed to send password reset email');
    }
    res.status(200).json({
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      message: 'Error sending password reset email'
    });
  }
};
// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }
    // Update password
    user.password = password;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Token is invalid or has expired'
    });
  }
};
// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token with same expiration as cookie
  const expiresIn = process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000;
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn }
  );
  const options = {
    expires: new Date(Date.now() + expiresIn),
    httpOnly: true,
    sameSite: 'strict'
  };
  // Use secure cookies in production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  // Return only necessary user info
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: token
  };
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      user: userResponse
    });
};