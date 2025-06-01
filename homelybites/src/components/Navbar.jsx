import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Check login status on component mount and when localStorage changes
  useEffect(() => {
    const checkLoginStatus = () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      setIsLoggedIn(currentUser.isLoggedIn || false);
    };

    checkLoginStatus();
    
    // Listen for storage changes (when user logs in/out from another tab)
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  const handleUserIconClick = () => {
    if (isLoggedIn) {
      setShowDropdown(!showDropdown);
    } else {
      navigate('/login');
    }
  };

  const handleProfileClick = () => {
    navigate('/userprofile');
    setShowDropdown(false);
  };

  const handleRecentRecipesClick = () => {
    navigate('/recent');
    setShowDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setShowDropdown(false);
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <nav className="w-full flex items-center justify-between px-8 py-6">
      {/* Logo */}
      <Link to="/" className="flex items-center">
        <img src="/Images/logo/logo2.png" alt="HomelyBites Logo" className="h-10" />
      </Link>
      
      {/* Menu */}
      <div className="flex-1 flex justify-center">
        <div className="flex gap-10 text-lg font-medium">
          <Link to="/Home" className="hover:text-accent hover:underline hover:underline-offset-8 transition">
            Home
          </Link>
          <Link to="/aboutus" className="hover:text-accent  hover:underline hover:underline-offset-8 transition">
            About
          </Link>
          <Link to="/recipe" className="hover:text-accent hover:underline hover:underline-offset-8 transition">
            Recipe
          </Link>
          <Link to="/community" className="hover:text-accent hover:underline hover:underline-offset-8 transition">
            Community
          </Link>
          <Link to="/contact" className="hover:text-accent hover:underline hover:underline-offset-8 transition">
            Contact
          </Link>
        </div>
      </div>
      
      {/* User Icon with Dropdown */}
      <div className="relative user-dropdown">
        <button
          onClick={handleUserIconClick}
          className="text-gray-700 hover:text-gray-900 transition-colors focus:outline-none"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            className="cursor-pointer"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>

        {/* Dropdown Menu - Only show if logged in */}
        {isLoggedIn && showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="py-2">
              <button
                onClick={handleProfileClick}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Profile
              </button>
              
              <button
                onClick={handleRecentRecipesClick}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Recent Recipes
              </button>
              
              <hr className="my-1" />
              
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
              
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;