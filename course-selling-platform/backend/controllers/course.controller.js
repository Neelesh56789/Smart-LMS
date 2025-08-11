const PDFDocument = require('pdfkit');
const Course = require('../models/Course');
const Category = require('../models/Category');
const Module = require('../models/Module');
const mongoose = require('mongoose');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
  try {
    console.log('Query params:', req.query);
    
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from the main query
    const removeFields = ['select', 'sort', 'page', 'limit', 'search', 'minPrice', 'maxPrice', 'category'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Parse the query string back to an object
    let queryObj = JSON.parse(queryStr);

    // Handle category filter
    if (req.query.category) {
      try {
        const categoryName = decodeURIComponent(req.query.category);
        console.log('Searching for category:', categoryName);
        
        const category = await Category.findOne({ 
          name: { $regex: new RegExp('^' + categoryName + '$', 'i') }
        });
        
        console.log('Found category:', category);
        
        if (category) {
          queryObj.category = category._id;
        } else {
          // If category not found, return empty results
          return res.status(200).json({
            success: true,
            count: 0,
            data: []
          });
        }
      } catch (err) {
        console.error('Error finding category:', err);
        return res.status(500).json({
          success: false,
          error: 'Error processing category filter'
        });
      }
    }

    // Handle price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      queryObj.price = {};
      if (req.query.minPrice) queryObj.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) queryObj.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Finding resource
    console.log('Final query object:', queryObj);
    let query = Course.find(queryObj)
      .populate({
        path: 'category',
        select: 'name icon'
      })
      .populate({
        path: 'instructor',
        select: 'name profileImage'
      });

    // Handle search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = query.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { shortDescription: searchRegex },
          { topics: searchRegex }
        ]
      });
    }

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      console.log('Sort parameter:', req.query.sort);
      
      // Handle special sort cases
      const sortField = req.query.sort.startsWith('-') ? req.query.sort.substring(1) : req.query.sort;
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      
      // Map frontend sort values to database fields
      const sortMapping = {
        enrolled: 'enrolled',
        price: 'price',
        rating: 'rating',
        createdAt: 'createdAt',
        popularity: 'enrolled' // Add popularity mapping
      };

      if (sortMapping[sortField]) {
        const sortObj = {};
        sortObj[sortMapping[sortField]] = sortOrder;
        query = query.sort(sortObj);
      } else {
        query = query.sort('-createdAt'); // Default sort
      }
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Course.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const courses = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      pagination,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res) => {
  try {
    // Check if ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    
    let course;
    
    if (isValidObjectId) {
      // If it's a valid ObjectId, find by ID
      course = await Course.findById(req.params.id)
        .populate({
          path: 'category',
          select: 'name'
        })
        .populate({
          path: 'instructor',
          select: 'name profileImage bio'
        })
        .populate('modules');
    } else {
      // If not a valid ObjectId, try to find by slug or other field
      // This is just a placeholder, you might need to adjust based on your data
      return res.status(404).json({
        success: false,
        message: `Invalid course ID format: ${req.params.id}`
      });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (instructors and admins)
exports.createCourse = async (req, res) => {
  try {
    // Add user to req.body
    req.body.instructor = req.user.id;

    // Check if category exists
    const category = await Category.findById(req.body.category);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Create course
    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (course owner, admin)
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course not found with id of ${req.params.id}`
      });
    }

    // Make sure user is course owner or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this course`
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (course owner, admin)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course not found with id of ${req.params.id}`
      });
    }

    // Make sure user is course owner or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this course`
      });
    }

    await course.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get featured courses
// @route   GET /api/courses/featured
// @access  Public
exports.getFeaturedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isFeatured: true, published: true })
      .populate({
        path: 'category',
        select: 'name'
      })
      .populate({
        path: 'instructor',
        select: 'name profileImage'
      })
      .limit(6);

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCourseContent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ success: false, message: 'Invalid Course ID.' });
    }

    // 1. Check if the user has purchased this course
    const user = await User.findById(userId).select('purchasedCourses');
    if (!user || !user.purchasedCourses.includes(courseId)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this course.' });
    }

    // 2. Fetch the course details
    const course = await Course.findById(courseId).lean(); // Use .lean() for a plain JS object
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // --- START: THE FIX ---
    // 3. Manually and reliably fetch and assemble the content structure
    
    // Find all modules for this course, sorted by order
    const modules = await Module.find({ course: courseId }).sort({ order: 1 }).lean();
    
    // For each module, find its lessons, sorted by order
    for (let module of modules) {
      const lessons = await Lesson.find({ module: module._id }).sort({ order: 1 }).lean();
      module.lessons = lessons; // Attach the lessons array to each module object
    }
    
    // Attach the fully populated modules array to the course object
    course.modules = modules;
    // --- END: THE FIX ---

    res.status(200).json({ success: true, data: course });

  } catch (error) {
    console.error('Get Course Content Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.markLessonAsComplete = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;

    // Use $addToSet to add the lesson ID to the user's completedLessons array.
    // This prevents duplicate entries automatically.
    await User.findByIdAndUpdate(userId, {
      $addToSet: { completedLessons: lessonId },
    });
    
    // Send back the updated list of completed lessons for that user.
    const updatedUser = await User.findById(userId).select('completedLessons');

    res.status(200).json({
      success: true,
      data: updatedUser.completedLessons,
    });
  } catch (error) {
    console.error('Mark Lesson Complete Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// exports.submitQuizAttempt = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { lessonId } = req.params;
//     const { isCorrect } = req.body; // Frontend will send true or false

//     const user = await User.findById(userId);

//     // Check if an attempt for this lesson already exists
//     const existingAttempt = user.lessonStatuses.find(
//       (ls) => ls.lesson.toString() === lessonId
//     );

//     // If the user has already attempted this quiz, do nothing. We only record the first attempt.
//     if (existingAttempt) {
//       return res.status(200).json({
//         success: true,
//         message: 'Attempt already recorded.',
//         data: user.lessonStatuses,
//       });
//     }

//     // Add the new attempt status to the user's record
//     user.lessonStatuses.push({
//       lesson: lessonId,
//       status: isCorrect ? 'correct' : 'incorrect',
//     });
    
//     await user.save();

//     res.status(200).json({
//       success: true,
//       data: user.lessonStatuses,
//     });
//   } catch (error) {
//     console.error('Submit Quiz Attempt Error:', error);
//     res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };

exports.updateLessonStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;
    const { status } = req.body; // Expecting 'correct', 'incorrect', or 'completed'

    if (!['correct', 'incorrect', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    const user = await User.findById(userId);

    // Find the index of an existing status for this lesson
    const statusIndex = user.lessonStatuses.findIndex(
      (ls) => ls.lesson.toString() === lessonId
    );

    if (statusIndex > -1) {
      // If a status for this lesson already exists, UPDATE it. This is the fix.
      user.lessonStatuses[statusIndex].status = status;
    } else {
      // If it doesn't exist, ADD the new status to the array.
      user.lessonStatuses.push({ lesson: lessonId, status: status });
    }
    
    // Tell Mongoose that the nested array has been modified. This is crucial!
    user.markModified('lessonStatuses'); 
    await user.save();

    // Send back a success response
    res.status(200).json({
      success: true,
      message: 'Progress updated successfully.',
      data: user.lessonStatuses, // Send back the full list for potential debugging
    });
  } catch (error) {
    console.error('Update Lesson Status Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
// Filename: controllers/course.controller.js (REPLACE THIS FUNCTION)

exports.generateCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    // ... (Your existing verification logic for user, course, and completion is perfect and remains unchanged)
    const user = await User.findById(userId).select('name purchasedCourses lessonStatuses');
    if (!user || !user.purchasedCourses.includes(courseId)) {
        return res.status(403).json({ success: false, message: 'You do not have access to this course.' });
    }
    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    const modules = await Module.find({ course: courseId });
    const lessonIdsInCourse = (await Lesson.find({ module: { $in: modules.map(m => m._id) } })).map(l => l._id.toString());
    const totalLessons = lessonIdsInCourse.length;
    if (totalLessons === 0) {
        return res.status(400).json({ success: false, message: 'This course has no lessons.' });
    }
    const completedLessons = user.lessonStatuses
      .filter(ls => (ls.status === 'correct' || ls.status === 'completed') && lessonIdsInCourse.includes(ls.lesson.toString()))
      .map(ls => ls.lesson.toString());
    const progress = Math.round((new Set(completedLessons).size / totalLessons) * 100);
    if (progress < 100) {
        return res.status(403).json({ success: false, message: 'You must complete 100% of the course to get a certificate.' });
    }
    // ... (End of verification logic)
    
    // --- START: THE FIX FOR THE TWO-PAGE ISSUE ---

    // 1. GENERATE THE PDF with controlled margins
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margins: { // Define smaller margins for more space
        top: 40,
        bottom: 40,
        left: 50,
        right: 50,
      }
    });

    // Set headers to stream the PDF to the client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="certificate-${course.slug}.pdf"`);
    doc.pipe(res);

    // --- Start Designing the Certificate with ABSOLUTE POSITIONING ---

    // Add a background color (optional)
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#F0F7FF');

    // 2. Use specific Y coordinates instead of multiple moveDown() calls
    const centerOfPage = doc.page.width / 2;
    const textOptions = { align: 'center', width: doc.page.width - 100 };

    // Certificate Title (y=60)
    doc.fontSize(50).fillColor('#0A2540').font('Helvetica-Bold').text('Certificate of Completion', 50, 60, textOptions);
    
    // "Presented to" text (y=160)
    doc.fontSize(20).fillColor('#334155').font('Helvetica').text('This certificate is proudly presented to', 50, 160, textOptions);

    // User's Name (y=200)
    doc.fontSize(40).fillColor('#2563EB').font('Helvetica-BoldOblique').text(user.name, 50, 200, textOptions);

    // "For completing" text (y=260)
    doc.fontSize(20).fillColor('#334155').font('Helvetica').text('for successfully completing the course', 50, 260, textOptions);
    
    // Course Name (y=290)
    doc.fontSize(28).fillColor('#1E293B').font('Helvetica-Bold').text(`"${course.title}"`, 50, 290, textOptions);

    // Position the bottom elements relative to the page height
    const bottomY = doc.page.height - 120;

    // Date
    const completionDate = new Date().toLocaleDate-string('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.fontSize(16).fillColor('#475569').font('Helvetica').text(`Issued on: ${completionDate}`, 50, bottomY, textOptions);

    // Signature Line
    doc.lineWidth(1).moveTo(centerOfPage - 100, bottomY + 50).lineTo(centerOfPage + 100, bottomY + 50).stroke('#334155');

    // Signature/Brand Name
    doc.fontSize(16).fillColor('#334155').text('Smart LMS', centerOfPage - 50, bottomY + 35, {
        align: 'center',
        width: 100
    });
    
    // --- End Designing ---

    // Finalize the PDF and end the stream
    doc.end();
    // --- END: THE FIX ---

  } catch (error) {
    console.error('Generate Certificate Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};