/**
 * Premium Input Component
 * Floating label inputs with validation states
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = ' ',
  error = '',
  success = '',
  disabled = false,
  required = false,
  className = '',
  floatingLabel = true,
  icon = null,
  iconPosition = 'left',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Validation state classes
  const validationClass = error
    ? 'is-invalid'
    : success
    ? 'is-valid'
    : '';

  // Icon wrapper classes
  const hasIcon = icon !== null;
  const iconPaddingClass = hasIcon
    ? iconPosition === 'left'
      ? 'pl-12'
      : 'pr-12'
    : '';

  if (floatingLabel && label) {
    return (
      <div className={`form-group ${className}`}>
        <div className="form-floating relative">
          {/* Icon */}
          {hasIcon && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${
                iconPosition === 'left' ? 'left-4' : 'right-4'
              } text-text-tertiary pointer-events-none`}
            >
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`form-control ${validationClass} ${iconPaddingClass}`}
            {...props}
          />

          {/* Floating Label */}
          <label htmlFor={name} className="text-sm">
            {label}
            {required && <span className="text-error-primary ml-1">*</span>}
          </label>
        </div>

        {/* Validation Messages */}
        {error && (
          <motion.p
            className="form-feedback invalid"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            className="form-feedback valid"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {success}
          </motion.p>
        )}
      </div>
    );
  }

  // Standard Input (without floating label)
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-error-primary ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Icon */}
        {hasIcon && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 ${
              iconPosition === 'left' ? 'left-4' : 'right-4'
            } text-text-tertiary pointer-events-none`}
          >
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          type={type}
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`form-control ${validationClass} ${iconPaddingClass}`}
          {...props}
        />
      </div>

      {/* Validation Messages */}
      {error && (
        <motion.p
          className="form-feedback invalid"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
      {success && (
        <motion.p
          className="form-feedback valid"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {success}
        </motion.p>
      )}
    </div>
  );
};

// Textarea Component
export const Textarea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  error = '',
  success = '',
  disabled = false,
  required = false,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-error-primary ml-1">*</span>}
        </label>
      )}

      <textarea
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`form-control ${error ? 'is-invalid' : success ? 'is-valid' : ''}`}
        {...props}
      />

      {error && (
        <motion.p
          className="form-feedback invalid"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
      {success && (
        <motion.p
          className="form-feedback valid"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {success}
        </motion.p>
      )}
    </div>
  );
};

// Select Component
export const Select = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Select an option',
  error = '',
  success = '',
  disabled = false,
  required = false,
  className = '',
  children,
  helpText = '',
  ...props
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-error-primary ml-1">*</span>}
        </label>
      )}

      <select
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        className={`form-control ${error ? 'is-invalid' : success ? 'is-valid' : ''}`}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            <option value="">{placeholder}</option>
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </>
        )}
      </select>

      {/* Help Text */}
      {helpText && !error && !success && (
        <p className="text-sm text-text-tertiary mt-1">{helpText}</p>
      )}

      {/* Validation Messages */}
      {error && (
        <motion.p
          className="form-feedback invalid"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
      {success && (
        <motion.p
          className="form-feedback valid"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {success}
        </motion.p>
      )}
    </div>
  );
};

// Checkbox Component
export const Checkbox = ({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <input
        type="checkbox"
        name={name}
        id={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-5 h-5 text-accent-brown bg-white border-border-medium rounded focus:ring-2 focus:ring-accent-brown focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        {...props}
      />
      {label && (
        <label
          htmlFor={name}
          className="text-base text-text-primary cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
};

// Radio Component
export const Radio = ({
  label,
  name,
  value,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <input
        type="radio"
        name={name}
        id={`${name}-${value}`}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-5 h-5 text-accent-brown bg-white border-border-medium focus:ring-2 focus:ring-accent-brown focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        {...props}
      />
      {label && (
        <label
          htmlFor={`${name}-${value}`}
          className="text-base text-text-primary cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
};

// Attach sub-components to Input
Input.Textarea = Textarea;
Input.Select = Select;
Input.Checkbox = Checkbox;
Input.Radio = Radio;

export default Input;
