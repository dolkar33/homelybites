// import { useState, useEffect } from 'react';

// const CustomToast = ({ type = 'success', message, onClose, duration = 3000, position = 'top-right' }) => {
//   const [isVisible, setIsVisible] = useState(true);
  
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsVisible(false);
//       setTimeout(() => {
//         if (onClose) onClose();
//       }, 300); // Allow time for fade out animation
//     }, duration);
    
//     return () => clearTimeout(timer);
//   }, [duration, onClose]);
  
//   return null; // Component not rendered anymore
// };

// export default CustomToast;


import React from 'react';
import toast, { Toaster } from 'react-hot-toast';

// Default success theme
const defaultTheme = {
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
  duration: 2000,
  position: 'top-right',
};

// Error theme
const errorTheme = {
  style: {
    background: '#fff',
    color: '#333',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  iconTheme: {
    primary: '#ef4444',
    secondary: '#fff',
  },
  duration: 3000,
  position: 'top-right',
};

// Custom toast methods
export const customToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      ...defaultTheme,
      ...options,
      style: { ...defaultTheme.style, ...options.style },
      iconTheme: { ...defaultTheme.iconTheme, ...options.iconTheme },
    });
  },
  
  error: (message, options = {}) => {
    return toast.error(message, {
      ...errorTheme,
      ...options,
      style: { ...errorTheme.style, ...options.style },
      iconTheme: { ...errorTheme.iconTheme, ...options.iconTheme },
    });
  },
  
  // Generic toast with default theme
  show: (message, options = {}) => {
    return toast(message, {
      ...defaultTheme,
      ...options,
      style: { ...defaultTheme.style, ...options.style },
      iconTheme: { ...defaultTheme.iconTheme, ...options.iconTheme },
    });
  }
};

// Toast Container Component
export const CustomToaster = () => {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        className: '',
        duration: 2000,
        style: defaultTheme.style,
        success: {
          duration: 2000,
          iconTheme: defaultTheme.iconTheme,
        },
        error: {
          duration: 3000,
          iconTheme: errorTheme.iconTheme,
        },
      }}
    />
  );
};
