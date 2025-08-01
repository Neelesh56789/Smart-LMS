const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Hides password from default queries
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  profileImage: {
    type: String,
    default: 'default-profile.jpg'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  phone: {
    type: String,
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  },
  address: {
    type: String,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  
  // Fields for Advanced Features
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // --- Fields for LMS Functionality ---
  purchasedCourses: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Course'
  }],

  // --- START: THE FIX ---
  // Replaced 'completedLessons' with 'lessonStatuses' to store more detailed progress.
  // This allows us to track if a quiz was answered correctly or incorrectly.
  lessonStatuses: [{
    lesson: { 
      type: mongoose.Schema.ObjectId, 
      ref: 'Lesson', 
      required: true 
    },
    status: {
      type: String,
      enum: ['correct', 'incorrect', 'completed'],
      required: true
    }
  }],
  // --- END: THE FIX ---
  
  // These fields are well-structured for future expansion
  socialLinks: {
    website: String,
    twitter: String,
    linkedin: String,
    github: String
  },
  education: [{
    school: String,
    degree: String,
    fieldOfStudy: String,
    from: Date,
    to: Date,
    current: Boolean,
    description: String
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// --- MONGOOSE MIDDLEWARE AND METHODS ---

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to sign a JWT and return it
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Method to match user-entered password to the hashed password in the database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);