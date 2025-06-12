import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";


const Navbar = ({ showLoginButtons = false, showUserProfile = true }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Check login status on component mount and when localStorage changes
  useEffect(() => {
    const checkLoginStatus = () => {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );
      setIsLoggedIn(currentUser.isLoggedIn || false);
    };

    // Only check login status if we're showing user profile (not landing page)
    if (showUserProfile) {
      checkLoginStatus();

      // Listen for storage changes (when user logs in/out from another tab)
      window.addEventListener("storage", checkLoginStatus);

      return () => {
        window.removeEventListener("storage", checkLoginStatus);
      };
    }
  }, [showUserProfile]);

  const handleUserIconClick = () => {
    if (isLoggedIn) {
      setShowDropdown(!showDropdown);
    } else {
      navigate("/login");
    }
  };

  const handleProfileClick = () => {
    navigate("/userprofile");
    setShowDropdown(false);
  };

  const handleRecentRecipesClick = () => {
    navigate("/recent");
    setShowDropdown(false);
  };

  const handleFavouritesClick = () => {
    navigate("/FavPage");
    setShowDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setIsLoggedIn(false);
    setShowDropdown(false);
    navigate("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest(".user-dropdown")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="w-full flex items-center justify-between px-8 py-6 ">
      {/* Logo Section*/}

      <Link to="/" className="flex items-center ">
        <img
          src="/svg/hbite.svg"
          alt="HomelyBites Logo"
          className="h-10 lg-11 hover:scale-105 transition-all"
        />
      </Link>

      {/* Navbar display Menu */}
      <div className="flex-1 flex justify-center">
        <ul className="hidden xl:flex md:flex items-center gap-10 text-base font-medium">
          <li>
            <Link
              to="/Home"
              className="hover:text-accent hover:underline hover:underline-offset-8 transition"
            >
              Home
            </Link>
          </li>
          <Link
            to="/aboutus"
            className="hover:text-accent  hover:underline hover:underline-offset-8 transition"
          >
            About
          </Link>
          <Link
            to="/recipe"
            className="hover:text-accent hover:underline hover:underline-offset-8 transition"
          >
            Recipe
          </Link>
          <Link
            to="/community"
            className="hover:text-accent hover:underline hover:underline-offset-8 transition"
          >
            Community
          </Link>
          <Link
            to="/contact"
            className="hover:text-accent hover:underline hover:underline-offset-8 transition"
          >
            Contact
          </Link>
        </ul>
        <i
          className="bx bx-menu xl:hidden md:hidden block text-3xl cursor-pointer ml-20"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        ></i>
        <div
          className={`absolute xl:hidden top-24 left-0 w-full bg-white flex flex-col items-center gap-6 font-semibold text-md transform transition-transform
          ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
          style={{ transition: "transform 0.3s ease, opacity 0.3s ease" }}
        >
          <li className="list-none w-full text-center p-4 hover:text-accent transition-all cursor-pointer">
            Home
          </li>
          <li className="list-none w-full text-center p-4 hover:text-accent transition-all cursor-pointer">
            About Us
          </li>
          <li className="list-none w-full text-center p-4 hover:text-accent transition-all cursor-pointer">
            Recipe
          </li>
          <li className="list-none w-full text-center p-4 hover:text-accent transition-all cursor-pointer">
            Community
          </li>
          <li className="list-none w-full text-center p-4 hover:text-accent transition-all cursor-pointer">
            Contact Us
          </li>
        </div>
      </div>

      {/* Conditional rendering based on props */}
      {showLoginButtons && (
        <div className="flex items-center space-x-4">
          <Link
            to="/Login"
            className="bg-accent text-white px-4 py-2 rounded-lg hover:brightness-110 transition font-medium"
          >
            Login
          </Link>
        </div>
      )}

      {showUserProfile && (
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </button>

                <button
                  onClick={handleRecentRecipesClick}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Recent Recipes
                </button>

                <button
                  onClick={handleFavouritesClick}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  Favourites
                </button>

                <hr className="my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16,17 21,12 16,7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
