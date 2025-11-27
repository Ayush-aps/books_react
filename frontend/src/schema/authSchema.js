// src/schemas/authSchemas.js
import { z } from 'zod';

/**
 * Industry-level Regex for Validation
 */
const PASSWORD_MIN_LENGTH = 8; // Standard industry minimum
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/; 
// Requires: 1 lowercase, 1 uppercase, 1 number, 1 special character

const passwordValidation = z.string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
  .regex(PASSWORD_REGEX, "Must include uppercase, lowercase, number, and special character.");

/**
 * Zod Schema for Login
 */
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim(),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Zod Schema for Register
 */
export const registerSchema = z.object({
  name: z.string().min(3, 'Full Name must be at least 3 characters').trim(),
  email: z.string().email('Please enter a valid email address').trim(),
  password: passwordValidation, // Use the shared password validation
  password2: z.string(),
  role: z.enum(['buyer', 'seller'], {
    required_error: "Role selection is required"
  }),
})
// Refine is used for cross-field validation (like password matching)
.refine((data) => data.password === data.password2, {
  message: 'Passwords do not match',
  path: ['password2'], // Attach error to the confirmation field
});