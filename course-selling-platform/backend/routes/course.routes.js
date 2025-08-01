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
  markLessonAsComplete,
  submitQuizAttempt,
  updateLessonStatus,
  generateCertificate
} = require('../controllers/course.controller');

const { protect, authorize } = require('../middleware/auth');

// Special route for featured courses
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

router.route('/:courseId/content').get(protect, getCourseContent);
router.route('/:courseId/lessons/:lessonId/complete').post(protect, markLessonAsComplete);
// router.route('/lessons/:lessonId/attempt').post(protect, submitQuizAttempt);
router.route('/lessons/:lessonId/status').post(protect, updateLessonStatus);

router.route('/:courseId/certificate').get(protect, generateCertificate);

module.exports = router;
