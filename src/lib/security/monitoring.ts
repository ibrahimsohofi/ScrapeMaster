import type { NextRequest } from 'next/server';

/**
 * Security monitoring and threat detection system for DataVault Pro
 */

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: SecurityEventType;
  severity: SecuritySeverity;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  description: string;
  metadata?: Record<string, any>;
  blocked: boolean;
  userId?: string;
  sessionId?: string;
}

export enum SecurityEventType {
  SQL_INJECTION = 'sql_injection',
  XSS_ATTEMPT = 'xss_attempt',
  PATH_TRAVERSAL = 'path_traversal',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_USER_AGENT = 'suspicious_user_agent',
  INVALID_AUTH_TOKEN = 'invalid_auth_token',
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  CORS_VIOLATION = 'cors_violation',
  MALFORMED_REQUEST = 'malformed_request',
  SUSPICIOUS_PAYLOAD = 'suspicious_payload',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_EXFILTRATION = 'data_exfiltration'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// In-memory store for security events (in production, use a proper database)
const securityEvents: SecurityEvent[] = [];
const MAX_EVENTS = 10000; // Keep last 10k events in memory

// IP-based threat tracking
const threatTracking = new Map<string, {
  events: SecurityEvent[];
  score: number;
  lastActivity: Date;
  blocked: boolean;
}>();

/**
 * Generate unique ID for security events
 */
function generateEventId(): string {
  return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract IP address from request
 */
function extractIpAddress(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

/**
 * Log a security event
 */
export function logSecurityEvent(
  req: NextRequest,
  type: SecurityEventType,
  severity: SecuritySeverity,
  description: string,
  metadata?: Record<string, any>,
  blocked = false
): SecurityEvent {
  const event: SecurityEvent = {
    id: generateEventId(),
    timestamp: new Date(),
    type,
    severity,
    ip: extractIpAddress(req),
    userAgent: req.headers.get('user-agent') || 'unknown',
    path: req.nextUrl.pathname,
    method: req.method,
    description,
    metadata,
    blocked,
    userId: extractUserId(req),
    sessionId: extractSessionId(req)
  };

  // Add to events list
  securityEvents.push(event);
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.shift(); // Remove oldest event
  }

  // Update threat tracking
  updateThreatTracking(event);

  // Send to external monitoring (in production)
  if (process.env.NODE_ENV === 'production') {
    sendToExternalMonitoring(event);
  }

  // Log to console with appropriate level
  logToConsole(event);

  return event;
}

/**
 * Extract user ID from request (if authenticated)
 */
function extractUserId(req: NextRequest): string | undefined {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // In a real implementation, you'd decode the JWT
      // For now, return a placeholder
      return 'user_from_token';
    }
  } catch {
    // Ignore errors
  }
  return undefined;
}

/**
 * Extract session ID from request
 */
function extractSessionId(req: NextRequest): string | undefined {
  const sessionCookie = req.cookies.get('session')?.value;
  return sessionCookie || undefined;
}

/**
 * Update threat tracking for an IP
 */
function updateThreatTracking(event: SecurityEvent): void {
  if (event.ip === 'unknown') return;

  let tracking = threatTracking.get(event.ip);
  if (!tracking) {
    tracking = {
      events: [],
      score: 0,
      lastActivity: new Date(),
      blocked: false
    };
    threatTracking.set(event.ip, tracking);
  }

  tracking.events.push(event);
  tracking.lastActivity = new Date();

  // Calculate threat score
  const severityScores = {
    [SecuritySeverity.LOW]: 1,
    [SecuritySeverity.MEDIUM]: 3,
    [SecuritySeverity.HIGH]: 7,
    [SecuritySeverity.CRITICAL]: 15
  };

  tracking.score += severityScores[event.severity];

  // Auto-block if score is too high
  if (tracking.score >= 50) {
    tracking.blocked = true;
    logSecurityEvent(
      // Create a mock request for logging
      {
        headers: { get: () => event.ip },
        nextUrl: { pathname: '/security/auto-block' },
        method: 'SYSTEM',
        cookies: { get: () => undefined }
      } as any,
      SecurityEventType.BRUTE_FORCE_ATTACK,
      SecuritySeverity.CRITICAL,
      `IP automatically blocked due to high threat score: ${tracking.score}`,
      { originalEvents: tracking.events.length },
      true
    );
  }

  // Clean up old events (keep last 100 per IP)
  if (tracking.events.length > 100) {
    tracking.events = tracking.events.slice(-100);
  }
}

/**
 * Check if an IP is blocked
 */
export function isIpBlocked(ip: string): boolean {
  const tracking = threatTracking.get(ip);
  return tracking?.blocked || false;
}

/**
 * Get threat score for an IP
 */
export function getThreatScore(ip: string): number {
  const tracking = threatTracking.get(ip);
  return tracking?.score || 0;
}

/**
 * Get recent security events
 */
export function getRecentEvents(limit = 100): SecurityEvent[] {
  return securityEvents.slice(-limit).reverse();
}

