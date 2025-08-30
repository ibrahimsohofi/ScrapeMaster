import { type NextRequest, NextResponse } from 'next/server';

interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

// Default CORS configuration
const defaultCorsOptions: CorsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://datavault.pro',
        'https://app.datavault.pro',
        'https://api.datavault.pro',
        ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
      ]
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Client-Version',
    'Accept',
    'Origin',
    'User-Agent',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count',
    'X-Page-Count',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

// API-specific CORS (more restrictive)
export const apiCorsOptions: CorsOptions = {
  ...defaultCorsOptions,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Requested-With',
  ],
};

// Public endpoint CORS (less restrictive)
export const publicCorsOptions: CorsOptions = {
  ...defaultCorsOptions,
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
};

// WebSocket CORS
export const websocketCorsOptions: CorsOptions = {
  ...defaultCorsOptions,
  methods: ['GET'],
  allowedHeaders: [
    'Upgrade',
    'Connection',
    'Sec-WebSocket-Key',
    'Sec-WebSocket-Version',
    'Sec-WebSocket-Protocol',
    'Origin',
  ],
};

function isOriginAllowed(origin: string, allowedOrigins: string | string[] | ((origin: string) => boolean)): boolean {
  if (typeof allowedOrigins === 'function') {
    return allowedOrigins(origin);
  }

  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  }

  return allowedOrigins === '*' || allowedOrigins === origin;
}

export function createCorsHandler(options: CorsOptions = defaultCorsOptions) {
  return (request: NextRequest): NextResponse | null => {
    const origin = request.headers.get('origin') || '';
    const method = request.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      const response = new NextResponse(null, { status: options.optionsSuccessStatus || 200 });

      // Set CORS headers for preflight
      if (options.origin && origin) {
        if (isOriginAllowed(origin, options.origin)) {
          response.headers.set('Access-Control-Allow-Origin', origin);
        }
      }

      if (options.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }

      if (options.methods) {
        response.headers.set('Access-Control-Allow-Methods', options.methods.join(', '));
      }

      if (options.allowedHeaders) {
        response.headers.set('Access-Control-Allow-Headers', options.allowedHeaders.join(', '));
      }

      if (options.maxAge) {
        response.headers.set('Access-Control-Max-Age', options.maxAge.toString());
      }

      return response;
    }

    return null; // Let the request continue
  };
}

export function applyCorsHeaders(response: NextResponse, request: NextRequest, options: CorsOptions = defaultCorsOptions): NextResponse {
  const origin = request.headers.get('origin') || '';

  // Set CORS headers for actual requests
  if (options.origin && origin) {
    if (isOriginAllowed(origin, options.origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
  }

  if (options.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (options.exposedHeaders && options.exposedHeaders.length > 0) {
    response.headers.set('Access-Control-Expose-Headers', options.exposedHeaders.join(', '));
  }

  return response;
}

// Security headers for enhanced protection
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com https://api.stripe.com wss: ws:",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Additional security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // HSTS for HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  return response;
}

// Validate request origin against whitelist
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // For same-origin requests (like direct navigation), origin header may not be present
  if (!origin && !referer) {
    // Allow requests without origin (e.g., direct navigation, mobile apps, Postman)
    return true;
  }

  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://datavault.pro',
        'https://app.datavault.pro',
        'https://api.datavault.pro',
        ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
      ]
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://0.0.0.0:3000'];

  // Check if the request is coming from the same host (same-origin)
  if (host && (!origin || origin.includes(host))) {
    return true;
  }

  try {
    const requestOrigin = origin || (referer ? new URL(referer).origin : '');

    return allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      return requestOrigin === allowed;
    });
  } catch (error) {
    // If URL parsing fails, allow the request (probably same-origin)
    return true;
  }
}

// Export default CORS middleware
export const corsMiddleware = createCorsHandler(defaultCorsOptions);
