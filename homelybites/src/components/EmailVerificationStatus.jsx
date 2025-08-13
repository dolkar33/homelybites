import React from "react";

const EmailVerificationStatus = ({ isVerified, email, onResendVerification }) => {
  if (isVerified) {
    return (
      <div className="p-3 bg-green-100 text-green-700 rounded-lg border border-green-200">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Email verified successfully!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-200">
      <div className="flex items-start">
        <svg className="w-5 h-5 mr-2 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">Email verification required</p>
          <p className="text-xs mb-2">
            Please check your email ({email}) for a verification link. You must verify your email before you can access all features.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={onResendVerification}
              className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
            >
              Resend Verification
            </button>
            <button
              onClick={() => window.location.reload()}
              className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationStatus;
