import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';

const CourseContentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingSectionId, setAddingSectionId] = useState(null);
  const [addingLessonToSectionId, setAddingLessonToSectionId] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newLesson, setNewLesson] = useState({
    title: '',
    type: 'video',
    content: '',
    videoUrl: '',
    duration: '',
    isPreview: false,
    file: null
  });
  const [expandedSections, setExpandedSections] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  
  useEffect(() => {
    // Check if user is instructor
    if (user && user.role !== 'instructor' && user.role !== 'admin') {
      toast.error('You do not have permission to access this page');
      navigate('/');
      return;
    }
    
    const fetchCourseContent = async () => {
      try {
        setLoading(true);
        // Fetch course details
        const courseRes = await axios.get(`/api/instructor/courses/${id}`);
        setCourse(courseRes.data);
        
        // Fetch course sections and lessons
        const sectionsRes = await axios.get(`/api/instructor/courses/${id}/sections`);
        setSections(sectionsRes.data);
        
        // Initialize expanded sections
        const expanded = {};
        sectionsRes.data.forEach(section => {
          expanded[section._id] = true;
        });
        setExpandedSections(expanded);
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        toast.error('Failed to load course content');
      }
    };
    
    fetchCourseContent();
  }, [id, user, navigate]);
  
  // Placeholder data for development
  const placeholderCourse = {
    _id: id,
    title: 'Complete Web Development Bootcamp',
    thumbnail: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    status: 'draft'
  };
  
  const placeholderSections = [
    {
      _id: 's1',
      title: 'Introduction to Web Development',
      order: 1,
      lessons: [
        {
          _id: 'l1',
          title: 'Welcome to the Course',
          type: 'video',
          duration: 8,
          isPreview: true,
          order: 1
        },
        {
          _id: 'l2',
          title: 'Course Overview',
          type: 'video',
          duration: 12,
          isPreview: false,
          order: 2
        }
      ]
    },
    {
      _id: 's2',
      title: 'HTML Fundamentals',
      order: 2,
      lessons: [
        {
          _id: 'l3',
          title: 'Introduction to HTML',
          type: 'video',
          duration: 15,
          isPreview: false,
          order: 1
        },
        {
          _id: 'l4',
          title: 'HTML Tags and Elements',
          type: 'video',
          duration: 22,
          isPreview: false,
          order: 2
        },
        {
          _id: 'l5',
          title: 'HTML Project: Building Your First Webpage',
          type: 'quiz',
          duration: 0,
          isPreview: false,
          order: 3
        }
      ]
    }
  ];
  
  const displayCourse = course || placeholderCourse;
  const displaySections = sections.length > 0 ? sections : placeholderSections;
  
  // Format duration
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };
  
  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  // Add a new section
  const startAddingSection = () => {
    setAddingSectionId('new');
    setNewSectionTitle('');
  };
  
  const cancelAddingSection = () => {
    setAddingSectionId(null);
  };
  
  const submitNewSection = async () => {
    if (!newSectionTitle.trim()) {
      toast.error('Section title cannot be empty');
      return;
    }
    
    try {
      // Make API call to add section
      const res = await axios.post(`/api/instructor/courses/${id}/sections`, {
        title: newSectionTitle,
        order: displaySections.length + 1
      });
      
      // Update sections state
      setSections([...displaySections, res.data]);
      
      // Set new section as expanded
      setExpandedSections(prev => ({
        ...prev,
        [res.data._id]: true
      }));
      
      setAddingSectionId(null);
      setNewSectionTitle('');
      toast.success('Section added successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add section');
    }
  };
  
  // Add a new lesson
  const startAddingLesson = (sectionId) => {
    setAddingLessonToSectionId(sectionId);
    setNewLesson({
      title: '',
      type: 'video',
      content: '',
      videoUrl: '',
      duration: '',
      isPreview: false,
      file: null
    });
  };
  
  const cancelAddingLesson = () => {
    setAddingLessonToSectionId(null);
  };
  
  const handleLessonChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setNewLesson(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setNewLesson(prev => ({
        ...prev,
        file: e.target.files[0]
      }));
    }
  };
  
  const submitNewLesson = async (sectionId) => {
    if (!newLesson.title.trim()) {
      toast.error('Lesson title cannot be empty');
      return;
    }
    
    if (newLesson.type === 'video' && !newLesson.videoUrl && !newLesson.file) {
      toast.error('Please provide a video URL or upload a video file');
      return;
    }
    
    if (newLesson.type === 'document' && !newLesson.file) {
      toast.error('Please upload a document file');
      return;
    }
    
    try {
      const sectionIndex = displaySections.findIndex(s => s._id === sectionId);
      
      if (sectionIndex === -1) {
        toast.error('Section not found');
        return;
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', newLesson.title);
      formData.append('type', newLesson.type);
      formData.append('content', newLesson.content);
      formData.append('isPreview', newLesson.isPreview);
      
      if (newLesson.type === 'video') {
        formData.append('videoUrl', newLesson.videoUrl);
        formData.append('duration', newLesson.duration);
      }
      
      if (newLesson.file) {
        formData.append('file', newLesson.file);
      }
      
      formData.append('order', displaySections[sectionIndex].lessons.length + 1);
      
      // Make API call to add lesson
      const res = await axios.post(`/api/instructor/courses/${id}/sections/${sectionId}/lessons`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update sections state
      const updatedSections = [...displaySections];
      updatedSections[sectionIndex].lessons.push(res.data);
      setSections(updatedSections);
      
      setAddingLessonToSectionId(null);
      setNewLesson({
        title: '',
        type: 'video',
        content: '',
        videoUrl: '',
        duration: '',
        isPreview: false,
        file: null
      });
      toast.success('Lesson added successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add lesson');
    }
  };
  
  // Drag and drop handlers
  const handleDragStart = (e, type, item, sectionId) => {
    setDraggedItem({
      type,
      item,
      sectionId
    });
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDrop = async (e, dropType, dropTarget, dropSectionId) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    try {
      // Reordering sections
      if (draggedItem.type === 'section' && dropType === 'section') {
        const dragIndex = displaySections.findIndex(s => s._id === draggedItem.item._id);
        const dropIndex = displaySections.findIndex(s => s._id === dropTarget._id);
        
        if (dragIndex === dropIndex) return;
        
        const updatedSections = [...displaySections];
        const [removed] = updatedSections.splice(dragIndex, 1);
        updatedSections.splice(dropIndex, 0, removed);
        
        // Update order property
        updatedSections.forEach((section, index) => {
          section.order = index + 1;
        });
        
        setSections(updatedSections);
        
        // Make API call to update order
        await axios.put(`/api/instructor/courses/${id}/sections/reorder`, {
          sectionIds: updatedSections.map(s => s._id)
        });
      }
      
      // Reordering lessons within a section
      if (draggedItem.type === 'lesson' && dropType === 'lesson' && draggedItem.sectionId === dropSectionId) {
        const sectionIndex = displaySections.findIndex(s => s._id === dropSectionId);
        
        if (sectionIndex === -1) return;
        
        const lessons = [...displaySections[sectionIndex].lessons];
        const dragIndex = lessons.findIndex(l => l._id === draggedItem.item._id);
        const dropIndex = lessons.findIndex(l => l._id === dropTarget._id);
        
        if (dragIndex === dropIndex) return;
        
        const [removed] = lessons.splice(dragIndex, 1);
        lessons.splice(dropIndex, 0, removed);
        
        // Update order property
        lessons.forEach((lesson, index) => {
          lesson.order = index + 1;
        });
        
        const updatedSections = [...displaySections];
        updatedSections[sectionIndex].lessons = lessons;
        setSections(updatedSections);
        
        // Make API call to update order
        await axios.put(`/api/instructor/courses/${id}/sections/${dropSectionId}/lessons/reorder`, {
          lessonIds: lessons.map(l => l._id)
        });
      }
      
      // Moving a lesson to another section
      if (draggedItem.type === 'lesson' && dropType === 'section' && draggedItem.sectionId !== dropTarget._id) {
        const sourceSectionIndex = displaySections.findIndex(s => s._id === draggedItem.sectionId);
        const targetSectionIndex = displaySections.findIndex(s => s._id === dropTarget._id);
        
        if (sourceSectionIndex === -1 || targetSectionIndex === -1) return;
        
        const updatedSections = [...displaySections];
        
        // Remove lesson from source section
        const sourceLessons = [...updatedSections[sourceSectionIndex].lessons];
        const lessonIndex = sourceLessons.findIndex(l => l._id === draggedItem.item._id);
        const [removed] = sourceLessons.splice(lessonIndex, 1);
        
        // Add lesson to target section
        const targetLessons = [...updatedSections[targetSectionIndex].lessons];
        targetLessons.push(removed);
        
        // Update order property for both sections
        sourceLessons.forEach((lesson, index) => {
          lesson.order = index + 1;
        });
        
        targetLessons.forEach((lesson, index) => {
          lesson.order = index + 1;
        });
        
        updatedSections[sourceSectionIndex].lessons = sourceLessons;
        updatedSections[targetSectionIndex].lessons = targetLessons;
        setSections(updatedSections);
        
        // Make API call to move lesson
        await axios.put(`/api/instructor/courses/${id}/lessons/${draggedItem.item._id}/move`, {
          fromSectionId: draggedItem.sectionId,
          toSectionId: dropTarget._id
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to reorder items');
    }
    
    setDraggedItem(null);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="w-full md:w-auto mb-4 md:mb-0">
          <h1 className="text-3xl font-bold">{displayCourse.title}</h1>
          <p className="text-gray-600 mt-1">
            Course Content
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">
              {displayCourse.status.charAt(0).toUpperCase() + displayCourse.status.slice(1)}
            </span>
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate(`/instructor/courses/${id}/edit`)}
            className="btn-secondary-sm"
          >
            Edit Details
          </button>
          
          <button 
            onClick={() => navigate(`/instructor/courses/${id}/preview`)}
            className="btn-secondary-sm"
          >
            Preview Course
          </button>
          
          {displayCourse.status === 'draft' && (
            <button 
              onClick={() => toast.info('Publishing feature will be implemented soon!')}
              className="btn-primary-sm"
            >
              Publish Course
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Course Structure</h2>
              <button 
                onClick={startAddingSection}
                className="btn-primary-sm"
              >
                Add Section
              </button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              {displaySections.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 mb-4">No sections yet. Add your first section to get started.</p>
                  <button 
                    onClick={startAddingSection}
                    className="btn-primary-sm"
                  >
                    Add Section
                  </button>
                </div>
              ) : (
                <div>
                  {displaySections.map((section, index) => (
                    <div 
                      key={section._id}
                      className="border-b last:border-b-0"
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'section', section)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'section', section)}
                    >
                      <div 
                        className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
                        onClick={() => toggleSection(section._id)}
                      >
                        <div className="flex items-center">
                          <span className="mr-2 text-gray-500">{index + 1}.</span>
                          <h3 className="font-medium">{section.title}</h3>
                          <span className="ml-2 text-sm text-gray-500">
                            ({section.lessons.length} {section.lessons.length === 1 ? 'lesson' : 'lessons'})
                          </span>
                        </div>
                        <div className="flex items-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              startAddingLesson(section._id);
                            }}
                            className="text-primary-600 hover:text-primary-700 mr-3"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 transition-transform ${expandedSections[section._id] ? 'transform rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {expandedSections[section._id] && (
                        <div className="p-4 bg-white">
                          {section.lessons.length === 0 ? (
                            <div className="text-center py-6">
                              <p className="text-gray-500 mb-2">No lessons in this section yet</p>
                              <button 
                                onClick={() => startAddingLesson(section._id)}
                                className="text-primary-600 hover:text-primary-700 font-medium"
                              >
                                + Add Lesson
                              </button>
                            </div>
                          ) : (
                            <ul>
                              {section.lessons.map((lesson, lessonIndex) => (
                                <li 
                                  key={lesson._id}
                                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, 'lesson', lesson, section._id)}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, 'lesson', lesson, section._id)}
                                >
                                  <div className="flex items-center">
                                    <span className="w-6 text-gray-500 text-sm">{lessonIndex + 1}.</span>
                                    <div className="flex items-center">
                                      {lesson.type === 'video' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                        </svg>
                                      )}
                                      {lesson.type === 'document' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      {lesson.type === 'quiz' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      <span className="font-medium">{lesson.title}</span>
                                      {lesson.isPreview && (
                                        <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                          Preview
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    {lesson.duration > 0 && (
                                      <span className="text-sm text-gray-500 mr-4">
                                        {formatDuration(lesson.duration)}
                                      </span>
                                    )}
                                    <button 
                                      onClick={() => toast.info('Edit lesson feature will be implemented soon!')}
                                      className="text-gray-500 hover:text-gray-700 mr-2"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={() => toast.info('Delete lesson feature will be implemented soon!')}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                          
                          {addingLessonToSectionId === section._id && (
                            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                              <h4 className="font-medium mb-3">Add New Lesson</h4>
                              
                              <div className="mb-3">
                                <label className="block text-gray-700 font-medium mb-2" htmlFor="lessonTitle">
                                  Lesson Title*
                                </label>
                                <input
                                  type="text"
                                  id="lessonTitle"
                                  name="title"
                                  value={newLesson.title}
                                  onChange={handleLessonChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  placeholder="e.g., Introduction to HTML"
                                  required
                                />
                              </div>
                              
                              <div className="mb-3">
                                <label className="block text-gray-700 font-medium mb-2" htmlFor="lessonType">
                                  Lesson Type*
                                </label>
                                <select
                                  id="lessonType"
                                  name="type"
                                  value={newLesson.type}
                                  onChange={handleLessonChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  required
                                >
                                  <option value="video">Video</option>
                                  <option value="document">Document</option>
                                  <option value="quiz">Quiz</option>
                                </select>
                              </div>
                              
                              {newLesson.type === 'video' && (
                                <>
                                  <div className="mb-3">
                                    <label className="block text-gray-700 font-medium mb-2" htmlFor="videoUrl">
                                      Video URL (YouTube, Vimeo, etc.)
                                    </label>
                                    <input
                                      type="text"
                                      id="videoUrl"
                                      name="videoUrl"
                                      value={newLesson.videoUrl}
                                      onChange={handleLessonChange}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                      placeholder="e.g., https://www.youtube.com/watch?v=..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Leave empty if you want to upload a video file instead
                                    </p>
                                  </div>
                                  
                                  <div className="mb-3">
                                    <label className="block text-gray-700 font-medium mb-2">
                                      Or Upload Video File
                                    </label>
                                    <input
                                      type="file"
                                      onChange={handleFileChange}
                                      className="w-full"
                                      accept="video/*"
                                    />
                                  </div>
                                  
                                  <div className="mb-3">
                                    <label className="block text-gray-700 font-medium mb-2" htmlFor="duration">
                                      Duration (minutes)
                                    </label>
                                    <input
                                      type="number"
                                      id="duration"
                                      name="duration"
                                      min="0"
                                      value={newLesson.duration}
                                      onChange={handleLessonChange}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                      placeholder="e.g., 15"
                                    />
                                  </div>
                                </>
                              )}
                              
                              {newLesson.type === 'document' && (
                                <div className="mb-3">
                                  <label className="block text-gray-700 font-medium mb-2">
                                    Upload Document
                                  </label>
                                  <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="w-full"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                  />
                                </div>
                              )}
                              
                              {newLesson.type === 'quiz' && (
                                <div className="mb-3">
                                  <p className="text-yellow-600 bg-yellow-100 p-3 rounded-md">
                                    After adding this quiz, you'll be able to edit it to add questions.
                                  </p>
                                </div>
                              )}
                              
                              <div className="mb-3">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id="isPreview"
                                    name="isPreview"
                                    checked={newLesson.isPreview}
                                    onChange={handleLessonChange}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor="isPreview" className="ml-2 block text-gray-700">
                                    Make this lesson free preview
                                  </label>
                                </div>
                              </div>
                              
                              <div className="flex justify-end space-x-3 mt-4">
                                <button
                                  type="button"
                                  onClick={cancelAddingLesson}
                                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => submitNewLesson(section._id)}
                                  className="btn-primary-sm"
                                >
                                  Add Lesson
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Add Section Form */}
                  {addingSectionId === 'new' && (
                    <div className="p-4 bg-gray-50 border-t">
                      <h3 className="font-medium mb-3">Add New Section</h3>
                      <div className="mb-3">
                        <label className="block text-gray-700 font-medium mb-2" htmlFor="sectionTitle">
                          Section Title*
                        </label>
                        <input
                          type="text"
                          id="sectionTitle"
                          value={newSectionTitle}
                          onChange={(e) => setNewSectionTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="e.g., Introduction to the Course"
                          required
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={cancelAddingSection}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={submitNewSection}
                          className="btn-primary-sm"
                        >
                          Add Section
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Course Summary</h2>
            
            <div className="mb-4">
              <img 
                src={displayCourse.thumbnail} 
                alt={displayCourse.title} 
                className="w-full h-40 object-cover rounded-md mb-4"
              />
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sections:</span>
                <span className="font-medium">{displaySections.length}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total Lessons:</span>
                <span className="font-medium">
                  {displaySections.reduce((total, section) => total + section.lessons.length, 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total Duration:</span>
                <span className="font-medium">
                  {formatDuration(
                    displaySections.reduce(
                      (total, section) => total + section.lessons.reduce(
                        (lessonTotal, lesson) => lessonTotal + (lesson.duration || 0), 0
                      ), 0
                    )
                  )}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Free Preview Lessons:</span>
                <span className="font-medium">
                  {displaySections.reduce(
                    (total, section) => total + section.lessons.filter(lesson => lesson.isPreview).length, 0
                  )}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium mb-3">Course Status</h3>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Course details completed</span>
                </div>
                
                <div className={`flex items-center ${displaySections.length > 0 ? 'text-green-800' : 'text-gray-500'}`}>
                  {displaySections.length > 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>Course content added</span>
                </div>
                
                <div className={`flex items-center ${displaySections.some(s => s.lessons.some(l => l.isPreview)) ? 'text-green-800' : 'text-gray-500'}`}>
                  {displaySections.some(s => s.lessons.some(l => l.isPreview)) ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>Free preview lesson added</span>
                </div>
              </div>
              
              {displayCourse.status === 'draft' && (
                <button 
                  onClick={() => toast.info('Publishing feature will be implemented soon!')}
                  className="w-full btn-primary mt-4"
                  disabled={!displaySections.length || !displaySections.some(s => s.lessons.some(l => l.isPreview))}
                >
                  Publish Course
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseContentPage;
