import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../api';
const PurchasedCoursesPage = () => {
  const { user: authUser } = useSelector(state => state.auth);
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [certificateLoading, setCertificateLoading] = useState(null);
   useEffect(() => {
    const fetchCoursesAndProgress = async () => {
      if (!authUser) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // 1. Fetch the fresh user data from database to get updated lessonStatuses
        const userRes = await api.get(`/auth/me/?id=${authUser._id}`, {
          headers: {
            Authorization: `Bearer ${authUser.token}`
          }
        });
        const freshUser = userRes.data.data;
        console.log("Fetched fresh user data:", freshUser);
        // 2. Fetch the basic details of the purchased courses.
        const coursesRes = await api.get('/orders/my-courses');
        console.log("Fetched courses:", coursesRes.data.data);
        const myCourses = coursesRes.data.data;
        // 3. Fetch the full content (with modules/lessons) ONLY to get the total lesson count.
        const coursesWithContent = await Promise.all(
          myCourses.map(async (course) => {
            const contentRes = await api.get(`/courses/${course._id}/content`);
            return contentRes.data.data;
          })
        );
        console.log("Fetched course content:", coursesWithContent);
        // 4. Get the set of completed lesson IDs from the fresh user data from database.
        const completedLessonsSet = new Set(
          freshUser.lessonStatuses
            .filter(ls => ls.status === 'correct' || ls.status === 'completed')
            .map(ls => ls.lesson)
        );
        // 5. Calculate progress for each course.
        const coursesWithProgress = coursesWithContent.map(course => {
          const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
          if (totalLessons === 0) return { ...course, progress: 0 };
          const completedCount = course.modules.reduce((sum, module) =>
            sum + module.lessons.filter(lesson => completedLessonsSet.has(lesson._id)).length,
          0);
          const progress = Math.round((completedCount / totalLessons) * 100);
          return { ...course, progress };
        });
        setPurchasedCourses(coursesWithProgress);
      } catch (err) {
        console.error("Error fetching courses and progress:", err);
        toast.error('Failed to fetch your courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCoursesAndProgress();
  }, [authUser]);
  const handleGetCertificate = async (courseId) => {
    setCertificateLoading(courseId);
    try {
      const res = await api.get(`/courses/${courseId}/certificate`, {
        responseType: 'blob',
      });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Could not generate certificate. Please ensure the course is 100% complete.';
      toast.error(errorMsg);
    } finally {
      setCertificateLoading(null);
    }
  };
  const filteredCourses = purchasedCourses.filter(course => {
    if (activeTab === 'in-progress') return course.progress > 0 && course.progress < 100;
    if (activeTab === 'completed') return course.progress === 100;
    return true;
  });
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-8">My Learning</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Learning</h1>
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('all')}
          >
            All Courses
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'in-progress' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('in-progress')}
          >
            In Progress
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'completed' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </div>
        {filteredCourses.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {activeTab === 'all' ? "You haven't purchased any courses yet." : `No courses in "${activeTab}" category.`}
            </h3>
            <p className="text-gray-500 mb-6">Your learning journey starts here!</p>
            <Link to="/courses" className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCourses.map(course => (
              <div key={course._id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row">
                <div className="md:w-1/3 h-48 md:h-auto">
                  <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-6 md:w-2/3 flex flex-col">
                  <h2 className="text-xl font-bold mb-1">{course.title}</h2>
                  <p className="text-gray-600 text-sm mb-4">By {course.instructor?.name || 'Smart LMS'}</p>
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                    </div>
                    <p className="text-right text-xs text-gray-500 mt-1">{course.progress}% Complete</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <Link to={`/courses/${course._id}/learn`} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
                      {course.progress === 100 ? 'Review Course' : 'Continue Learning'}
                    </Link>
                    {course.progress === 100 && (
                      <button
                        onClick={() => handleGetCertificate(course._id)}
                        disabled={certificateLoading === course._id}
                        className="flex items-center text-green-600 font-semibold hover:text-green-700 disabled:opacity-50"
                      >
                        {certificateLoading === course._id ? (
                           <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                           <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                        {certificateLoading === course._id ? 'Generating...' : 'Get Certificate'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default PurchasedCoursesPage;