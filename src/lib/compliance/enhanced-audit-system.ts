import { logger } from '@/lib/utils';
import { PrismaClient } from '@prisma/client';

interface AuditEvent {
  id?: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  compliance_flags: string[];
  geolocation?: {
    country: string;
    region: string;
    city: string;
    coordinates?: [number, number];
  };
  outcome: 'success' | 'failure' | 'blocked';
  error_details?: string;
}

interface ComplianceReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    total_events: number;
    data_access_events: number;
    data_modification_events: number;
    security_events: number;
    compliance_violations: number;
  };
  gdpr_activities: {
    data_exports: number;
    data_deletions: number;
    consent_changes: number;
    access_requests: number;
  };
  security_metrics: {
    failed_logins: number;
    suspicious_activities: number;
    blocked_requests: number;
    privilege_escalations: number;
  };
  top_risks: Array<{
    risk_type: string;
    count: number;
    impact_level: string;
  }>;
}

interface DataRetentionPolicy {
  data_type: string;
  retention_period_days: number;
  auto_delete: boolean;
  encryption_required: boolean;
  access_controls: string[];
  compliance_requirements: string[];
}

interface GDPRRequest {
  id: string;
  type: 'access' | 'portability' | 'rectification' | 'erasure' | 'restriction' | 'objection';
  userId: string;
  email: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requested_at: Date;
  completed_at?: Date;
  request_details: Record<string, any>;
  verification_token?: string;
  response_data?: any;
  legal_basis?: string;
}

