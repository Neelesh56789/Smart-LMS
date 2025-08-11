// Filename: routes/course.routes.js (REPLACE ENTIRE FILE)

const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getFeaturedCourses,
  getCourseContent,
  updateLessonStatus, // We only need this one for progress
  generateCertificate
} = require('../controllers/course.controller');

const { protect, authorize } = require('../middleware/auth');

// --- Public & General Course Routes ---
router.get('/featured', getFeaturedCourses);

router
  .route('/')
  .get(getCourses)
  .post(protect, authorize('instructor', 'admin'), createCourse);

router
  .route('/:id')
  .get(getCourse)
  .put(protect, authorize('instructor', 'admin'), updateCourse)
  .delete(protect, authorize('instructor', 'admin'), deleteCourse);

// --- Learning & Content-Specific Routes (All Protected) ---
router.route('/:courseId/content').get(protect, getCourseContent);

// This is now the SINGLE, RELIABLE route for all progress updates
router.route('/lessons/:lessonId/status').post(protect, updateLessonStatus);

router.route('/:courseId/certificate').get(protect, generateCertificate);

module.exports = router;