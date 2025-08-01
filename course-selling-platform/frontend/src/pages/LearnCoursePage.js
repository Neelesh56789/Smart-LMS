import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import CourseSidebar from '../components/course/CourseSidebar';
import ContentPlayer from '../components/course/ContentPlayer';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../redux/slices/authSlice';

const LearnCoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonStatuses, setLessonStatuses] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.lessonStatuses) {
      const statusMap = new Map();
      user.lessonStatuses.forEach(ls => statusMap.set(ls.lesson, ls.status));
      setLessonStatuses(statusMap);
    }
  }, [user]);

  useEffect(() => {
    const fetchCourseContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/courses/${courseId}/content`);
        if (res.data.success && res.data.data) {
          setCourse(res.data.data);
          if (res.data.data.modules?.[0]?.lessons?.[0]) {
            setActiveLesson(res.data.data.modules[0].lessons[0]);
          }
        } else {
          throw new Error('Course content could not be loaded.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load course content.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourseContent();
  }, [courseId]);

  const updateProgress = async (lessonId, status) => {
    if (lessonStatuses.has(lessonId)) return;
    try {
      await api.post(`/courses/lessons/${lessonId}/status`, { status });
      
      const updatedStatuses = new Map(lessonStatuses);
      updatedStatuses.set(lessonId, status);
      setLessonStatuses(updatedStatuses);
      
      const profileRes = await api.get('/profile');
      dispatch(updateProfile(profileRes.data.data));

      if (status === 'completed') {
        toast.success("Lesson marked as complete!");
      }
    } catch (err) {
      console.error('Failed to update progress', err);
      toast.error('Could not save progress.');
    }
  };

  const handleQuizAttempt = (lessonId, isCorrect) => {
    updateProgress(lessonId, isCorrect ? 'correct' : 'incorrect');
  };

  const handleVideoComplete = (lessonId) => {
    updateProgress(lessonId, 'completed');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">An Error Occurred</h2>
          <p className="text-gray-600">{error}</p>
          <button onClick={() => navigate('/my-courses')} className="mt-6 bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Could not find course content.</p>
      </div>
    );
  }

  const isCurrentLessonCompleted = activeLesson ? lessonStatuses.has(activeLesson._id) : false;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-68px)]">
      <CourseSidebar 
        course={course} 
        activeLesson={activeLesson}
        setActiveLesson={setActiveLesson}
        lessonStatuses={lessonStatuses}
      />
      <main className="flex-1 p-4 md:p-8 bg-gray-100 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          
          {/* --- START: THE FIX --- */}
          {/* The "Back to My Courses" button is restored here. */}
          <button 
            onClick={() => navigate('/my-courses')} 
            className="flex items-center gap-2 mb-6 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to My Courses
          </button>
          {/* --- END: THE FIX --- */}
          
          <ContentPlayer 
            lesson={activeLesson} 
            onQuizAttempt={handleQuizAttempt}
            onVideoComplete={handleVideoComplete}
            isAlreadyCompleted={isCurrentLessonCompleted}
          />
        </div>
      </main>
    </div>
  );
};

export default LearnCoursePage;