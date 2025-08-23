import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authLimiter, apiLimiter, scraperLimiter, strictLimiter, applyRateLimit } from '@/lib/auth/rate-limiter';
import {
  corsMiddleware,
  createCorsHandler,
  addSecurityHeaders as addCORSSecurityHeaders,
  validateOrigin,
  apiCorsOptions,
  publicCorsOptions
} from '@/lib/auth/cors-config';
import { verifyToken } from '@/lib/auth/jwt';
import { InputValidator, sanitizeQueryParams } from '@/lib/security/input-validation';

// Enhanced security configuration
interface SecurityConfig {
  requireAuth: boolean;
  rateLimiter: string;
  inputValidation: boolean;
  corsLevel: 'strict' | 'normal' | 'public';
}

const securityConfigs: Record<string, SecurityConfig> = {
  '/': {
    requireAuth: false,
    rateLimiter: 'api',
    inputValidation: false,
    corsLevel: 'public',
  },
  '/auth/': {
    requireAuth: false,
    rateLimiter: 'auth',
    inputValidation: false,
    corsLevel: 'public',
  },
  '/dashboard/': {
    requireAuth: false, // Frontend auth handled by React components
    rateLimiter: 'api',
    inputValidation: false,
    corsLevel: 'public',
  },
  '/api/auth/': {
    requireAuth: false,
    rateLimiter: 'auth',
    inputValidation: true,
    corsLevel: 'strict',
  },
  '/api/users/': {
    requireAuth: true,
    rateLimiter: 'auth',
    inputValidation: true,
    corsLevel: 'strict',
  },
  '/api/scrapers': {
    requireAuth: true,
    rateLimiter: 'scraper',
    inputValidation: true,
    corsLevel: 'normal',
  },
  '/api/jobs': {
    requireAuth: true,
    rateLimiter: 'scraper',
    inputValidation: true,
    corsLevel: 'normal',
  },
  '/api/health': {
    requireAuth: false,
    rateLimiter: 'api',
    inputValidation: false,
    corsLevel: 'public',
  },
  '/api/': {
    requireAuth: true,
    rateLimiter: 'api',
    inputValidation: true,
    corsLevel: 'normal',
  },
};

// Helper functions for enhanced security

function getSecurityConfig(pathname: string): SecurityConfig {
  for (const [route, config] of Object.entries(securityConfigs)) {
    if (pathname.startsWith(route)) {
      return config;
    }
  }
  // Default configuration based on route type
  if (pathname.startsWith('/api/')) {
    return securityConfigs['/api/'];
  } else {
    // Frontend routes default to no auth required
    return securityConfigs['/'];
  }
}

function getRateLimiter(type: string) {
  switch (type) {
    case 'auth':
      return authLimiter;
    case 'scraper':
      return scraperLimiter;
    case 'strict':
      return strictLimiter;
    case 'api':
    default:
      return apiLimiter;
  }
}

function performSecurityChecks(req: NextRequest): { isValid: boolean; reason?: string } {
  // Skip all security checks in development mode
  if (process.env.NODE_ENV !== 'production') {
    return { isValid: true };
  }

  const { pathname } = req.nextUrl;
  const userAgent = req.headers.get('user-agent') || '';

  // Validate origin for cross-origin requests
  if (!validateOrigin(req)) {
    return { isValid: false, reason: 'Invalid origin' };
  }

  // Check for XSS attempts in URL
  if (InputValidator.containsXSS(pathname)) {
    return { isValid: false, reason: 'XSS attempt detected in URL' };
  }

  // Check for SQL injection attempts in URL
  if (InputValidator.containsSQLInjection(pathname)) {
    return { isValid: false, reason: 'SQL injection attempt detected in URL' };
  }

  // Check for NoSQL injection attempts in URL
  if (InputValidator.containsNoSQLInjection(pathname)) {
    return { isValid: false, reason: 'NoSQL injection attempt detected in URL' };
  }

  // Check for suspicious patterns in user agent
  if (InputValidator.containsXSS(userAgent)) {
    return { isValid: false, reason: 'Suspicious user agent' };
  }

  // Honeypot detection disabled for now

  // Check content length for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentLength = req.headers.get('content-length');
    if (contentLength && Number.parseInt(contentLength) > 10 * 1024 * 1024) {
      return { isValid: false, reason: 'Request body too large' };
    }
  }

  // Sanitize and validate query parameters
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const sanitizedParams = sanitizeQueryParams(params);

  // Check if sanitization removed any parameters (potential attack)
  if (Object.keys(params).length !== Object.keys(sanitizedParams).length) {
    return { isValid: false, reason: 'Malicious query parameters detected' };
  }

  return { isValid: true };
}

