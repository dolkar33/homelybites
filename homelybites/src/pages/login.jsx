import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Toaster } from "react-hot-toast";
import axiosInstance from "../config/axiosInstance";
import { customToast } from "./toast";

// Yup validation schema
const validationSchema = yup.object({
  username: yup
    .string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must not exceed 20 characters")
    .matches(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),

  password: yup
    .string()
    .required("Password is required")
    .min(1, "Password cannot be empty"),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null); // { user_id, email }
  const [resendUsername, setResendUsername] = useState("");
  const [resendEmail, setResendEmail] = useState("");
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
    const registered = params.get("registered") === "true";
    const verified = params.get("verified"); // "true" | "false" | null
    const message = params.get("message");
    const pending = params.get("pendingVerification") === "true";

    if (registered) {
      customToast.success("Registration successful! Check your email to verify your account.");
    }

    if (verified === "true") {
      customToast.success(message || "Email verified successfully! You can now log in.");
      // On next successful login, take the user to questions
      localStorage.setItem("postVerifiedRedirect", "userquestion");
      // Clear any pending verification cache
      localStorage.removeItem("pendingVerification");
    } else if (verified === "false") {
      customToast.error(message || "Email verification failed. Please try again.");
    }

    if (pending) {
      // Load pending verification info from localStorage if present
      try {
        const stored = localStorage.getItem("pendingVerification");
        if (stored) {
          const obj = JSON.parse(stored);
          setPendingUser(obj);
          setNeedsVerification(true);
        }
      } catch {}
    }

    // Clean URL params
    if (registered || verified || message || pending) {
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
      const response = await axiosInstance.post("api/login/", {
        username: data.username,
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

        reset();
        const hasCompleted = Boolean(userData.has_completed_questions);
        const postVerify = localStorage.getItem("postVerifiedRedirect");
        // Clear the flag regardless; we only use it for the very next login
        if (postVerify) localStorage.removeItem("postVerifiedRedirect");

        if (hasCompleted) {
          customToast.success("Welcome back! Redirecting to Home...");
          setTimeout(() => {
            navigate("/Home");
          }, 1500);
        } else {
          // First-time users (questions not completed) go to user questions.
          // If coming right after email verification, this remains the same.
          customToast.success("Login successful! Redirecting to your questions...");
          setTimeout(() => {
            navigate("/userquestion");
          }, 1500);
        }
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

        // If backend indicates email not verified, surface resend UI
        if (/verify your email/i.test(errorMessage) || /no active account/i.test(errorMessage) || /inactive/i.test(errorMessage)) {
          setNeedsVerification(true);
          try {
            const stored = localStorage.getItem("pendingVerification");
            if (stored) setPendingUser(JSON.parse(stored));
          } catch {}
          customToast.error("Please verify your email. You can resend the verification email below.");
        } else {
          customToast.error(errorMessage);
        }
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

  const handleResendVerification = async () => {
    // Require pending user_id from registration
    let info = pendingUser;
    if (!info) {
      try {
        const stored = localStorage.getItem("pendingVerification");
        if (stored) info = JSON.parse(stored);
      } catch {}
    }
    // Build payload: prefer user_id; fallback to username or email if provided
    const payload = {};
    if (info?.user_id) {
      payload.user_id = info.user_id;
    } else if (resendUsername.trim()) {
      payload.username = resendUsername.trim();
    } else if (resendEmail.trim()) {
      payload.email = resendEmail.trim();
    } else {
      customToast.error("Enter your username or email to resend the verification email.");
      return;
    }
    try {
      setResendLoading(true);
      const res = await axiosInstance.post("/api/resend-verification/", payload);
      if (res.status === 200) {
        customToast.success("Verification email sent. Please check your inbox.");
      } else {
        customToast.error("Failed to send verification email. Please try again later.");
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error || "Failed to send verification email.";
      customToast.error(msg);
    } finally {
      setResendLoading(false);
    }
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="flex min-h-screen w-full bg-white relative">
      {/* Toast Container */}
      <Toaster />

      {/* Left side - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-start pt-[5vh] sm:pt-[6vh] px-4 sm:px-6 md:px-8 h-[100vh]">
        <div className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center mb-[4vh] sm:mb-[5vh]">
            <img
              src="/Images/logo/logo-fyp.svg"
              alt="HomelyBites Logo"
              className="w-[12vh] h-[12vh] sm:w-[16vh] sm:h-[16vh]"
            />
            <h2 className="text-xl sm:text-2xl font-bold mt-[2vh] sm:mt-[3vh] text-gray-800">
              Welcome, Login!
            </h2>
          </div>

          {generalError && (
            <div className="mb-[2vh] p-3 bg-red-100 text-red-700 rounded-lg">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
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

            <div className="text-right mb-6 mt-[1vh]">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
              >
                Forgot Password?
              </button>
            </div>

            {needsVerification && (
              <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-lg text-sm">
                <p className="text-yellow-800 mb-2">
                  Your account email is not verified. Please check your inbox for the verification link.
                </p>
                {pendingUser?.email && (
                  <p className="text-yellow-700 mb-3">Email: <span className="font-medium">{pendingUser.email}</span></p>
                )}
                {!pendingUser?.user_id && (
                  <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={resendUsername}
                      onChange={(e) => setResendUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full px-3 py-2 border border-yellow-300 rounded-md bg-white placeholder-yellow-700/70"
                    />
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="or enter email"
                      className="w-full px-3 py-2 border border-yellow-300 rounded-md bg-white placeholder-yellow-700/70"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="px-4 py-2 rounded-md bg-accent text-white hover:opacity-90 disabled:opacity-60"
                >
                  {resendLoading ? "Sending..." : "Resend verification email"}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-[1.5vh] sm:py-[2vh] text-sm sm:text-base text-white rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent hover:opacity-80 bg-accent"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            <div className="mt-[3vh] text-center text-xs sm:text-sm text-greyy">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={handleSignUp}
                className="text-accent hover:opacity-80 font-medium"
              >
                SignUp
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

export default Login;
