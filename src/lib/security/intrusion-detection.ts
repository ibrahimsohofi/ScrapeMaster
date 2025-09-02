import { logger } from '@/lib/utils';
import { auditLogger } from '@/lib/compliance/audit-logger';

interface SecurityThreat {
  id: string;
  type: 'brute_force' | 'sql_injection' | 'xss' | 'dos' | 'suspicious_activity' | 'unauthorized_access' | 'data_exfiltration' | 'malware' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  timestamp: Date;
  source: {
    ipAddress: string;
    userAgent?: string;
    userId?: string;
    sessionId?: string;
    geolocation?: {
      country: string;
      region: string;
      city: string;
    };
  };
  target: {
    resource: string;
    endpoint: string;
    method: string;
  };
  description: string;
  evidence: {
    patterns: string[];
    frequency: number;
    timeWindow: number; // seconds
    relatedEvents: string[];
  };
  status: 'detected' | 'investigating' | 'confirmed' | 'false_positive' | 'mitigated';
  response: {
    actions: string[];
    automated: boolean;
    manual: boolean;
  };
  mitigation?: {
    blocked: boolean;
    quarantined: boolean;
    alertsSent: boolean;
    escalated: boolean;
  };
}

interface SecurityRule {
  id: string;
  name: string;
  enabled: boolean;
  type: SecurityThreat['type'];
  severity: SecurityThreat['severity'];
  conditions: {
    patterns: string[];
    thresholds: {
      frequency: number;
      timeWindow: number; // seconds
    };
    methods?: string[];
    endpoints?: string[];
    ipWhitelist?: string[];
    ipBlacklist?: string[];
  };
  actions: {
    block: boolean;
    alert: boolean;
    log: boolean;
    quarantine: boolean;
    escalate: boolean;
  };
}

interface RateLimitRule {
  id: string;
  name: string;
  enabled: boolean;
  scope: 'ip' | 'user' | 'session' | 'endpoint';
  limit: number;
  window: number; // seconds
  endpoints: string[];
  methods: string[];
  exemptions: string[]; // IPs or user IDs exempt from rate limiting
}

interface RequestFingerprint {
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  headers: Record<string, string>;
  params: Record<string, any>;
  body?: any;
}

export class IntrusionDetectionService {
  private threats: Map<string, SecurityThreat> = new Map();
  private rules: Map<string, SecurityRule> = new Map();
  private rateLimitRules: Map<string, RateLimitRule> = new Map();
  private requestHistory: Map<string, RequestFingerprint[]> = new Map();
  private blockedIPs: Set<string> = new Set();
  private quarantinedSessions: Set<string> = new Set();

  constructor() {
    this.initializeDefaultRules();
    this.startCleanupInterval();
  }

  /**
   * Analyze incoming request for threats
   */
  async analyzeRequest(request: RequestFingerprint): Promise<{
    allowed: boolean;
    threats: SecurityThreat[];
    rateLimited: boolean;
  }> {
    const threats: SecurityThreat[] = [];
    let rateLimited = false;

    // Check if IP is blocked
    if (this.blockedIPs.has(request.ipAddress)) {
      await auditLogger.logSecurityEvent({
        eventType: 'blocked_request',
        action: 'block',
        resource: request.endpoint,
        outcome: 'success',
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        severity: 'medium',
        details: { reason: 'blocked_ip' },
      });

      return { allowed: false, threats: [], rateLimited: false };
    }

    // Check if session is quarantined
    if (request.sessionId && this.quarantinedSessions.has(request.sessionId)) {
      await auditLogger.logSecurityEvent({
        eventType: 'quarantined_request',
        action: 'quarantine',
        resource: request.endpoint,
        outcome: 'success',
        userId: request.userId,
        sessionId: request.sessionId,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        severity: 'medium',
        details: { reason: 'quarantined_session' },
      });

      return { allowed: false, threats: [], rateLimited: false };
    }

    // Store request history
    this.storeRequestHistory(request);

    // Check rate limits
    rateLimited = await this.checkRateLimits(request);
    if (rateLimited) {
      return { allowed: false, threats: [], rateLimited: true };
    }

    // Analyze against security rules
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const threat = await this.checkRule(rule, request);
      if (threat) {
        threats.push(threat);

        // Take automated actions
        if (rule.actions.block) {
          this.blockedIPs.add(request.ipAddress);
        }

        if (rule.actions.quarantine && request.sessionId) {
          this.quarantinedSessions.add(request.sessionId);
        }
      }
    }

