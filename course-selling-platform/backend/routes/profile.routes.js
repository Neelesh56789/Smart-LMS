const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  updatePassword,
  getPurchasedCourses
} = require('../controllers/profile.controller');
const upload = require('../middleware/upload');

const { protect } = require('../middleware/auth');

router.use(protect); // All profile routes are protected

router.route('/')
  .get(getProfile)
  .put(updateProfile);

router.put('/photo', upload, updateProfilePhoto);

router.put('/password', updatePassword);
router.get('/courses', getPurchasedCourses);
router.put('/', protect, updateProfile);

module.exports = router;
