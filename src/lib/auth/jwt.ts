import * as jwt from 'jsonwebtoken';

// Security Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'development-refresh-secret-change-in-production';

// Validate JWT_SECRET strength in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
  if (!process.env.REFRESH_SECRET || process.env.REFRESH_SECRET.length < 32) {
    throw new Error('REFRESH_SECRET must be at least 32 characters in production');
  }
}

// Token Types and Interfaces
export interface JwtPayload {
  userId: string;
  role?: string;
  organizationId?: string;
  tokenId?: string; // For token revocation
  sessionId?: string; // For session management
  exp?: number;
  iat?: number;
  aud?: string; // Audience
  iss?: string; // Issuer
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  sessionId: string;
  exp?: number;
  iat?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

// In-memory token blacklist (use Redis in production)
const blacklistedTokens = new Set<string>();
const activeTokens = new Map<string, { userId: string; createdAt: number }>();

// Token Configuration
const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m', // Short-lived access tokens
  REFRESH_TOKEN_EXPIRY: '7d', // Longer-lived refresh tokens
  ISSUER: 'techflow-pro',
  AUDIENCE: 'techflow-api',
  ALGORITHM: 'HS256' as const,
  MAX_TOKENS_PER_USER: 5, // Limit concurrent sessions
};

/**
 * Generate a secure random token ID using Web Crypto API
 */
function generateTokenId(): string {
  if (typeof window !== 'undefined') {
    // Browser environment
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js environment
    const { randomBytes } = require('crypto');
    return randomBytes(16).toString('hex');
  }
}

/**
 * Generate a secure session ID using Web Crypto API
 */
function generateSessionId(): string {
  if (typeof window !== 'undefined') {
    // Browser environment
    const array = new Uint8Array(20);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js environment
    const { randomBytes } = require('crypto');
    return randomBytes(20).toString('hex');
  }
}

/**
 * Create hash of token for blacklist storage using Web Crypto API
 */
async function hashTokenAsync(token: string): Promise<string> {
  if (typeof window !== 'undefined') {
    // Browser environment
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js environment
    const { createHash } = require('crypto');
    return createHash('sha256').update(token).digest('hex');
  }
}

/**
 * Synchronous hash function for backwards compatibility
 */
function hashToken(token: string): string {
  if (typeof window !== 'undefined') {
    // In browser, use a simple hash for now (not cryptographically secure)
    // This is only used for blacklisting, so security is less critical
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  } else {
    // Node.js environment
    const { createHash } = require('crypto');
    return createHash('sha256').update(token).digest('hex');
  }
}

/**
 * Sign a new access token with enhanced security
 */
export function signAccessToken(
  userId: string,
  role?: string,
  organizationId?: string,
  sessionId?: string
): string {
  const tokenId = generateTokenId();
  const payload: JwtPayload = {
    userId,
    role: role || 'USER',
    organizationId,
    tokenId,
    sessionId: sessionId || generateSessionId(),
    aud: TOKEN_CONFIG.AUDIENCE,
    iss: TOKEN_CONFIG.ISSUER,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY,
    algorithm: TOKEN_CONFIG.ALGORITHM,
  });

  // Track active token
  activeTokens.set(tokenId, { userId, createdAt: Date.now() });

  return token;
}

/**
 * Sign a new refresh token
 */
export function signRefreshToken(userId: string, sessionId: string): string {
  const tokenId = generateTokenId();
  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
    sessionId,
  };

  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY,
    algorithm: TOKEN_CONFIG.ALGORITHM,
  });
}

/**
 * Create a complete token pair (access + refresh)
 */
export function createTokenPair(
  userId: string,
  role?: string,
  organizationId?: string
): TokenPair {
  const sessionId = generateSessionId();
  const accessToken = signAccessToken(userId, role, organizationId, sessionId);
  const refreshToken = signRefreshToken(userId, sessionId);

  // Calculate expiry time for access token
  const decoded = jwt.decode(accessToken) as any;
  const expiresIn = decoded.exp ? (decoded.exp - Math.floor(Date.now() / 1000)) : 900; // 15 min default

  return {
    accessToken,
    refreshToken,
    expiresIn,
    tokenType: 'Bearer',
  };
}

