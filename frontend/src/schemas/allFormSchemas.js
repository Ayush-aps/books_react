// src/schemas/allFormSchemas.js
import { z } from 'zod';

// --- Shared Constants and Regex Patterns ---

// Name validation: Only letters and single spaces between words
// Rules:
// - Only alphabetic characters (a-z, A-Z)
// - Single spaces allowed between words
// - No leading/trailing spaces
// - No consecutive spaces
// - No numbers, hyphens, apostrophes, or any symbols
// - 2-50 characters total
const NAME_REGEX = /^[a-zA-Z]+( [a-zA-Z]+)*$/;

// Allowed email TLDs (top-level domains)
const ALLOWED_EMAIL_TLDS = [
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  'co.uk', 'co.in', 'ac.uk', 'gov.uk', 'org.uk',
  'io', 'ai', 'app', 'dev', 'tech', 'info', 'biz',
  'us', 'uk', 'ca', 'au', 'de', 'fr', 'jp', 'in'
];

// Allowed Email Domains (Strict Whitelist)
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'zoho.com',
  'yandex.com',
  'live.com',
  'msn.com'
];

// Common email domain typos
const DOMAIN_TYPOS = {
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmai.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
};

// Enhanced Email validation
// Rules:
// - Username: starts with alphanumeric, can contain dots/underscores/hyphens/plus
// - Special chars allowed but not consecutive (except underscores which can be)
// - No leading/trailing dots or hyphens in username
// - Domain: must be in the allowed whitelist
const EMAIL_REGEX = /^[a-zA-Z0-9]+([._+-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-]?[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

// Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/;

// Indian mobile number: Starts with 6-9, followed by 9 digits
const PHONE_REGEX = /^[6-9]\d{9}$/;

// Indian Pincode: Exactly 6 digits
const PINCODE_REGEX = /^\d{6}$/;

// URL validation
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Book title: Alphanumeric with common punctuation, must contain at least one alphanumeric char
const BOOK_TITLE_REGEX = /^(?=.*[a-zA-Z0-9])[a-zA-Z0-9\s:,.'!?&()-]+$/;

// Author name: Letters, spaces, periods, hyphens, must contain at least one letter
const AUTHOR_REGEX = /^(?=.*[a-zA-Z])[a-zA-Z\s.'-]+$/;

// --- Core Validation Schemas ---

// Enhanced email validation
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .regex(EMAIL_REGEX, 'Please enter a valid email address')
  .email('Please enter a valid email address')
  .superRefine((email, ctx) => {
    const [username, domain] = email.split('@');
    if (!username || !domain) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid email format" });
      return;
    }

    // Username must be at least 1 char and not start/end with dots or hyphens
    if (username.length < 1 || /^[.-]|[.-]$/.test(username)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid username format" });
      return;
    }

    // Check if domain is in the allowed whitelist
    if (!ALLOWED_EMAIL_DOMAINS.includes(domain.toLowerCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Email provider not supported. Please use a common provider like gmail.com, yahoo.com, etc.`
      });
      return;
    }

    // No consecutive dots or hyphens (underscores are OK)
    if (/\.{2,}|--/.test(email)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Email cannot contain consecutive dots or hyphens" });
      return;
    }
  })
  .trim()
  .toLowerCase();

// Enhanced name validation
export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name cannot exceed 50 characters')
  .regex(NAME_REGEX, 'Name can only contain letters and single spaces between words')
  .trim();

// Password validation
const passwordBaseValidation = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password cannot exceed 128 characters')
  .refine((val) => !/\s/.test(val), "Password cannot contain spaces")
  .regex(PASSWORD_REGEX, "Password must include uppercase, lowercase, number, and special character (@$!%*?&#)");

// Required string helper
export const requiredString = (fieldName) =>
  z.string()
    .min(1, `${fieldName} is required`)
    .trim();

// --- AUTHENTICATION SCHEMAS ---

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordBaseValidation,
  password2: z.string().min(1, 'Confirm Password is required'),
  role: z.enum(['buyer', 'seller', 'employee'], {
    required_error: "Role selection is required"
  }),
})
  .refine((data) => {
    // Only validate if both password fields have values
    // This prevents showing "passwords don't match" when user is still typing
    if (!data.password || !data.password2) return true;
    return data.password === data.password2;
  }, {
    message: 'Passwords do not match',
    path: ['password2'],
  });

// --- BOOK LISTING SCHEMA ---

export const bookListingSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .regex(BOOK_TITLE_REGEX, "Title must contain letters or numbers and avoid invalid characters")
    .trim(),

  author: z.string()
    .min(1, "Author is required")
    .max(100, "Author name cannot exceed 100 characters")
    .regex(AUTHOR_REGEX, "Author name must contain letters and avoid invalid characters")
    .trim(),

  genre: z.string().min(1, "Genre is required"),

  price: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : parsed;
    },
    z.number({ required_error: 'Price is required' })
      .min(0.01, "Price must be greater than 0")
      .max(100000, "Price cannot exceed 100,000")
  ),

  discountPercentage: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : parsed;
    },
    z.number({ invalid_type_error: "Discount must be a number" })
      .min(1, "Discount must be at least 1%")
      .max(100, "Discount cannot exceed 100%")
      .refine(val => {
        const str = val.toString();
        const parts = str.split('.');
        return parts.length === 1 || parts[1].length <= 1;
      }, "Discount cannot have more than 1 decimal place")
      .optional()
  ),

  stock: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : parsed;
    },
    z.number({ required_error: 'Stock is required' })
      .int("Stock must be a whole number")
      .min(0, "Stock cannot be negative")
      .max(10000, "Stock cannot exceed 10,000")
  ),

  isbn: z.string().optional().or(z.literal(''))
    .refine(val => {
      if (!val) return true;
      const digitsOnly = val.replace(/[^0-9X]/gi, '');
      return digitsOnly.length === 10 || digitsOnly.length === 13;
    }, { message: 'ISBN must be 10 or 13 digits' }),

  publisher: z.string().optional(),

  publishedDate: z.string().optional(),

  pageCount: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : parsed;
    },
    z.number({ invalid_type_error: "Page count must be a number" })
      .int("Page count must be a whole number")
      .positive("Page count must be positive")
      .max(15145, "Page count cannot exceed 15,145")
      .optional()
  ),

  language: z.string().optional(),

  condition: z.enum(['new', 'used'], { required_error: "Condition is required" }),

  format: z.enum(['paperback', 'hardcover', 'ebook', 'audiobook'], { required_error: "Format is required" }),

  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters")
    .trim()
    .refine(
      (val) => /[a-zA-Z]/.test(val),
      { message: "Description must contain at least one alphabetic character" }
    )
    .refine(
      (val) => !/^\d+$/.test(val),
      { message: "Description cannot contain only numbers" }
    ),

  coverImage: z.string().url("Invalid URL").optional().or(z.literal('')),
});

// --- ADMIN FORM SCHEMAS ---

export const orderUpdateSchema = z.object({
  orderStatus: z.enum(['ordered', 'processing', 'shipped', 'delivered', 'cancelled'], {
    required_error: "Order status is required"
  }),
  expectedDelivery: z.string().optional().or(z.literal('')),
  carrier: z.string()
    .max(50, 'Carrier name too long')
    .optional()
    .or(z.literal('')),
  trackingNumber: z.string()
    .max(100, 'Tracking number too long')
    .optional()
    .or(z.literal('')),
  trackingUrl: z.string()
    .regex(URL_REGEX, 'Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  adminNotes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

export const complaintCommentSchema = z.object({
  message: z.string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment cannot exceed 1000 characters")
    .trim()
    .refine(
      (val) => /[a-zA-Z]/.test(val),
      { message: "Comment must contain at least one alphabetic character" }
    )
    .refine(
      (val) => !/^\d+$/.test(val),
      { message: "Comment cannot contain only numbers" }
    )
    .refine(
      (val) => !/^[^a-zA-Z0-9\s]+$/.test(val),
      { message: "Comment cannot contain only special characters" }
    )
    .refine(
      (val) => !/^[\d\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(val),
      { message: "Comment must contain at least one alphabetic character" }
    ),
});

export const complaintResolutionSchema = z.object({
  action: z.enum(['refund_issued', 'replacement_sent', 'compensation_provided', 'policy_clarified', 'no_action', 'other'], {
    required_error: "Please select a resolution action"
  }),
  details: z.string()
    .min(10, "Please provide detailed resolution information")
    .max(1000, "Details cannot exceed 1000 characters")
    .trim()
    .refine(
      (val) => /[a-zA-Z]/.test(val),
      { message: "Details must contain at least one alphabetic character" }
    )
    .refine(
      (val) => !/^\d+$/.test(val),
      { message: "Details cannot contain only numbers" }
    )
    .refine(
      (val) => !/^[^a-zA-Z0-9\s]+$/.test(val),
      { message: "Details cannot contain only special characters" }
    )
    .refine(
      (val) => !/^[\d\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(val),
      { message: "Details must contain at least one alphabetic character" }
    ),
});

export const bookRejectionSchema = z.object({
  reason: z.string()
    .min(10, "Please provide a detailed reason (minimum 10 characters)")
    .max(500, "Reason cannot exceed 500 characters")
    .trim()
    .refine(
      (val) => /[a-zA-Z]/.test(val),
      { message: "Reason must contain at least one alphabetic character" }
    )
    .refine(
      (val) => !/^\d+$/.test(val),
      { message: "Reason cannot contain only numbers" }
    )
    .refine(
      (val) => !/^[^a-zA-Z0-9\s]+$/.test(val),
      { message: "Reason cannot contain only special characters" }
    )
    .refine(
      (val) => !/^[\d\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(val),
      { message: "Reason must contain at least one alphabetic character" }
    ),
});

// --- BUYER FORM SCHEMAS ---

export const addressSchema = z.object({
  fullName: nameSchema,
  street: z.string()
    .min(5, 'Street address must be at least 5 characters')
    .max(200, 'Street address cannot exceed 200 characters')
    .trim(),
  city: z.string()
    .min(2, 'City name must be at least 2 characters')
    .max(50, 'City name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]{2,50}$/, 'City name contains invalid characters')
    .trim(),
  state: z.string()
    .min(2, 'State name must be at least 2 characters')
    .max(50, 'State name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]{2,50}$/, 'State name contains invalid characters')
    .trim(),
  zipCode: z.string()
    .regex(PINCODE_REGEX, 'ZIP Code/Pincode must be exactly 6 digits')
    .trim(),
  country: z.string()
    .min(2, 'Country name must be at least 2 characters')
    .max(50, 'Country name cannot exceed 50 characters')
    .trim(),
  phone: z.string()
    .regex(PHONE_REGEX, 'Please enter a valid 10-digit Indian mobile number (starting with 6-9)')
    .trim(),
  isDefault: z.boolean().optional(),
});

export const videoUploadSchema = z.object({
  bookId: z.string().min(1, "Please select a book"),
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters')
    .trim(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description cannot exceed 500 characters')
    .trim(),
  tags: z.string().optional(),
  videoFile: z.any()
    .refine((file) => file instanceof File, "Please select a video file")
    .refine((file) => file?.type?.startsWith('video/'), "File must be a video")
    .refine((file) => file?.size <= 50 * 1024 * 1024, "File size must be less than 50MB"),
});

// --- COMPLAINT SCHEMA ---

export const complaintSchema = z.object({
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject cannot exceed 100 characters')
    .trim()
    .refine(
      (val) => /[a-zA-Z]/.test(val),
      { message: "Subject must contain at least one alphabetic character" }
    )
    .refine(
      (val) => !/^\d+$/.test(val),
      { message: "Subject cannot contain only numbers" }
    )
    .refine(
      (val) => !/^[^a-zA-Z0-9\s]+$/.test(val),
      { message: "Subject cannot contain only special characters" }
    )
    .refine(
      (val) => !/^[\d\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(val),
      { message: "Subject must contain at least one alphabetic character" }
    ),
  category: requiredString('Category'),
  description: z.string()
    .min(20, 'Please provide a detailed description (minimum 20 characters)')
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .refine(
      (val) => /[a-zA-Z]/.test(val),
      { message: "Description must contain at least one alphabetic character" }
    )
    .refine(
      (val) => !/^\d+$/.test(val),
      { message: "Description cannot contain only numbers" }
    )
    .refine(
      (val) => !/^[^a-zA-Z0-9\s]+$/.test(val),
      { message: "Description cannot contain only special characters" }
    )
    .refine(
      (val) => !/^[\d\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(val),
      { message: "Description must contain at least one alphabetic character" }
    ),
  orderId: z.string().optional().or(z.literal('')),
  bookId: z.string().optional().or(z.literal('')),
});

export const buyerComplaintSchema = complaintSchema.extend({
  orderId: z.string().min(1, 'Please select an order'),
});

// --- CONTACT FORM SCHEMA ---

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject cannot exceed 100 characters')
    .trim()
    .refine(
      (val) => /[a-zA-Z]/.test(val),
      { message: "Subject must contain at least one alphabetic character" }
    )
    .refine(
      (val) => !/^\d+$/.test(val),
      { message: "Subject cannot contain only numbers" }
    )
    .refine(
      (val) => !/^[^a-zA-Z0-9\s]+$/.test(val),
      { message: "Subject cannot contain only special characters" }
    )
    .refine(
      (val) => !/^[\d\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(val),
      { message: "Subject must contain at least one alphabetic character" }
    ),
  message: z.string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message cannot exceed 2000 characters')
    .trim()
    .refine(
      (val) => /[a-zA-Z]/.test(val),
      { message: "Message must contain at least one alphabetic character" }
    )
    .refine(
      (val) => !/^\d+$/.test(val),
      { message: "Message cannot contain only numbers" }
    )
    .refine(
      (val) => !/^[^a-zA-Z0-9\s]+$/.test(val),
      { message: "Message cannot contain only special characters" }
    )
    .refine(
      (val) => !/^[\d\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(val),
      { message: "Message must contain at least one alphabetic character" }
    ),
});

// --- PROFILE UPDATE SCHEMA ---

export const profileUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z.string()
    .regex(PHONE_REGEX, 'Phone number must be exactly 10 digits starting with 6-9')
    .trim()
    .optional()
    .or(z.literal('')),
  currentPassword: z.string().optional().or(z.literal('')),
  newPassword: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
})
  .refine((data) => {
    // If any password field is filled, all must be filled
    const hasAnyPassword = data.currentPassword || data.newPassword || data.confirmPassword;
    if (hasAnyPassword) {
      return data.currentPassword && data.newPassword && data.confirmPassword;
    }
    return true;
  }, {
    message: 'Please fill all password fields',
    path: ['currentPassword'],
  })
  .refine((data) => {
    // If changing password, new passwords must match
    if (data.newPassword || data.confirmPassword) {
      return data.newPassword === data.confirmPassword;
    }
    return true;
  }, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => {
    // If changing password, validate new password strength
    if (data.newPassword) {
      return data.newPassword.length >= 8;
    }
    return true;
  }, {
    message: 'New password must be at least 8 characters',
    path: ['newPassword'],
  });