import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import { FaShoppingCart } from 'react-icons/fa'; 
import Avatar from '../common/Avatar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get all necessary state from Redux in one go
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { cart } = useSelector(state => state.cart);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Calculate the number of items in the cart
  const itemCount = cart?.items?.length || 0;

  const handleLogout = () => {
    dispatch(logout());
    setDropdownOpen(false);
    navigate('/login');
  };
  
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-800">Smart-LMS</Link>
        
        <div className="flex items-center space-x-6"> {/* Increased spacing for better look */}
          <Link to="/courses" className="text-gray-600 hover:text-blue-600">Courses</Link>
          
          {/* --- START: THE CART ICON FIX --- */}
          <Link to="/cart" className="relative text-gray-600 hover:text-blue-600">
            <FaShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
          {/* --- END: THE CART ICON FIX --- */}
          
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
              >
                <Avatar user={user} size="w-10 h-10" textSize="text-lg" />
                  {/* <img 
                    src={`${BACKEND_URL}/uploads/${user.profileImage}`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                    {getInitials(user.name)}
                  </span>
                )} */}
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 py-1">
                  <div className="px-4 py-2 text-sm text-gray-500 border-b">
                    Signed in as <br/>
                    <strong className="font-medium text-gray-800">{user.name}</strong>
                  </div>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white">Profile Settings</Link>
                  <Link to="/my-courses" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white">My Courses</Link>
                  {user.role === 'instructor' && (
                    <Link to="/instructor/dashboard" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white">Instructor Dashboard</Link>
                  )}
                  <div className="border-t border-gray-100"></div>
                  <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-red-500 hover:text-white">Logout</button>
                </div>
              )}
            </div>
          ) : (
             <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Login</Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;