const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a course title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  originalPrice: {
    type: Number
  },
  image: {
    type: String,
    default: 'no-image.jpg'
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: true
  },
  instructor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  published: {
    type: Boolean,
    default: true 
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number, // In minutes
    default: 0
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  topics: [String],
  prerequisites: [String],
  objectives: [String],
  demoVideo: {
    type: String
  },
  ratings: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must not be more than 5'],
    default: 4
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must not be more than 5'],
    default: 4
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  enrolled: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create course slug from the title
CourseSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Allow letters, numbers, spaces, and hyphens
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with a single hyphen
      .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
  }
  next();
});

// Cascade delete modules and lessons when a course is deleted
CourseSchema.pre('remove', async function(next) {
  await this.model('Module').deleteMany({ course: this._id });
  next();
});

// Reverse populate with modules
CourseSchema.virtual('modules', {
  ref: 'Module',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

module.exports = mongoose.model('Course', CourseSchema);