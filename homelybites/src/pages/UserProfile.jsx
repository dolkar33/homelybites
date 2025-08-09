import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../config/axiosInstance";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { baseURL } from "../config/axiosInstance";

const UserProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State for user information
  const [userInfo, setUserInfo] = useState({
    username: "",
    email: "",
    current_password: "",
    new_password: "",
    first_name: "",
    last_name: ""
  });

  // State for profile response.data
  const [profileData, setProfileData] = useState({
    dietary_preference: [],
    allergies: ""
  });

  // State for profile image
  const [profileImage, setProfileImage] = useState("/Images/user.jpg");
  const [originalProfileImage] = useState("/Images/user.jpg");
  const [selectedFile, setSelectedFile] = useState(null);

  // State for loading and errors
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // State for dietary preferences - now array for multiple selections
  const [dietaryPlan, setDietaryPlan] = useState([]);
  
  // State for allergies dropdown
  const [isAllergyDropdownOpen, setIsAllergyDropdownOpen] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const allergyDropdownRef = useRef(null);
  
  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  
  // State for form validation
  const [errors, setErrors] = useState({});

  // State for making layout scrollable after clicking change profile
  const [isScrollableMode, setIsScrollableMode] = useState(false);

  // State for success message
  const [successMessage, setSuccessMessage] = useState('');

  const dietaryOptions = [
    { label: "Vegetarian", value: "vegetarian" },
    { label: "Non-Vegetarian", value: "non-vegetarian" },
    { label: "Keto", value: "keto" },
    { label: "Gluten Free", value: "gluten-free" },
    { label: "Vegan", value: "vegan" }
  ];

  const allergyOptions = [
    "Lactose Intolerance",
    "Nut Allergy", 
    "Gluten Intolerance",
    "Shellfish Allergy"
  ];

  // Fetch user profile response.data on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setApiError('');
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axiosInstance.get('api/user-profiles/my_profile/');
      console.log('User profile response:', response);
      
      if (response.status === 200) {
        const data = response.data;
        
        // Set user info from the response
        setUserInfo({
          username: data.user.username || "",
          email: data.user.email || "", 
          current_password: "",
          new_password: "",
          first_name: data.user.first_name || "",
          last_name: data.user.last_name || ""
        });

        // Set profile data
        setProfileData({
          dietary_preference: Array.isArray(data.dietary_preference) ? data.dietary_preference : [data.dietary_preference].filter(Boolean),
          allergies: Array.isArray(data.allergies) ? data.allergies : (data.allergies ? [data.allergies] : [])
        });

        // Set dietary plan for the checkboxes
        if (data.dietary_preference) {
          setDietaryPlan(Array.isArray(data.dietary_preference) ? data.dietary_preference : [data.dietary_preference]);
        }

        // Set selected allergies
        if (data.allergies) {
          setSelectedAllergies(Array.isArray(data.allergies) ? data.allergies : [data.allergies]);
        }

        // Set profile image with cache busting
        if (data.profile_image) {
          const cacheBustedUrl = `${data.profile_image}${data.profile_image.includes('?') ? '&' : '?'}t=${Date.now()}`;
          setProfileImage(cacheBustedUrl);
        } else {
          setProfileImage("/Images/user.jpg");
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      if (error.response?.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        navigate('/login');
      } else {
        setApiError('Failed to load profile data. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

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

  // Handle multiple dietary plan selections
  const handleDietaryChange = (optionValue) => {
    setDietaryPlan(prev => {
      const newSelection = prev.includes(optionValue)
        ? prev.filter(item => item !== optionValue)
        : [...prev, optionValue];
      
      setProfileData(prevData => ({
        ...prevData,
        dietary_preference: newSelection
      }));
      
      return newSelection;
    });
  };

  // Handle allergy selection - Multiple select
  const handleAllergySelect = (allergy) => {
    setSelectedAllergies(prev => {
      const newSelection = prev.includes(allergy)
        ? prev.filter(item => item !== allergy)
        : [...prev, allergy];
      
      setProfileData(prevData => ({
        ...prevData,
        allergies: newSelection
      }));
      
      return newSelection;
    });
    // Don't close dropdown for multi-select
  };

  // Toggle allergy dropdown and make page scrollable
  const toggleAllergyDropdown = () => {
    setIsAllergyDropdownOpen(!isAllergyDropdownOpen);
    if (!isAllergyDropdownOpen) {
      setIsScrollableMode(true);
      // Auto scroll to dropdown position after a small delay to ensure DOM updates
      setTimeout(() => {
        if (allergyDropdownRef.current) {
          allergyDropdownRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
    }
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
        canvas.toBlob((blob) => {
          // Create a new File with a valid name and type
          const ext = file.name.split('.').pop();
          const newFile = new File([blob], `compressed.${ext}`, { type: blob.type });
          resolve(newFile);
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle profile image change
  const handleProfileImageChange = () => {
    setUploadError('');
    setIsScrollableMode(true);
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
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      // Compress image if it's too large
      let processedFile = file;
      if (file.size > 1024 * 1024) {
        processedFile = await compressImage(file);
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        // No cache busting needed for preview (local blob)
        setProfileImage(e.target.result);
        setSelectedFile(processedFile);
      };
      reader.readAsDataURL(processedFile);

    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  // Reset profile image to original
  const handleResetImage = () => {
    setProfileImage("/Images/user.jpg");
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

    // If new_password is provided, current_password must also be provided
    if (userInfo.new_password) {
      if (!userInfo.current_password) {
        newErrors.current_password = "Current password is required to set a new password";
      }
      if (userInfo.new_password.length < 8) {
        newErrors.new_password = "New password must be at least 8 characters";
      }
      if (userInfo.current_password && userInfo.new_password === userInfo.current_password) {
        newErrors.new_password = "Please choose a new password different from your current password.";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return false;
      }
      const response = await axiosInstance.post(
        'api/change-password/',
        {
          old_password: userInfo.current_password,
          new_password: userInfo.new_password,
          confirm_password: userInfo.new_password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (response.data.message) {
        setSuccessMessage(response.data.message);
        setUserInfo(prev => ({
          ...prev,
          current_password: "",
          new_password: "",
        }));
        return true;
      }
      return false;
    } catch (error) {
      setApiError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.detail ||
        'Failed to change password. Please try again.'
      );
      return false;
    }
  };

  const handleProfileImageUpload = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return null;
      }
      const formData = new FormData();
      formData.append('profile_image', selectedFile);

      const response = await axiosInstance.post(
        'api/user-profiles/update_profile_image/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (response.data.profile_image) {
        // Add cache-busting param to force reload
        const cacheBustedUrl = response.data.profile_image ? `${response.data.profile_image}${response.data.profile_image.includes('?') ? '&' : '?'}t=${Date.now()}` : "/Images/user.jpg";
        setProfileImage(cacheBustedUrl);
        setSelectedFile(null);
        setSuccessMessage('Profile image updated successfully!');
        return response.data.profile_image;
      }
      return null;
    } catch (error) {
      console.error('Image upload error:', error, error?.response?.data);
      setUploadError(
        (error.response && JSON.stringify(error.response.data)) ||
        error.message ||
        'Failed to update profile image. Please try again.'
      );
      return null;
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    setApiError('');
    setSuccessMessage('');
    
    try {
      if (userInfo.new_password) {
        const passwordChanged = await handlePasswordChange();
        if (!passwordChanged) {
          setIsUploading(false);
          return;
        }
      }

      if (selectedFile) {
        const uploadedImageUrl = await handleProfileImageUpload();
        if (!uploadedImageUrl) {
          setIsUploading(false);
          return;
        }
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      let response;
      if (selectedFile) {
        // (No longer send image here)
      } else {
        // If no image, send JSON as before
        const updateData = {
          dietary_preference: dietaryPlan,
          allergies: selectedAllergies,
          username: userInfo.username,
          email: userInfo.email,
          first_name: userInfo.first_name,
          last_name: userInfo.last_name,
          // Do NOT include current_password or new_password here
        };

        response = await axiosInstance.put(
          'api/user-profiles/update/',
          updateData
        );
      }

      if (response.status === 200) {
        setSuccessMessage('Profile updated successfully!');
        
        // Update localStorage with new user data
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const updatedUser = {
          ...currentUser,
          ...userInfo,
          dietary_preference: dietaryPlan
        };
        setUserInfo({
          username: response.data.user.username || "",
          email: response.data.user.email || "",
          current_password: "",
          new_password: "",
          first_name: response.data.user.first_name || "",
          last_name: response.data.user.last_name || ""
        });

        // Set profile response.data
        setProfileData({
          dietary_preference: response.data.dietary_preference || [],
          allergies: response.data.allergies || []
        });
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Auto hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        navigate('/login');
      } else {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.response?.data?.detail ||
                           'Failed to update profile. Please try again.';
        setApiError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-[#faf9f7] min-h-screen flex flex-col">
        <div className="flex-shrink-0">
          <Navbar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ff6b6b] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
        <div className="mt-auto w-full">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf9f7] min-h-screen flex flex-col">
      <div className="flex-shrink-0">
        <Navbar />
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 p-4 rounded shadow-md z-50 animate-fade-in-down">
          <div className="flex items-center">
            <div className="mr-2">
              <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-green-800">Success!</p>
              <p className="text-green-700">{successMessage}</p>
            </div>
            <button 
              onClick={() => setSuccessMessage('')}
              className="ml-4 text-green-500 hover:opacity-80"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {apiError && (
        <div className="fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 p-4 rounded shadow-md z-50">
          <div className="flex items-center">
            <div className="mr-2">
              <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-red-800">Error!</p>
              <p className="text-red-700">{apiError}</p>
            </div>
            <button 
              onClick={() => setApiError('')}
              className="ml-4 text-red-500 hover:opacity-80"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 px-4 md:px-8 py-6 pb-12">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
            
            {/* Left Panel - Profile Image and Dietary Plan */}
            <div className={`lg:col-span-2 bg-white rounded-3xl shadow-2xl p-6 flex flex-col ${isScrollableMode ? 'overflow-y-auto' : ''}`}>
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
                      src={profileImage?.startsWith('http') ? profileImage : baseURL + profileImage}
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        setProfileImage("/Images/user.jpg");
                      }}
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
                {/* Change Dietary Plan - Multiple Select with Checkboxes */}
                <h3 className="text-lg font-bold mb-4 font-inter">Change Dietary Plan</h3>
                <div className="space-y-2 mb-6">
                  {dietaryOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={dietaryPlan.includes(option.value)}
                          onChange={() => handleDietaryChange(option.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          dietaryPlan.includes(option.value)
                            ? 'bg-[#ff6b6b] border-[#ff6b6b]' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {dietaryPlan.includes(option.value) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-base">{option.label}</span>
                    </label>
                  ))}
                </div>

                {/* Allergies Section - Multi-Select Dropdown */}
                <div className="mb-4 relative" ref={allergyDropdownRef}>
                  <label className="block text-base font-medium mb-2">Allergies</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={toggleAllergyDropdown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white text-left flex items-center justify-between min-h-[40px]"
                    >
                      <span className={selectedAllergies.length > 0 ? "text-gray-900" : "text-gray-500"}>
                        {selectedAllergies.length > 0 
                          ? selectedAllergies.length === 1 
                            ? selectedAllergies[0]
                            : `${selectedAllergies.length} allergies selected`
                          : "Select allergies"
                        }
                      </span>
                      <svg 
                        className={`w-4 h-4 transition-transform flex-shrink-0 ${isAllergyDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Options */}
                    {isAllergyDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                        <div className="p-2 border-b border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAllergies([]);
                              setProfileData(prev => ({ ...prev, allergies: [] }));
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Clear all
                          </button>
                        </div>
                        {allergyOptions.map((allergy) => (
                          <label
                            key={allergy}
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <div className="relative flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={selectedAllergies.includes(allergy)}
                                onChange={() => handleAllergySelect(allergy)}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                selectedAllergies.includes(allergy)
                                  ? 'bg-[#ff6b6b] border-[#ff6b6b]' 
                                  : 'bg-white border-gray-300'
                              }`}>
                                {selectedAllergies.includes(allergy) && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <span className="text-sm">{allergy}</span>
                          </label>
                        ))}
                        <div className="p-2 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => setIsAllergyDropdownOpen(false)}
                            className="w-full bg-[#ff6b6b] text-white px-3 py-1.5 rounded text-xs hover:brightness-110 transition-all duration-200"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Selected allergies display */}
                  {selectedAllergies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedAllergies.map((allergy) => (
                        <span
                          key={allergy}
                          className="inline-flex items-center gap-1 bg-[#ff6b6b] text-white px-2 py-1 rounded-full text-xs"
                        >
                          {allergy}
                          <button
                            type="button"
                            onClick={() => handleAllergySelect(allergy)}
                            className="hover:bg-red-600 rounded-full p-0.5"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Panel - Account Information */}
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
                      className={`w-full px-3 py-2.5 border rounded-lg text-base focus:outline-none ${
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
                      className={`w-full px-3 py-2.5 border rounded-lg text-base focus:outline-none ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                  
                  {/* First Name */}
                  <div>
                    <label className="block text-base font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      value={userInfo.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none"
                      placeholder="Enter your first name"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-base font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      value={userInfo.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none"
                      placeholder="Enter your last name"
                    />
                  </div>
                  
                  {/* Current Password */}
                  <div>
                    <label className="block text-base font-medium mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={userInfo.current_password}
                        onChange={(e) => handleInputChange('current_password', e.target.value)}
                        className={`w-full px-3 py-2.5 border rounded-lg text-base focus:outline-none pr-10 ${
                          errors.current_password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your current password"
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
                    {errors.current_password && (
                      <p className="text-red-500 text-sm mt-1">{errors.current_password}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-base font-medium mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={userInfo.new_password}
                        onChange={(e) => handleInputChange('new_password', e.target.value)}
                        className={`w-full px-3 py-2.5 border rounded-lg text-base focus:outline-none pr-10 ${
                          errors.new_password ? 'border-red-500' : 'border-gray-300'
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
                    {errors.new_password && (
                      <p className="text-red-500 text-sm mt-1">{errors.new_password}</p>
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
      
      {/* Footer - Now properly positioned at bottom with full width */}
      <div className="w-full mt-auto">
        <Footer />
      </div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translate3d(0, -20px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UserProfile;