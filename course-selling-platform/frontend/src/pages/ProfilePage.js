// Filename: src/pages/ProfilePage.js (CORRECTED AND FINAL VERSION)

import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { updateProfile, updateProfilePhoto, getMe } from '../redux/slices/authSlice'; // <-- Import getMe
import Avatar from '../components/common/Avatar';
// The base URL of your backend, for constructing image paths
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    name: '', email: '', bio: '', phone: '', address: '',
  });
  
  // This state now specifically holds the URL to be displayed in the <img> tag
  const [displayImage, setDisplayImage] = useState('https://via.placeholder.com/150?text=Profile');

  // This effect fetches user data when the component mounts if it's not already there.
  // This solves the "nothing appears after logging in" problem.
  useEffect(() => {
    if (!user) {
      dispatch(getMe());
    }
  }, [user, dispatch]);

  // This effect syncs the form data and display image whenever the user object in Redux changes.
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        phone: user.phone || '',
        address: user.address || '',
      });
      // This is the key fix for the image. It constructs the permanent server URL.
      if (user.profileImage && user.profileImage !== 'default-profile.jpg') {
        // Add a timestamp to bust the browser cache and show the new image immediately.
        setDisplayImage(`${BACKEND_URL}/uploads/${user.profileImage}?t=${new Date().getTime()}`);
      } else {
        setDisplayImage('https://via.placeholder.com/150?text=Profile');
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show a temporary local preview so the user sees an instant change.
    const tempPreviewUrl = URL.createObjectURL(file);
    setDisplayImage(tempPreviewUrl);

    const photoFormData = new FormData();
    photoFormData.append('profileImage', file);

    try {
      // The unwrap() will throw an error if the thunk is rejected.
      await dispatch(updateProfilePhoto(photoFormData)).unwrap();
      toast.success('Profile picture updated!');
      // The useEffect hook listening to `user` will automatically set the new permanent URL.
    } catch (err) {
      toast.error(err || 'Failed to upload picture. Check file size (Max 2MB).');
      // If the upload fails, revert to the original user image from Redux state.
      setDisplayImage(user.profileImage ? `${BACKEND_URL}/uploads/${user.profileImage}` : 'https://via.placeholder.com/150?text=Profile');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile details updated successfully!');
    } catch (err) {
      toast.error(err || 'Failed to update profile');
    }
  };
  
  if (loading && !user) {
    return <div>Loading profile...</div>;
  }
  
  if (!user && error) {
    return <div>Error loading profile: {error}</div>;
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Image Column */}
              <div className="flex flex-col items-center md:items-start">
                <div className="relative">
                  <Avatar 
                    user={user} 
                    src={displayImage} // Pass the dynamic image URL state
                    size="w-32 h-32"   // Define the size
                    textSize="text-5xl" // Make initials larger for the big avatar
                  />
                  <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center md:text-left">Click the camera to upload a new photo (Max 2MB).</p>
              </div>
              
              {/* Form Fields Column */}
              <div className="md:col-span-2">
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="name">Name</label>
                  <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="email">Email (cannot be changed)</label>
                  <input id="email" name="email" type="email" value={formData.email} className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 cursor-not-allowed" disabled />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="bio">Bio</label>
                  <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700" rows="3" placeholder="Tell us a little about yourself..."></textarea>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" type="text" value={formData.phone} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700" />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="address">Address</label>
                  <textarea id="address" name="address" value={formData.address} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700" rows="2"></textarea>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end border-t pt-6 mt-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;