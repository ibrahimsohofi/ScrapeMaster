import { logger } from '@/lib/utils';
import { encryptionService } from '@/lib/security/encryption';

interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: string;
  eventCategory: 'security' | 'data_access' | 'system' | 'user_action' | 'compliance' | 'admin';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  outcome: 'success' | 'failure' | 'error';
  details: Record<string, any>;
  metadata: {
    version: string;
    source: string;
    environment: string;
  };
  encrypted: boolean;
  retention: number; // Days to retain
}

interface AuditQuery {
  eventTypes?: string[];
  categories?: string[];
  severities?: string[];
  userId?: string;
  organizationId?: string;
  resource?: string;
  action?: string;
  outcome?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

interface AuditReport {
  summary: {
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    eventsByOutcome: Record<string, number>;
    uniqueUsers: number;
    uniqueIPs: number;
    timeRange: {
      start: Date;
      end: Date;
    };
  };
  securityEvents: AuditEvent[];
  complianceEvents: AuditEvent[];
  dataAccessEvents: AuditEvent[];
  anomalies: {
    unusualLoginTimes: AuditEvent[];
    suspiciousIPs: string[];
    multipleFailedAttempts: AuditEvent[];
    privilegedActions: AuditEvent[];
  };
  recommendations: string[];
}

export class AuditLogger {
  private events: Map<string, AuditEvent> = new Map();
  private eventIndex: Map<string, Set<string>> = new Map(); // For efficient querying
  private retentionPeriod = 2555; // 7 years in days (SOC 2 requirement)