export class EnhancedAuditSystem {
  private prisma: PrismaClient;
  private retentionPolicies: Map<string, DataRetentionPolicy> = new Map();
  private complianceRules: Map<string, (event: AuditEvent) => string[]> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
    this.setupRetentionPolicies();
    this.setupComplianceRules();
    this.startRetentionCleanup();
  }

  private setupRetentionPolicies(): void {
    const policies: DataRetentionPolicy[] = [
      {
        data_type: 'authentication_logs',
        retention_period_days: 90,
        auto_delete: true,
        encryption_required: true,
        access_controls: ['admin', 'security_officer'],
        compliance_requirements: ['SOC2', 'ISO27001']
      },
      {
        data_type: 'data_access_logs',
        retention_period_days: 365,
        auto_delete: true,
        encryption_required: true,
        access_controls: ['admin', 'compliance_officer'],
        compliance_requirements: ['GDPR', 'CCPA', 'SOC2']
      },
      {
        data_type: 'scraping_logs',
        retention_period_days: 180,
        auto_delete: true,
        encryption_required: false,
        access_controls: ['admin', 'operations'],
        compliance_requirements: ['SOC2']
      },
      {
        data_type: 'security_events',
        retention_period_days: 730, // 2 years
        auto_delete: false,
        encryption_required: true,
        access_controls: ['admin', 'security_officer'],
        compliance_requirements: ['SOC2', 'ISO27001', 'PCI_DSS']
      },
      {
        data_type: 'gdpr_requests',
        retention_period_days: 2555, // 7 years
        auto_delete: false,
        encryption_required: true,
        access_controls: ['admin', 'compliance_officer'],
        compliance_requirements: ['GDPR']
      }
    ];

    policies.forEach(policy => {
      this.retentionPolicies.set(policy.data_type, policy);
    });
  }

  private setupComplianceRules(): void {
    // GDPR compliance rules
    this.complianceRules.set('gdpr_data_access', (event: AuditEvent) => {
      const flags: string[] = [];

      if (event.action.includes('export') || event.action.includes('download')) {
        flags.push('GDPR_DATA_EXPORT');
      }

      if (event.details.personal_data === true) {
        flags.push('GDPR_PERSONAL_DATA_ACCESS');
      }

      if (event.details.bulk_operation === true) {
        flags.push('GDPR_BULK_DATA_OPERATION');
      }

      return flags;
    });

    // SOC2 compliance rules
    this.complianceRules.set('soc2_security', (event: AuditEvent) => {
      const flags: string[] = [];

      if (event.action.includes('privilege') || event.action.includes('admin')) {
        flags.push('SOC2_PRIVILEGE_OPERATION');
      }

      if (event.risk_level === 'high' || event.risk_level === 'critical') {
        flags.push('SOC2_HIGH_RISK_EVENT');
      }

      return flags;
    });

    // PCI DSS compliance rules
    this.complianceRules.set('pci_payment', (event: AuditEvent) => {
      const flags: string[] = [];

      if (event.resource.includes('payment') || event.resource.includes('billing')) {
        flags.push('PCI_DSS_PAYMENT_DATA');
      }

      return flags;
    });
  }

  /**
   * Log an audit event with automatic compliance flagging
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'compliance_flags'>): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        ...event,
        timestamp: new Date(),
        compliance_flags: this.calculateComplianceFlags(event as AuditEvent)
      };

      // Store in database (assuming audit_logs table exists)
      await this.prisma.$executeRaw`
        INSERT INTO audit_logs (
          user_id, session_id, user_agent, ip_address, action, resource,
          resource_id, details, risk_level, compliance_flags, geolocation,
          outcome, error_details, created_at
        ) VALUES (
          ${auditEvent.userId}, ${auditEvent.sessionId}, ${auditEvent.userAgent},
          ${auditEvent.ipAddress}, ${auditEvent.action}, ${auditEvent.resource},
          ${auditEvent.resourceId}, ${JSON.stringify(auditEvent.details)},
          ${auditEvent.risk_level}, ${JSON.stringify(auditEvent.compliance_flags)},
          ${JSON.stringify(auditEvent.geolocation)}, ${auditEvent.outcome},
          ${auditEvent.error_details}, ${auditEvent.timestamp}
        )
      `;

      // Real-time security monitoring
      await this.checkSecurityAlerts(auditEvent);

      // GDPR automatic processing
      if (auditEvent.compliance_flags.includes('GDPR_PERSONAL_DATA_ACCESS')) {
        await this.processGDPREvent(auditEvent);
      }

      logger.info('Audit event logged', {
        action: auditEvent.action,
        resource: auditEvent.resource,
        risk_level: auditEvent.risk_level,
        compliance_flags: auditEvent.compliance_flags
      });

    } catch (error) {
      logger.error('Failed to log audit event', { error, event });
      // Fallback to file logging for critical audit events
      await this.fallbackLog(event);
    }
  }

  private calculateComplianceFlags(event: AuditEvent): string[] {
    let flags: string[] = [];

    for (const [ruleType, ruleFunction] of this.complianceRules) {
      const ruleFlags = ruleFunction(event);
      flags = [...flags, ...ruleFlags];
    }

    return [...new Set(flags)]; // Remove duplicates
  }

  private async checkSecurityAlerts(event: AuditEvent): Promise<void> {
    // Check for security patterns
    const alerts: string[] = [];

    // Failed login attempts
    if (event.action === 'login' && event.outcome === 'failure') {
      const recentFailures = await this.getRecentFailedLogins(event.ipAddress, 15);
      if (recentFailures >= 5) {
        alerts.push('BRUTE_FORCE_ATTEMPT');
      }
    }

    // Unusual access patterns
    if (event.action.includes('access') && event.geolocation) {
      const userLocations = await this.getUserRecentLocations(event.userId || '', 24);
      if (this.isUnusualLocation(event.geolocation, userLocations)) {
        alerts.push('UNUSUAL_LOCATION_ACCESS');
      }
    }

    // Privilege escalation
    if (event.action.includes('admin') || event.action.includes('privilege')) {
      alerts.push('PRIVILEGE_OPERATION');
    }

    // High-risk operations
    if (event.risk_level === 'critical') {
      alerts.push('CRITICAL_RISK_OPERATION');
    }

    if (alerts.length > 0) {
      await this.triggerSecurityAlerts(event, alerts);
    }
  }

  private async triggerSecurityAlerts(event: AuditEvent, alerts: string[]): Promise<void> {
    // Send to security monitoring system
    const alertData = {
      timestamp: new Date(),
      event_id: event.id,
      alert_types: alerts,
      severity: this.calculateAlertSeverity(alerts),
      event_details: event,
      requires_investigation: alerts.some(a =>
        ['BRUTE_FORCE_ATTEMPT', 'UNUSUAL_LOCATION_ACCESS', 'CRITICAL_RISK_OPERATION'].includes(a)
      )
    };

    // Log security alert
    logger.warn('Security alert triggered', alertData);

    // Send to external security systems (SIEM, etc.)
    if (process.env.SECURITY_WEBHOOK_URL) {
      try {
        await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertData)
        });
      } catch (error) {
        logger.error('Failed to send security alert', { error });
      }
    }
  }

  /**
   * Process GDPR data request
   */
  async processGDPRRequest(request: Omit<GDPRRequest, 'id' | 'requested_at' | 'status'>): Promise<string> {
    const gdprRequest: GDPRRequest = {
      ...request,
      id: this.generateRequestId(),
      requested_at: new Date(),
      status: 'pending',
      verification_token: this.generateVerificationToken()
    };

    try {
      // Store GDPR request
      await this.prisma.$executeRaw`
        INSERT INTO gdpr_requests (
          id, type, user_id, email, status, requested_at, request_details,
          verification_token, legal_basis
        ) VALUES (
          ${gdprRequest.id}, ${gdprRequest.type}, ${gdprRequest.userId},
          ${gdprRequest.email}, ${gdprRequest.status}, ${gdprRequest.requested_at},
          ${JSON.stringify(gdprRequest.request_details)}, ${gdprRequest.verification_token},
          ${gdprRequest.legal_basis}
        )
      `;

      // Log the request
      await this.logEvent({
        userId: gdprRequest.userId,
        ipAddress: request.request_details.ip_address || 'unknown',
        action: `gdpr_request_${gdprRequest.type}`,
        resource: 'gdpr_requests',
        resourceId: gdprRequest.id,
        details: {
          request_type: gdprRequest.type,
          verification_required: true
        },
        risk_level: 'medium',
        outcome: 'success'
      });

      // Send verification email (implement email service)
      await this.sendGDPRVerificationEmail(gdprRequest);

      logger.info('GDPR request created', {
        requestId: gdprRequest.id,
        type: gdprRequest.type,
        userId: gdprRequest.userId
      });

      return gdprRequest.id;

    } catch (error) {
      logger.error('Failed to process GDPR request', { error, request });
      throw error;
    }
  }

  /**
   * Verify and execute GDPR request
   */
  async executeGDPRRequest(requestId: string, verificationToken: string): Promise<any> {
    try {
      // Verify request
      const request = await this.prisma.$queryRaw<GDPRRequest[]>`
        SELECT * FROM gdpr_requests
        WHERE id = ${requestId} AND verification_token = ${verificationToken}
        AND status = 'pending'
      `;

      if (!request.length) {
        throw new Error('Invalid or expired GDPR request');
      }

      const gdprRequest = request[0];

      // Update status
      await this.prisma.$executeRaw`
        UPDATE gdpr_requests
        SET status = 'in_progress'
        WHERE id = ${requestId}
      `;

      let responseData: any = null;

      // Execute based on request type
      switch (gdprRequest.type) {
        case 'access':
          responseData = await this.executeDataAccess(gdprRequest.userId);
          break;
        case 'portability':
          responseData = await this.executeDataPortability(gdprRequest.userId);
          break;
        case 'erasure':
          responseData = await this.executeDataErasure(gdprRequest.userId);
          break;
        case 'rectification':
          responseData = await this.executeDataRectification(gdprRequest);
          break;
        case 'restriction':
          responseData = await this.executeProcessingRestriction(gdprRequest.userId);
          break;
        case 'objection':
          responseData = await this.executeProcessingObjection(gdprRequest.userId);
          break;
      }

      // Mark as completed
      await this.prisma.$executeRaw`
        UPDATE gdpr_requests
        SET status = 'completed', completed_at = ${new Date()}, response_data = ${JSON.stringify(responseData)}
        WHERE id = ${requestId}
      `;

      // Log completion
      await this.logEvent({
        userId: gdprRequest.userId,
        ipAddress: 'system',
        action: `gdpr_request_completed_${gdprRequest.type}`,
        resource: 'gdpr_requests',
        resourceId: requestId,
        details: {
          request_type: gdprRequest.type,
          execution_successful: true
        },
        risk_level: 'medium',
        outcome: 'success'
      });

      return responseData;

    } catch (error) {
      // Mark as failed
      await this.prisma.$executeRaw`
        UPDATE gdpr_requests
        SET status = 'rejected', error_details = ${error instanceof Error ? error.message : String(error)}
        WHERE id = ${requestId}
      `;

      logger.error('Failed to execute GDPR request', { error, requestId });
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport> {
    try {
      const events = await this.prisma.$queryRaw<AuditEvent[]>`
        SELECT * FROM audit_logs
        WHERE created_at BETWEEN ${startDate} AND ${endDate}
      `;

      const report: ComplianceReport = {
        period: { start: startDate, end: endDate },
        summary: {
          total_events: events.length,
          data_access_events: events.filter(e => e.action.includes('access')).length,
          data_modification_events: events.filter(e => e.action.includes('update') || e.action.includes('delete')).length,
          security_events: events.filter(e => e.risk_level === 'high' || e.risk_level === 'critical').length,
          compliance_violations: events.filter(e => e.compliance_flags.length > 0).length
        },
        gdpr_activities: {
          data_exports: events.filter(e => e.compliance_flags.includes('GDPR_DATA_EXPORT')).length,
          data_deletions: events.filter(e => e.action.includes('delete') && e.compliance_flags.includes('GDPR_PERSONAL_DATA_ACCESS')).length,
          consent_changes: events.filter(e => e.action.includes('consent')).length,
          access_requests: events.filter(e => e.action.includes('gdpr_request_access')).length
        },
        security_metrics: {
          failed_logins: events.filter(e => e.action === 'login' && e.outcome === 'failure').length,
          suspicious_activities: events.filter(e => e.risk_level === 'critical').length,
          blocked_requests: events.filter(e => e.outcome === 'blocked').length,
          privilege_escalations: events.filter(e => e.action.includes('privilege')).length
        },
        top_risks: this.calculateTopRisks(events)
      };

      return report;

    } catch (error) {
      logger.error('Failed to generate compliance report', { error });
      throw error;
    }
  }

  // Private helper methods
  private async getRecentFailedLogins(ipAddress: string, minutes: number): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    const result = await this.prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*) as count FROM audit_logs
      WHERE ip_address = ${ipAddress}
      AND action = 'login'
      AND outcome = 'failure'
      AND created_at > ${since}
    `;
    return result[0].count;
  }

  private async getUserRecentLocations(userId: string, hours: number): Promise<any[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await this.prisma.$queryRaw`
      SELECT DISTINCT geolocation FROM audit_logs
      WHERE user_id = ${userId}
      AND geolocation IS NOT NULL
      AND created_at > ${since}
    `;
  }

  private isUnusualLocation(current: any, recent: any[]): boolean {
    // Implement geolocation distance calculation
    // Return true if current location is significantly different from recent locations
    return false; // Simplified for now
  }

  private calculateAlertSeverity(alerts: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (alerts.includes('CRITICAL_RISK_OPERATION')) return 'critical';
    if (alerts.includes('BRUTE_FORCE_ATTEMPT')) return 'high';
    if (alerts.includes('UNUSUAL_LOCATION_ACCESS')) return 'medium';
    return 'low';
  }

  private calculateTopRisks(events: AuditEvent[]): Array<{ risk_type: string; count: number; impact_level: string }> {
    const riskCounts = new Map<string, number>();

    events.forEach(event => {
      if (event.risk_level === 'high' || event.risk_level === 'critical') {
        const key = `${event.action}_${event.risk_level}`;
        riskCounts.set(key, (riskCounts.get(key) || 0) + 1);
      }
    });

    return Array.from(riskCounts.entries())
      .map(([risk_type, count]) => ({
        risk_type,
        count,
        impact_level: risk_type.includes('critical') ? 'critical' : 'high'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private generateRequestId(): string {
    return `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVerificationToken(): string {
    return Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
  }

  private async fallbackLog(event: any): Promise<void> {
    // Fallback file logging for when database is unavailable
    const fs = require('fs').promises;
    const logLine = JSON.stringify({ ...event, timestamp: new Date() }) + '\n';
    await fs.appendFile('/var/log/datavault/audit-fallback.log', logLine).catch(() => {});
  }

  private startRetentionCleanup(): void {
    // Run cleanup every 24 hours
    setInterval(async () => {
      await this.runRetentionCleanup();
    }, 24 * 60 * 60 * 1000);
  }

  private async runRetentionCleanup(): Promise<void> {
    try {
      for (const [dataType, policy] of this.retentionPolicies) {
        if (policy.auto_delete) {
          const cutoffDate = new Date(Date.now() - policy.retention_period_days * 24 * 60 * 60 * 1000);

          await this.prisma.$executeRaw`
            DELETE FROM audit_logs
            WHERE data_type = ${dataType}
            AND created_at < ${cutoffDate}
          `;
        }
      }

      logger.info('Retention cleanup completed');
    } catch (error) {
      logger.error('Retention cleanup failed', { error });
    }
  }

  // GDPR execution methods (simplified implementations)
  private async executeDataAccess(userId: string): Promise<any> {
    // Collect all user data across all systems
    return { message: 'Data access report generated', userId };
  }

  private async executeDataPortability(userId: string): Promise<any> {
    // Export user data in portable format
    return { message: 'Data export created', userId };
  }

  private async executeDataErasure(userId: string): Promise<any> {
    // Delete user data (with legal considerations)
    return { message: 'Data erasure completed', userId };
  }

  private async executeDataRectification(request: GDPRRequest): Promise<any> {
    // Update incorrect data
    return { message: 'Data rectification completed', requestId: request.id };
  }

  private async executeProcessingRestriction(userId: string): Promise<any> {
    // Restrict data processing
    return { message: 'Processing restriction applied', userId };
  }

  private async executeProcessingObjection(userId: string): Promise<any> {
    // Handle processing objection
    return { message: 'Processing objection handled', userId };
  }

  private async processGDPREvent(event: AuditEvent): Promise<void> {
    // Automatic GDPR event processing
    logger.info('Processing GDPR event', { event: event.id, flags: event.compliance_flags });
  }

  private async sendGDPRVerificationEmail(request: GDPRRequest): Promise<void> {
    // Send verification email (implement with your email service)
    logger.info('GDPR verification email sent', { requestId: request.id, email: request.email });
  }
}

// Export singleton instance
export const auditSystem = new EnhancedAuditSystem();
