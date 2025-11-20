import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    firstname: z.string().min(2, "Min 2 chars").max(50).regex(/^[a-zA-Z\s]+$/, "Only letters allowed"),
    lastname: z.string().min(2, "Min 2 chars").max(50).regex(/^[a-zA-Z\s]+$/, "Only letters allowed"),
    email: z.string().email("Invalid email address"),
    
    // FIXED: Chained validation for clear error messages and better character support
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "At least 1 uppercase letter")
      .regex(/[a-z]/, "At least 1 lowercase letter")
      .regex(/[0-9]/, "At least 1 number")
      .regex(/[\W_]/, "At least 1 special character"), // \W matches any non-word char (symbols)

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });