import { type NextRequest, NextResponse } from 'next/server';
import { findUserById, findUserByApiKey } from '../db';
import prisma from '../db/prisma';
import { verifyToken, signToken } from './jwt';
import { applyRateLimit, authLimiter, apiLimiter, scraperLimiter, strictLimiter } from './rate-limiter';

// Security headers configuration
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Robots-Tag': 'noindex, nofollow', // Prevent API indexing
};

// CORS configuration
const corsConfig = {
  allowedOrigins: [
    'http://localhost:3000',
    'https://localhost:3000',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
  ],
  maxAge: 86400, // 24 hours
};

function applyCorsHeaders(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin');

  // Check if origin is allowed
  if (origin && corsConfig.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

function applySecurityHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

async function getRateLimiterForPath(pathname: string) {
  if (pathname.startsWith('/api/auth/')) {
    return authLimiter;
  }
  if (pathname.startsWith('/api/scrapers/') && pathname.includes('/run')) {
    return scraperLimiter;
  }
  if (pathname.startsWith('/api/data/export')) {
    return strictLimiter;
  }
  if (pathname.startsWith('/api/')) {
    return apiLimiter;
  }
  return null;
}

// Enhanced input validation
function validateRequest(request: NextRequest): { valid: boolean; error?: string } {
  const userAgent = request.headers.get('user-agent');
  const contentType = request.headers.get('content-type');

  // Block suspicious user agents
  if (!userAgent || userAgent.length < 10) {
    return { valid: false, error: 'Invalid user agent' };
  }

  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    if (contentType && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      return { valid: false, error: 'Invalid content type' };
    }
  }

  return { valid: true };
}

// Middleware to authenticate API requests via JWT or API key
export async function authenticateApiRequest(
  request: NextRequest
): Promise<{ authenticated: boolean; userId?: string; error?: string }> {
  // Apply request validation
  const validation = validateRequest(request);
  if (!validation.valid) {
    return {
      authenticated: false,
      error: validation.error || 'Invalid request',
    };
  }

  // Apply rate limiting
  const pathname = new URL(request.url).pathname;
  const rateLimiter = await getRateLimiterForPath(pathname);
  if (rateLimiter) {
    const rateLimitResult = await rateLimiter.isAllowed(request);
    if (!rateLimitResult.allowed) {
      return {
        authenticated: false,
        error: 'Rate limit exceeded',
      };
    }
  }

  // Get Authorization header
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return {
      authenticated: false,
      error: 'Missing Authorization header',
    };
  }

  // Check if it's a Bearer token
  if (!authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Invalid Authorization header format',
    };
  }

  // Extract the token
  const token = authHeader.slice(7);

  if (!token) {
    return {
      authenticated: false,
      error: 'Missing token',
    };
  }

  // First try to verify as a JWT token
  try {
    const payload = verifyToken(token);
    if (payload && payload.userId) {
      // For development, use in-memory DB for now
      const user = findUserById(payload.userId);
      // For production, use Prisma
      // const user = await prisma.user.findUnique({ where: { id: payload.userId } });

      if (user && user.isActive) {
        return {
          authenticated: true,
          userId: user.id,
        };
      }
    }
  } catch (error) {
    // JWT verification failed, continue to API key check
  }

  // If JWT verification fails, try as an API key
  const user = findUserByApiKey(token);
  // For production, use Prisma
  // const apiKey = await prisma.apiKey.findUnique({
  //   where: { keyHash: token },
  //   include: { user: true }
  // });
  // const user = apiKey?.user;

  if (user) {
    return {
      authenticated: true,
      userId: user.id,
    };
  }

  // Authentication failed
  return {
    authenticated: false,
    error: 'Invalid authentication token',
  };
}

// Enhanced middleware to handle authentication for API routes
export function withApiAuth<T extends unknown[]>(
  handler: (request: NextRequest, context: { userId: string }, ...args: T) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, ...args: T) => {
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      return applyCorsHeaders(request, applySecurityHeaders(response));
    }

    // Authenticate the request
    const { authenticated, userId, error } = await authenticateApiRequest(request);

    if (!authenticated) {
      const errorResponse = NextResponse.json(
        { error },
        { status: error === 'Rate limit exceeded' ? 429 : 401 }
      );
      return applyCorsHeaders(request, applySecurityHeaders(errorResponse));
    }

    if (!userId) {
      const errorResponse = NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
      return applyCorsHeaders(request, applySecurityHeaders(errorResponse));
    }

    try {
      const result = await handler(request, { userId }, ...args);
      return applyCorsHeaders(request, applySecurityHeaders(result));
    } catch (error) {
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return applyCorsHeaders(request, applySecurityHeaders(errorResponse));
    }
  };
}

// Generate a JWT token
export function generateToken(userId: string): string {
  return signToken(userId);
}
