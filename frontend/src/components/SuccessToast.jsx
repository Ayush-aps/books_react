/**
 * SuccessToast Component
 * Success notification toast
 */

import { useEffect, useState } from 'react';

const SuccessToast = ({ 
  message, 
  duration = 3000, 
  onClose,
  position = 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center
  type = 'success' // success, error, warning, info
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);

    // Auto close after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
  };

  const typeStyles = {
    success: {
      borderColor: 'border-green-500',
      iconColor: 'text-green-500',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    error: {
      borderColor: 'border-red-500',
      iconColor: 'text-red-500',
      icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    warning: {
      borderColor: 'border-yellow-500',
      iconColor: 'text-yellow-500',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    },
    info: {
      borderColor: 'border-blue-500',
      iconColor: 'text-blue-500',
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  };

  const currentStyle = typeStyles[type] || typeStyles.success;

  if (!message) return null;

  return (
    <div
      className={`fixed ${positionClasses[position]} z-notification transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className={`bg-white rounded-lg shadow-lg border-l-4 ${currentStyle.borderColor} p-4 flex items-center gap-3 max-w-md`}>
        {/* Icon */}
        <div className="flex-shrink-0">
          <svg
            className={`h-6 w-6 ${currentStyle.iconColor}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={currentStyle.icon}
            />
          </svg>
        </div>

        {/* Message */}
        <p className="text-gray-800 font-medium flex-1">{message}</p>

        {/* Close Button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SuccessToast;
