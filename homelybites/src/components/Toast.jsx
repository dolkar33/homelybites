import React, { useEffect } from "react";

/**
 * Props:
 * - show: boolean
 * - message: string
 * - variant: 'success' | 'error' | 'info' | 'warning'
 * - onClose: () => void
 * - autoHideDuration?: number (ms, default 3000)
 * - position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
 */
const variantStyles = {
  success: {
    container: "bg-green-100 border-green-500",
    iconColor: "text-green-500",
    title: "text-green-800",
    text: "text-green-700",
  },
  error: {
    container: "bg-red-100 border-red-500",
    iconColor: "text-red-500",
    title: "text-red-800",
    text: "text-red-700",
  },
  info: {
    container: "bg-blue-100 border-blue-500",
    iconColor: "text-blue-500",
    title: "text-blue-800",
    text: "text-blue-700",
  },
  warning: {
    container: "bg-yellow-100 border-yellow-500",
    iconColor: "text-yellow-500",
    title: "text-yellow-800",
    text: "text-yellow-700",
  },
};

const positionClasses = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
};

export default function Toast({
  show,
  message,
  variant = "info",
  onClose,
  autoHideDuration = 3000,
  position = "top-right",
}) {
  useEffect(() => {
    if (!show) return;
    if (!autoHideDuration) return;
    const id = setTimeout(() => onClose && onClose(), autoHideDuration);
    return () => clearTimeout(id);
  }, [show, autoHideDuration, onClose]);

  if (!show || !message) return null;

  const styles = variantStyles[variant] || variantStyles.info;
  const pos = positionClasses[position] || positionClasses["top-right"];

  const title = (
    variant === "success" ? "Success!" :
    variant === "error" ? "Error!" :
    variant === "warning" ? "Warning" : "Info"
  );

  return (
    <div className={`fixed ${pos} border-l-4 p-4 rounded shadow-md z-50 animate-fade-in-down ${styles.container}`}>
      <div className="flex items-center">
        <div className="mr-2">
          {variant === "success" && (
            <svg className={`h-6 w-6 ${styles.iconColor}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {variant === "error" && (
            <svg className={`h-6 w-6 ${styles.iconColor}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {variant === "info" && (
            <svg className={`h-6 w-6 ${styles.iconColor}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01" />
            </svg>
          )}
          {variant === "warning" && (
            <svg className={`h-6 w-6 ${styles.iconColor}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          )}
        </div>
        <div className="mr-2">
          <p className={`font-bold ${styles.title}`}>{title}</p>
          <p className={`${styles.text}`}>{message}</p>
        </div>
        <button onClick={onClose} className={`${styles.iconColor} hover:opacity-80 ml-4`}>
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
