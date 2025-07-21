import { useState, useEffect } from 'react';

const CustomToast = ({ type = 'success', message, onClose, duration = 3000, position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Allow time for fade out animation
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  return null; // Component not rendered anymore
};

export default CustomToast;