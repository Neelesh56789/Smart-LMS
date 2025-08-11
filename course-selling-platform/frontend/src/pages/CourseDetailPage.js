import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCourse } from '../redux/slices/courseSlice';
import { addToCart, getCart } from '../redux/slices/cartSlice';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import { BsPeople, BsClockHistory } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { useStripe } from '@stripe/react-stripe-js';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api',
  withCredentials: true,
});



/**
 * CourseDetailPage component displays detailed information about a specific course,
 * including its image, title, rating, description, instructor, topics, modules, and lessons.
 * 
 * It allows users to:
 * - Add the course to their cart (with authentication and loading guards)
 * - Buy the course immediately (navigates to checkout with the course)
 * - View course content in an expandable/collapsible format
 * - See pricing, discounts, and course features
 * 
 * State management is handled via Redux for course, cart, and authentication data.
 * 
 * @component
 * @returns {JSX.Element} The rendered course detail page.
 */
const CourseDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { course, loading } = useSelector(state => state.courses);
  const { isAuthenticated } = useSelector(state => state.auth);
  const { cart } = useSelector(state => state.cart);
  
  const [isInCart, setIsInCart] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const renderStarRating = (rating) => {
    if (!rating) return Array(5).fill(<FaRegStar key={Math.random()} className="text-yellow-400 w-4 h-4" />);
    
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

  useEffect(() => {
    if (id) {
      dispatch(getCourse(id));
    }
    if(isAuthenticated) {
      dispatch(getCart());
    }
  }, [dispatch, id, isAuthenticated]);

  useEffect(() => {
    if (cart?.items && course?._id) {
      const courseInCart = cart.items.some(item => 
        (item.course?._id === course._id) || 
        (typeof item.course === 'string' && item.course === course._id)
      );
      setIsInCart(!!courseInCart);
    }
  }, [cart, course]);

  const handleAddToCart = async () => {
    // --- START: THE FIX ---
    
    // 1. More Robust Guard Clause: Explicitly check for course and its ID before doing anything.
    if (!course || !course._id) {
        toast.error("Course data is not available yet. Please wait a moment and try again.");
        return;
    }
    
    if (isInCart) {
      navigate('/cart');
      return;
    }
    
    if (!isAuthenticated) {
      toast.info('Please login to add courses to your cart.');
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    if (isAddingToCart) return;

    setIsAddingToCart(true);
    try {
      // The course._id is now guaranteed to be valid here
      await dispatch(addToCart(course._id)).unwrap();
      toast.success('Course added to cart!');
      setIsInCart(true);
    } catch (error) {
      // 2. Improved Error Logging: 'error' from unwrap() contains the message from the backend.
      console.error("Add to cart failed:", error); // Log the detailed error to the console
      toast.error(error || 'Failed to add course to cart.'); // Display the specific error to the user
      
    } finally {
      setIsAddingToCart(false);
    }
    
    // --- END: THE FIX ---
  };

  const stripe = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.info('Please login to purchase courses.');
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }
    if (!course) {
      toast.error('Course details not loaded yet.');
      return;
    }
    
    // Create a temporary "cart item" structure for a single purchase
    const buyNowItem = {
      course: course,
      price: course.price,
      quantity: 1,
    };
    
    // Navigate to the checkout page and pass this single item in the state
    navigate('/checkout', { state: { items: [buyNowItem] } });
  };


  // Loading and not-found guards prevent rendering the button before data is ready
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center">Course not found or failed to load.</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Course info - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Course Image */}
              <div className="relative h-96">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Course Header */}
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
                
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4">
                  <div className="flex items-center">
                    <div className="flex mr-2">{renderStarRating(course.rating)}</div>
                    <span className="text-yellow-600 font-medium">{course.rating?.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <div className="flex items-center text-gray-600">
                    <BsPeople className="mr-1.5" />
                    <span>{course.enrolled?.toLocaleString()} students enrolled</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{course.description}</p>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-500">
                    Created by <span className="font-medium text-blue-600">
                      {typeof course.instructor === 'object' ? course.instructor.name : 'Unknown Instructor'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Course Content */}
              <div className="border-t border-gray-200 p-8">
                <h3 className="text-xl font-semibold mb-6">What you'll learn</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {course.topics?.map((topic, index) => (
                    <div key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600">{topic}</span>
                    </div>
                  ))}
                </div>

                <h3 className="text-xl font-semibold mb-4">Course Content</h3>
                <div className="space-y-4">
                  {course.modules?.map((module, moduleIndex) => (
                    <div key={module._id || moduleIndex} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setActiveSection(activeSection === moduleIndex ? -1 : moduleIndex)}
                        className="w-full p-4 text-left font-medium bg-gray-50 hover:bg-gray-100 focus:outline-none flex justify-between items-center"
                      >
                        <span>{module.title}</span>
                        <svg
                          className={`w-5 h-5 transform transition-transform ${activeSection === moduleIndex ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {activeSection === moduleIndex && (
                        <div className="p-4 bg-white border-t">
                          <ul className="space-y-2">
                            {module.lessons?.map((lesson) => (
                              <li key={lesson._id} className="flex items-center text-gray-600 text-sm">
                                <span className="mr-3 text-gray-400">
                                  {lesson.type === 'video' ? '▶️' : '❓'}
                                </span>
                                {lesson.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Purchase card - Takes up 1 column */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <div className="mb-6">
                <p className="text-3xl font-bold text-gray-900">${course.price?.toFixed(2)}</p>
                {course.originalPrice && course.originalPrice > course.price && (
                  <div className="flex items-center mt-1">
                    <p className="text-lg text-gray-500 line-through mr-2">${course.originalPrice.toFixed(2)}</p>
                    <p className="text-sm text-green-600 font-medium">
                      {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% off
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingToCart ? 'Adding...' : isInCart ? 'Go to Cart' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isAddingToCart}
                  className="block w-full bg-white text-blue-600 text-center px-6 py-3 rounded-md border-2 border-blue-600 hover:bg-blue-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">This course includes:</h4>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-600">
                    <BsClockHistory className="mr-2" />
                    <span>Full lifetime access</span>
                  </li>
                  <li className="flex items-center text-gray-600">
                    <BsPeople className="mr-2" />
                    <span>{course.enrolled?.toLocaleString()} students</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;