import { z } from 'zod';

// Base validation rules
const email = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

const name = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Login form schema
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'), // Less strict for login
  rememberMe: z.boolean().optional(),
});

// Signup form schema
export const signupSchema = z.object({
  name,
  email,
  password,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  organizationName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email,
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

// Email verification schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  email: email.optional(),
});

// Resend verification schema
export const resendVerificationSchema = z.object({
  email,
});

// Update profile schema
export const updateProfileSchema = z.object({
  name,
  email,
  avatar: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

// Organization settings schema
export const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  logo: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

// Invite user schema
export const inviteUserSchema = z.object({
  email,
  role: z.enum(['ADMIN', 'USER', 'VIEWER'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
});

// API key schema
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required').max(100),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  scopes: z.array(z.string()).min(1, 'At least one scope is required'),
  expiresAt: z.date().optional(),
});

// Two-factor authentication schemas
export const setupTwoFactorSchema = z.object({
  code: z.string().length(6, 'Code must be exactly 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

export const verifyTwoFactorSchema = z.object({
  code: z.string().length(6, 'Code must be exactly 6 digits').regex(/^\d+$/, 'Code must be numeric'),
  rememberDevice: z.boolean().optional(),
});

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  code: z.string().length(6, 'Code must be exactly 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

// Type exports for TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type SetupTwoFactorInput = z.infer<typeof setupTwoFactorSchema>;
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;
export type DisableTwoFactorInput = z.infer<typeof disableTwoFactorSchema>;

// Helper function to validate data and return formatted errors
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((error) => {
      const path = error.path.join('.');
      errors[path] = error.message;
    });
    return { success: false, errors, data: null };
  }

  return { success: true, errors: null, data: result.data };
}

// Common validation utilities
export const authValidationUtils = {
  isValidEmail: (email: string) => z.string().email().safeParse(email).success,
  isStrongPassword: (password: string) => password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password),
  isValidSlug: (slug: string) => /^[a-z0-9-]+$/.test(slug) && slug.length >= 3,
  sanitizeInput: (input: string) => input.trim().replace(/\s+/g, ' '),
};