    // Check for patterns and anomalies
    const patternThreats = await this.detectPatterns(request);
    threats.push(...patternThreats);

    const allowed = threats.length === 0 || !threats.some(t => t.severity === 'critical');

    return { allowed, threats, rateLimited };
  }

  /**
   * Check security rule against request
   */
  private async checkRule(rule: SecurityRule, request: RequestFingerprint): Promise<SecurityThreat | null> {
    // Check method filter
    if (rule.conditions.methods && !rule.conditions.methods.includes(request.method)) {
      return null;
    }

    // Check endpoint filter
    if (rule.conditions.endpoints && !rule.conditions.endpoints.some(ep => request.endpoint.includes(ep))) {
      return null;
    }

    // Check IP whitelist
    if (rule.conditions.ipWhitelist && rule.conditions.ipWhitelist.includes(request.ipAddress)) {
      return null;
    }

    // Check IP blacklist
    if (rule.conditions.ipBlacklist && rule.conditions.ipBlacklist.includes(request.ipAddress)) {
      return this.createThreat(rule, request, 'IP address in blacklist', 95);
    }

    // Check patterns
    for (const pattern of rule.conditions.patterns) {
      if (this.matchesPattern(pattern, request)) {
        // Check frequency threshold
        const frequency = await this.getRequestFrequency(request, rule.conditions.thresholds.timeWindow);

        if (frequency >= rule.conditions.thresholds.frequency) {
          return this.createThreat(rule, request, `Pattern "${pattern}" exceeded threshold`, 85);
        }
      }
    }

    return null;
  }

  /**
   * Check if request matches pattern
   */
  private matchesPattern(pattern: string, request: RequestFingerprint): boolean {
    const payload = JSON.stringify({
      endpoint: request.endpoint,
      params: request.params,
      body: request.body,
      headers: request.headers,
    }).toLowerCase();

    // SQL Injection patterns
    const sqlPatterns = [
      /union\s+select/i,
      /'\s*or\s*'.*'=/i,
      /'\s*and\s*'.*'=/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+.*set/i,
    ];

    // XSS patterns
    const xssPatterns = [
      /<script.*>/i,
      /javascript:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
      /eval\s*\(/i,
      /alert\s*\(/i,
    ];

    // Path traversal patterns
    const pathTraversalPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e%2f/i,
      /%2e%2e%5c/i,
    ];

    if (pattern === 'sql_injection') {
      return sqlPatterns.some(p => p.test(payload));
    } else if (pattern === 'xss') {
      return xssPatterns.some(p => p.test(payload));
    } else if (pattern === 'path_traversal') {
      return pathTraversalPatterns.some(p => p.test(payload));
    } else if (pattern === 'suspicious_user_agent') {
      return /bot|crawler|spider|scanner|curl|wget/i.test(request.userAgent);
    }

    // Custom regex pattern
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(payload);
    } catch {
      return false;
    }
  }

  /**
   * Get request frequency for IP/user in time window
   */
  private async getRequestFrequency(request: RequestFingerprint, timeWindow: number): Promise<number> {
    const key = `${request.ipAddress}:${request.endpoint}`;
    const history = this.requestHistory.get(key) || [];
    const cutoff = new Date(Date.now() - timeWindow * 1000);

    return history.filter(h => h.timestamp > cutoff).length;
  }

  /**
   * Create security threat
   */
  private createThreat(rule: SecurityRule, request: RequestFingerprint, description: string, confidence: number): SecurityThreat {
    const threat: SecurityThreat = {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: rule.type,
      severity: rule.severity,
      confidence,
      timestamp: new Date(),
      source: {
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        userId: request.userId,
        sessionId: request.sessionId,
      },
      target: {
        resource: request.endpoint,
        endpoint: request.endpoint,
        method: request.method,
      },
      description,
      evidence: {
        patterns: rule.conditions.patterns,
        frequency: 1,
        timeWindow: rule.conditions.thresholds.timeWindow,
        relatedEvents: [],
      },
      status: 'detected',
      response: {
        actions: Object.keys(rule.actions).filter(key => rule.actions[key as keyof typeof rule.actions]),
        automated: true,
        manual: false,
      },
    };

    // Store threat
    this.threats.set(threat.id, threat);

    // Log threat
    auditLogger.logSecurityEvent({
      eventType: 'security_threat_detected',
      action: 'detect',
      resource: request.endpoint,
      outcome: 'success',
      userId: request.userId,
      sessionId: request.sessionId,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      severity: rule.severity,
      details: {
        threatId: threat.id,
        threatType: threat.type,
        confidence: threat.confidence,
        description: threat.description,
      },
    });

    return threat;
  }

  /**
   * Detect patterns and anomalies
   */
  private async detectPatterns(request: RequestFingerprint): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    // Detect brute force attacks
    const loginAttempts = await this.getLoginAttempts(request.ipAddress, 300); // 5 minutes
    if (loginAttempts >= 10) {
      threats.push(this.createBruteForceeThreat(request, loginAttempts));
    }

    // Detect DoS patterns
    const requestRate = await this.getRequestFrequency(request, 60); // 1 minute
    if (requestRate >= 100) {
      threats.push(this.createDoSThreat(request, requestRate));
    }

    // Detect data exfiltration
    if (request.endpoint.includes('/export') || request.endpoint.includes('/download')) {
      const exportFrequency = await this.getExportFrequency(request, 3600); // 1 hour
      if (exportFrequency >= 5) {
        threats.push(this.createDataExfiltrationThreat(request, exportFrequency));
      }
    }

    return threats;
  }

  /**
   * Create brute force threat
   */
  private createBruteForceeThreat(request: RequestFingerprint, attempts: number): SecurityThreat {
    return {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'brute_force',
      severity: 'high',
      confidence: 90,
      timestamp: new Date(),
      source: {
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        userId: request.userId,
      },
      target: {
        resource: request.endpoint,
        endpoint: request.endpoint,
        method: request.method,
      },
      description: `Brute force attack detected: ${attempts} login attempts in 5 minutes`,
      evidence: {
        patterns: ['brute_force'],
        frequency: attempts,
        timeWindow: 300,
        relatedEvents: [],
      },
      status: 'detected',
      response: {
        actions: ['block', 'alert'],
        automated: true,
        manual: false,
      },
    };
  }

  /**
   * Create DoS threat
   */
  private createDoSThreat(request: RequestFingerprint, rate: number): SecurityThreat {
    return {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'dos',
      severity: 'critical',
      confidence: 95,
      timestamp: new Date(),
      source: {
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
      },
      target: {
        resource: request.endpoint,
        endpoint: request.endpoint,
        method: request.method,
      },
      description: `DoS attack detected: ${rate} requests per minute`,
      evidence: {
        patterns: ['high_frequency'],
        frequency: rate,
        timeWindow: 60,
        relatedEvents: [],
      },
      status: 'detected',
      response: {
        actions: ['block', 'alert', 'escalate'],
        automated: true,
        manual: false,
      },
    };
  }

  /**
   * Create data exfiltration threat
   */
  private createDataExfiltrationThreat(request: RequestFingerprint, frequency: number): SecurityThreat {
    return {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'data_exfiltration',
      severity: 'high',
      confidence: 80,
      timestamp: new Date(),
      source: {
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        userId: request.userId,
        sessionId: request.sessionId,
      },
      target: {
        resource: request.endpoint,
        endpoint: request.endpoint,
        method: request.method,
      },
      description: `Potential data exfiltration: ${frequency} export requests in 1 hour`,
      evidence: {
        patterns: ['data_export'],
        frequency,
        timeWindow: 3600,
        relatedEvents: [],
      },
      status: 'detected',
      response: {
        actions: ['alert', 'log'],
        automated: true,
        manual: true,
      },
    };
  }

  /**
   * Check rate limits
   */
  private async checkRateLimits(request: RequestFingerprint): Promise<boolean> {
    for (const rule of this.rateLimitRules.values()) {
      if (!rule.enabled) continue;

      // Check if endpoint matches
      if (!rule.endpoints.some(ep => request.endpoint.includes(ep))) continue;

      // Check if method matches
      if (!rule.methods.includes(request.method)) continue;

      // Check exemptions
      if (rule.exemptions.includes(request.ipAddress) ||
          (request.userId && rule.exemptions.includes(request.userId))) {
        continue;
      }

      // Get rate limit key
      let key: string;
      switch (rule.scope) {
        case 'ip':
          key = `rate_limit:${rule.id}:${request.ipAddress}`;
          break;
        case 'user':
          if (!request.userId) continue;
          key = `rate_limit:${rule.id}:${request.userId}`;
          break;
        case 'session':
          if (!request.sessionId) continue;
          key = `rate_limit:${rule.id}:${request.sessionId}`;
          break;
        case 'endpoint':
          key = `rate_limit:${rule.id}:${request.endpoint}`;
          break;
        default:
          continue;
      }

      // Check rate limit
      const count = await this.getRateLimitCount(key, rule.window);
      if (count >= rule.limit) {
        await auditLogger.logSecurityEvent({
          eventType: 'rate_limit_exceeded',
          action: 'rate_limit',
          resource: request.endpoint,
          outcome: 'success',
          userId: request.userId,
          sessionId: request.sessionId,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          severity: 'medium',
          details: {
            rule: rule.name,
            limit: rule.limit,
            window: rule.window,
            count,
          },
        });

        return true;
      }

      // Increment counter
      await this.incrementRateLimitCount(key, rule.window);
    }

    return false;
  }

  /**
   * Store request history
   */
  private storeRequestHistory(request: RequestFingerprint): void {
    const key = `${request.ipAddress}:${request.endpoint}`;
    const history = this.requestHistory.get(key) || [];

    history.push(request);

    // Keep only last 100 requests per key
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    this.requestHistory.set(key, history);
  }

  /**
   * Get login attempts for IP
   */
  private async getLoginAttempts(ipAddress: string, timeWindow: number): Promise<number> {
    // In a real implementation, this would query audit logs
    return Math.floor(Math.random() * 15); // Mock implementation
  }

  /**
   * Get export frequency for user
   */
  private async getExportFrequency(request: RequestFingerprint, timeWindow: number): Promise<number> {
    // In a real implementation, this would query audit logs
    return Math.floor(Math.random() * 8); // Mock implementation
  }

  /**
   * Get rate limit count (mock implementation)
   */
  private async getRateLimitCount(key: string, window: number): Promise<number> {
    // In a real implementation, this would use Redis or similar
    return Math.floor(Math.random() * 50);
  }

  /**
   * Increment rate limit count (mock implementation)
   */
  private async incrementRateLimitCount(key: string, window: number): Promise<void> {
    // In a real implementation, this would use Redis with expiration
  }

  /**
   * Initialize default security rules
   */
  private initializeDefaultRules(): void {
    // SQL Injection rule
    this.rules.set('sql_injection', {
      id: 'sql_injection',
      name: 'SQL Injection Detection',
      enabled: true,
      type: 'sql_injection',
      severity: 'high',
      conditions: {
        patterns: ['sql_injection'],
        thresholds: {
          frequency: 1,
          timeWindow: 60,
        },
      },
      actions: {
        block: true,
        alert: true,
        log: true,
        quarantine: false,
        escalate: true,
      },
    });

    // XSS rule
    this.rules.set('xss', {
      id: 'xss',
      name: 'Cross-Site Scripting Detection',
      enabled: true,
      type: 'xss',
      severity: 'high',
      conditions: {
        patterns: ['xss'],
        thresholds: {
          frequency: 1,
          timeWindow: 60,
        },
      },
      actions: {
        block: true,
        alert: true,
        log: true,
        quarantine: false,
        escalate: true,
      },
    });

    // Brute force rule
    this.rules.set('brute_force', {
      id: 'brute_force',
      name: 'Brute Force Detection',
      enabled: true,
      type: 'brute_force',
      severity: 'high',
      conditions: {
        patterns: ['login', 'auth'],
        thresholds: {
          frequency: 10,
          timeWindow: 300,
        },
        endpoints: ['/auth/login', '/api/auth'],
      },
      actions: {
        block: true,
        alert: true,
        log: true,
        quarantine: true,
        escalate: false,
      },
    });

    // Rate limit rules
    this.rateLimitRules.set('api_general', {
      id: 'api_general',
      name: 'General API Rate Limit',
      enabled: true,
      scope: 'ip',
      limit: 100,
      window: 60,
      endpoints: ['/api/'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      exemptions: [],
    });

    this.rateLimitRules.set('login_attempts', {
      id: 'login_attempts',
      name: 'Login Attempt Rate Limit',
      enabled: true,
      scope: 'ip',
      limit: 5,
      window: 300,
      endpoints: ['/auth/login'],
      methods: ['POST'],
      exemptions: [],
    });
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000); // Cleanup every hour
  }

  /**
   * Cleanup old data
   */
  private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    // Cleanup request history
    for (const [key, history] of this.requestHistory.entries()) {
      const filtered = history.filter(h => h.timestamp > cutoff);
      if (filtered.length === 0) {
        this.requestHistory.delete(key);
      } else {
        this.requestHistory.set(key, filtered);
      }
    }

    // Cleanup old threats
    for (const [id, threat] of this.threats.entries()) {
      if (threat.timestamp < cutoff && threat.status === 'mitigated') {
        this.threats.delete(id);
      }
    }
  }

  /**
   * Get active threats
   */
  getActiveThreats(): SecurityThreat[] {
    return Array.from(this.threats.values())
      .filter(t => t.status !== 'mitigated' && t.status !== 'false_positive')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Update threat status
   */
  updateThreatStatus(threatId: string, status: SecurityThreat['status']): boolean {
    const threat = this.threats.get(threatId);
    if (!threat) return false;

    threat.status = status;
    this.threats.set(threatId, threat);

    return true;
  }

  /**
   * Unblock IP address
   */
  unblockIP(ipAddress: string): boolean {
    return this.blockedIPs.delete(ipAddress);
  }

  /**
   * Unquarantine session
   */
  unquarantineSession(sessionId: string): boolean {
    return this.quarantinedSessions.delete(sessionId);
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): {
    threatsDetected: number;
    activeThreats: number;
    blockedIPs: number;
    quarantinedSessions: number;
    topThreatTypes: Array<{ type: string; count: number }>;
  } {
    const threats = Array.from(this.threats.values());
    const activeThreats = threats.filter(t => t.status !== 'mitigated' && t.status !== 'false_positive');

    const threatTypeCounts: Record<string, number> = {};
    for (const threat of threats) {
      threatTypeCounts[threat.type] = (threatTypeCounts[threat.type] || 0) + 1;
    }

    const topThreatTypes = Object.entries(threatTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      threatsDetected: threats.length,
      activeThreats: activeThreats.length,
      blockedIPs: this.blockedIPs.size,
      quarantinedSessions: this.quarantinedSessions.size,
      topThreatTypes,
    };
  }
}

// Export singleton instance
export const intrusionDetectionService = new IntrusionDetectionService();
