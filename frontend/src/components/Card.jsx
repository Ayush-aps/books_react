/**
 * Premium Card Component
 * Elegant card with hover effects and customizable sections
 */

import { motion } from 'framer-motion';
import { cardHover } from '../utils/animations';

const Card = ({
  children,
  className = '',
  elevated = false,
  hoverable = true,
  padding = 'default',
  onClick,
  ...props
}) => {
  // Base classes
  const baseClasses = 'card';

  // Elevation class
  const elevationClass = elevated ? 'card-elevated' : '';

  // Padding classes
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    default: '',
    lg: 'p-8'
  };

  // Combine classes
  const combinedClasses = `
    ${baseClasses}
    ${elevationClass}
    ${paddingClasses[padding]}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  if (hoverable) {
    return (
      <motion.div
        className={combinedClasses}
        onClick={onClick}
        initial="rest"
        whileHover="hover"
        variants={cardHover}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={combinedClasses} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

// Card Header Component
Card.Header = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
);

// Card Body Component
Card.Body = ({ children, className = '', ...props }) => (
  <div className={`card-body ${className}`} {...props}>
    {children}
  </div>
);

// Card Footer Component
Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
