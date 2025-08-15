import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axiosInstance from '../config/axiosInstance';
import { customToast } from './toast';
import { Toaster } from 'react-hot-toast';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { token: tokenFromPath } = useParams();
    const [token, setToken] = useState('');

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setError('');
    };

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
        setError('');
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const res = await axiosInstance.post('/api/password-reset-confirm/', {
                token,
                password,
                password2: confirmPassword,
            });

            if (res?.status === 200) {
                setSuccess('Password has been reset successfully!');
                customToast.success('Password has been reset successfully!');
                setTimeout(() => navigate('/login'), 1500);
            } else {
                throw new Error(res?.data?.error || 'Failed to reset password');
            }
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to reset password. Please try again.';
            setError(msg);
            customToast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Resolve token from either path parameter /reset-password/:token or query ?token=...
    useEffect(() => {
        const qs = new URLSearchParams(location.search);
        const tokenFromQuery = qs.get('token');
        setToken(tokenFromPath || tokenFromQuery || '');
    }, [location.search, tokenFromPath]);

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
                            Enter and confirm your new password
                        </p>
                    </div>

                    {error && (
                        <div className="mb-[2vh] p-3 bg-red-100 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-[2vh] p-3 bg-green-100 text-green-700 rounded-lg">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="w-full">
                        <div className="mb-[3vh] relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="New Password"
                                value={password}
                                onChange={handlePasswordChange}
                                className="w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] pr-12 text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                                required
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
                        </div>

                        <div className="mb-[3vh] relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                className="w-full px-3 sm:px-4 py-[1.5vh] sm:py-[2vh] pr-12 text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                                required
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-[1.5vh] sm:py-[2vh] text-sm sm:text-base text-white rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent hover:opacity-80 bg-accent disabled:opacity-60"
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </button>

                        <div className="mt-[3vh] text-center text-xs sm:text-sm text-greyy">
                            Remembered it?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
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

export default ResetPassword; 