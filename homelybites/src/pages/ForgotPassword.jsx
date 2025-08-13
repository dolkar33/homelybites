import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Toaster } from "react-hot-toast";
import { customToast } from "./toast";

// Yup validation schema
const validationSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),

  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "New password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

const ForgotPassword = () => {
  const [showNewPassword, setShowNewPassword] = useState(false);
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
      newPassword: "",
    },
  });

  const handleInputChange = () => {
    if (generalError) {
      setGeneralError("");
    }
    clearErrors();
  };

  const togglePasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const onSubmit = async (data) => {
    setGeneralError("");

    try {
      // Here you would typically make an API call to change the password
      // For now, we'll just show a success message
      customToast.success("Password changed successfully!");
      
      // Reset form
      reset();
      
      // Redirect back to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 1500);
      
    } catch (error) {
      console.error("Password change error:", error);
      customToast.error("Failed to change password. Please try again.");
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
              Enter your email and a new password
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

            <div className="mb-[3vh] relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                {...register("newPassword", {
                  onChange: handleInputChange,
                })}
                className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] pr-12 text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
                  errors.newPassword ? "border-red-400" : "border-gray-400"
                }`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showNewPassword ? (
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
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            {/* No confirm password for forgot password flow */}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-[1.5vh] sm:py-[2vh] text-sm sm:text-base text-white rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent hover:opacity-80 bg-accent"
            >
              {isSubmitting ? "Resetting Password..." : "Reset Password"}
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
