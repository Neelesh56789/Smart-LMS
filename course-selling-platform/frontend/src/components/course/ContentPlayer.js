import React from 'react';
import VideoPlayer from './VideoPlayer';
import MCQPlayer from './MCQPlayer';

const ContentPlayer = ({ lesson, onQuizAttempt, onVideoComplete, isAlreadyCompleted }) => {
  if (!lesson) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
        <h2 className="text-xl font-semibold">Welcome!</h2>
        <p>Select a lesson from the sidebar to begin your learning journey.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6 border-b pb-4">{lesson.title}</h1>
      
      {lesson.type === 'video' && (
        <VideoPlayer 
          videoId={lesson.content.videoId}
          // Pass ONLY the props relevant to the VideoPlayer
          lessonId={lesson._id}
          onVideoComplete={onVideoComplete}
          isAlreadyCompleted={isAlreadyCompleted}
        />
      )}

      {lesson.type === 'quiz' && (
        <MCQPlayer 
          quizData={lesson.content} 
          // Pass ONLY the props relevant to the MCQPlayer
          lessonId={lesson._id}
          onQuizAttempt={onQuizAttempt}
          isAlreadyCompleted={isAlreadyCompleted}
        />
      )}
    </div>
  );
};

export default ContentPlayer;