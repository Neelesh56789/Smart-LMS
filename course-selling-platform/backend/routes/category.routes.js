const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryCourses
} = require('../controllers/category.controller');

const { protect, authorize } = require('../middleware/auth');
const { getCourses } = require('../controllers/course.controller');

// Set getCourses for category courses
router.use((req, res, next) => {
  res.locals.getCourses = getCourses;
  next();
});

router
  .route('/')
  .get(getCategories)
  .post(protect, authorize('admin'), createCategory);

router
  .route('/:id')
  .get(getCategory)
  .put(protect, authorize('admin'), updateCategory)
  .delete(protect, authorize('admin'), deleteCategory);

router.get('/:id/courses', getCategoryCourses);

module.exports = router;
