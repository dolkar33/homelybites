import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import axiosInstance from '../config/axiosInstance';

// Yup validation schema
const validationSchema = yup.object({
    first_name: yup
        .string()
        .required('First name is required')
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must not exceed 50 characters')
        .matches(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
    
    last_name: yup
        .string()
        .required('Last name is required')
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must not exceed 50 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
    
    username: yup
        .string()
        .required('Username is required')
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must not exceed 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .matches(/^[a-zA-Z]/, 'Username must start with a letter'),
    
    email: yup
        .string()
        .required('Email is required')
        .email('Please enter a valid email format')
        .test('valid-domain', 'Please use a valid email provider (e.g., gmail.com, yahoo.com, outlook.com)', function(value) {
            if (!value) return false;
            const validDomains = [
                'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
                'aol.com', 'protonmail.com', 'yandex.com', 'mail.com', 'zoho.com',
                'live.com', 'msn.com', 'yahoo.co.uk', 'googlemail.com'
            ];
            const domain = value.split('@')[1]?.toLowerCase();
            return validDomains.includes(domain);
        }),
    
    password: yup
        .string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/\d/, 'Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    
    password2: yup
        .string()
        .required('Please confirm your password')
        .oneOf([yup.ref('password')], 'Passwords do not match')
});

const SignUp = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [errors, setErrors] = useState({});
    const [registerData, setRegisterData] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        password2: ''
    });

    const handleInput = (e) => {
        const { name, value } = e.target;
        setRegisterData((prevData) => ({
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
    };

    const validateForm = async () => {
        try {
            await validationSchema.validate(registerData, { abortEarly: false });
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
            await validationSchema.validateAt(fieldName, { ...registerData, [fieldName]: value });
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

    const handleRegister = async (e) => {
        e.preventDefault();
        
        const isValid = await validateForm();
        if (!isValid) {
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.post('api/register/', {
                first_name: registerData.first_name,
                last_name: registerData.last_name,
                username: registerData.username,
                email: registerData.email,
                password: registerData.password,
                password2: registerData.password2,
            });

            if (response.status === 200 || response.status === 201) {
                setShowSuccessToast(true);
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.message || 'Registration failed. Please try again';
            setErrors({ general: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const navigateToLogin = () => {
        navigate('/login');
    };

    // Password strength checker for visual feedback
    const getPasswordStrength = (password) => {
        if (!password) return { score: 0, requirements: [] };
        
        const requirements = [
            { test: password.length >= 8, text: 'At least 8 characters' },
            { test: /[a-z]/.test(password), text: 'One lowercase letter (a-z)' },
            { test: /[A-Z]/.test(password), text: 'One uppercase letter (A-Z)' },
            { test: /\d/.test(password), text: 'One number (0-9)' },
            { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: 'One special character (!@#$%^&*)' }
        ];
        
        const score = requirements.filter(req => req.test).length;
        return { score, requirements };
    };

    const passwordStrength = getPasswordStrength(registerData.password);

    return (
        <div className="flex h-screen w-full bg-white relative">
            {/* Success Toast Notification */}
            {showSuccessToast && (
                <div className="fixed top-4 right-4 bg-white border-l-4 border-pink-400 p-4 rounded shadow-md z-50 flex items-center animate-pulse">
                    <div className="mr-2">
                        <svg className="h-6 w-6 text-pink-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-bold text-gray-800">Success!</p>
                        <p className="text-gray-600">Account created successfully!</p>
                    </div>
                    <button 
                        onClick={() => setShowSuccessToast(false)}
                        className="ml-4 text-pink-400 hover:text-pink-600"
                    >
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            
            {/* Left side - SignUp Form */}
            <div className="w-full md:w-1/2 flex flex-col justify-start pt-12 px-8">
                <div className="w-full max-w-md mx-auto">
                    <div className="flex flex-col items-center mb-12">
                        <img src="/Images/logo/logo-fyp.svg" alt="HomelyBites Logo" className="w-32 h-32" />
                        <h2 className="text-2xl font-bold mt-6 text-gray-800">Get Started</h2>
                    </div>
                    
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                            {errors.general}
                        </div>
                    )}
                    
                    <form onSubmit={handleRegister} className="w-full">
                        <div className="flex gap-4 mb-6">
                            <div className="w-1/2">
                                <input 
                                    type="text" 
                                    name="first_name"
                                    placeholder="First Name"
                                    value={registerData.first_name}
                                    onChange={handleInput}
                                    onBlur={handleBlur}
                                    className={`w-full px-4 py-4 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300 ${
                                        errors.first_name ? 'border-red-400' : 'border-gray-400'
                                    }`}
                                />
                                {errors.first_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                                )}
                            </div>
                            <div className="w-1/2">
                                <input 
                                    type="text" 
                                    name="last_name"
                                    placeholder="Last Name"
                                    value={registerData.last_name}
                                    onChange={handleInput}
                                    onBlur={handleBlur}
                                    className={`w-full px-4 py-4 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300 ${
                                        errors.last_name ? 'border-red-400' : 'border-gray-400'
                                    }`}
                                />
                                {errors.last_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <input 
                                type="text" 
                                name="username"
                                placeholder="Username"
                                value={registerData.username}
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
                        
                        <div className="mb-6">
                            <input 
                                type="email" 
                                name="email"
                                placeholder="Email Address"
                                value={registerData.email}
                                onChange={handleInput}
                                onBlur={handleBlur}
                                className={`w-full px-4 py-4 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300 ${
                                    errors.email ? 'border-red-400' : 'border-gray-400'
                                }`}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>
                        
                        <div className="mb-4 relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter Password"
                                value={registerData.password}
                                onChange={handleInput}
                                onBlur={handleBlur}
                                className={`w-full px-4 py-4 pr-12 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300 ${
                                    errors.password ? 'border-red-400' : 'border-gray-400'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {/* Password Strength Indicator */}
                        {registerData.password && passwordStrength.score < 5 && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                                <div className="space-y-1">
                                    {passwordStrength.requirements.map((req, index) => (
                                        <div key={index} className={`flex items-center text-xs ${req.test ? 'text-green-600' : 'text-red-500'}`}>
                                            <span className="mr-2">{req.test ? '✓' : '✗'}</span>
                                            {req.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="mb-8 relative">
                            <input 
                                type={showConfirmPassword ? "text" : "password"}
                                name="password2"
                                placeholder="Confirm Password"
                                value={registerData.password2}
                                onChange={handleInput}
                                onBlur={handleBlur}
                                className={`w-full px-4 py-4 pr-12 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300 ${
                                    errors.password2 ? 'border-red-400' : 'border-gray-400'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={toggleConfirmPasswordVisibility}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                {showConfirmPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                            {errors.password2 && (
                                <p className="mt-1 text-sm text-red-600">{errors.password2}</p>
                            )}
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            style={{ backgroundColor: '#FC7D7D' }}
                            className="w-full py-3 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300 hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>
                    
                   <div className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <button 
                            onClick={navigateToLogin}
                            style={{ color: '#FC7D7D' }}
                            className="hover:opacity-80"
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="hidden md:block md:w-1/2 bg-pink-200">
                <div className="h-full flex items-center justify-center">
                    <img src="/src/img/chef.png" alt="Chef Illustration" className="max-w-full max-h-full" />
                </div>
            </div>
        </div>
    );
};

export default SignUp;