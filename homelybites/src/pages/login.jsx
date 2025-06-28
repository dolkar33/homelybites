import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Toaster } from "react-hot-toast";
import axiosInstance from "../config/axiosInstance";
import { customToast } from "./toast";
import axios from "axios";

// Yup validation schema
const validationSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  password: yup
    .string()
    .required("Password is required")
    .min(1, "Password cannot be empty"),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") {
      customToast.success("Registration successful! You can now log in.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleInputChange = () => {
    if (generalError) {
      setGeneralError("");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data) => {
    setGeneralError("");

    try {
      const response = await axios.post("api/recipes/login/", {
        username: data.email,
        password: data.password,
      });

      if (response.status === 200) {
        const userData = response.data.user || response.data;

        localStorage.setItem(
          
          "currentUser",
          JSON.stringify({
            ...userData,
            isLoggedIn: true,
          })
        );

        localStorage.setItem("authToken", response.data.access);
        localStorage.setItem("refreshToken", response.data.refresh);

        customToast.success(
          "Login successful! Redirecting to your questions..."
        );
        reset();

        setTimeout(() => {
          navigate("/userquestion");
        }, 1500);
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("currentUser");
        }

        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.response?.data?.detail ||
          "Invalid username or password";
        customToast.error(errorMessage);
      } else if (error.request) {
        customToast.error(
          "Network error. Please check your connection and try again."
        );
      } else {
        customToast.error(
          "An unexpected error occurred. Please try again later."
        );
      }
    }
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleForgotPassword = () => {
    customToast.error("Forgot Password feature is not implemented yet.");
  };

  return (
    <div className="flex h-screen w-full">
      <Toaster />
      {/* Left Side: Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-white px-8">
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          <img
            src="/Images/logo/logo-fyp.svg"
            alt="HomelyBites Logo"
            className="w-24 h-24 mb-6"
          />
          <h2 className="text-2xl font-bold font-amaranth mb-8 text-gray-800 text-center">
            Welcome, Login!
          </h2>
          {generalError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg w-full text-center">
              {generalError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email Address"
                {...register("email", {
                  onChange: handleInputChange,
                })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent text-base ${
                  errors.email ? "border-red-400" : "border-gray-400"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="mb-2 relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                {...register("password", {
                  onChange: handleInputChange,
                })}
                className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent text-base ${
                  errors.password ? "border-red-400" : "border-gray-400"
                }`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
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
            <div className="text-right mb-6">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Forgot Password?
              </button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              
              className="w-full py-3 text-white rounded-full hover:opacity-80 transition-colors focus:outline-none focus:ring-2 focus:ring-accent text-lg mb-4 bg-accent"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
          <div className="mt-2 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={handleSignUp}
              className="text-accent hover:opacity-80 font-medium"
            >
              SignUp Now
            </button>
          </div>
        </div>
      </div>
      {/* Right Side: Chef Illustration */}
      <div className="hidden md:flex md:w-1/2 h-screen bg-[#FFD6D6] items-center justify-center relative">
        <img
          src="/src/img/chef.png"
          alt="Chef Illustration"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Login;
