import { z } from 'zod';

// Lazy import DOMPurify only when needed in browser/server context
const getDOMPurify = async () => {
  if (typeof window !== 'undefined') {
    const { default: DOMPurify } = await import('isomorphic-dompurify');
    return DOMPurify;
  } else {
    // For server-side (including middleware), we'll use basic regex patterns
    return null;
  }
};

// XSS Protection patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
  /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
];

// SQL Injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(--|\#|\/\*|\*\/)/gi,
  /(\bOR\b.*=.*\bOR\b|\bAND\b.*=.*\bAND\b)/gi,
  /('|(\\')|('')|(%27)|(%27)|(\x27))/gi,
  /(;|%3B)/gi,
];

// NoSQL Injection patterns
const NOSQL_INJECTION_PATTERNS = [
  /\$where/gi,
  /\$regex/gi,
  /\$ne/gi,
  /\$gt/gi,
  /\$lt/gi,
  /\$or/gi,
  /\$and/gi,
];

// Common validation schemas
export const validationSchemas = {
  email: z.string().email('Invalid email format').min(1, 'Email is required'),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
           'Password must contain uppercase, lowercase, number and special character'),

  url: z.string().url('Invalid URL format').refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    'URL must use HTTP or HTTPS protocol'
  ),

  scraperName: z.string()
    .min(1, 'Scraper name is required')
    .max(100, 'Scraper name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Scraper name can only contain letters, numbers, spaces, hyphens and underscores'),

  cssSelector: z.string()
    .min(1, 'CSS selector is required')
    .max(500, 'CSS selector is too long')
    .regex(/^[a-zA-Z0-9\s\.\#\[\]\-\=\:\_\(\)\>\+\~\*\^\"\']+$/, 'Invalid CSS selector characters'),

  organizationSlug: z.string()
    .min(2, 'Organization slug must be at least 2 characters')
    .max(50, 'Organization slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Organization slug can only contain lowercase letters, numbers and hyphens'),

  apiKey: z.string()
    .min(32, 'API key must be at least 32 characters')
    .max(128, 'API key is too long')
    .regex(/^[a-zA-Z0-9]+$/, 'API key can only contain alphanumeric characters'),
};

export class InputValidator {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static async sanitizeHtml(input: string): Promise<string> {
    if (typeof input !== 'string') {
      return '';
    }

    const DOMPurify = await getDOMPurify();
    if (DOMPurify) {
      return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target'],
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
      });
    }

    // Fallback for server-side/middleware context - basic HTML stripping
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/javascript:/gi, '');
  }

  /**
   * Sanitize text input by removing dangerous characters
   */
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes that could break SQL
      .replace(/[\\]/g, '') // Remove backslashes
      .trim();
  }

  /**
   * Validate and sanitize URL
   */
  static sanitizeUrl(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    try {
      const url = new URL(input);

      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }

      // Remove potentially dangerous query parameters
      const dangerousParams = ['javascript', 'data', 'vbscript'];
      for (const param of dangerousParams) {
        url.searchParams.delete(param);
      }

      return url.toString();
    } catch {
      return '';
    }
  }

  /**
   * Check for XSS patterns
   */
  static containsXSS(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    return XSS_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Check for SQL injection patterns
   */
  static containsSQLInjection(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Check for NoSQL injection patterns
   */
  static containsNoSQLInjection(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    return NOSQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Validate JSON input to prevent injection
   */
  static validateJSON(input: string): { isValid: boolean; data?: any; error?: string } {
    try {
      const parsed = JSON.parse(input);

      // Check for prototype pollution
      if (this.hasPrototypePollution(parsed)) {
        return { isValid: false, error: 'Potential prototype pollution detected' };
      }

      return { isValid: true, data: parsed };
    } catch (error) {
      return { isValid: false, error: 'Invalid JSON format' };
    }
  }

  /**
   * Check for prototype pollution in objects
   */
  static hasPrototypePollution(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    for (const key of Object.keys(obj)) {
      if (dangerousKeys.includes(key)) {
        return true;
      }

      if (typeof obj[key] === 'object' && this.hasPrototypePollution(obj[key])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate file upload
   */
  static validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): { isValid: boolean; error?: string } {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['text/plain', 'application/json', 'text/csv'],
      allowedExtensions = ['.txt', '.json', '.csv']
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return { isValid: false, error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not allowed' };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return { isValid: false, error: 'File extension not allowed' };
    }

    return { isValid: true };
  }

  /**
   * Rate limit validation per user/IP
   */
  static validateRateLimit(identifier: string, action: string, limit: number, window: number): boolean {
    // This is a simplified in-memory implementation
    // In production, use Redis or a proper rate limiting service
    const key = `${identifier}:${action}`;
    const now = Date.now();

    // This would be implemented with proper storage in production
    return true; // Placeholder
  }
}

/**
 * Middleware to validate and sanitize request body
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: boolean; data?: T; errors?: string[] } => {
    try {
      // Check if data is a string (potential JSON)
      if (typeof data === 'string') {
        const jsonValidation = InputValidator.validateJSON(data);
        if (!jsonValidation.isValid) {
          return { success: false, errors: [jsonValidation.error || 'Invalid JSON'] };
        }
        data = jsonValidation.data;
      }

      // Validate with Zod schema
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return { success: false, errors };
      }

      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, errors: ['Validation failed'] };
    }
  };
}

/**
 * Middleware to sanitize query parameters
 */
export function sanitizeQueryParams(params: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Basic sanitization
      const sanitizedKey = InputValidator.sanitizeText(key);
      const sanitizedValue = InputValidator.sanitizeText(value);

      // Check for injection attempts
      if (!InputValidator.containsXSS(sanitizedValue) &&
          !InputValidator.containsSQLInjection(sanitizedValue) &&
          !InputValidator.containsNoSQLInjection(sanitizedValue)) {
        sanitized[sanitizedKey] = sanitizedValue;
      }
    }
  }

  return sanitized;
}

/**
 * Security validation for scraper configurations
 */
export const scraperValidation = z.object({
  url: validationSchemas.url,
  name: validationSchemas.scraperName,
  selectors: z.record(validationSchemas.cssSelector),
  schedule: z.enum(['manual', 'hourly', 'daily', 'weekly', 'monthly']),
  timeout: z.number().min(1000).max(300000), // 1s to 5min
  maxPages: z.number().min(1).max(1000),
  headers: z.record(z.string().max(1000)),
  cookies: z.array(z.object({
    name: z.string().max(100),
    value: z.string().max(1000),
    domain: z.string().optional(),
  })).optional(),
});

export type ScraperConfig = z.infer<typeof scraperValidation>;

/**
 * Security headers validation
 */
export function validateSecurityHeaders(headers: Record<string, string>): boolean {
  const requiredHeaders = [
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
  ];

  return requiredHeaders.every(header => headers[header.toLowerCase()]);
}
