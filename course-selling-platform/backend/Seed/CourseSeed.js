require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Category = require('../models/Category');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/edustream', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const categoriesData = [
  {
    name: 'Web Development',
    slug: 'web-development',
    icon: 'https://img.icons8.com/color/96/000000/html-5--v1.png'
  },
  {
    name: 'Mobile Development',
    slug: 'mobile-development',
    icon: 'https://img.icons8.com/color/96/000000/android-os.png'
  },
  {
    name: 'Data Science',
    slug: 'data-science',
    icon: 'https://img.icons8.com/color/96/000000/combo-chart--v1.png'
  },
  {
    name: 'Design',
    slug: 'design',
    icon: 'https://img.icons8.com/color/96/000000/figma--v1.png'
  },
  {
    name: 'Business',
    slug: 'business',
    icon: 'https://img.icons8.com/color/96/000000/briefcase.png'
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    icon: 'https://img.icons8.com/color/96/000000/commercial.png'
  }
];

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-');
};

const coursesData = [
  {
    title: 'Complete Web Development Bootcamp',
    slug: 'complete-web-development-bootcamp',
    description: 'Learn HTML, CSS, JavaScript, React, Node.js and more to become a full-stack web developer',
    shortDescription: 'Learn full-stack web development',
    price: 99.99,
    rating: 4.8,
    ratingCount: 1250,
    enrolled: 5280,
    image: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    topics: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Web Development'],
    published: true,
    isFeatured: true
  },
  {
    title: 'React Masterclass 2023',
    slug: 'react-masterclass-2023',
    description: 'Become an expert in React.js and build complex, scalable front-end applications',
    shortDescription: 'Master React.js development',
    price: 79.99,
    rating: 4.9,
    ratingCount: 823,
    enrolled: 3150,
    image: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    topics: ['React', 'JavaScript', 'Redux', 'Web Development'],
    published: true,
    isFeatured: true
  },
  {
    title: 'Python for Data Science',
    slug: 'python-for-data-science',
    description: 'Learn Python, NumPy, Pandas, Matplotlib, Seaborn and more for data analysis',
    shortDescription: 'Master data analysis with Python',
    price: 89.99,
    rating: 4.7,
    ratingCount: 950,
    enrolled: 4200,
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80',
    topics: ['Python', 'Data Science', 'Machine Learning'],
    published: true,
    isFeatured: true
  },
  {
    title: 'UI/UX Design Fundamentals',
    slug: 'ui-ux-design-fundamentals',
    description: 'Master user interface and user experience design principles and tools',
    shortDescription: 'Learn UI/UX design from scratch',
    price: 69.99,
    rating: 4.6,
    ratingCount: 720,
    enrolled: 2890,
    image: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80',
    topics: ['UI Design', 'UX Design', 'Figma', 'Adobe XD'],
    published: true
  },
  {
    title: 'Mobile App Development with Flutter',
    slug: 'mobile-app-development-with-flutter',
    description: 'Build cross-platform mobile apps with Flutter and Dart',
    shortDescription: 'Create mobile apps with Flutter',
    price: 84.99,
    rating: 4.5,
    ratingCount: 610,
    enrolled: 2100,
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
    topics: ['Flutter', 'Dart', 'Mobile Development'],
    published: true
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Connected to MongoDB, starting seed...');

    // Clear existing data
    await Course.deleteMany({});
    await Category.deleteMany({});
    
    console.log('Cleared existing data...');

    // Create categories
    console.log('Creating categories...');
    const categories = await Category.insertMany(categoriesData);
    console.log(`Created ${categories.length} categories`);

    // Create a test instructor if doesn't exist
    let instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      instructor = await User.create({
        name: 'Test Instructor',
        email: 'instructor@test.com',
        password: hashedPassword,
        role: 'instructor'
      });
      console.log('Created test instructor');
    }

    // Create category name to ID mapping
    const categoryMap = categories.reduce((map, category) => {
      map[category.name] = category._id;
      return map;
    }, {});

    // Add categories and instructor to courses
    const coursesWithRefs = coursesData.map(course => {
      let categoryName = 'Business'; // Default category

      if (course.topics.some(topic => ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Web Development'].includes(topic))) {
        categoryName = 'Web Development';
      } else if (course.topics.some(topic => ['Flutter', 'Dart', 'Mobile Development', 'iOS', 'Android'].includes(topic))) {
        categoryName = 'Mobile Development';
      } else if (course.topics.some(topic => ['Data Science', 'Machine Learning', 'Python', 'AI', 'Statistics'].includes(topic))) {
        categoryName = 'Data Science';
      } else if (course.topics.some(topic => ['UI Design', 'UX Design', 'Figma', 'Design', 'Adobe XD'].includes(topic))) {
        categoryName = 'Design';
      } else if (course.topics.some(topic => ['Digital Marketing', 'Marketing', 'SEO', 'Social Media'].includes(topic))) {
        categoryName = 'Marketing';
      }

      if (!categoryMap[categoryName]) {
        throw new Error(`Category ${categoryName} not found in categoryMap`);
      }

      return {
        ...course,
        category: categoryMap[categoryName],
        instructor: instructor._id
      };
    });

    // Create courses
    const createdCourses = await Course.insertMany(coursesWithRefs);
    console.log(`Created ${createdCourses.length} courses`);

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
