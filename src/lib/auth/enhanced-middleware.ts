import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { env } from '@/lib/env-validation';
import { rateLimiter } from '@/lib/security/enhanced-rate-limiter';

// JWT Configuration
const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const JWT_ALGORITHM = 'HS256';

// Session Configuration
const SESSION_CONFIG = {
  accessTokenExpiry: 15 * 60, // 15 minutes
  refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days
  tokenRefreshThreshold: 5 * 60, // Refresh if token expires in 5 minutes
  maxSessions: 5, // Max concurrent sessions per user
};

// Security Headers Configuration
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  sessionId: string;
  permissions: string[];
  lastActivity: number;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  shouldRefresh?: boolean;
  newTokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * Enhanced Authentication Middleware with advanced security features
 */
export class EnhancedAuthMiddleware {
  // In-memory session store (use Redis in production)
  private sessions = new Map<string, {
    userId: string;
    sessionId: string;
    createdAt: number;
    lastActivity: number;
    refreshToken: string;
    deviceInfo: string;
  }>();

  /**
   * Generate JWT tokens
   */
  async generateTokens(user: AuthUser): Promise<{ accessToken: string; refreshToken: string }> {
    const sessionId = this.generateSessionId();
    const now = Math.floor(Date.now() / 1000);

    // Create access token with short expiry
    const accessToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      sessionId,
      permissions: user.permissions,
    })
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuedAt(now)
      .setExpirationTime(now + SESSION_CONFIG.accessTokenExpiry)
      .setAudience('datavault-pro')
      .setIssuer('datavault-pro')
      .sign(JWT_SECRET);

    // Create refresh token with longer expiry
    const refreshToken = await new SignJWT({
      sub: user.id,
      sessionId,
      type: 'refresh',
    })
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setIssuedAt(now)
      .setExpirationTime(now + SESSION_CONFIG.refreshTokenExpiry)
      .setAudience('datavault-pro')
      .setIssuer('datavault-pro')
      .sign(JWT_SECRET);

    // Store session
    this.sessions.set(sessionId, {
      userId: user.id,
      sessionId,
      createdAt: now,
      lastActivity: now,
      refreshToken,
      deviceInfo: this.getDeviceInfo(user as any), // Simplified device info
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decode JWT token
   */
  async verifyToken(token: string): Promise<AuthResult> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        audience: 'datavault-pro',
        issuer: 'datavault-pro',
      });

      // Check if token is close to expiry
      const now = Math.floor(Date.now() / 1000);
      const timeToExpiry = (payload.exp || 0) - now;
      const shouldRefresh = timeToExpiry < SESSION_CONFIG.tokenRefreshThreshold;

      // Validate session
      const sessionId = payload.sessionId as string;
      const session = this.sessions.get(sessionId);

      if (!session || session.userId !== payload.sub) {
        return { success: false, error: 'Invalid session' };
      }

      // Update session activity
      session.lastActivity = now;

      const user: AuthUser = {
        id: payload.sub as string,
        email: payload.email as string,
        role: payload.role as string,
        organizationId: payload.organizationId as string,
        sessionId,
        permissions: (payload.permissions as string[]) || [],
        lastActivity: now,
      };

      return {
        success: true,
        user,
        shouldRefresh,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token verification failed',
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthResult> {
    try {
      const { payload } = await jwtVerify(refreshToken, JWT_SECRET);

      if (payload.type !== 'refresh') {
        return { success: false, error: 'Invalid refresh token' };
      }

      const sessionId = payload.sessionId as string;
      const session = this.sessions.get(sessionId);

      if (!session || session.refreshToken !== refreshToken) {
        return { success: false, error: 'Invalid session or refresh token' };
      }

      // Generate new tokens (this would typically fetch user from database)
      const user: AuthUser = {
        id: session.userId,
        email: '', // Would be fetched from database
        role: '', // Would be fetched from database
        organizationId: '', // Would be fetched from database
        sessionId,
        permissions: [], // Would be fetched from database
        lastActivity: Math.floor(Date.now() / 1000),
      };

      const newTokens = await this.generateTokens(user);

      return {
        success: true,
        user,
        newTokens,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Refresh token verification failed',
      };
    }
  }

  /**
   * Revoke session (logout)
   */
  revokeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Revoke all sessions for a user
   */
  revokeAllUserSessions(userId: string): number {
    let revoked = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        revoked++;
      }
    }
    return revoked;
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = Math.floor(Date.now() / 1000);
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      // Remove sessions older than refresh token expiry
      if (session.createdAt + SESSION_CONFIG.refreshTokenExpiry < now) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Apply security headers to response
   */
  applySecurityHeaders(response: NextResponse): NextResponse {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Content Security Policy (basic)
    if (env.NODE_ENV === 'production') {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
      );
    }

    return response;
  }

  /**
   * Create authentication middleware
   */
  createMiddleware(options?: {
    publicPaths?: string[];
    adminPaths?: string[];
    rateLimitConfig?: { requests: number; window: number };
  }) {
    return async (request: NextRequest) => {
      const { pathname } = request.nextUrl;

      // Apply rate limiting first
      const rateLimitResult = rateLimiter.checkRateLimit(
        request,
        options?.rateLimitConfig
      );

      if (!rateLimitResult.success) {
        const response = NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
        return this.applySecurityHeaders(response);
      }

      // Skip authentication for public paths
      const isPublicPath = options?.publicPaths?.some(path =>
        pathname.startsWith(path)
      ) || pathname.startsWith('/api/auth/') || pathname === '/';

      if (isPublicPath) {
        return this.applySecurityHeaders(NextResponse.next());
      }

      // Extract tokens from request
      const accessToken = this.extractAccessToken(request);
      const refreshToken = this.extractRefreshToken(request);

      if (!accessToken) {
        return this.redirectToLogin(request);
      }

      // Verify access token
      const authResult = await this.verifyToken(accessToken);

      if (!authResult.success) {
        // Try to refresh token if available
        if (refreshToken) {
          const refreshResult = await this.refreshAccessToken(refreshToken);
          if (refreshResult.success && refreshResult.newTokens) {
            // Create response with new tokens
            const response = NextResponse.next();
            this.setTokenCookies(response, refreshResult.newTokens);
            return this.applySecurityHeaders(response);
          }
        }

        return this.redirectToLogin(request);
      }

      // Check admin paths
      const isAdminPath = options?.adminPaths?.some(path =>
        pathname.startsWith(path)
      );

      if (isAdminPath && authResult.user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Add user info to request headers for API routes
      const response = NextResponse.next();
      response.headers.set('X-User-ID', authResult.user!.id);
      response.headers.set('X-User-Role', authResult.user!.role);
      response.headers.set('X-Organization-ID', authResult.user!.organizationId);

      // Refresh token if needed
      if (authResult.shouldRefresh && refreshToken) {
        const refreshResult = await this.refreshAccessToken(refreshToken);
        if (refreshResult.success && refreshResult.newTokens) {
          this.setTokenCookies(response, refreshResult.newTokens);
        }
      }

      return this.applySecurityHeaders(response);
    };
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private getDeviceInfo(request: any): string {
    const userAgent = request.headers?.get?.('user-agent') || '';
    return userAgent.substring(0, 100); // Simplified device fingerprinting
  }

  private extractAccessToken(request: NextRequest): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try cookie
    return request.cookies.get('access-token')?.value || null;
  }

  private extractRefreshToken(request: NextRequest): string | null {
    return request.cookies.get('refresh-token')?.value || null;
  }

  private setTokenCookies(
    response: NextResponse,
    tokens: { accessToken: string; refreshToken: string }
  ): void {
    const isProduction = env.NODE_ENV === 'production';

    // Set access token cookie (shorter expiry)
    response.cookies.set('access-token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: SESSION_CONFIG.accessTokenExpiry,
      path: '/',
    });

    // Set refresh token cookie (longer expiry)
    response.cookies.set('refresh-token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: SESSION_CONFIG.refreshTokenExpiry,
      path: '/',
    });
  }

  private redirectToLogin(request: NextRequest): NextResponse {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Export singleton instance
export const authMiddleware = new EnhancedAuthMiddleware();

// Utility function for API route protection
export function withAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>,
  options?: { requiredRole?: string; requiredPermissions?: string[] }
) {
  return async (request: NextRequest) => {
    const accessToken = request.cookies.get('access-token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const authResult = await authMiddleware.verifyToken(accessToken);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check role requirements
    if (options?.requiredRole && authResult.user.role !== options.requiredRole) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check permission requirements
    if (options?.requiredPermissions) {
      const hasPermissions = options.requiredPermissions.every(permission =>
        authResult.user!.permissions.includes(permission)
      );

      if (!hasPermissions) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    return handler(request, authResult.user);
  };
}