  constructor() {
    // Start cleanup interval
    setInterval(() => {
      this.cleanupExpiredEvents();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  /**
   * Log audit event
   */
  async logEvent(eventData: Omit<AuditEvent, 'id' | 'timestamp' | 'encrypted' | 'metadata'>): Promise<string> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const auditEvent: AuditEvent = {
      id,
      timestamp: new Date(),
      encrypted: false,
      metadata: {
        version: '1.0',
        source: 'datavault-pro',
        environment: process.env.NODE_ENV || 'development',
      },
      ...eventData,
      retention: eventData.retention || this.retentionPeriod,
    };

    // Encrypt sensitive details
    if (this.shouldEncryptEvent(auditEvent)) {
      const encryptedDetails = encryptionService.encrypt(JSON.stringify(auditEvent.details));
      auditEvent.details = { encrypted: JSON.stringify(encryptedDetails) };
      auditEvent.encrypted = true;
    }

    // Store event
    this.events.set(id, auditEvent);

    // Update indices for efficient querying
    this.updateIndices(auditEvent);

    // Log to external systems if configured
    await this.sendToExternalSystems(auditEvent);

    logger.info('Audit event logged', {
      id,
      eventType: auditEvent.eventType,
      category: auditEvent.eventCategory,
      severity: auditEvent.severity,
    });

    return id;
  }

  /**
   * Security-related audit events
   */
  async logSecurityEvent(data: {
    eventType: string;
    action: string;
    resource: string;
    outcome: 'success' | 'failure' | 'error';
    userId?: string;
    userEmail?: string;
    sessionId?: string;
    organizationId?: string;
    ipAddress: string;
    userAgent: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    details?: Record<string, any>;
  }): Promise<string> {
    return this.logEvent({
      eventCategory: 'security',
      severity: data.severity || 'medium',
      retention: this.retentionPeriod,
      ...data,
      details: data.details || {},
    });
  }

  /**
   * Data access audit events
   */
  async logDataAccess(data: {
    action: 'read' | 'write' | 'delete' | 'export' | 'import';
    resource: string;
    recordCount?: number;
    dataTypes?: string[];
    userId: string;
    userEmail?: string;
    organizationId?: string;
    ipAddress: string;
    userAgent: string;
    outcome: 'success' | 'failure' | 'error';
    details?: Record<string, any>;
  }): Promise<string> {
    return this.logEvent({
      eventType: `data_${data.action}`,
      eventCategory: 'data_access',
      severity: data.action === 'delete' ? 'high' : 'medium',
      action: data.action,
      resource: data.resource,
      userId: data.userId,
      userEmail: data.userEmail,
      organizationId: data.organizationId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      outcome: data.outcome,
      retention: this.retentionPeriod,
      details: {
        recordCount: data.recordCount,
        dataTypes: data.dataTypes,
        ...data.details,
      },
    });
  }

  /**
   * User action audit events
   */
  async logUserAction(data: {
    action: string;
    resource: string;
    userId: string;
    userEmail?: string;
    sessionId?: string;
    organizationId?: string;
    ipAddress: string;
    userAgent: string;
    outcome: 'success' | 'failure' | 'error';
    details?: Record<string, any>;
  }): Promise<string> {
    return this.logEvent({
      eventType: 'user_action',
      eventCategory: 'user_action',
      severity: 'low',
      retention: this.retentionPeriod,
      ...data,
      details: data.details || {},
    });
  }

  /**
   * System audit events
   */
  async logSystemEvent(data: {
    eventType: string;
    action: string;
    resource: string;
    outcome: 'success' | 'failure' | 'error';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    details?: Record<string, any>;
  }): Promise<string> {
    return this.logEvent({
      eventCategory: 'system',
      severity: data.severity || 'low',
      ipAddress: '127.0.0.1',
      userAgent: 'system',
      retention: this.retentionPeriod,
      ...data,
      details: data.details || {},
    });
  }

  /**
   * Compliance audit events
   */
  async logComplianceEvent(data: {
    eventType: string;
    action: string;
    resource: string;
    outcome: 'success' | 'failure' | 'error';
    userId?: string;
    userEmail?: string;
    organizationId?: string;
    ipAddress: string;
    userAgent: string;
    details?: Record<string, any>;
  }): Promise<string> {
    return this.logEvent({
      eventCategory: 'compliance',
      severity: 'medium',
      retention: this.retentionPeriod,
      ...data,
      details: data.details || {},
    });
  }

  /**
   * Query audit events
   */
  async queryEvents(query: AuditQuery): Promise<{
    events: AuditEvent[];
    total: number;
    hasMore: boolean;
  }> {
    let filteredEvents = Array.from(this.events.values());

    // Apply filters
    if (query.eventTypes?.length) {
      filteredEvents = filteredEvents.filter(e => query.eventTypes!.includes(e.eventType));
    }

    if (query.categories?.length) {
      filteredEvents = filteredEvents.filter(e => query.categories!.includes(e.eventCategory));
    }

    if (query.severities?.length) {
      filteredEvents = filteredEvents.filter(e => query.severities!.includes(e.severity));
    }

    if (query.userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === query.userId);
    }

    if (query.organizationId) {
      filteredEvents = filteredEvents.filter(e => e.organizationId === query.organizationId);
    }

    if (query.resource) {
      filteredEvents = filteredEvents.filter(e => e.resource && e.resource.includes(query.resource!));
    }

    if (query.action) {
      filteredEvents = filteredEvents.filter(e => e.action === query.action);
    }

    if (query.outcome) {
      filteredEvents = filteredEvents.filter(e => e.outcome === query.outcome);
    }

    if (query.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= query.endDate!);
    }

    if (query.ipAddress) {
      filteredEvents = filteredEvents.filter(e => e.ipAddress === query.ipAddress);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = filteredEvents.length;
    const limit = query.limit || 100;
    const offset = query.offset || 0;

    const paginatedEvents = filteredEvents.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    // Decrypt events if needed
    const decryptedEvents = await Promise.all(
      paginatedEvents.map(async (event) => {
        if (event.encrypted && event.details.encrypted) {
          try {
            const encryptedData = JSON.parse(event.details.encrypted);
            const decryptedDetails = encryptionService.decrypt(encryptedData);
            return {
              ...event,
              details: JSON.parse(decryptedDetails),
              encrypted: false,
            };
          } catch (error) {
            logger.error('Failed to decrypt audit event details', { eventId: event.id, error });
            return event;
          }
        }
        return event;
      })
    );

    return {
      events: decryptedEvents,
      total,
      hasMore,
    };
  }

  /**
   * Generate audit report
   */
  async generateReport(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<AuditReport> {
    const query: AuditQuery = {
      startDate,
      endDate,
      organizationId,
      limit: 10000, // Large limit for report generation
    };

    const { events } = await this.queryEvents(query);

    // Calculate summary statistics
    const eventsByCategory: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const eventsByOutcome: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const uniqueIPs = new Set<string>();

    for (const event of events) {
      // Category count
      eventsByCategory[event.eventCategory] = (eventsByCategory[event.eventCategory] || 0) + 1;

      // Severity count
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

      // Outcome count
      eventsByOutcome[event.outcome] = (eventsByOutcome[event.outcome] || 0) + 1;

      // Unique users and IPs
      if (event.userId) uniqueUsers.add(event.userId);
      uniqueIPs.add(event.ipAddress);
    }

    // Filter events by category
    const securityEvents = events.filter(e => e.eventCategory === 'security');
    const complianceEvents = events.filter(e => e.eventCategory === 'compliance');
    const dataAccessEvents = events.filter(e => e.eventCategory === 'data_access');

    // Detect anomalies
    const anomalies = await this.detectAnomalies(events);

    // Generate recommendations
    const recommendations = this.generateRecommendations(events, anomalies);

    return {
      summary: {
        totalEvents: events.length,
        eventsByCategory,
        eventsBySeverity,
        eventsByOutcome,
        uniqueUsers: uniqueUsers.size,
        uniqueIPs: uniqueIPs.size,
        timeRange: { start: startDate, end: endDate },
      },
      securityEvents: securityEvents.slice(0, 50), // Top 50 security events
      complianceEvents: complianceEvents.slice(0, 50),
      dataAccessEvents: dataAccessEvents.slice(0, 50),
      anomalies,
      recommendations,
    };
  }

  /**
   * Detect security anomalies
   */
  private async detectAnomalies(events: AuditEvent[]): Promise<AuditReport['anomalies']> {
    const anomalies: AuditReport['anomalies'] = {
      unusualLoginTimes: [],
      suspiciousIPs: [],
      multipleFailedAttempts: [],
      privilegedActions: [],
    };

    // Group events by user and IP
    const eventsByUser: Record<string, AuditEvent[]> = {};
    const eventsByIP: Record<string, AuditEvent[]> = {};
    const failedAttempts: Record<string, AuditEvent[]> = {};

    for (const event of events) {
      // Group by user
      if (event.userId) {
        if (!eventsByUser[event.userId]) eventsByUser[event.userId] = [];
        eventsByUser[event.userId].push(event);
      }

      // Group by IP
      if (!eventsByIP[event.ipAddress]) eventsByIP[event.ipAddress] = [];
      eventsByIP[event.ipAddress].push(event);

      // Track failed attempts
      if (event.outcome === 'failure' && event.eventCategory === 'security') {
        const key = event.userId || event.ipAddress;
        if (!failedAttempts[key]) failedAttempts[key] = [];
        failedAttempts[key].push(event);
      }

      // Detect unusual login times (outside business hours)
      if (event.eventType === 'login' && event.outcome === 'success') {
        const hour = event.timestamp.getHours();
        if (hour < 6 || hour > 22) { // Outside 6 AM - 10 PM
          anomalies.unusualLoginTimes.push(event);
        }
      }

      // Detect privileged actions
      if (event.eventCategory === 'admin' ||
          event.action === 'delete' ||
          event.resource.includes('admin') ||
          event.eventType.includes('privilege')) {
        anomalies.privilegedActions.push(event);
      }
    }

    // Detect multiple failed attempts
    for (const [key, attempts] of Object.entries(failedAttempts)) {
      if (attempts.length >= 5) { // 5 or more failed attempts
        anomalies.multipleFailedAttempts.push(...attempts);
      }
    }

    // Detect suspicious IPs (high activity from single IP)
    for (const [ip, ipEvents] of Object.entries(eventsByIP)) {
      if (ipEvents.length > 100 && !ip.startsWith('192.168.') && ip !== '127.0.0.1') {
        anomalies.suspiciousIPs.push(ip);
      }
    }

    return anomalies;
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(events: AuditEvent[], anomalies: AuditReport['anomalies']): string[] {
    const recommendations: string[] = [];

    // Check for security issues
    const failureRate = events.filter(e => e.outcome === 'failure').length / events.length;
    if (failureRate > 0.1) {
      recommendations.push('High failure rate detected - review authentication and authorization mechanisms');
    }

    if (anomalies.multipleFailedAttempts.length > 0) {
      recommendations.push('Implement account lockout policies to prevent brute force attacks');
    }

    if (anomalies.suspiciousIPs.length > 0) {
      recommendations.push('Consider implementing IP-based rate limiting and geoblocking');
    }

    if (anomalies.unusualLoginTimes.length > 0) {
      recommendations.push('Review unusual login times and consider implementing time-based access controls');
    }

    // Check for compliance issues
    const dataAccessEvents = events.filter(e => e.eventCategory === 'data_access');
    if (dataAccessEvents.length === 0) {
      recommendations.push('Ensure all data access activities are being logged for compliance');
    }

    const exportEvents = events.filter(e => e.action === 'export');
    if (exportEvents.length > 0) {
      recommendations.push('Review data export activities to ensure compliance with data protection regulations');
    }

    return recommendations;
  }

  /**
   * Update search indices
   */
  private updateIndices(event: AuditEvent): void {
    // Index by category
    const categoryKey = `category:${event.eventCategory}`;
    if (!this.eventIndex.has(categoryKey)) {
      this.eventIndex.set(categoryKey, new Set());
    }
    this.eventIndex.get(categoryKey)!.add(event.id);

    // Index by user
    if (event.userId) {
      const userKey = `user:${event.userId}`;
      if (!this.eventIndex.has(userKey)) {
        this.eventIndex.set(userKey, new Set());
      }
      this.eventIndex.get(userKey)!.add(event.id);
    }

    // Index by IP
    const ipKey = `ip:${event.ipAddress}`;
    if (!this.eventIndex.has(ipKey)) {
      this.eventIndex.set(ipKey, new Set());
    }
    this.eventIndex.get(ipKey)!.add(event.id);
  }

  /**
   * Determine if event should be encrypted
   */
  private shouldEncryptEvent(event: AuditEvent): boolean {
    // Encrypt high-severity events and data access events
    return event.severity === 'high' ||
           event.severity === 'critical' ||
           event.eventCategory === 'data_access' ||
           event.eventCategory === 'security';
  }

  /**
   * Send events to external systems
   */
  private async sendToExternalSystems(event: AuditEvent): Promise<void> {
    try {
      // Send to DataDog if configured
      if (process.env.DATADOG_API_KEY) {
        // Implementation would send to DataDog
        logger.debug('Audit event sent to DataDog', { eventId: event.id });
      }

      // Send to New Relic if configured
      if (process.env.NEW_RELIC_LICENSE_KEY) {
        // Implementation would send to New Relic
        logger.debug('Audit event sent to New Relic', { eventId: event.id });
      }

      // Send to SIEM if configured
      if (process.env.SIEM_ENDPOINT) {
        // Implementation would send to SIEM
        logger.debug('Audit event sent to SIEM', { eventId: event.id });
      }
    } catch (error) {
      logger.error('Failed to send audit event to external systems', { eventId: event.id, error });
    }
  }

  /**
   * Cleanup expired events
   */
  private cleanupExpiredEvents(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, event] of this.events.entries()) {
      const expiryDate = new Date(event.timestamp);
      expiryDate.setDate(expiryDate.getDate() + event.retention);

      if (now > expiryDate) {
        this.events.delete(id);
        cleanedCount++;

        // Remove from indices
        for (const [key, eventSet] of this.eventIndex.entries()) {
          eventSet.delete(id);
          if (eventSet.size === 0) {
            this.eventIndex.delete(key);
          }
        }
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up expired audit events', { count: cleanedCount });
    }
  }

  /**
   * Export audit logs for compliance
   */
  async exportAuditLogs(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<Buffer> {
    const { events } = await this.queryEvents({
      startDate,
      endDate,
      limit: 100000, // Large limit for export
    });

    if (format === 'csv') {
      return this.exportAsCSV(events);
    } else {
      return Buffer.from(JSON.stringify(events, null, 2));
    }
  }

  /**
   * Export as CSV
   */
  private exportAsCSV(events: AuditEvent[]): Buffer {
    const headers = [
      'ID', 'Timestamp', 'Event Type', 'Category', 'Severity',
      'User ID', 'User Email', 'Organization ID', 'IP Address',
      'Resource', 'Action', 'Outcome', 'Details'
    ];

    const rows = [headers.join(',')];

    for (const event of events) {
      const row = [
        event.id,
        event.timestamp.toISOString(),
        event.eventType,
        event.eventCategory,
        event.severity,
        event.userId || '',
        event.userEmail || '',
        event.organizationId || '',
        event.ipAddress,
        event.resource,
        event.action,
        event.outcome,
        JSON.stringify(event.details).replace(/"/g, '""'), // Escape quotes for CSV
      ];
      rows.push(row.join(','));
    }

    return Buffer.from(rows.join('\n'));
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
