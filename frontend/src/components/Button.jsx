/**
 * Premium Button Component
 * Sophisticated, accessible buttons with smooth animations
 */

import { motion } from 'framer-motion';
import { buttonHover } from '../utils/animations';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  // Base classes
  const baseClasses = 'btn';

  // Variant classes
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    text: 'btn-text',
    success: 'btn-success',
    error: 'btn-error',
    warning: 'btn-warning'
  };

  // Size classes
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
    xl: 'btn-xl'
  };

  // Icon button classes
  const iconOnlyClasses = !children && icon ? 'btn-icon' : '';

  // Full width class
  const widthClass = fullWidth ? 'w-full' : '';

  // Combine all classes
  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${iconOnlyClasses}
    ${widthClass}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <motion.button
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
      type={type}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={buttonHover}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Left Icon */}
      {icon && iconPosition === 'left' && !isLoading && (
        <span className="inline-flex items-center">{icon}</span>
      )}

      {/* Button Text */}
      {children && <span>{children}</span>}

      {/* Right Icon */}
      {icon && iconPosition === 'right' && !isLoading && (
        <span className="inline-flex items-center">{icon}</span>
      )}
    </motion.button>
  );
};

export default Button;
