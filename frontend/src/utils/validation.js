/**
 * Validation Utilities
 * Centralized validation functions for form inputs
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one letter' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate required field
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate numeric value with optional range
 * @param {string|number} value - Value to validate
 * @param {number} min - Minimum value (optional)
 * @param {number} max - Maximum value (optional)
 * @param {string} fieldName - Name of the field for error message
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateNumber = (value, min = null, max = null, fieldName = 'This field') => {
  const num = parseFloat(value);

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (min !== null && num < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== null && num > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @param {boolean} required - Whether the URL is required
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateURL = (url, required = false) => {
  if (!url || !url.trim()) {
    if (required) {
      return { isValid: false, error: 'URL is required' };
    }
    return { isValid: true, error: '' };
  }

  try {
    new URL(url);
    return { isValid: true, error: '' };
  } catch (err) {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @param {boolean} required - Whether the phone is required
 * @returns {object} { isValid: boolean, error: string }
 */
export const validatePhone = (phone, required = true) => {
  if (!phone || !phone.trim()) {
    if (required) {
      return { isValid: false, error: 'Phone number is required' };
    }
    return { isValid: true, error: '' };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 10) {
    return { isValid: false, error: 'Phone number must be at least 10 digits' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate ISBN format (10 or 13 digits)
 * @param {string} isbn - ISBN to validate
 * @param {boolean} required - Whether the ISBN is required
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateISBN = (isbn, required = false) => {
  if (!isbn || !isbn.trim()) {
    if (required) {
      return { isValid: false, error: 'ISBN is required' };
    }
    return { isValid: true, error: '' };
  }

  const digitsOnly = isbn.replace(/[^0-9X]/gi, '');
  
  if (digitsOnly.length !== 10 && digitsOnly.length !== 13) {
    return { isValid: false, error: 'ISBN must be 10 or 13 digits' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate year (between 1800 and current year)
 * @param {string|number} year - Year to validate
 * @param {boolean} required - Whether the year is required
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateYear = (year, required = false) => {
  if (!year) {
    if (required) {
      return { isValid: false, error: 'Year is required' };
    }
    return { isValid: true, error: '' };
  }

  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(year);

  if (isNaN(yearNum)) {
    return { isValid: false, error: 'Year must be a valid number' };
  }

  if (yearNum < 1800 || yearNum > currentYear) {
    return { isValid: false, error: `Year must be between 1800 and ${currentYear}` };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate zip code format (US format)
 * @param {string} zipCode - Zip code to validate
 * @param {boolean} required - Whether the zip code is required
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateZipCode = (zipCode, required = true) => {
  if (!zipCode || !zipCode.trim()) {
    if (required) {
      return { isValid: false, error: 'Zip code is required' };
    }
    return { isValid: true, error: '' };
  }

  // US zip code: 5 digits or 5+4 format
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(zipCode)) {
    return { isValid: false, error: 'Please enter a valid zip code (e.g., 12345 or 12345-6789)' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate text length
 * @param {string} text - Text to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Name of the field for error message
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateLength = (text, minLength, maxLength, fieldName = 'This field') => {
  const length = text ? text.length : 0;

  if (minLength && length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (maxLength && length > maxLength) {
    return { isValid: false, error: `${fieldName} must be at most ${maxLength} characters` };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate that two values match (e.g., password confirmation)
 * @param {string} value1 - First value
 * @param {string} value2 - Second value
 * @param {string} fieldName - Name of the field for error message
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateMatch = (value1, value2, fieldName = 'Fields') => {
  if (value1 !== value2) {
    return { isValid: false, error: `${fieldName} do not match` };
  }

  return { isValid: true, error: '' };
};
