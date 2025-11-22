/**
 * Custom Hook for Form Validation
 * Manages form state, validation, and errors
 */

import { useState, useCallback } from 'react';

/**
 * useFormValidation hook
 * @param {object} initialValues - Initial form values
 * @param {object} validationSchema - Validation rules for each field
 * @returns {object} Form state and handlers
 */
const useFormValidation = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate a single field
   */
  const validateField = useCallback((name, value) => {
    if (!validationSchema[name]) {
      return { isValid: true, error: '' };
    }

    const rules = validationSchema[name];
    
    // If rules is a function, call it with the value and all values
    if (typeof rules === 'function') {
      return rules(value, values);
    }

    // If rules is an array of validation functions
    if (Array.isArray(rules)) {
      for (const rule of rules) {
        const result = rule(value, values);
        if (!result.isValid) {
          return result;
        }
      }
      return { isValid: true, error: '' };
    }

    return { isValid: true, error: '' };
  }, [validationSchema, values]);

  /**
   * Validate all fields
   */
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(fieldName => {
      const result = validateField(fieldName, values[fieldName]);
      if (!result.isValid) {
        newErrors[fieldName] = result.error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationSchema, values, validateField]);

  /**
   * Handle input change
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Validate field if it has been touched
    if (touched[name]) {
      const result = validateField(name, newValue);
      setErrors(prev => ({
        ...prev,
        [name]: result.error
      }));
    }
  }, [touched, validateField]);

  /**
   * Handle input blur
   */
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;

    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field on blur
    const result = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: result.error
    }));
  }, [validateField]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();
      
      // Mark all fields as touched
      const allTouched = {};
      Object.keys(validationSchema).forEach(key => {
        allTouched[key] = true;
      });
      setTouched(allTouched);

      // Validate form
      const isValid = validateForm();
      
      if (isValid) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      }
    };
  }, [values, validationSchema, validateForm]);

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Set a specific field value
   */
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate if touched
    if (touched[name]) {
      const result = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: result.error
      }));
    }
  }, [touched, validateField]);

  /**
   * Set a specific field error
   */
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  /**
   * Check if form is valid
   */
  const isValid = useCallback(() => {
    return Object.keys(errors).length === 0 || 
           Object.values(errors).every(error => !error);
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    setValues,
    validateForm,
    isValid: isValid()
  };
};

export default useFormValidation;