async function authenticateRequest(req: NextRequest): Promise<{
  success: boolean;
  message?: string;
  status?: number;
  userId?: string;
  role?: string;
  organizationId?: string;
}> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
               req.cookies.get('token')?.value;

  if (!token) {
    return { success: false, message: 'Authentication required', status: 401 };
  }

  try {
    const payload = await verifyToken(token);
    if (!payload) {
      return { success: false, message: 'Invalid token', status: 401 };
    }

    return {
      success: true,
      userId: payload.userId,
      role: payload.role,
      organizationId: payload.organizationId,
    };
  } catch (error) {
    return { success: false, message: 'Invalid or expired token', status: 401 };
  }
}

function addSecurityHeaders(response: NextResponse, req: NextRequest, startTime?: number): NextResponse {
  // Use comprehensive security headers from our CORS config
  response = addCORSSecurityHeaders(response);

  // Performance and tracking headers
  if (startTime) {
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  }
  response.headers.set('X-Request-ID', Math.random().toString(36).slice(2));
  response.headers.set('X-Powered-By', 'DataVault Pro');

  return response;
}

function createSecurityErrorResponse(
  message: string,
  status = 400,
  headers: Record<string, string> = {}
): NextResponse {
  const response = new NextResponse(
    JSON.stringify({
      error: 'Security validation failed',
      message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );

  // Add security headers even to error responses
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

// Honeypot detection is now handled in the rate-limiter module

// Enhanced middleware with comprehensive security
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const startTime = Date.now();

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('favicon.ico') ||
    (pathname.includes('.') && !pathname.includes('/api/'))
  ) {
    return NextResponse.next();
  }

  // In development, skip all middleware processing for non-API routes
  if (process.env.NODE_ENV !== 'production' && !pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  try {
    // 1. CORS handling (must be first)
    const corsOptions = pathname.startsWith('/api/health') ? publicCorsOptions : apiCorsOptions;
    const corsHandler = createCorsHandler(corsOptions);
    const corsResponse = corsHandler(req);
    if (corsResponse) {
      return addCORSSecurityHeaders(corsResponse);
    }

    // 2. Get security configuration for this route
    const config = getSecurityConfig(pathname);

    // 3. Input validation and security checks (only for API routes)
    if (config.inputValidation && pathname.startsWith('/api/')) {
      const securityResult = performSecurityChecks(req);
      if (!securityResult.isValid) {
        return createSecurityErrorResponse(
          'Request contains potentially harmful content',
          400,
          { 'X-Security-Issue': securityResult.reason || 'Unknown security issue' }
        );
      }
    }

    // 4. Rate limiting
    if (pathname.startsWith('/api/')) {
      const rateLimiter = getRateLimiter(config.rateLimiter);
      const rateLimitResponse = await applyRateLimit(req, rateLimiter);

      if (rateLimitResponse) {
        return rateLimitResponse; // applyRateLimit already returns a properly configured Response
      }
    }

    // 5. Authentication for protected routes
    if (config.requireAuth) {
      const authResult = await authenticateRequest(req);
      if (!authResult.success) {
        return createSecurityErrorResponse(
          authResult.message || 'Authentication required',
          authResult.status || 401
        );
      }

      // Add user context to headers
      const response = NextResponse.next({
        request: {
          headers: new Headers({
            ...Object.fromEntries(req.headers),
            'x-user-id': authResult.userId!,
            'x-user-role': authResult.role || 'USER',
            'x-organization-id': authResult.organizationId || '',
          }),
        },
      });

      return addSecurityHeaders(response, req, startTime);
    }

    // 6. Continue with security headers for public routes
    const response = NextResponse.next();
    return addSecurityHeaders(response, req, startTime);

  } catch (error) {
    console.error('Middleware error:', error);
    return createSecurityErrorResponse(
      'An unexpected error occurred',
      500
    );
  }
}

// Configure matcher to run middleware on specific routes
export const config = {
  matcher: [
    // Match all request paths except for static files
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    // Match all API routes
    '/api/:path*'
  ]
};