/**
 * Verify and decode an access token with enhanced validation
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    // Check if token is blacklisted
    const tokenHash = hashToken(token);
    if (blacklistedTokens.has(tokenHash)) {
      console.warn('Attempted use of blacklisted token');
      return null;
    }

    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: [TOKEN_CONFIG.ALGORITHM],
      audience: TOKEN_CONFIG.AUDIENCE,
      issuer: TOKEN_CONFIG.ISSUER,
    }) as JwtPayload;

    // Additional validation
    if (!payload.userId || !payload.tokenId) {
      console.error('Token missing required fields');
      return null;
    }

    // Check if token is still active
    const activeToken = activeTokens.get(payload.tokenId);
    if (!activeToken || activeToken.userId !== payload.userId) {
      console.warn('Token not found in active tokens');
      return null;
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT verification error:', error.message);
    } else if (error instanceof jwt.TokenExpiredError) {
      console.warn('Token expired:', error.message);
    } else {
      console.error('Unknown token verification error:', error);
    }
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const tokenHash = hashToken(token);
    if (blacklistedTokens.has(tokenHash)) {
      console.warn('Attempted use of blacklisted refresh token');
      return null;
    }

    const payload = jwt.verify(token, REFRESH_SECRET, {
      algorithms: [TOKEN_CONFIG.ALGORITHM],
    }) as RefreshTokenPayload;

    if (!payload.userId || !payload.tokenId || !payload.sessionId) {
      console.error('Refresh token missing required fields');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return null;
  }
}

/**
 * Refresh an access token using a refresh token
 */
export function refreshAccessToken(refreshToken: string): TokenPair | null {
  const refreshPayload = verifyRefreshToken(refreshToken);
  if (!refreshPayload) {
    return null;
  }

  // In a real implementation, you'd fetch user data from database
  // For now, we'll create a new token pair with basic info
  return createTokenPair(refreshPayload.userId);
}

/**
 * Revoke a specific token (blacklist it)
 */
export function revokeToken(token: string): boolean {
  try {
    const tokenHash = hashToken(token);
    blacklistedTokens.add(tokenHash);

    // Try to extract tokenId and remove from active tokens
    const payload = jwt.decode(token) as JwtPayload;
    if (payload?.tokenId) {
      activeTokens.delete(payload.tokenId);
    }

    return true;
  } catch (error) {
    console.error('Error revoking token:', error);
    return false;
  }
}

/**
 * Revoke all tokens for a user
 */
export function revokeAllUserTokens(userId: string): number {
  let revokedCount = 0;

  // Remove all active tokens for the user
  for (const [tokenId, tokenInfo] of activeTokens.entries()) {
    if (tokenInfo.userId === userId) {
      activeTokens.delete(tokenId);
      revokedCount++;
    }
  }

  return revokedCount;
}

/**
 * Get active token count for a user
 */
export function getUserActiveTokenCount(userId: string): number {
  let count = 0;
  for (const tokenInfo of activeTokens.values()) {
    if (tokenInfo.userId === userId) {
      count++;
    }
  }
  return count;
}

/**
 * Cleanup expired tokens from memory
 */
export function cleanupExpiredTokens(): number {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  let cleanedCount = 0;

  for (const [tokenId, tokenInfo] of activeTokens.entries()) {
    if (now - tokenInfo.createdAt > maxAge) {
      activeTokens.delete(tokenId);
      cleanedCount++;
    }
  }

  return cleanedCount;
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * Validate token structure and claims
 */
export function validateTokenStructure(token: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  try {
    const payload = jwt.decode(token) as JwtPayload;

    if (!payload) {
      issues.push('Token cannot be decoded');
      return { isValid: false, issues };
    }

    // Check required fields
    if (!payload.userId) issues.push('Missing userId');
    if (!payload.tokenId) issues.push('Missing tokenId');
    if (!payload.exp) issues.push('Missing expiration');
    if (!payload.iat) issues.push('Missing issued at');

    // Check audience and issuer
    if (payload.aud !== TOKEN_CONFIG.AUDIENCE) issues.push('Invalid audience');
    if (payload.iss !== TOKEN_CONFIG.ISSUER) issues.push('Invalid issuer');

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      issues.push('Token expired');
    }

    return { isValid: issues.length === 0, issues };
  } catch (error) {
    issues.push('Token parsing error');
    return { isValid: false, issues };
  }
}

// Cleanup expired tokens periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    const cleaned = cleanupExpiredTokens();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired tokens`);
    }
  }, 60 * 60 * 1000); // Every hour
}

// Legacy function for backward compatibility
export function signToken(userId: string, expiresIn = '15m'): string {
  console.warn('signToken is deprecated, use signAccessToken instead');
  return signAccessToken(userId);
}

export function verifyToken(token: string): JwtPayload | null {
  console.warn('verifyToken is deprecated, use verifyAccessToken instead');
  return verifyAccessToken(token);
}
