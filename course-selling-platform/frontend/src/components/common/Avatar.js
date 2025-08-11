// Filename: src/components/common/Avatar.js (NEW FILE)

import React from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Helper function to get initials from a name
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const Avatar = ({ user, size = 'w-10 h-10', textSize = 'text-lg' }) => {
  // Determine if there is a valid, non-default profile image
  const hasProfileImage = user?.profileImage && user.profileImage !== 'default-profile.jpg';

  // Add a cache-busting timestamp to the image URL
  const imageUrl = hasProfileImage 
    ? `${BACKEND_URL}/uploads/${user.profileImage}?t=${new Date().getTime()}`
    : null;

  return (
    <>
      {hasProfileImage ? (
        <img
          src={imageUrl}
          alt="Profile"
          className={`${size} rounded-full object-cover`}
          // Fallback in case the image link is broken
          onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150?text=Error'; }}
        />
      ) : (
        <span className={`${size} rounded-full bg-blue-500 text-white flex items-center justify-center font-bold ${textSize}`}>
          {getInitials(user?.name)}
        </span>
      )}
    </>
  );
};

export default Avatar;