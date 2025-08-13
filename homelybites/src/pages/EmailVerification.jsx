import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { customToast } from "./toast";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the token from URL parameters
        const token = searchParams.get("token");
        const status = searchParams.get("status");
        const message = searchParams.get("message");

        if (status === "success") {
          setVerificationStatus("success");
          setMessage(message || "Email verified successfully!");
          customToast.success("Email verified successfully! You can now log in.");
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate("/login?verified=true");
          }, 3000);
        } else if (status === "error") {
          setVerificationStatus("error");
          setMessage(message || "Email verification failed. Please try again.");
          customToast.error("Email verification failed. Please try again.");
        } else {
          setVerificationStatus("error");
          setMessage("Invalid verification link. Please check your email or contact support.");
          customToast.error("Invalid verification link. Please check your email or contact support.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setVerificationStatus("error");
        setMessage("An error occurred during verification. Please try again.");
        customToast.error("An error occurred during verification. Please try again.");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const handleGoToSignup = () => {
    navigate("/signup");
  };

  const handleResendVerification = () => {
    // This would typically call an API to resend verification email
    customToast.info("Resend verification feature will be implemented soon.");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Logo */}
          <img
            src="/Images/logo/logo-fyp.svg"
            alt="HomelyBites Logo"
            className="w-20 h-20 mx-auto mb-6"
          />

          {/* Status Icon */}
          {verificationStatus === "verifying" && (
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto"></div>
            </div>
          )}

          {verificationStatus === "success" && (
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}

          {verificationStatus === "error" && (
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {verificationStatus === "verifying" && "Verifying Email..."}
            {verificationStatus === "success" && "Email Verified!"}
            {verificationStatus === "error" && "Verification Failed"}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-8">
            {verificationStatus === "verifying" && "Please wait while we verify your email address..."}
            {verificationStatus === "success" && message}
            {verificationStatus === "error" && message}
          </p>

          {/* Action Buttons */}
          {verificationStatus === "success" && (
            <div className="space-y-3">
              <button
                onClick={handleGoToLogin}
                className="w-full bg-accent text-white py-3 px-4 rounded-lg hover:bg-accent/90 transition-colors font-medium"
              >
                Go to Login
              </button>
            </div>
          )}

          {verificationStatus === "error" && (
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Resend Verification Email
              </button>
              <button
                onClick={handleGoToSignup}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Create New Account
              </button>
              <button
                onClick={handleGoToLogin}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Go to Login
              </button>
            </div>
          )}

          {/* Additional Info */}
          {verificationStatus === "success" && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                You will be automatically redirected to the login page in a few seconds.
              </p>
            </div>
          )}

          {verificationStatus === "error" && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                If you continue to have issues, please contact our support team.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
