import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';

const CreateCoursePage = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    level: 'beginner',
    price: '',
    thumbnail: null,
    requirements: [''],
    outcomes: [''],
    isPaid: true,
    discountPrice: '',
    isDiscount: false,
    durationHours: '',
    durationMinutes: ''
  });
  
  useEffect(() => {
    // Check if user is instructor
    if (user && user.role !== 'instructor' && user.role !== 'admin') {
      toast.error('You do not have permission to access this page');
      navigate('/');
      return;
    }
    
    // Fetch categories
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories');
        setCategories(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load categories');
      }
    };
    
    fetchCategories();
  }, [user, navigate]);
  
  // Placeholder categories for development
  const placeholderCategories = [
    { _id: '1', name: 'Web Development' },
    { _id: '2', name: 'Mobile Development' },
    { _id: '3', name: 'Data Science' },
    { _id: '4', name: 'Design' },
    { _id: '5', name: 'Business' },
    { _id: '6', name: 'Marketing' },
    { _id: '7', name: 'IT & Software' },
    { _id: '8', name: 'Personal Development' }
  ];
  
  const displayCategories = categories.length > 0 ? categories : placeholderCategories;
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: e.target.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleThumbnailChange = (e) => {
    if (e.target.files[0]) {
      setFormData({
        ...formData,
        thumbnail: e.target.files[0]
      });
      
      // Create thumbnail preview
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleArrayChange = (index, field, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [field]: newArray
    });
  };
  
  const addArrayItem = (field) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    });
  };
  
  const removeArrayItem = (field, index) => {
    if (formData[field].length > 1) {
      const newArray = [...formData[field]];
      newArray.splice(index, 1);
      setFormData({
        ...formData,
        [field]: newArray
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate form
      if (!formData.title.trim()) {
        toast.error('Course title is required');
        setLoading(false);
        return;
      }
      
      if (!formData.description.trim()) {
        toast.error('Course description is required');
        setLoading(false);
        return;
      }
      
      if (!formData.category) {
        toast.error('Please select a category');
        setLoading(false);
        return;
      }
      
      if (formData.isPaid && (!formData.price || formData.price <= 0)) {
        toast.error('Please enter a valid price');
        setLoading(false);
        return;
      }
      
      // Create form data
      const courseData = new FormData();
      courseData.append('title', formData.title);
      courseData.append('subtitle', formData.subtitle);
      courseData.append('description', formData.description);
      courseData.append('category', formData.category);
      courseData.append('level', formData.level);
      courseData.append('isPaid', formData.isPaid);
      
      if (formData.isPaid) {
        courseData.append('price', formData.price);
        
        if (formData.isDiscount && formData.discountPrice) {
          courseData.append('isDiscount', formData.isDiscount);
          courseData.append('discountPrice', formData.discountPrice);
        }
      }
      
      // Add duration
      if (formData.durationHours || formData.durationMinutes) {
        const hours = parseInt(formData.durationHours) || 0;
        const minutes = parseInt(formData.durationMinutes) || 0;
        const totalMinutes = (hours * 60) + minutes;
        courseData.append('durationMinutes', totalMinutes);
      }
      
      // Add thumbnail if selected
      if (formData.thumbnail) {
        courseData.append('thumbnail', formData.thumbnail);
      }
      
      // Add requirements and outcomes
      formData.requirements.forEach((req, index) => {
        if (req.trim()) {
          courseData.append(`requirements[${index}]`, req);
        }
      });
      
      formData.outcomes.forEach((outcome, index) => {
        if (outcome.trim()) {
          courseData.append(`outcomes[${index}]`, outcome);
        }
      });
      
      // Save as draft
      courseData.append('status', 'draft');
      
      // Submit to API
      const res = await axios.post('/api/instructor/courses', courseData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Course created successfully! You can now add content.');
      navigate(`/instructor/courses/${res.data._id}/content`);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Failed to create course'
      );
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Course</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
                  Course Title*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Complete Web Development Bootcamp"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="subtitle">
                  Course Subtitle
                </label>
                <input
                  type="text"
                  id="subtitle"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Learn HTML, CSS, JavaScript, React, Node.js and more"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="description">
                  Course Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Provide a detailed description of your course"
                  required
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="category">
                    Category*
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {displayCategories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="level">
                    Level*
                  </label>
                  <select
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="all-levels">All Levels</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Course Thumbnail
                </label>
                <div className="flex items-center">
                  <div className="w-40 h-24 bg-gray-100 rounded-md overflow-hidden mr-4 border border-gray-300">
                    {thumbnailPreview ? (
                      <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="btn-secondary cursor-pointer">
                      <span>Upload Thumbnail</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleThumbnailChange} 
                        accept="image/*"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Recommended size: 1280x720 pixels</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <p className="text-gray-600 mb-3">List the requirements or prerequisites for taking your course</p>
              
              {formData.requirements.map((requirement, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleArrayChange(index, 'requirements', e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={`Requirement ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('requirements', index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                    disabled={formData.requirements.length <= 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => addArrayItem('requirements')}
                className="flex items-center text-primary-600 hover:text-primary-700 mt-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="ml-1">Add Requirement</span>
              </button>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Learning Outcomes</h2>
              <p className="text-gray-600 mb-3">What will students learn in your course?</p>
              
              {formData.outcomes.map((outcome, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) => handleArrayChange(index, 'outcomes', e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={`Outcome ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('outcomes', index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                    disabled={formData.outcomes.length <= 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => addArrayItem('outcomes')}
                className="flex items-center text-primary-600 hover:text-primary-700 mt-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="ml-1">Add Outcome</span>
              </button>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Course Duration</h2>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="durationHours">
                    Hours
                  </label>
                  <input
                    type="number"
                    id="durationHours"
                    name="durationHours"
                    min="0"
                    value={formData.durationHours}
                    onChange={handleChange}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="durationMinutes">
                    Minutes
                  </label>
                  <input
                    type="number"
                    id="durationMinutes"
                    name="durationMinutes"
                    min="0"
                    max="59"
                    value={formData.durationMinutes}
                    onChange={handleChange}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Pricing</h2>
              
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="isPaid"
                  name="isPaid"
                  checked={formData.isPaid}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isPaid" className="ml-2 block text-gray-700">
                  This is a paid course
                </label>
              </div>
              
              {formData.isPaid && (
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="price">
                        Regular Price ($)*
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., 49.99"
                        required={formData.isPaid}
                      />
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id="isDiscount"
                          name="isDiscount"
                          checked={formData.isDiscount}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isDiscount" className="ml-2 block text-gray-700">
                          Add discount price
                        </label>
                      </div>
                      
                      {formData.isDiscount && (
                        <div>
                          <label className="block text-gray-700 font-medium mb-2" htmlFor="discountPrice">
                            Discount Price ($)
                          </label>
                          <input
                            type="number"
                            id="discountPrice"
                            name="discountPrice"
                            min="0"
                            step="0.01"
                            value={formData.discountPrice}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., 39.99"
                            required={formData.isDiscount}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/instructor/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;
