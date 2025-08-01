import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { updateProfile, updateProfilePhoto } from '../redux/slices/authSlice';

// The base URL of your backend, for constructing image paths
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    name: '', email: '', bio: '', phone: '', address: '',
  });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        phone: user.phone || '',
        address: user.address || '',
      });
      if (user.profileImage && user.profileImage !== 'default-profile.jpg') {
        setPreviewImage(`${BACKEND_URL}/uploads/${user.profileImage}`);
      } else {
        setPreviewImage('https://via.placeholder.com/150?text=Profile');
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));

      const photoFormData = new FormData();
      photoFormData.append('profileImage', file);
      try {
        await dispatch(updateProfilePhoto(photoFormData)).unwrap();
        toast.success('Profile picture updated!');
      } catch (error) {
        toast.error(error || 'Failed to upload picture. Image may be too large.');
        setPreviewImage(user.profileImage ? `${BACKEND_URL}/uploads/${user.profileImage}` : null);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile details updated successfully!');
    } catch (error) {
      toast.error(error || 'Failed to update profile');
    }
  };
  
  if (!user) {
    return <div>Loading profile...</div>;
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
                  <img 
                    src={previewImage} 
                    alt="Profile" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
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
                
                {/* --- RESTORED MISSING FIELDS --- */}
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
                {/* --- END RESTORED FIELDS --- */}
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