/**
 * Get events by type
 */
export function getEventsByType(type: SecurityEventType, limit = 50): SecurityEvent[] {
  return securityEvents
    .filter(event => event.type === type)
    .slice(-limit)
    .reverse();
}

/**
 * Get events by severity
 */
export function getEventsBySeverity(severity: SecuritySeverity, limit = 50): SecurityEvent[] {
  return securityEvents
    .filter(event => event.severity === severity)
    .slice(-limit)
    .reverse();
}

/**
 * Get top threat IPs
 */
export function getTopThreatIps(limit = 10): Array<{ ip: string; score: number; events: number; blocked: boolean }> {
  return Array.from(threatTracking.entries())
    .map(([ip, tracking]) => ({
      ip,
      score: tracking.score,
      events: tracking.events.length,
      blocked: tracking.blocked
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Security metrics for dashboard
 */
export function getSecurityMetrics(): {
  totalEvents: number;
  eventsLast24h: number;
  blockedIps: number;
  criticalEvents: number;
  topThreats: Array<{ type: SecurityEventType; count: number }>;
} {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const eventsLast24h = securityEvents.filter(event =>
    event.timestamp >= last24h
  ).length;

  const blockedIps = Array.from(threatTracking.values())
    .filter(tracking => tracking.blocked).length;

  const criticalEvents = securityEvents.filter(event =>
    event.severity === SecuritySeverity.CRITICAL
  ).length;

  // Count events by type
  const threatCounts = new Map<SecurityEventType, number>();
  securityEvents.forEach(event => {
    threatCounts.set(event.type, (threatCounts.get(event.type) || 0) + 1);
  });

  const topThreats = Array.from(threatCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalEvents: securityEvents.length,
    eventsLast24h,
    blockedIps,
    criticalEvents,
    topThreats
  };
}

/**
 * Log to console with appropriate level
 */
function logToConsole(event: SecurityEvent): void {
  const logData = {
    id: event.id,
    type: event.type,
    severity: event.severity,
    ip: event.ip,
    path: event.path,
    description: event.description,
    blocked: event.blocked
  };

  switch (event.severity) {
    case SecuritySeverity.CRITICAL:
      console.error('🚨 CRITICAL SECURITY EVENT:', logData);
      break;
    case SecuritySeverity.HIGH:
      console.error('⚠️ HIGH SECURITY EVENT:', logData);
      break;
    case SecuritySeverity.MEDIUM:
      console.warn('⚠️ MEDIUM SECURITY EVENT:', logData);
      break;
    case SecuritySeverity.LOW:
      console.log('ℹ️ LOW SECURITY EVENT:', logData);
      break;
  }
}

/**
 * Send to external monitoring service (placeholder)
 */
function sendToExternalMonitoring(event: SecurityEvent): void {
  // In production, send to services like:
  // - Sentry
  // - DataDog
  // - New Relic
  // - Custom webhook

  if (process.env.SECURITY_WEBHOOK_URL) {
    fetch(process.env.SECURITY_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(error => {
      console.error('Failed to send security event to webhook:', error);
    });
  }
}

/**
 * Cleanup old threat tracking data
 */
export function cleanupThreatTracking(): void {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const [ip, tracking] of threatTracking.entries()) {
    if (tracking.lastActivity < oneWeekAgo && !tracking.blocked) {
      threatTracking.delete(ip);
    }
  }
}

/**
 * Manually block/unblock an IP
 */
export function setIpBlockStatus(ip: string, blocked: boolean, reason?: string): void {
  let tracking = threatTracking.get(ip);
  if (!tracking) {
    tracking = {
      events: [],
      score: 0,
      lastActivity: new Date(),
      blocked: false
    };
    threatTracking.set(ip, tracking);
  }

  tracking.blocked = blocked;
  tracking.lastActivity = new Date();

  // Log the manual action
  const mockReq = {
    headers: { get: () => ip },
    nextUrl: { pathname: '/security/manual-action' },
    method: 'ADMIN',
    cookies: { get: () => undefined }
  } as any;

  logSecurityEvent(
    mockReq,
    blocked ? SecurityEventType.BRUTE_FORCE_ATTACK : SecurityEventType.UNAUTHORIZED_ACCESS,
    SecuritySeverity.MEDIUM,
    `IP ${blocked ? 'blocked' : 'unblocked'} manually${reason ? `: ${reason}` : ''}`,
    { manual: true, reason },
    blocked
  );
}

/**
 * Run periodic cleanup (call this in a cron job)
 */
export function performPeriodicCleanup(): void {
  cleanupThreatTracking();

  // Decay threat scores over time
  const now = new Date();
  for (const tracking of threatTracking.values()) {
    const hoursSinceLastActivity = (now.getTime() - tracking.lastActivity.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastActivity > 24) {
      tracking.score = Math.max(0, tracking.score * 0.5); // Reduce score by half daily
    }
  }
}
