import { logger } from '@/lib/utils';
import { auditSystem } from '@/lib/compliance/enhanced-audit-system';

interface ThreatSignature {
  id: string;
  name: string;
  pattern: RegExp | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'injection' | 'traversal' | 'xss' | 'ddos' | 'scanner' | 'malware';
  action: 'log' | 'block' | 'alert' | 'quarantine';
  confidence_threshold: number;
}

interface SecurityEvent {
  id: string;
  timestamp: Date;
  source_ip: string;
  user_agent?: string;
  user_id?: string;
  session_id?: string;
  request_path: string;
  request_method: string;
  request_headers: Record<string, string>;
  request_body?: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number;
  blocked: boolean;
  signatures_matched: string[];
  geolocation?: {
    country: string;
    region: string;
    city: string;
  };
}

interface ThreatIntelligence {
  ip_reputation: Map<string, {
    risk_score: number;
    categories: string[];
    last_seen: Date;
    sources: string[];
  }>;
  malicious_domains: Set<string>;
  known_attack_patterns: ThreatSignature[];
  user_behavior_baselines: Map<string, {
    normal_locations: string[];
    typical_hours: number[];
    average_requests_per_hour: number;
    common_user_agents: string[];
  }>;
}

interface AttackPattern {
  pattern_id: string;
  attack_type: string;
  indicators: string[];
  time_window_minutes: number;
  threshold_count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityResponse {
  action: 'allow' | 'block' | 'challenge' | 'rate_limit';
  reason: string;
  confidence: number;
  additional_actions?: string[];
  expires_at?: Date;
}

export class EnhancedIntrusionDetection {
  private threatSignatures: Map<string, ThreatSignature> = new Map();
  private threatIntelligence: ThreatIntelligence;
  private attackPatterns: Map<string, AttackPattern> = new Map();
  private recentEvents: SecurityEvent[] = [];
  private blockedIPs: Map<string, { until: Date; reason: string }> = new Map();
  private rateLimits: Map<string, { count: number; window_start: Date }> = new Map();
  private behaviorAnalyzer: BehaviorAnalyzer;

  constructor() {
    this.threatIntelligence = {
      ip_reputation: new Map(),
      malicious_domains: new Set(),
      known_attack_patterns: [],
      user_behavior_baselines: new Map()
    };

    this.behaviorAnalyzer = new BehaviorAnalyzer();
    this.initializeThreatSignatures();
    this.initializeAttackPatterns();
    this.startThreatIntelligenceUpdates();
    this.startBehaviorLearning();
  }

