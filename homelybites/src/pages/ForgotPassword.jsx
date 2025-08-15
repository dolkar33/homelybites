import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Toaster } from "react-hot-toast";
import { customToast } from "./toast";
import axiosInstance from "../config/axiosInstance";

// Yup validation schema
const validationSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
});

const ForgotPassword = () => {
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
      email: "",
    },
  });

  const handleInputChange = () => {
    if (generalError) {
      setGeneralError("");
    }
    clearErrors();
  };

  // No password field in forgot password form

  const onSubmit = async (data) => {
    setGeneralError("");

    try {
      // Request backend to send password reset email/link
      const res = await axiosInstance.post("/api/password-reset/", {
        email: data.email,
      });

      if (res?.status === 200) {
        customToast.success(
          "If an account with this email exists, a password reset link has been sent."
        );
      } else {
        customToast.success(
          "If an account with this email exists, a password reset link has been sent."
        );
      }

      // Reset form and go to login
      reset();
      setTimeout(() => navigate("/login"), 1200);
      
    } catch (error) {
      console.error("Password reset request error:", error);
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to request password reset. Please try again.";
      customToast.error(msg);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-white relative">
      {/* Toast Container */}
      <Toaster />

      {/* Centered Form Container */}
      <div className="w-full flex flex-col justify-start pt-[5vh] sm:pt-[6vh] px-4 sm:px-6 md:px-8 h-[100vh]">
        <div className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center mb-[4vh] sm:mb-[5vh]">
            <img
              src="/Images/logo/logo-fyp.svg"
              alt="HomelyBites Logo"
              className="w-[12vh] h-[12vh] sm:w-[16vh] sm:h-[16vh]"
            />
            <h2 className="text-xl sm:text-2xl font-bold mt-[2vh] sm:mt-[3vh] text-gray-800">
              Reset Password
            </h2>
            <p className="text-sm text-gray-600 text-center mt-2">
              Enter your email to receive a password reset link
            </p>
          </div>

          {generalError && (
            <div className="mb-[2vh] p-3 bg-red-100 text-red-700 rounded-lg">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <div className="mb-[3vh]">
              <input
                type="email"
                placeholder="Email"
                {...register("email", {
                  onChange: handleInputChange,
                })}
                className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
                  errors.email ? "border-red-400" : "border-gray-400"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* No password input in forgot password form */}

            {/* No confirm password for forgot password flow */}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-[1.5vh] sm:py-[2vh] text-sm sm:text-base text-white rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent hover:opacity-80 bg-accent"
            >
              {isSubmitting ? "Sending Link..." : "Send Reset Link"}
            </button>

            <div className="mt-[3vh] text-center text-xs sm:text-sm text-greyy">
              Remember your password?{" "}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-accent hover:opacity-80 font-medium"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
