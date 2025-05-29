import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        hasLowercase: false,
        hasUppercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false
    });

    // Valid email domains
    const validEmailDomains = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'icloud.com',
        'aol.com',
        'protonmail.com',
        'yandex.com',
        'mail.com',
        'zoho.com',
        'live.com',
        'msn.com',
        'yahoo.co.uk',
        'googlemail.com'
    ];

    const clearError = () => {
        if (error) {
            setError('');
        }
    };

    const handleFirstNameChange = (e) => {
        setFirstName(e.target.value);
        clearError();
    };
    
    const handleLastNameChange = (e) => {
        setLastName(e.target.value);
        clearError();
    };
    
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        clearError();
    };
    
    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        clearError();
        
        // Check password strength
        setPasswordStrength({
            hasLowercase: /[a-z]/.test(newPassword),
            hasUppercase: /[A-Z]/.test(newPassword),
            hasNumber: /\d/.test(newPassword),
            hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
            hasMinLength: newPassword.length >= 8
        });
    };
    
    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
        clearError();
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

    const validateEmail = (email) => {
        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, message: 'Please enter a valid email format' };
        }

        // Extract domain from email
        const domain = email.split('@')[1]?.toLowerCase();
        
        // Check if domain is in our list of valid domains
        if (!validEmailDomains.includes(domain)) {
            return { 
                isValid: false, 
                message: `Please use a valid email provider (e.g., ${validEmailDomains.slice(0, 3).join(', ')}, etc.)` 
            };
        }

        return { isValid: true, message: '' };
    };

    const validatePassword = (password) => {
        const requirements = {
            minLength: password.length >= 8,
            hasLowercase: /[a-z]/.test(password),
            hasUppercase: /[A-Z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };
        
        return requirements;
    };

    const isPasswordStrong = () => {
        const { hasLowercase, hasUppercase, hasNumber, hasSpecialChar, hasMinLength } = passwordStrength;
        return hasLowercase && hasUppercase && hasNumber && hasSpecialChar && hasMinLength;
    };
  

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        // Basic validation
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            setError('Please complete all required fields');
            setLoading(false);
            return;
        }
        
        // Enhanced email validation
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            setError(emailValidation.message);
            setLoading(false);
            return;
        }
        
        // Strong password validation
        const passwordRequirements = validatePassword(password);
        if (!passwordRequirements.minLength) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }
        if (!passwordRequirements.hasLowercase) {
            setError('Password must contain at least one lowercase letter');
            setLoading(false);
            return;
        }
        if (!passwordRequirements.hasUppercase) {
            setError('Password must contain at least one uppercase letter');
            setLoading(false);
            return;
        }
        if (!passwordRequirements.hasNumber) {
            setError('Password must contain at least one number');
            setLoading(false);
            return;
        }
        if (!passwordRequirements.hasSpecialChar) {
            setError('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>?/)');
            setLoading(false);
            return;
        }
        
        // Password match validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        
        try {
            // Get existing users from localStorage
            const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Check if email already exists
            if (existingUsers.some(user => user.email.toLowerCase() === email.toLowerCase())) {
                setError('Email is already registered');
                setLoading(false);
                return;
            }
            
            // Artificial delay to simulate network request
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Create new user object
            const newUser = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.toLowerCase().trim(),
                password: password, // In real app, this should be hashed
                createdAt: new Date().toISOString()
            };
            
            // Add new user to existing users array
            const updatedUsers = [...existingUsers, newUser];
            
            // Save updated users array to localStorage
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            
            console.log('User registered successfully:', { email: newUser.email, firstName: newUser.firstName });
            
            // Show success toast
            setShowSuccessToast(true);
            
            // Auto hide toast after 5 seconds
            setTimeout(() => {
                setShowSuccessToast(false);
            }, 5000);
            
            // Navigate to login with success parameter after successful registration
            setTimeout(() => {
                navigate('/login?registered=true');
            }, 1500);
            
        } catch (err) {
            setError('Registration failed. Please try again');
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

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
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}
                    
                    <div className="w-full">
                        <div className="flex gap-4 mb-6">
                            <div className="w-1/2">
                                <input 
                                    type="text" 
                                    placeholder="First Name"
                                    value={firstName}
                                    onChange={handleFirstNameChange}
                                    onFocus={clearError}
                                    className="w-full px-4 py-4 border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300"
                                    required
                                />
                            </div>
                            <div className="w-1/2">
                                <input 
                                    type="text" 
                                    placeholder="Last Name"
                                    value={lastName}
                                    onChange={handleLastNameChange}
                                    onFocus={clearError}
                                    className="w-full px-4 py-4 border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <input 
                                type="email" 
                                placeholder="Email Address"
                                value={email}
                                onChange={handleEmailChange}
                                onFocus={clearError}
                                className="w-full px-4 py-4 border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300"
                                required
                            />
                        </div>
                        
                        <div className="mb-4 relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter Password"
                                value={password}
                                onChange={handlePasswordChange}
                                onFocus={clearError}
                                className="w-full px-4 py-4 pr-12 border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300"
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

                        {/* Password Strength Indicator */}
                        {password && !isPasswordStrong() && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                                <div className="space-y-1">
                                    <div className={`flex items-center text-xs ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-red-500'}`}>
                                        <span className="mr-2">{passwordStrength.hasMinLength ? '✓' : '✗'}</span>
                                        At least 8 characters
                                    </div>
                                    <div className={`flex items-center text-xs ${passwordStrength.hasLowercase ? 'text-green-600' : 'text-red-500'}`}>
                                        <span className="mr-2">{passwordStrength.hasLowercase ? '✓' : '✗'}</span>
                                        One lowercase letter (a-z)
                                    </div>
                                    <div className={`flex items-center text-xs ${passwordStrength.hasUppercase ? 'text-green-600' : 'text-red-500'}`}>
                                        <span className="mr-2">{passwordStrength.hasUppercase ? '✓' : '✗'}</span>
                                        One uppercase letter (A-Z)
                                    </div>
                                    <div className={`flex items-center text-xs ${passwordStrength.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                                        <span className="mr-2">{passwordStrength.hasNumber ? '✓' : '✗'}</span>
                                        One number (0-9)
                                    </div>
                                    <div className={`flex items-center text-xs ${passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-red-500'}`}>
                                        <span className="mr-2">{passwordStrength.hasSpecialChar ? '✓' : '✗'}</span>
                                        One special character (!@#$%^&*)
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="mb-8 relative">
                            <input 
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                onFocus={clearError}
                                className="w-full px-4 py-4 pr-12 border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300"
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <button 
                            type="button"
                            onClick={handleSignUp}
                            disabled={loading}
                            style={{ backgroundColor: '#FC7D7D' }}
                            className="w-full py-3 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300 hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </div>
                    
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