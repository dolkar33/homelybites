import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import axiosInstance from "../config/axiosInstance.js";
import { customToast } from "./toast.jsx";
import { Toaster } from "react-hot-toast";

const dietaryOptions = ["Vegetarian", "Keto", "Gluten-free", "Vegan"];
const allergyOptions = [
  "Lactose Intolerance",
  "Nut Allergy",
  "Gluten Intolerance",
  "Shellfish Allergy",
];
const dislikeOptions = [
  "Lactose Intolerance",
  "Nut Allergy",
  "Gluten Intolerance",  
  "Shellfish Allergy",
];

const UserQuestion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dietary: [],
    allergies: [],
    dislikes: []
  });
  const [errors, setErrors] = useState({});
  const handleCheckboxChange = (category, option) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(option)
        ? prev[category].filter(item => item !== option)
        : [...prev[category], option]
    }));
    
    // Clear error when user makes a selection
    if (errors[category]) {
      setErrors(prev => ({
        ...prev,
        [category]: false
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.dietary.length === 0) {
      newErrors.dietary = "Please select at least one dietary preference";
    }
    if (formData.allergies.length === 0) {
      newErrors.allergies = "Please select your food allergies/intolerances or check 'None'";
    }
    if (formData.dislikes.length === 0) {
      newErrors.dislikes = "Please select ingredients to avoid or check 'None'";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {

      try {
      const response = await axiosInstance.post('/api/complete-user-questions/', formData);
      if (response.status === 200) {
        customToast.success("User questions submitted successfully");
        setTimeout(() => {
                    navigate('/Home');
                }, 1500);
      }
      } catch (error) {
    customToast.error("Failed to submit user questions. Please try again.");}
     
    }
  };

  return (
    <div className="h-screen bg-[#faf9f7] flex flex-col">
      {/* Fixed Navbar */}
      <Toaster />
      <div className="flex-shrink-0">
        <Navbar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex px-4 md:px-8 overflow-hidden">
        <div className="flex w-full max-w-6xl mx-auto gap-8">
          {/* Left Side - Scrollable Form Section */}
          <div className="flex-1 py-8">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 h-full overflow-y-auto">
              <h1 className="text-1xl md:text-3xl font-bold mb-8 underline mt-0">
                Help us get to know your taste
              </h1>
              <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Q1 */}
                <div>
                  <div className="mb-4 text-lg font-medium">
                    1. Select your Dietary Preferences *
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {dietaryOptions.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 text-lg cursor-pointer"
                      >
                        <input 
                          type="checkbox" 
                          className="accent-accent w-5 h-5"
                          checked={formData.dietary.includes(option)}
                          onChange={() => handleCheckboxChange('dietary', option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-3 text-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="accent-accent w-5 h-5"
                        checked={formData.dietary.includes('None')}
                        onChange={() => handleCheckboxChange('dietary', 'None')}
                      />
                      <span>None</span>
                    </label>
                  </div>
                  {errors.dietary && (
                    <p className="text-red-500 text-sm mt-2">{errors.dietary}</p>
                  )}
                </div>
                
                {/* Q2 */}
                <div>
                  <div className="mb-4 text-lg font-medium">
                    2. Do you have any food allergies or intolerances? *
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {allergyOptions.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 text-lg cursor-pointer"
                      >
                        <input 
                          type="checkbox" 
                          className="accent-accent w-5 h-5"
                          checked={formData.allergies.includes(option)}
                          onChange={() => handleCheckboxChange('allergies', option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-3 text-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="accent-accent w-5 h-5"
                        checked={formData.allergies.includes('None')}
                        onChange={() => handleCheckboxChange('allergies', 'None')}
                      />
                      <span>None</span>
                    </label>
                  </div>
                  {errors.allergies && (
                    <p className="text-red-500 text-sm mt-2">{errors.allergies}</p>
                  )}
                </div>
                
                {/* Q3 */}
                <div>
                  <div className="mb-4 text-lg font-medium">
                    3. Are there any ingredients you dislike or want to avoid? *
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {dislikeOptions.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 text-lg cursor-pointer"
                      >
                        <input 
                          type="checkbox" 
                          className="accent-accent w-5 h-5"
                          checked={formData.dislikes.includes(option)}
                          onChange={() => handleCheckboxChange('dislikes', option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-3 text-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="accent-accent w-5 h-5"
                        checked={formData.dislikes.includes('None')}
                        onChange={() => handleCheckboxChange('dislikes', 'None')}
                      />
                      <span>None</span>
                    </label>
                  </div>
                  {errors.dislikes && (
                    <p className="text-red-500 text-sm mt-2">{errors.dislikes}</p>
                  )}
                </div>

                {/* Add more questions here as needed */}
                
                <div className="flex justify-center mt-8 pb-8">
                  <button
                    type="submit"
                    className="bg-accent text-white px-8 py-3 rounded-lg text-lg shadow hover:brightness-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Right Side - Fixed Chef Illustration */}
          <div className="hidden lg:flex flex-1 items-end">
            <div className="w-full max-w-lg">
              <img 
                src="/Images/chef-illustration.jpg" 
                alt="Chef Illustration" 
                className="w-full h-auto object-contain opacity-90 mix-blend-multiply"
              />
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

export default UserQuestion;