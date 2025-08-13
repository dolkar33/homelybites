import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../config/axiosInstance";
import axios from "axios";

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // React Hook Form setup without Yup validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      password: "",
      password2: "",
    },
  });

  // Watch password for strength indicator
  const watchPassword = watch("password", "");

  // Clear general error when user starts typing
  const handleInputChange = () => {
    if (generalError) {
      setGeneralError("");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const navigateToLogin = () => {
    navigate("/login");
  };

  // Password strength checker for visual feedback
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, requirements: [] };

    const requirements = [
      { test: password.length >= 8, text: "At least 8 characters" },
      { test: /[a-z]/.test(password), text: "One lowercase letter (a-z)" },
      { test: /[A-Z]/.test(password), text: "One uppercase letter (A-Z)" },
      { test: /\d/.test(password), text: "One number (0-9)" },
      {
        test: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        text: "One special character (!@#$%^&*)",
      },
    ];

    const score = requirements.filter((req) => req.test).length;
    return { score, requirements };
  };

  const passwordStrength = getPasswordStrength(watchPassword);

  const onSubmit = async (data) => {
    setGeneralError("");
    setRegistrationSuccess(false);

    // Basic client-side validation
    if (!data.first_name || !data.last_name || !data.username || !data.email || !data.password || !data.password2) {
      setGeneralError("All fields are required.");
      toast.error("All fields are required.", {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#fff",
          color: "#333",
          border: "1px solid #ef4444",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      });
      return;
    }

    if (data.password !== data.password2) {
      setGeneralError("Passwords do not match.");
      toast.error("Passwords do not match.", {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#fff",
          color: "#333",
          border: "1px solid #ef4444",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      });
      return;
    }

    if (data.password.length < 8) {
      setGeneralError("Password must be at least 8 characters long.");
      toast.error("Password must be at least 8 characters long.", {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#fff",
          color: "#333",
          border: "1px solid #ef4444",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      });
      return;
    }

    try {
      const response = await axios.post("http://localhost:8000/api/register/", {
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        email: data.email,
        password: data.password,
        password2: data.password2,
      });

      if (response.status === 200 || response.status === 201) {
        // Show success toast with email verification message
        toast.success("Account created successfully! Please check your email for verification.", {
          duration: 5000,
          position: "top-right",
          style: {
            background: "#fff",
            color: "#333",
            border: "1px solid #FC7D7D",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          },
          iconTheme: {
            primary: "#FC7D7D",
            secondary: "#fff",
          },
        });

        // Reset form and show verification message
        reset();
        setRegistrationSuccess(true);
        setGeneralError(""); // Clear any previous errors
      }
    } catch (error) {
      console.error("Registration error:", error);

      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        let errorMessage = "";
        
        if (error.response.data && typeof error.response.data === 'object') {
          // Handle field-specific errors
          const errors = error.response.data;
          if (errors.email) {
            errorMessage = `Email Error: ${errors.email}`;
          } else if (errors.username) {
            errorMessage = `Username Error: ${errors.username}`;
          } else if (errors.password) {
            errorMessage = `Password Error: ${errors.password}`;
          } else if (errors.first_name) {
            errorMessage = `First Name Error: ${errors.first_name}`;
          } else if (errors.last_name) {
            errorMessage = `Last Name Error: ${errors.last_name}`;
          } else {
            // Handle general errors
            errorMessage = errors.message || errors.error || errors.detail || "Registration failed. Please try again";
          }
        } else {
          errorMessage = error.response.data || "Registration failed. Please try again";
        }
        
        setGeneralError(errorMessage);
        toast.error(errorMessage, {
          duration: 4000,
          position: "top-right",
          style: {
            background: "#fff",
            color: "#333",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          },
        });
      } else if (error.request) {
        // Request was made but no response received
        const networkError =
          "Network error. Please check your connection and try again.";
        setGeneralError(networkError);
        toast.error(networkError, {
          duration: 4000,
          position: "top-right",
          style: {
            background: "#fff",
            color: "#333",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          },
        });
      } else {
        // Something else happened
        const generalError = "Registration failed. Please try again.";
        setGeneralError(generalError);
        toast.error(generalError, {
          duration: 4000,
          position: "top-right",
          style: {
            background: "#fff",
            color: "#333",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          },
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white relative">
      {/* Toast Container */}
      <Toaster />

      {/* Left side - SignUp Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-start pt-[5vh] sm:pt-[6vh] px-4 sm:px-6 md:px-8 h-[100vh]">
        <div className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center mb-[4vh] sm:mb-[5vh]">
            <img
              src="/Images/logo/logo-fyp.svg"
              alt="HomelyBites Logo"
              className="w-[12vh] h-[12vh] sm:w-[16vh] sm:h-[16vh]"
            />
            <h2 className="text-xl sm:text-2xl font-bold mt-[2vh] sm:mt-[3vh] text-gray-800">
              Get Started
            </h2>
          </div>

          {generalError && (
            <div className="mb-[2vh] p-3 bg-red-100 text-red-700 rounded-lg">
              {generalError}
            </div>
          )}

          {/* Email Verification Message */}
          {registrationSuccess && (
            <div className="mb-[2vh] p-4 bg-blue-100 text-blue-700 rounded-lg border border-blue-200">
              <div className="text-center">
                <h4 className="font-medium text-lg mb-2">Email Verification Required</h4>
                <p className="text-sm mb-3">
                  We've sent a verification link to your email address. You must verify your email before you can log in.
                </p>
                <div className="p-2 bg-blue-50 rounded border border-blue-200 mb-3">
                  <p className="text-xs text-blue-600">
                    <strong>Important:</strong> Check your spam/junk folder if you don't see the email.
                  </p>
                </div>
                <div className="flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationSuccess(false);
                      setGeneralError("");
                    }}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Another Account
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <div className="flex flex-col sm:flex-row gap-4 mb-[3vh]">
              <div className="w-full sm:w-1/2">
                <input
                  type="text"
                  placeholder="First Name"
                  {...register("first_name", {
                    onChange: handleInputChange,
                  })}
                  className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
                    errors.first_name ? "border-red-400" : "border-gray-400"
                  }`}
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="w-full sm:w-1/2">
                <input
                  type="text"
                  placeholder="Last Name"
                  {...register("last_name", {
                    onChange: handleInputChange,
                  })}
                  className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
                    errors.last_name ? "border-red-400" : "border-gray-400"
                  }`}
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-[3vh]">
              <input
                type="text"
                placeholder="Username"
                {...register("username", {
                  onChange: handleInputChange,
                })}
                className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
                  errors.username ? "border-red-400" : "border-gray-400"
                }`}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                {...register("email")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your email address"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                We accept emails from Gmail, Yahoo, Hotmail, Outlook, and other legitimate providers.
                <br />
                <strong>Note:</strong> Disposable, temporary, or fake email addresses are not allowed.
              </p>
            </div>

            <div className="mb-[2vh] relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                {...register("password", {
                  onChange: handleInputChange,
                })}
                className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] pr-12 text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
                  errors.password ? "border-red-400" : "border-gray-400"
                }`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Password Strength Indicator */}
            {watchPassword && passwordStrength.score < 5 && (
              <div className="mb-[2vh] p-3 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-[1vh]">
                  Password Requirements:
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {passwordStrength.requirements.map((req, index) => (
                    <div
                      key={index}
                      className={`flex items-center text-xs sm:text-sm ${
                        req.test ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      <span className="mr-2">{req.test ? "✓" : "✗"}</span>
                      <span className="text-xs">{req.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                {...register("password2", {
                  onChange: handleInputChange,
                })}
                className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] pr-12 text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
                  errors.password2 ? "border-red-400" : "border-gray-400"
                }`}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
              {errors.password2 && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password2.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-[1.5vh] sm:py-[2vh] text-sm sm:text-base text-white rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent hover:opacity-80 bg-accent"
            >
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>

            <div className="mt-[3vh] text-center text-xs sm:text-sm text-greyy">
              Already have an account?{" "}
              <button
                type="button"
                onClick={navigateToLogin}
                className="text-accent hover:opacity-80 font-medium"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden md:flex md:w-1/2 min-h-screen bg-accent items-center justify-center relative">
        <img
          src="/src/img/chef.png"
          alt="Chef Illustration"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default SignUp;
