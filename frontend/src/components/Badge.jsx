/**
 * Premium Badge Component
 * Status badges with elegant styling
 */

import { motion } from 'framer-motion';
import { scaleIn } from '../utils/animations';

const Badge = ({
  children,
  variant = 'brown',
  size = 'md',
  outline = false,
  rounded = true,
  className = '',
  animated = false,
  ...props
}) => {
  // Base classes
  const baseClasses = 'badge';

  // Variant classes
  const variantClasses = {
    brown: 'badge-brown',
    green: 'badge-green',
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info'
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: '',
    lg: 'text-sm px-4 py-1'
  };

  // Outline modifier
  const outlineClass = outline ? 'badge-outline' : '';

  // Rounded modifier
  const roundedClass = rounded ? '' : 'rounded-md';

  // Combine classes
  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${outlineClass}
    ${roundedClass}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  if (animated) {
    return (
      <motion.span
        className={combinedClasses}
        initial="initial"
        animate="animate"
        variants={scaleIn}
        {...props}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <span className={combinedClasses} {...props}>
      {children}
    </span>
  );
};

export default Badge;
