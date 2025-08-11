import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getFeaturedCourses, getCategories } from '../redux/slices/courseSlice';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';

const HomePage = () => {
  const dispatch = useDispatch();
  const { featuredCourses, categories, loading } = useSelector(state => state.courses);

  useEffect(() => {
    // Fetch both featured courses and categories
    const fetchData = async () => {
      try {
        const featuredResult = await dispatch(getFeaturedCourses());
        const categoriesResult = await dispatch(getCategories());
        console.log('Featured Courses:', featuredResult.payload);
        console.log('Categories:', categoriesResult.payload);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [dispatch]);

  const renderStarRating = (rating) => {
    if (!rating) return Array(5).fill().map((_, i) => <FaRegStar key={i} className="text-yellow-400 w-4 h-4" />);
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400 w-4 h-4" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400 w-4 h-4" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400 w-4 h-4" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-20 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Elevate Your Skills with Expert-Led Courses
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of students learning in-demand skills. Start your learning journey today.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/courses" className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition duration-300">
                Browse Courses
              </Link>
              {/* <Link to="/register" className="inline-block bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-300">
                Sign Up Free
              </Link> */}
            </div>
          </div>
          <div className="md:w-1/2 md:pl-10">
            <img 
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&amp;ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&amp;auto=format&amp;fit=crop&amp;w=1170&amp;q=80" 
              alt="Learning online" 
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Browse Categories</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover a wide range of courses across popular categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {(categories || []).map(category => (
              <Link 
                key={category._id}
                to={`/courses?category=${encodeURIComponent(category.name)}`}
                className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-all duration-300"
              >
                <img 
                  src={category.icon} 
                  alt={category.name} 
                  className="w-16 h-16 mx-auto mb-4"
                />
                <h3 className="font-medium text-lg mb-1">{category.name}</h3>
                <p className="text-gray-500 text-sm">{category.count || 0} courses</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Featured Courses</h2>
              <p className="text-gray-600">Hand-picked courses recommended by our team</p>
            </div>
            <Link to="/courses" className="text-blue-600 hover:text-blue-800 font-medium">
              View All Courses →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(featuredCourses || []).map(course => (
              <div key={course._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative h-48">
                  <img 
                    src={course.image || 'https://via.placeholder.com/400x300'} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                    {course.category?.name || 'Uncategorized'}
                  </div>
                </div>
                <div className="p-6">
                  <Link to={`/courses/${course._id}`} className="block">
                    <h3 className="font-bold text-xl mb-2 hover:text-blue-600 transition-colors duration-300">
                      {course.title}
                    </h3>
                  </Link>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center mb-3">
                    <div className="flex">
                      {renderStarRating(course.rating)}
                    </div>
                    <span className="text-gray-600 text-sm ml-2">
                      ({course.ratingCount?.toLocaleString() || 0})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-700 font-bold">${course.price?.toFixed(2) || '0.00'}</p>
                    <span className="text-gray-500 text-sm">{course.instructor?.name || 'Unknown Instructor'}</span>
                  </div>
                </div>
              </div>
            ))}
            {!loading && (!featuredCourses || featuredCourses.length === 0) && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No featured courses available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Learning?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our community of learners and boost your career with in-demand skills
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/courses" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition duration-300">
              Explore Courses
            </Link>
            {/* <Link to="/register" className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition duration-300">
              Sign Up Now
            </Link> */}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
