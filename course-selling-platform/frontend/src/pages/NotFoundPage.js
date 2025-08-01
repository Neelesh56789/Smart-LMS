import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-16">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        <h2 className="text-4xl font-bold text-gray-800 mt-4 mb-6">Page Not Found</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            to="/"
            className="btn-primary py-3 px-6"
          >
            Go to Homepage
          </Link>
          <Link
            to="/courses"
            className="btn-secondary py-3 px-6"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
