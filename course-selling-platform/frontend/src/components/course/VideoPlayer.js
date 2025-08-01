import React from 'react';
import { toast } from 'react-toastify';

const VideoPlayer = ({ videoId, lessonId, onVideoComplete, isAlreadyCompleted }) => {
  if (!videoId) {
    return (
      <div className="bg-gray-200 aspect-video w-full flex items-center justify-center rounded-lg">
        <p className="text-gray-500">Video not available.</p>
      </div>
    );
  }

  const videoSrc = `https://go.screenpal.com/player/${videoId}?width=100%&height=100%&ff=1&title=0`;

  const handleMarkComplete = () => {
    // This function calls the prop with the specific ID for THIS video.
    onVideoComplete(lessonId);
  };

  return (
    <div>
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
          src={videoSrc}
          title="Course Video Player"
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe>
      </div>

      <div className="mt-6 text-right">
        {isAlreadyCompleted ? (
          <p className="text-sm font-semibold text-green-600 bg-green-100 p-3 rounded-md inline-block">
            ✅ Lesson Complete
          </p>
        ) : (
          <button 
            onClick={handleMarkComplete}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Mark as Complete
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;