require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all necessary models
const User = require('../models/User');
const Category = require('../models/Category');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')        // Remove all non-word chars
    .replace(/--+/g, '-');          // Replace multiple - with single -
};
const categoriesData = [
  { name: 'Web Development', slug: 'web-development', icon: 'https://img.icons8.com/color/96/000000/html-5--v1.png' },
  { name: 'Mobile Development', slug: 'mobile-development', icon: 'https://img.icons8.com/color/96/000000/android-os.png' },
  { name: 'Data Science', slug: 'data-science', icon: 'https://img.icons8.com/color/96/000000/combo-chart--v1.png' },
  { name: 'Design', slug: 'design', icon: 'https://img.icons8.com/color/96/000000/figma--v1.png' },
  { name: 'Business', slug: 'business', icon: 'https://img.icons8.com/color/96/000000/briefcase.png' },
  { name: 'Marketing', slug: 'marketing', icon: 'https://img.icons8.com/color/96/000000/commercial.png' },
];
// --- END: THE FIX ---

const coursesData = [
  {
    title: 'Complete Web Development Bootcamp',
    description: 'Learn HTML, CSS, JavaScript, React, Node.js and more to become a full-stack web developer',
    shortDescription: 'Learn full-stack web development',
    price: 99.99, rating: 4.8, enrolled: 5280,
    image: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613',
    topics: ['Web Development', 'HTML', 'CSS', 'JavaScript', 'React'], published: true, isFeatured: true
  },
  {
    title: 'React Masterclass 2023',
    description: 'Become an expert in React.js and build complex, scalable front-end applications',
    shortDescription: 'Master React.js development',
    price: 79.99, rating: 4.9, enrolled: 3150,
    image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2',
    topics: ['Web Development', 'React', 'JavaScript'], published: true, isFeatured: true
  },
  {
    title: 'Python for Data Science',
    description: 'Learn Python, NumPy, Pandas, Matplotlib, Seaborn and more for data analysis',
    shortDescription: 'Master data analysis with Python',
    price: 89.99, rating: 4.7, enrolled: 4200,
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4',
    topics: ['Data Science', 'Python'], published: true, isFeatured: true
  },
  {
    title: 'UI/UX Design Fundamentals',
    description: 'Master user interface and user experience design principles and tools',
    shortDescription: 'Learn UI/UX design from scratch',
    price: 69.99, rating: 4.6, enrolled: 2890,
    image: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0',
    topics: ['Design', 'UI Design', 'UX Design'], published: true
  },
  {
    title: 'Mobile App Development with Flutter',
    description: 'Build cross-platform mobile apps with Flutter and Dart',
    shortDescription: 'Create mobile apps with Flutter',
    price: 84.99, rating: 4.5, enrolled: 2100,
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3',
    topics: ['Mobile Development', 'Flutter', 'Dart'], published: true
  }
];

const lmsContentTemplate = [
  {
    moduleTitle: 'Module 1: Getting Started',
    moduleOrder: 1,
    lessons: [
      {
        title: 'Welcome to the Course!',
        type: 'video',
        content: { videoId: 'cTivQXnIw0v' },
        order: 1,
      },
      {
        title: 'Course Structure Overview',
        type: 'video',
        content: { videoId: 'cTivQznIwUv' },
        order: 2,
      },
    ],
  },
  {
    moduleTitle: 'Module 2: Core Concepts & Quiz',
    moduleOrder: 2,
    lessons: [
      {
        title: 'Knowledge Check: What is HTML?',
        type: 'quiz',
        content: {
          question: 'What does HTML stand for?',
          options: ['Hyper Tool Makeup Language', 'Hyper Text Markup Language', 'Home Tool Markup Language'],
          correctAnswer: 'Hyper Text Markup Language',
        },
        order: 1,
      },
      {
        title: 'Knowledge Check: CSS Purpose',
        type: 'quiz',
        content: {
          question: 'What is the primary purpose of CSS?',
          options: ['To structure a web page', 'To handle server logic', 'To style a web page'],
          correctAnswer: 'To style a web page',
        },
        order: 2,
      },
    ],
  },
];


const seedDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in your .env file');
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    console.log('Clearing old data...');
    await User.deleteMany({ role: { $ne: 'admin' } });
    await Category.deleteMany({});
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    console.log('Data Cleared.');

    const hashedPassword = await bcrypt.hash('password123', 10);
    const instructor = await User.create({
      name: 'Test Instructor',
      email: 'instructor@test.com',
      password: hashedPassword,
      role: 'instructor',
    });
    console.log('Instructor created.');
    
    const categories = await Category.insertMany(categoriesData);
    console.log('Categories created.');
    
    const categoryMap = categories.reduce((map, cat) => ({ ...map, [cat.name]: cat._id }), {});
     const coursesToCreate = coursesData.map(course => {
      const categoryName = course.topics[0];
      return {
        ...course,
        slug: slugify(course.title), // <-- GENERATE THE SLUG HERE
        instructor: instructor._id,
        category: categoryMap[categoryName] || categoryMap['Business'],
      };
    });
    const createdCourses = await Course.insertMany(coursesToCreate);
    console.log(`${createdCourses.length} courses created.`);
    
    console.log('Seeding LMS content for each course...');
    for (const course of createdCourses) {
      for (const moduleTemplate of lmsContentTemplate) {
        const newModule = await Module.create({
          title: moduleTemplate.moduleTitle,
          course: course._id,
          order: moduleTemplate.moduleOrder,
        });

        const lessonsToCreate = moduleTemplate.lessons.map(lessonTemplate => ({
          ...lessonTemplate,
          module: newModule._id,
        }));
        
        await Lesson.insertMany(lessonsToCreate);
      }
      console.log(` -> Content seeded for course: "${course.title}"`);
    }
    
    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();