import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';
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
    const [generalError, setGeneralError] = useState('');

    // React Hook Form setup
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        reset
    } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            username: '',
            email: '',
            password: '',
            password2: ''
        }
    });

    // Watch password for strength indicator
    const watchPassword = watch('password', '');

    // Clear general error when user starts typing
    const handleInputChange = () => {
        if (generalError) {
            setGeneralError('');
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
            { test: password.length >= 8, text: 'At least 8 characters' },
            { test: /[a-z]/.test(password), text: 'One lowercase letter (a-z)' },
            { test: /[A-Z]/.test(password), text: 'One uppercase letter (A-Z)' },
            { test: /\d/.test(password), text: 'One number (0-9)' },
            { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: 'One special character (!@#$%^&*)' }
        ];
        
        const score = requirements.filter(req => req.test).length;
        return { score, requirements };
    };

    const passwordStrength = getPasswordStrength(watchPassword);

    const onSubmit = async (data) => {
        setGeneralError('');
        
        try {
            const response = await axiosInstance.post('api/register/', {
                first_name: data.first_name,
                last_name: data.last_name,
                username: data.username,
                email: data.email,
                password: data.password,
                password2: data.password2,
            });

            if (response.status === 200 || response.status === 201) {
                // Show success toast
                toast.success('Account created successfully! Redirecting to login...', {
                    duration: 3000,
                    position: 'top-right',
                    style: {
                        background: '#fff',
                        color: '#333',
                        border: '1px solid #FC7D7D',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                    iconTheme: {
                        primary: '#FC7D7D',
                        secondary: '#fff',
                    },
                });

                // Reset form
                reset();
                
                // Navigate to login with success parameter
                setTimeout(() => {
                    navigate('/login?registered=true');
                }, 2000);
            }
        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle different error scenarios
            if (error.response) {
                // Server responded with error status
                const errorMessage = error.response?.data?.message || 
                                   error.response?.data?.error || 
                                   error.response?.data?.detail ||
                                   'Registration failed. Please try again';
                setGeneralError(errorMessage);
                toast.error(errorMessage, {
                    duration: 4000,
                    position: 'top-right',
                    style: {
                        background: '#fff',
                        color: '#333',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                });
            } else if (error.request) {
                // Request was made but no response received
                const networkError = 'Network error. Please check your connection and try again.';
                setGeneralError(networkError);
                toast.error(networkError, {
                    duration: 4000,
                    position: 'top-right',
                    style: {
                        background: '#fff',
                        color: '#333',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                });
            } else {
                // Something else happened
                const generalError = 'Registration failed. Please try again.';
                setGeneralError(generalError);
                toast.error(generalError, {
                    duration: 4000,
                    position: 'top-right',
                    style: {
                        background: '#fff',
                        color: '#333',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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
                        <img src="/Images/logo/logo-fyp.svg" alt="HomelyBites Logo" className="w-[12vh] h-[12vh] sm:w-[16vh] sm:h-[16vh]" />
                        <h2 className="text-xl sm:text-2xl font-bold mt-[2vh] sm:mt-[3vh] text-gray-800">Get Started</h2>
                    </div>
                    
                    {generalError && (
                        <div className="mb-[2vh] p-3 bg-red-100 text-red-700 rounded-lg">
                            {generalError}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
                        <div className="flex flex-col sm:flex-row gap-4 mb-[3vh]">
                            <div className="w-full sm:w-1/2">
                                <input 
                                    type="text" 
                                    placeholder="First Name"
                                    {...register('first_name', {
                                        onChange: handleInputChange
                                    })}
                                    className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
                                        errors.first_name ? 'border-red-400' : 'border-gray-400'
                                    }`}
                                />
                                {errors.first_name && (
                                    <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
                                )}
                            </div>
                            <div className="w-full sm:w-1/2">
                                <input 
                                    type="text" 
                                    placeholder="Last Name"
                                    {...register('last_name', {
                                        onChange: handleInputChange
                                    })}
                                    className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
                                        errors.last_name ? 'border-red-400' : 'border-gray-400'
                                    }`}
                                />
                                {errors.last_name && (
                                    <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="mb-[3vh]">
                            <input 
                                type="text" 
                                placeholder="Username"
                                {...register('username', {
                                    onChange: handleInputChange
                                })}
                                className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
                                    errors.username ? 'border-red-400' : 'border-gray-400'
                                }`}
                            />
                            {errors.username && (
                                <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
                            )}
                        </div>

                        <div className="mb-[3vh]">
                            <input 
                                type="email" 
                                placeholder="Email Address"
                                {...register('email', {
                                    onChange: handleInputChange
                                })}
                                className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] pr-12 text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
                                    errors.email ? 'border-red-400' : 'border-gray-400'
                                }`}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="mb-[2vh] relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter Password"
                                {...register('password', {
                                    onChange: handleInputChange
                                })}
                                className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] pr-12 text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
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
                                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
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
                                        <div key={index} className={`flex items-center text-xs sm:text-sm ${req.test ? 'text-green-600' : 'text-red-500'}`}>
                                            <span className="mr-2">{req.test ? '✓' : '✗'}</span>
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
                                {...register('password2', {
                                    onChange: handleInputChange
                                })}
                                className={`w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] pr-12 text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent ${
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
                                <p className="mt-1 text-xs text-red-600">{errors.password2.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-[1.5vh] sm:py-[2vh] text-sm sm:text-base text-white rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent hover:opacity-80 bg-accent"
                        >
                            {isSubmitting ? "Creating Account..." : "Sign Up"}
                        </button>

                        <div className="mt-[3vh] text-center text-xs sm:text-sm text-gray-600">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={navigateToLogin}
                                className="text-accent hover:opacity-60"
                            >
                                Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right side - Image */}
            <div className="hidden md:inline-block md:w-1/2 h-[100vh]">
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

export default SignUp;