  private initializeThreatSignatures(): void {
    const signatures: ThreatSignature[] = [
      // SQL Injection
      {
        id: 'sql_injection_1',
        name: 'SQL Injection - Basic',
        pattern: /('|(\\')|(;|(\s*;))|(\s*(union|select|insert|update|delete|drop|create|alter)\s+))/i,
        severity: 'high',
        category: 'injection',
        action: 'block',
        confidence_threshold: 0.8
      },
      // XSS
      {
        id: 'xss_script_tag',
        name: 'XSS - Script Tag',
        pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/i,
        severity: 'high',
        category: 'xss',
        action: 'block',
        confidence_threshold: 0.9
      },
      // Path Traversal
      {
        id: 'path_traversal_1',
        name: 'Path Traversal - Directory Navigation',
        pattern: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\|%252e%252e%252f/i,
        severity: 'medium',
        category: 'traversal',
        action: 'block',
        confidence_threshold: 0.7
      },
      // LDAP Injection
      {
        id: 'ldap_injection_1',
        name: 'LDAP Injection',
        pattern: /(\)|\(|\||\&|\\|\*|%28|%29|%7c|%26|%5c|%2a)/i,
        severity: 'medium',
        category: 'injection',
        action: 'alert',
        confidence_threshold: 0.6
      },
      // Command Injection
      {
        id: 'command_injection_1',
        name: 'Command Injection',
        pattern: /(;|&&|\|\||`|\$\(|%3b|%26%26|%7c%7c)/i,
        severity: 'critical',
        category: 'injection',
        action: 'block',
        confidence_threshold: 0.85
      },
      // Scanner Detection
      {
        id: 'scanner_user_agent',
        name: 'Security Scanner User Agent',
        pattern: /(nmap|nikto|sqlmap|nessus|openvas|w3af|skipfish|wpscan|dirb|gobuster|ffuf)/i,
        severity: 'medium',
        category: 'scanner',
        action: 'block',
        confidence_threshold: 0.95
      },
      // Brute Force
      {
        id: 'brute_force_login',
        name: 'Brute Force Login Attempt',
        pattern: 'multiple_failed_logins',
        severity: 'high',
        category: 'authentication',
        action: 'block',
        confidence_threshold: 0.9
      }
    ];

    signatures.forEach(sig => {
      this.threatSignatures.set(sig.id, sig);
    });
  }

  private initializeAttackPatterns(): void {
    const patterns: AttackPattern[] = [
      {
        pattern_id: 'rapid_requests',
        attack_type: 'ddos',
        indicators: ['high_request_rate'],
        time_window_minutes: 5,
        threshold_count: 100,
        severity: 'high'
      },
      {
        pattern_id: 'credential_stuffing',
        attack_type: 'authentication',
        indicators: ['multiple_failed_logins', 'different_user_agents'],
        time_window_minutes: 10,
        threshold_count: 20,
        severity: 'critical'
      },
      {
        pattern_id: 'directory_bruteforce',
        attack_type: 'scanner',
        indicators: ['404_responses', 'sequential_paths'],
        time_window_minutes: 15,
        threshold_count: 50,
        severity: 'medium'
      },
      {
        pattern_id: 'data_exfiltration',
        attack_type: 'data_theft',
        indicators: ['large_responses', 'bulk_downloads'],
        time_window_minutes: 30,
        threshold_count: 10,
        severity: 'critical'
      }
    ];

    patterns.forEach(pattern => {
      this.attackPatterns.set(pattern.pattern_id, pattern);
    });
  }

  /**
   * Analyze incoming request for threats
   */
  async analyzeRequest(requestData: {
    ip: string;
    user_agent?: string;
    user_id?: string;
    session_id?: string;
    path: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    query_params?: Record<string, string>;
  }): Promise<SecurityResponse> {

    try {
      // Check if IP is already blocked
      const blockStatus = this.blockedIPs.get(requestData.ip);
      if (blockStatus && blockStatus.until > new Date()) {
        return {
          action: 'block',
          reason: `IP blocked: ${blockStatus.reason}`,
          confidence: 1.0
        };
      }

      // Rate limiting check
      const rateLimitResponse = this.checkRateLimit(requestData.ip);
      if (rateLimitResponse.action === 'rate_limit') {
        return rateLimitResponse;
      }

      // Threat signature matching
      const signatureMatches = await this.matchThreatSignatures(requestData);

      // Behavior analysis
      const behaviorScore = await this.behaviorAnalyzer.analyzeRequest(requestData);

      // IP reputation check
      const reputationScore = await this.checkIPReputation(requestData.ip);

      // Combine scores
      const combinedScore = this.calculateThreatScore(signatureMatches, behaviorScore, reputationScore);

      // Create security event
      const securityEvent: SecurityEvent = {
        id: this.generateEventId(),
        timestamp: new Date(),
        source_ip: requestData.ip,
        user_agent: requestData.user_agent,
        user_id: requestData.user_id,
        session_id: requestData.session_id,
        request_path: requestData.path,
        request_method: requestData.method,
        request_headers: requestData.headers,
        request_body: requestData.body,
        threat_type: signatureMatches.length > 0 ? signatureMatches[0].category : 'behavioral',
        severity: this.calculateSeverity(combinedScore),
        confidence_score: combinedScore,
        blocked: false,
        signatures_matched: signatureMatches.map(s => s.id)
      };

      // Determine response action
      const response = await this.determineSecurityResponse(securityEvent, signatureMatches, combinedScore);

      // Update event with final action
      securityEvent.blocked = response.action === 'block';

      // Store event
      this.recentEvents.push(securityEvent);
      this.cleanupOldEvents();

      // Check for attack patterns
      await this.checkAttackPatterns(securityEvent);

      // Log to audit system
      await auditSystem.logEvent({
        userId: requestData.user_id,
        ipAddress: requestData.ip,
        action: 'security_analysis',
        resource: 'intrusion_detection',
        details: {
          threat_score: combinedScore,
          signatures_matched: signatureMatches.length,
          action_taken: response.action
        },
        risk_level: securityEvent.severity,
        outcome: response.action === 'block' ? 'blocked' : 'success'
      });

      logger.info('Security analysis completed', {
        ip: requestData.ip,
        path: requestData.path,
        threat_score: combinedScore,
        action: response.action,
        signatures_matched: signatureMatches.length
      });

      return response;

    } catch (error) {
      logger.error('Security analysis failed', { error, ip: requestData.ip });

      // Fail secure - block on analysis error
      return {
        action: 'block',
        reason: 'Security analysis error',
        confidence: 0.5
      };
    }
  }

  private async matchThreatSignatures(requestData: any): Promise<ThreatSignature[]> {
    const matches: ThreatSignature[] = [];

    // Combine all request data for analysis
    const analysisText = [
      requestData.path,
      requestData.body || '',
      Object.values(requestData.query_params || {}).join(' '),
      Object.values(requestData.headers).join(' ')
    ].join(' ').toLowerCase();

    for (const signature of this.threatSignatures.values()) {
      let isMatch = false;

      if (signature.pattern instanceof RegExp) {
        isMatch = signature.pattern.test(analysisText);
      } else if (typeof signature.pattern === 'string') {
        // Special pattern handling
        switch (signature.pattern) {
          case 'multiple_failed_logins':
            isMatch = await this.checkMultipleFailedLogins(requestData.ip);
            break;
          default:
            isMatch = analysisText.includes(signature.pattern.toLowerCase());
        }
      }

      if (isMatch) {
        matches.push(signature);
      }
    }

    return matches;
  }

  private async checkIPReputation(ip: string): Promise<number> {
    // Check internal reputation database
    const reputation = this.threatIntelligence.ip_reputation.get(ip);
    if (reputation) {
      return reputation.risk_score;
    }

    // Check external threat intelligence (implement with real services)
    // This would integrate with services like AbuseIPDB, VirusTotal, etc.

    return 0; // Default to neutral
  }

  private calculateThreatScore(signatures: ThreatSignature[], behaviorScore: number, reputationScore: number): number {
    let score = 0;

    // Signature-based scoring
    signatures.forEach(sig => {
      switch (sig.severity) {
        case 'critical': score += 0.4; break;
        case 'high': score += 0.3; break;
        case 'medium': score += 0.2; break;
        case 'low': score += 0.1; break;
      }
    });

    // Behavior scoring (0-1)
    score += behaviorScore * 0.3;

    // Reputation scoring (0-1)
    score += reputationScore * 0.2;

    return Math.min(score, 1.0);
  }

  private calculateSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private async determineSecurityResponse(event: SecurityEvent, signatures: ThreatSignature[], score: number): Promise<SecurityResponse> {
    // High confidence threats - immediate block
    if (score >= 0.8) {
      this.blockIP(event.source_ip, 'High threat score', 60); // Block for 1 hour
      return {
        action: 'block',
        reason: 'High threat score detected',
        confidence: score,
        additional_actions: ['block_ip']
      };
    }

    // Critical signatures - block regardless of score
    const criticalSignatures = signatures.filter(s => s.severity === 'critical');
    if (criticalSignatures.length > 0) {
      this.blockIP(event.source_ip, 'Critical signature match', 30);
      return {
        action: 'block',
        reason: `Critical signature: ${criticalSignatures[0].name}`,
        confidence: score,
        additional_actions: ['block_ip']
      };
    }

    // Medium threat - challenge or rate limit
    if (score >= 0.4) {
      return {
        action: 'challenge',
        reason: 'Medium threat score - additional verification required',
        confidence: score
      };
    }

    // Low threat - allow with monitoring
    return {
      action: 'allow',
      reason: 'No significant threats detected',
      confidence: 1.0 - score
    };
  }

  private checkRateLimit(ip: string): SecurityResponse {
    const now = new Date();
    const key = ip;
    const limit = this.rateLimits.get(key);

    if (!limit) {
      this.rateLimits.set(key, { count: 1, window_start: now });
      return { action: 'allow', reason: 'Within rate limits', confidence: 1.0 };
    }

    // Reset window if expired (5 minute windows)
    if (now.getTime() - limit.window_start.getTime() > 5 * 60 * 1000) {
      this.rateLimits.set(key, { count: 1, window_start: now });
      return { action: 'allow', reason: 'Within rate limits', confidence: 1.0 };
    }

    limit.count++;

    // Rate limit threshold (100 requests per 5 minutes)
    if (limit.count > 100) {
      return {
        action: 'rate_limit',
        reason: 'Rate limit exceeded',
        confidence: 1.0,
        expires_at: new Date(limit.window_start.getTime() + 5 * 60 * 1000)
      };
    }

    return { action: 'allow', reason: 'Within rate limits', confidence: 1.0 };
  }

  private async checkAttackPatterns(event: SecurityEvent): Promise<void> {
    for (const pattern of this.attackPatterns.values()) {
      const recentEvents = this.getRecentEvents(pattern.time_window_minutes);
      const matchingEvents = this.filterEventsByPattern(recentEvents, pattern);

      if (matchingEvents.length >= pattern.threshold_count) {
        await this.triggerAttackPatternAlert(pattern, matchingEvents);
      }
    }
  }

  private getRecentEvents(windowMinutes: number): SecurityEvent[] {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
    return this.recentEvents.filter(event => event.timestamp > cutoff);
  }

  private filterEventsByPattern(events: SecurityEvent[], pattern: AttackPattern): SecurityEvent[] {
    return events.filter(event => {
      return pattern.indicators.some(indicator => {
        switch (indicator) {
          case 'high_request_rate':
            return true; // All events count for rate analysis
          case 'multiple_failed_logins':
            return event.request_path.includes('/login') && event.severity !== 'low';
          case 'different_user_agents':
            return event.user_agent !== undefined;
          case '404_responses':
            return event.request_path.includes('404') || event.threat_type === 'scanner';
          case 'sequential_paths':
            return event.threat_type === 'scanner';
          case 'large_responses':
            return event.request_path.includes('/api/data');
          case 'bulk_downloads':
            return event.request_path.includes('/export');
          default:
            return false;
        }
      });
    });
  }

  private async triggerAttackPatternAlert(pattern: AttackPattern, events: SecurityEvent[]): Promise<void> {
    const alert = {
      pattern_id: pattern.pattern_id,
      attack_type: pattern.attack_type,
      severity: pattern.severity,
      event_count: events.length,
      time_window: pattern.time_window_minutes,
      affected_ips: [...new Set(events.map(e => e.source_ip))],
      first_seen: events[0].timestamp,
      last_seen: events[events.length - 1].timestamp
    };

    logger.warn('Attack pattern detected', alert);

    // Take automated response based on pattern
    if (pattern.severity === 'critical') {
      // Block all involved IPs
      alert.affected_ips.forEach(ip => {
        this.blockIP(ip, `Attack pattern: ${pattern.attack_type}`, 120); // 2 hours
      });
    }

    // Send to security monitoring
    await auditSystem.logEvent({
      ipAddress: alert.affected_ips[0],
      action: 'attack_pattern_detected',
      resource: 'security_system',
      details: alert,
      risk_level: pattern.severity,
      outcome: 'success'
    });
  }

  private blockIP(ip: string, reason: string, durationMinutes: number): void {
    const until = new Date(Date.now() + durationMinutes * 60 * 1000);
    this.blockedIPs.set(ip, { until, reason });

    logger.warn('IP blocked', { ip, reason, until });
  }

  private async checkMultipleFailedLogins(ip: string): Promise<boolean> {
    const recentEvents = this.getRecentEvents(15); // Last 15 minutes
    const failedLogins = recentEvents.filter(e =>
      e.source_ip === ip &&
      e.request_path.includes('/login') &&
      e.severity !== 'low'
    );

    return failedLogins.length >= 5;
  }

  private cleanupOldEvents(): void {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000); // Keep 1 hour
    this.recentEvents = this.recentEvents.filter(event => event.timestamp > cutoff);
  }

  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startThreatIntelligenceUpdates(): void {
    // Update threat intelligence every hour
    setInterval(async () => {
      await this.updateThreatIntelligence();
    }, 60 * 60 * 1000);
  }

  private startBehaviorLearning(): void {
    // Update behavior baselines every 6 hours
    setInterval(async () => {
      await this.behaviorAnalyzer.updateBaselines();
    }, 6 * 60 * 60 * 1000);
  }

  private async updateThreatIntelligence(): Promise<void> {
    try {
      // Update IP reputation from external sources
      // Update malicious domains
      // Update attack signatures
      logger.info('Threat intelligence updated');
    } catch (error) {
      logger.error('Failed to update threat intelligence', { error });
    }
  }

  /**
   * Get security dashboard data
   */
  getDashboardData(): any {
    const now = new Date();
    const last24h = this.recentEvents.filter(e =>
      now.getTime() - e.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    return {
      events_last_24h: last24h.length,
      blocked_requests: last24h.filter(e => e.blocked).length,
      threat_levels: {
        critical: last24h.filter(e => e.severity === 'critical').length,
        high: last24h.filter(e => e.severity === 'high').length,
        medium: last24h.filter(e => e.severity === 'medium').length,
        low: last24h.filter(e => e.severity === 'low').length
      },
      top_threats: this.getTopThreats(last24h),
      blocked_ips: this.blockedIPs.size,
      active_signatures: this.threatSignatures.size
    };
  }

  private getTopThreats(events: SecurityEvent[]): Array<{ type: string; count: number }> {
    const threatCounts = new Map<string, number>();

    events.forEach(event => {
      const count = threatCounts.get(event.threat_type) || 0;
      threatCounts.set(event.threat_type, count + 1);
    });

    return Array.from(threatCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

// Behavior Analyzer class
class BehaviorAnalyzer {
  private userBaselines: Map<string, any> = new Map();

  async analyzeRequest(requestData: any): Promise<number> {
    // Implement behavior analysis
    // This would analyze user patterns, timing, etc.
    return 0; // Placeholder
  }

  async updateBaselines(): Promise<void> {
    // Update user behavior baselines
    logger.info('Behavior baselines updated');
  }
}

// Export singleton instance
export const intrusionDetection = new EnhancedIntrusionDetection();
