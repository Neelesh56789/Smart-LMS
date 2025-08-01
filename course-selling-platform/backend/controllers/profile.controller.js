const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get logged-in user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    // --- START: THE FIX ---
    // The 'protect' middleware already found the user and attached it to the request object.
    // We should use req.user.id, which is secure and reliable.
    const user = await User.findById(req.user.id).select('-password'); // Exclude password
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // --- END: THE FIX ---

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    // The fields to update are in req.body. Let's be specific about what can be updated.
    const { name, bio, phone, address } = req.body;
    const fieldsToUpdate = { name, bio, phone, address };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate, // Use the specific fields
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};


exports.updateProfilePhoto = async (req, res) => {
  try {
    // req.file is added by the 'upload' multer middleware
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: req.file.filename }, // Save the generated filename to the user's profile
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Update Photo Error:', error);
    // Handle multer-specific errors
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Image is too large (Max 2MB)' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user's purchased courses
// @route   GET /api/profile/courses
// @access  Private
exports.getPurchasedCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('purchasedCourses');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      count: user.purchasedCourses.length,
      data: user.purchasedCourses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/profile/password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
    }

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};