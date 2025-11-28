/**
 * Premium Input Component
 * Floating label inputs with validation states
 */

import React, { useState, forwardRef } from 'react'; // ⬅️ Import forwardRef
import { motion } from 'framer-motion';

// -----------------------------------------------------------
// 1. Primary Input Component (Floating or Standard)
// -----------------------------------------------------------

// ⬅️ Use forwardRef to pass ref from RHF's register()
const Input = forwardRef(({
  label,
  type = 'text',
  name,
  placeholder = ' ',
  error = '',
  success = '',
  disabled = false,
  required = false,
  className = '',
  floatingLabel = true,
  icon = null,
  iconPosition = 'left',
  helpText = '',
  onIconClick,
  // RHF props (value, onChange, onBlur) are automatically spread into props
  ...props
}, ref) => { // ⬅️ Receive ref
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const togglePassword = () => setShowPassword(!showPassword);

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

  // Add padding for password toggle button
  const passwordPaddingClass = isPassword ? 'pr-12' : '';
  const finalPaddingClass = `${iconPaddingClass} ${passwordPaddingClass}`.trim();

  if (floatingLabel && label) {
    return (
      <div className={`form-group ${className}`}>
        <div className="form-floating relative">
          {/* Icon */}
          {hasIcon && (
            <div
              onClick={props.onIconClick}
              className={`absolute top-1/2 -translate-y-1/2 ${iconPosition === 'left' ? 'left-4' : 'right-4'
                } text-text-tertiary ${props.onIconClick ? 'cursor-pointer hover:text-text-primary z-10' : 'pointer-events-none'}`}
            >
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref} // ⬅️ Attach the ref here
            type={inputType}
            name={name}
            id={name}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`form-control ${validationClass} ${finalPaddingClass}`}
            {...props}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}

          />

          {/* Password Toggle Button */}
          {isPassword && (
            <button
              type="button"
              onClick={togglePassword}
              className="absolute top-1/2 -translate-y-1/2 right-4 text-text-tertiary hover:text-text-primary focus:outline-none z-10"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          )}

          {/* Floating Label */}
          <label htmlFor={name} className="text-sm">
            {label}
            {required && <span className="text-error-primary ml-1">*</span>}
          </label>
        </div>

        {/* Validation Messages */}
        {/* Help Text */}
        {helpText && !error && !success && (
          <p className="text-sm text-text-tertiary mt-1">{helpText}</p>
        )}
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
            onClick={props.onIconClick}
            className={`absolute top-1/2 -translate-y-1/2 ${iconPosition === 'left' ? 'left-4' : 'right-4'
              } text-text-tertiary ${props.onIconClick ? 'cursor-pointer hover:text-text-primary z-10' : 'pointer-events-none'}`}
          >
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref} // ⬅️ Attach the ref here
          type={inputType}
          name={name}
          id={name}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`form-control ${validationClass} ${finalPaddingClass}`}
          {...props}
        />

        {/* Password Toggle Button */}
        {isPassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute top-1/2 -translate-y-1/2 right-4 text-text-tertiary hover:text-text-primary focus:outline-none z-10"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Validation Messages */}
      {/* Help Text */}
      {helpText && !error && !success && (
        <p className="text-sm text-text-tertiary mt-1">{helpText}</p>
      )}
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
});

Input.displayName = 'Input'; // Good practice for forwardRef

// -----------------------------------------------------------
// 2. Textarea Component
// -----------------------------------------------------------

// ⬅️ Use forwardRef
export const Textarea = forwardRef(({
  label,
  name,
  placeholder,
  error = '',
  success = '',
  disabled = false,
  required = false,
  rows = 4,
  className = '',
  ...props
}, ref) => { // ⬅️ Receive ref
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-error-primary ml-1">*</span>}
        </label>
      )}

      <textarea
        ref={ref} // ⬅️ Attach the ref here
        name={name}
        id={name}
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
});

Textarea.displayName = 'Textarea';

// -----------------------------------------------------------
// 3. Select Component
// -----------------------------------------------------------

// ⬅️ Use forwardRef
export const Select = forwardRef(({
  label,
  name,
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
}, ref) => { // ⬅️ Receive ref
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-error-primary ml-1">*</span>}
        </label>
      )}

      <select
        ref={ref} // ⬅️ Attach the ref here
        name={name}
        id={name}
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
});

Select.displayName = 'Select';


// -----------------------------------------------------------
// 4. Checkbox Component (Use Controller)
// -----------------------------------------------------------
// NOTE: Checkbox and Radio are generally managed better with RHF's <Controller> or use a separate onChange handler, 
// so we don't apply forwardRef here, but keep the component clean.

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

// -----------------------------------------------------------
// 5. Radio Component (Use Controller)
// -----------------------------------------------------------

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