import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const UserProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State for user information - Get from localStorage if available
  const [userInfo, setUserInfo] = useState(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return {
      username: currentUser.firstName && currentUser.lastName 
        ? `${currentUser.firstName} ${currentUser.lastName}` 
        : "Anushka Shakya",
      email: currentUser.email || "aanu332@gmail.com",
      phone: currentUser.phone || "",
      password: ""
    };
  });

  // State for profile image
  const [profileImage, setProfileImage] = useState("/Images/user.jpg");
  const [originalProfileImage] = useState("/Images/user.jpg");
  const [selectedFile, setSelectedFile] = useState(null);

  // State for loading and errors
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // State for dietary preferences
  const [dietaryPlan, setDietaryPlan] = useState("Non-Vegetarian");
  
  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  
  // State for form validation
  const [errors, setErrors] = useState({});

  // State for making layout scrollable after clicking change profile
  const [isScrollableMode, setIsScrollableMode] = useState(false);

  const dietaryOptions = [
    "Vegetarian",
    "Non-Vegetarian", 
    "Keto",
    "Gluten Free",
    "No Dietary Plan"
  ];

  const handleInputChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user makes changes
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const handleDietaryChange = (option) => {
    setDietaryPlan(option);
  };

  // Compress image before preview
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle profile image change
  const handleProfileImageChange = () => {
    setUploadError('');
    setIsScrollableMode(true); // Make layout scrollable when Change Profile is clicked
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please select a valid image file (JPEG, PNG, or GIF)');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      // Compress image if it's too large
      let processedFile = file;
      if (file.size > 1024 * 1024) { // If larger than 1MB, compress
        processedFile = await compressImage(file);
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
        setSelectedFile(processedFile);
      };
      reader.readAsDataURL(processedFile);

    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
      // Clear the input so the same file can be selected again
      event.target.value = '';
    }
  };

  // Reset profile image to original
  const handleResetImage = () => {
    setProfileImage(originalProfileImage);
    setSelectedFile(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setProfileImage('');
    setSelectedFile(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!userInfo.username.trim()) {
      newErrors.username = "Username is required";
    }
    
    if (!userInfo.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(userInfo.email)) {
      newErrors.email = "Email format is invalid";
    }
    
    // Phone number is optional - no validation required
    
    if (userInfo.password && userInfo.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      try {
        // Here you would typically save to backend
        const dataToSave = {
          ...userInfo,
          dietaryPlan,
          profileImage: selectedFile ? 'new_image_selected' : profileImage,
          hasNewImage: !!selectedFile
        };
        
        console.log("Saving user data:", dataToSave);
        
        // Simulate successful save
        alert("Changes saved successfully!");
        
        // You could update localStorage here if needed
        // localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
      } catch (error) {
        alert("Error saving changes. Please try again.");
        console.error("Save error:", error);
      } finally {
        setIsUploading(false);
      }
    }, 1000);
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className={`bg-[#faf9f7] flex flex-col ${isScrollableMode ? 'min-h-screen' : 'h-screen overflow-hidden'}`}>
      <div className="flex-shrink-0">
        <Navbar />
      </div>
      
      <div className={`flex-1 px-4 md:px-8 py-6 ${isScrollableMode ? '' : 'overflow-hidden'}`}>
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
            
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl p-6 flex flex-col">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-[#ff6b6b] mb-6 hover:opacity-80 transition-opacity"
              >
                <span className="text-xl">←</span>
                <span className="text-lg font-medium">Back</span>
              </button>
              
              {/* Profile Section */}
              <div className="text-center mb-6 flex-shrink-0">
                <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden mb-3 shadow-lg relative">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  )}
                  
                  {/* Loading overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                
                {/* Upload Error Display */}
                {uploadError && (
                  <p className="text-red-500 text-sm mb-3">{uploadError}</p>
                )}
                
                {/* Action Buttons */}
                <div className="space-y-2 flex flex-col items-center">
                  <button 
                    onClick={handleProfileImageChange}
                    disabled={isUploading}
                    className="bg-[#ff6b6b] text-white px-4 py-2 rounded-md text-sm hover:brightness-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? "Uploading..." : "Change Profile"}
                  </button>
                  
                  {/* Show additional options if image is selected */}
                  {selectedFile && (
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={handleResetImage}
                        className="bg-gray-500 w-20 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-600 transition-all duration-200"
                      >
                        Reset
                      </button>
                      <button 
                        onClick={handleRemoveImage}
                        className="bg-red-400 w-20 text-white px-4 py-2 rounded-md text-sm hover:bg-red-500 transition-all duration-200"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <h3 className="text-lg font-bold mb-4 font-inter">Change Dietary Plan</h3>
                <div className="space-y-2">
                  {dietaryOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative">
                        <input
                          type="radio"
                          name="dietary"
                          value={option}
                          checked={dietaryPlan === option}
                          onChange={() => handleDietaryChange(option)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          dietaryPlan === option 
                            ? 'bg-[#ff6b6b] border-[#ff6b6b]' 
                            : 'bg-gray-200 border-gray-300'
                        }`}>
                          {dietaryPlan === option && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <span className="text-base">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-3 bg-white rounded-3xl shadow-2xl p-6 flex flex-col">
              
              <h2 className="text-xl font-bold mb-6">Account Information</h2>
              
              <form onSubmit={handleSaveChanges} className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto">
                  {/* Username */}
                  <div>
                    <label className="block text-base font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={userInfo.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent ${
                        errors.username ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your username"
                    />
                    {errors.username && (
                      <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                    )}
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label className="block text-base font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                  
                  {/* Phone */}
                  <div>
                    <label className="block text-base font-medium mb-2">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={userInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>
                  
                  {/* Password */}
                  <div>
                    <label className="block text-base font-medium mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={userInfo.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full px-3 py-2.5 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent pr-10 ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter new password (leave blank to keep current)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {showPassword ? (
                            <>
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </>
                          ) : (
                            <>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                    <p className="text-gray-500 text-sm mt-1">
                      Password must be at least 8 characters with letters, numbers and symbols
                    </p>
                  </div>
                </div>
                
                {/* Save Button - Fixed at bottom */}
                <div className="pt-4 flex-shrink-0">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full bg-[#ff6b6b] text-white py-2.5 rounded-lg text-base font-medium hover:brightness-110 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving Changes...
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed Footer */}
      <div className="flex-shrink-0">
        <Footer />
      </div>
    </div>
  );
};

export default UserProfile;