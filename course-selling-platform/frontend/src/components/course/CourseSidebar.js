import React from 'react';
// --- START: THE ICON FIX ---
import { FaPlayCircle, FaQuestionCircle, FaCheckCircle } from 'react-icons/fa';
import { VscError } from 'react-icons/vsc';
// --- END: THE ICON FIX ---

const CourseSidebar = ({ course, activeLesson, setActiveLesson, lessonStatuses }) => {
  if (!course) return null;
  
  const modules = course.modules || [];

  return (
    <aside className="w-full md:w-80 bg-white shadow-lg h-auto md:h-screen md:sticky top-0 overflow-y-auto flex-shrink-0 border-r border-gray-200">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">{course.title}</h2>
        <p className="text-sm text-gray-500 mt-1">Course Content</p>
      </div>
      <div>
        {modules.map((module) => (
          <div key={module._id} className="border-b">
            <h3 className="p-4 font-semibold bg-gray-50 text-gray-800">{module.title}</h3>
            <ul>
              {module.lessons?.map((lesson) => {
                const status = lessonStatuses.get(lesson._id);
                return (
                  <li key={lesson._id}>
                    <button
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full text-left p-4 text-sm flex items-center gap-3 transition-colors ${
                        activeLesson?._id === lesson._id
                          ? 'bg-blue-100 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {/* --- START: THE ICON FIX --- */}
                      <div className="w-5 flex items-center justify-center">
                        {status === 'correct' || status === 'completed' ? <FaCheckCircle className="text-green-500" /> :
           status === 'incorrect' ? <VscError className="text-red-500 text-lg" /> :
           lesson.type === 'video' ? <FaPlayCircle className="text-gray-400" /> : 
           <FaQuestionCircle className="text-gray-400" />}
                      </div>
                      {/* --- END: THE ICON FIX --- */}
                      
                      <span>{lesson.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default CourseSidebar;