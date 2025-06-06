import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import axiosInstance from '../config/axiosInstance';

// Yup validation schema
const validationSchema = yup.object({
    username: yup
        .string()
        .required('Username is required')
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must not exceed 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    
    password: yup
        .string()
        .required('Password is required')
        .min(1, 'Password cannot be empty')
});

const Login = () => {
    const [loginData, setLoginData] = useState({
        username: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const navigate = useNavigate();

    // Check if redirected from signup with success flag
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === 'true') {
            setShowSuccessToast(true);
            
            // Clear the query parameter without page refresh
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Auto hide toast after 5 seconds
            setTimeout(() => {
                setShowSuccessToast(false);
            }, 5000);
        }
    }, []);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setLoginData((prevData) => ({
            ...prevData,
            [name]: value
        }));

        // Clear specific field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Clear general error when user starts typing
        if (errors.general) {
            setErrors(prev => ({
                ...prev,
                general: ''
            }));
        }
    };

    const validateForm = async () => {
        try {
            await validationSchema.validate(loginData, { abortEarly: false });
            setErrors({});
            return true;
        } catch (validationErrors) {
            const errorMap = {};
            validationErrors.inner.forEach(error => {
                errorMap[error.path] = error.message;
            });
            setErrors(errorMap);
            return false;
        }
    };

    const validateField = async (fieldName, value) => {
        try {
            await validationSchema.validateAt(fieldName, { ...loginData, [fieldName]: value });
            setErrors(prev => ({
                ...prev,
                [fieldName]: ''
            }));
        } catch (error) {
            setErrors(prev => ({
                ...prev,
                [fieldName]: error.message
            }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        validateField(name, value);
    };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        const isValid = await validateForm();
        if (!isValid) {
            return;
        }

        setLoading(true);
        setErrors({});
        
        try {
            const response = await axiosInstance.post('api/login/', {
                username: loginData.username,
                password: loginData.password,
            });

            if (response.status === 200) {
                // Store user data from response
                const userData = response.data.user || response.data;
                
                // Store logged in user info (adjust based on your API response structure)
                localStorage.setItem('currentUser', JSON.stringify({
                    ...userData,
                    isLoggedIn: true
                }));

                // Store token if provided - using consistent 'authToken' key
                
                    localStorage.setItem('authToken', response.data.access);
                    localStorage.setItem('refreshToken', response.data.refresh);
                    
                
                // Show success toast
                setShowSuccessToast(true);
                
                // Redirect to main page after a short delay
                setTimeout(() => {
                    navigate('/userquestion');
                }, 1500);
                
                // Auto hide toast after 5 seconds
                setTimeout(() => {
                    setShowSuccessToast(false);
                }, 5000);
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle different error scenarios
            if (error.response) {
                // Server responded with error status
                if (error.response.status === 401) {
                    // Clear any existing tokens on 401
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                }
                
                const errorMessage = error.response?.data?.message || 
                                   error.response?.data?.error || 
                                   error.response?.data?.detail ||
                                   'Invalid username or password';
                setErrors({ general: errorMessage });
            } else if (error.request) {
                // Request was made but no response received
                setErrors({ general: 'Network error. Please check your connection and try again.' });
            } else {
                // Something else happened
                setErrors({ general: 'Login failed. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

  const handleSignUp = () => {
    navigate("/signup");
  };

    const handleForgotPassword = () => {
        // Navigate to forgot password page or show modal
        // For now, just alert the user
        alert('Password reset functionality will be implemented soon!');
        // navigate('/forgot-password');
    };

    return (
        <div className="flex h-screen w-full bg-white relative">
            {/* Success Toast Notification - with pink theme (#FC7D7D) */}
            {showSuccessToast && (
                <div className="fixed top-4 right-4 bg-white border-l-4 p-4 rounded shadow-md z-50 animate-fade-in-down flex items-center" style={{ borderColor: '#FC7D7D' }}>
                    <div className="mr-2">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#FC7D7D">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-bold" style={{ color: '#333333' }}>Success!</p>
                        <p style={{ color: '#666666' }}>You have successfully logged in.</p>
                    </div>
                    <button 
                        onClick={() => setShowSuccessToast(false)}
                        className="ml-4 hover:opacity-80"
                        style={{ color: '#FC7D7D' }}
                    >
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            
            {/* Left side - Login Form */}
            <div className="w-full md:w-1/2 flex flex-col justify-start pt-12 px-8">
                <div className="w-full max-w-md mx-auto">
                    <div className="flex flex-col items-center mb-12">
                        <img src="/Images/logo/logo-fyp.svg" alt="HomelyBites Logo" className="w-32 h-32" />
                        <h2 className="text-2xl font-bold font-amaranth mt-6 text-gray-800">Welcome, Login!</h2>
                    </div>
                    
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                            {errors.general}
                        </div>
                    )}
                    
                    <form onSubmit={handleLogin} className="w-full">
                        <div className="mb-8">
                            <input 
                                type="text" 
                                name="username"
                                placeholder="Username"
                                value={loginData.username}
                                onChange={handleInput}
                                onBlur={handleBlur}
                                className={`w-full px-4 py-4 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300 ${
                                    errors.username ? 'border-red-400' : 'border-gray-400'
                                }`}
                            />
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                            )}
                        </div>
                        
                        <div className="mb-1 relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter Password"
                                value={loginData.password}
                                onChange={handleInput}
                                onBlur={handleBlur}
                                className={`w-full px-4 py-4 pr-12 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300 ${
                                    errors.password ? 'border-red-400' : 'border-gray-400'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? (
                                    // Eye with slash (hide password)
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    // Eye (show password)
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
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
                            disabled={loading}
                            style={{ backgroundColor: '#FC7D7D' }}
                            className="w-full py-3 text-white rounded-full hover:bg-pink-500 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300 hover:opacity-80 disabled:opacity-50"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                    
                    <div className="mt-6 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button 
                            onClick={handleSignUp}
                            style={{ color: '#FC7D7D' }}
                            className="hover:opacity-60"
                        >
                            SignUp Now
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Add custom animation for toast */}
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
