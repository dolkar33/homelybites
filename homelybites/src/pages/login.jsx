import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const navigate = useNavigate();

  // Check if redirected from signup with success flag
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") {
      setShowSuccessToast(true);

      // Clear the query parameter without page refresh
      window.history.replaceState({}, document.title, window.location.pathname);

      // Auto hide toast after 5 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 5000);
    }

    // Add test users for development (remove this in production)
    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
    if (existingUsers.length === 0) {
      const testUsers = [
        {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          password: "password123",
        },
        {
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          password: "test123",
        },
      ];
      localStorage.setItem("users", JSON.stringify(testUsers));
    }
  }, []);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError(""); // Clear error when user types
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError(""); // Clear error when user types
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      // Simulate API call with localStorage check
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      console.log("Stored users:", users); // Debug log
      console.log("Login attempt:", { email, password }); // Debug log

      const user = users.find(
        (u) => u.email === email && u.password === password
      );
      console.log("Found user:", user); // Debug log

      // Artificial delay to simulate network request
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (user) {
        // Store logged in user info in localStorage
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isLoggedIn: true,
          })
        );

        // Show success toast first
        setShowSuccessToast(true);

        // Redirect to MainPage after a short delay
        setTimeout(() => {
          navigate("/userquestion");
        }, 1500);

        // Auto hide toast after 5 seconds
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 5000);
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("Login failed. Please try again");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleForgotPassword = () => {
    // For now, just alert the user
    alert("Password reset functionality will be implemented soon!");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-white relative">
      {/* Success Toast Notification - with pink theme (#FC7D7D) */}
      {showSuccessToast && (
        <div
          className="fixed top-4 right-4 bg-white border-l-4 p-4 rounded shadow-md z-50 animate-fade-in-down flex items-center"
          style={{ borderColor: "#FC7D7D" }}
        >
          <div className="mr-2">
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#FC7D7D"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold" style={{ color: "#333333" }}>
              Success!
            </p>
            <p style={{ color: "#666666" }}>You have successfully logged in.</p>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="ml-4 hover:opacity-80"
            style={{ color: "#FC7D7D" }}
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Left side - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-start pt-12 px-8">
        <div className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center mb-12">
            <img
              src="/Images/logo/logo-fyp.svg"
              alt="HomelyBites Logo"
              className="w-32 h-32"
            />
            <h2 className="text-2xl font-bold font-amaranth mt-6 text-gray-800">
              Welcome, Login!
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full">
            <div className="mb-8">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={handleEmailChange}
                className="w-full px-4 py-4 border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>

            <div className="mb-1 relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-4 pr-12 border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  // Eye with slash (hide password)
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                ) : (
                  // Eye (show password)
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
            </div>

            <div className="text-right mb-8 mt-2">
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
              className="w-full py-3 text-white bg-accent rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent hover:opacity-80"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={handleSignUp}
              className="hover:opacity-6 text-accent"
            >
              SignUp Now
            </button>
          </div>
        </div>
      </div>

      {/* Add custom animation for toast */}
      {/* <style jsx>{`
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
            `}</style> */}

      <div className="md:inline-block md:w-1/2 ">
        <div className="h-full w-full md:flex md:justify-end relative overflow-visible">
          <img
            src="/src/img/chef.png"
            alt="Chef Illustration"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
