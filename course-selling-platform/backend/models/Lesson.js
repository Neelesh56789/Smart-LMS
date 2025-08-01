const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a lesson title'],
    trim: true,
  },
  module: {
    type: mongoose.Schema.ObjectId,
    ref: 'Module',
    required: true,
  },
  type: {
    type: String,
    enum: ['video', 'quiz'],
    required: true,
  },
  // Flexible content field
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Lesson', LessonSchema);