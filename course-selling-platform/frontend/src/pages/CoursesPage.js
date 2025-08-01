import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import { getCourses, getCategories } from '../redux/slices/courseSlice';

const CoursesPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  // Get category from URL params
  const categoryFromUrl = searchParams.get('category');
  
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
  const [sortBy, setSortBy] = useState('popularity');
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 8;
  
  const { courses, categories, loading } = useSelector(state => state.courses);

  const [totalPages, setTotalPages] = useState(1);

  // Fetch courses from backend
  const fetchCourses = useCallback(async () => {
    try {
      // Build query params
      const params = {
        page: currentPage,
        limit: coursesPerPage,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: searchTerm || undefined,
        minPrice: priceRange.min > 0 ? priceRange.min : undefined,
        maxPrice: priceRange.max < 500 ? priceRange.max : undefined,
        sort: (() => {
          switch (sortBy) {
            case 'priceAsc':
              return 'price';
            case 'priceDesc':
              return '-price';
            case 'rating':
              return '-rating';
            case 'newest':
              return '-createdAt';
            case 'popularity':
            default:
              return '-enrolled';
          }
        })(),
        
        // Pagination
        page: currentPage,
        limit: coursesPerPage
      };

      // Remove undefined values
      Object.keys(params).forEach(key => 
        params[key] === undefined && delete params[key]
      );

      // Dispatch the getCourses action which will handle loading states
      dispatch(getCourses(params))
        .then(action => {
          if (action.payload?.total) {
            setTotalPages(Math.ceil(action.payload.total / coursesPerPage));
          }
        });
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }, [dispatch, selectedCategory, searchTerm, priceRange, sortBy, currentPage, coursesPerPage]);

  // Initial fetch and category setup
  useEffect(() => {
    fetchCourses();
    dispatch(getCategories()); // Fetch categories
  }, [fetchCourses, dispatch]);

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  // Handle category filter
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when changing category
    
    // Update URL query params
    const params = new URLSearchParams(location.search);
    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    navigate({ search: params.toString() });
  };

  // Handle search with debounce
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle price range
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({
      ...prev,
      [name]: parseInt(value)
    }));
    setCurrentPage(1); // Reset to first page when changing price range
  };

  // Handle sort
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1); // Reset to first page when changing sort
  };

  // Handle pagination
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading state component
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          {/* Add loading skeleton UI here */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-gray-200 h-96 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Function to render star ratings
  const renderStarRating = (rating) => {
    if (!rating) return Array(5).fill(<FaRegStar key={Math.random()} className="text-yellow-400 w-4 h-4" />);
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400 w-4 h-4" />);
    }

    // Add half star if necessary
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400 w-4 h-4" />);
    }

    // Add empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400 w-4 h-4" />);
    }

    return stars;
  };

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Explore Courses</h1>
          <p className="text-gray-600">Discover top-quality courses to help you master in-demand skills</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Search</h2>
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </form>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Categories</h2>
                <div className="space-y-2">
                  <div 
                    className={`cursor-pointer py-2 px-3 rounded-md ${selectedCategory === 'All' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    onClick={() => handleCategoryChange('All')}
                  >
                    All Categories
                  </div>
                  {categories && categories.map(category => (
                    <div
                      key={category.id}
                      className={`cursor-pointer py-2 px-3 rounded-md ${selectedCategory === category.name ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                      onClick={() => handleCategoryChange(category.name)}
                    >
                      {category.name} <span className="text-gray-500 text-sm">({category.count})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Price Range</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>${priceRange.min}</span>
                    <span>${priceRange.max}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Min</label>
                      <input
                        type="number"
                        name="min"
                        min="0"
                        max={priceRange.max}
                        value={priceRange.min}
                        onChange={handlePriceChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Max</label>
                      <input
                        type="number"
                        name="max"
                        min={priceRange.min}
                        value={priceRange.max}
                        onChange={handlePriceChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Listings */}
          <div className="lg:w-3/4">
            {/* Sorting and results count */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-600 mb-4 sm:mb-0">
                Showing {courses?.length || 0} courses
              </p>
              <div className="flex items-center">
                <label htmlFor="sort" className="mr-2 text-gray-600">Sort by:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={handleSortChange}
                  className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 focus:outline-none"
                >
                  <option value="popularity">Popularity</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* No results message */}
            {!loading && (!courses || courses.length === 0) && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No courses found</h3>
                <p className="mt-2 text-gray-500">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setPriceRange({ min: 0, max: 500 });
                  }}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Course grid */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses && courses.map(course => (
                  <div key={course.id} className="course-card">
                    <div className="relative h-48">
                      <img 
                        src={course.image} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                        {course.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-xl mb-2 line-clamp-2">
                        <Link to={`/courses/${course._id}`} className="hover:text-blue-600">
                          {course.title}
                        </Link>
                      </h3>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center mb-3">
                        <div className="flex">
                          {renderStarRating(course.rating)}
                        </div>
                        <span className="text-gray-600 text-sm ml-2">
                          ({course.ratingCount.toLocaleString()})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-700 font-bold">
                          ${course.price.toFixed(2)}
                        </p>
                        <Link 
                          to={`/courses/${course.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md mr-2 ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    // Show limited page numbers with ellipsis
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1 rounded-md mx-1 ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                    
                    // Add ellipsis
                    if (
                      (page === currentPage - 2 && page > 1) ||
                      (page === currentPage + 2 && page < totalPages)
                    ) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    
                    return null;
                  })}
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md ml-2 ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;