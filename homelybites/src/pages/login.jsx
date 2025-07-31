import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Toaster } from 'react-hot-toast';
import axiosInstance from '../config/axiosInstance';
import { customToast } from './toast';

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
    const [showPassword, setShowPassword] = useState(false);
    const [generalError, setGeneralError] = useState('');
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        clearErrors,
        reset
    } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            username: '',
            password: ''
        }
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === 'true') {
            customToast.success('Registration successful! You can now log in.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleInputChange = () => {
        if (generalError) {
            setGeneralError('');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const onSubmit = async (data) => {
        setGeneralError('');

        try {
            const response = await axiosInstance.post('api/login/', {
                username: data.username,
                password: data.password,
            });

            if (response.status === 200) {
                const userData = response.data.user || response.data;

                localStorage.setItem('currentUser', JSON.stringify({
                    ...userData,
                    isLoggedIn: true
                }));

                localStorage.setItem('authToken', response.data.access);
                localStorage.setItem('refreshToken', response.data.refresh);

                
                reset();
                if (userData.has_completed_questions) {
                    customToast.success('Welcome back! Redirecting to Home...');
                    setTimeout(() => {
                        navigate('/Home');
                    }, 1500);
                } else {
                    customToast.success('Login successful! Redirecting to your questions...');
                    setTimeout(() => {
                    
                    navigate('/userquestion');
                }, 1500);
                };
                
            }
        } catch (error) {
            console.error('Login error:', error);

            if (error.response) {
                if (error.response.status === 401) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                }

                const errorMessage = error.response?.data?.message || 
                                    error.response?.data?.error || 
                                    error.response?.data?.detail ||
                                    'Invalid username or password';
                customToast.error(errorMessage);
            } else if (error.request) {
                customToast.error('Network error. Please check your connection and try again.');
            } else {
                customToast.error('An unexpected error occurred. Please try again later.');
            }
        }
    };

    const handleSignUp = () => {
        navigate("/signup");
    };

    const handleForgotPassword = () => {
        customToast.error('Forgot Password feature is not implemented yet.');
    };

    return (
        <div className="flex h-screen w-full bg-white relative overflow-hidden">
            <Toaster />

            <div className="w-full md:w-1/2 flex flex-col justify-start items-center pt-16 px-8 overflow-hidden">
                <div className="w-full max-w-md">
                    <div className="flex flex-col items-center mb-8">
                        <img src="/Images/logo/logo-fyp.svg" alt="HomelyBites Logo" className="w-28 h-28" />
                        <h2 className="text-2xl font-bold mt-4 text-gray-800">Welcome, Login!</h2>
                    </div>

                    {generalError && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                            {generalError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
                        <div className="mb-6">
                            <input 
                                type="text" 
                                placeholder="Username"
                                {...register('username', {
                                    onChange: handleInputChange
                                })}
                                className={`w-full px-4 py-4 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300 text-base ${
                                    errors.username ? 'border-red-400' : 'border-gray-400'
                                }`}
                            />
                            {errors.username && (
                                <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
                            )}
                        </div>

                        <div className="mb-5 relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter Password"
                                {...register('password', {
                                    onChange: handleInputChange
                                })}
                                className={`w-full px-4 py-4 pr-12 border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300 text-base ${
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

                        <div className="text-right mb-6 mt-3">
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
                            style={{ backgroundColor: '#FC7D7D' }}
                            className="w-full py-4 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300 hover:opacity-90 disabled:opacity-50 text-base font-medium"
                        >
                            {isSubmitting ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button 
                            onClick={handleSignUp}
                            style={{ color: '#FC7D7D' }}
                            className="hover:opacity-80 font-medium"
                        >
                            SignUp 
                        </button>
                    </div>
                </div>
            </div>

            <div className="hidden md:block md:w-1/2 bg-pink-200 overflow-hidden">
                <div className="h-full flex items-center justify-center">
                    <img src="/src/img/chef.png" alt="Chef Illustration" className="max-w-full max-h-full object-contain" />
                </div>
            </div>
        </div>
    );
};

export default Login;
