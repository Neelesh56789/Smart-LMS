import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const InstructorRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useSelector(state => state.auth);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (user && (user.role === 'instructor' || user.role === 'admin')) {
    return children;
  }
  
  return <Navigate to="/" />;
};

export default InstructorRoute;
