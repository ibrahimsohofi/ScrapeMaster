import { NextRequest, NextResponse } from 'next/server';
import { monitoringSystem } from '@/lib/monitoring/unified-monitoring-system';
import { auditSystem } from '@/lib/compliance/enhanced-audit-system';
import { intrusionDetection } from '@/lib/security/enhanced-intrusion-detection';
import { logger } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' || '24h';
    const section = searchParams.get('section') || 'overview';

    switch (section) {
      case 'overview':
        return NextResponse.json(await getOverviewData(timeRange));

      case 'monitoring':
        return NextResponse.json(await getMonitoringData(timeRange));

      case 'security':
        return NextResponse.json(await getSecurityData(timeRange));

      case 'compliance':
        return NextResponse.json(await getComplianceData(timeRange));

      case 'alerts':
        return NextResponse.json(await getAlertsData(timeRange));

      default:
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Failed to fetch monitoring data', { error });
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'record_metrics':
        await monitoringSystem.recordMetrics(params.metrics);
        return NextResponse.json({ success: true });

      case 'record_scraping_metrics':
        await monitoringSystem.recordScrapingMetrics(params.metrics);
        return NextResponse.json({ success: true });

      case 'analyze_security_request':
        const securityResponse = await intrusionDetection.analyzeRequest(params.requestData);
        return NextResponse.json({ securityResponse });

      case 'create_gdpr_request':
        const requestId = await auditSystem.processGDPRRequest(params.gdprRequest);
        return NextResponse.json({ requestId });

      case 'generate_compliance_report':
        const report = await auditSystem.generateComplianceReport(
          new Date(params.startDate),
          new Date(params.endDate)
        );
        return NextResponse.json({ report });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Failed to process monitoring action', { error });
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}

async function getOverviewData(timeRange: string) {
  try {
    const [
      monitoringData,
      securityData,
      complianceData
    ] = await Promise.all([
      monitoringSystem.getDashboardData(timeRange as any),
      intrusionDetection.getDashboardData(),
      getComplianceSummary()
    ]);

    return {
      overview: {
        system_health: calculateSystemHealth(monitoringData),
        security_status: calculateSecurityStatus(securityData),
        compliance_status: calculateComplianceStatus(complianceData),
        active_alerts: monitoringData.summary.activeAlerts,
        last_updated: new Date().toISOString()
      },
      key_metrics: {
        performance: {
          avg_response_time: getAverageResponseTime(monitoringData.metrics),
          error_rate: getErrorRate(monitoringData.metrics),
          throughput: getThroughput(monitoringData.metrics),
          uptime: calculateUptime(monitoringData.metrics)
        },
        security: {
          threats_blocked: securityData.blocked_requests,
          risk_score: calculateRiskScore(securityData),
          intrusion_attempts: securityData.events_last_24h,
          blocked_ips: securityData.blocked_ips
        },
        compliance: {
          gdpr_requests: complianceData.pending_gdpr_requests || 0,
          audit_events: complianceData.audit_events_24h || 0,
          compliance_score: complianceData.compliance_score || 95,
          policy_violations: complianceData.policy_violations || 0
        }
      },
      recent_events: await getRecentSignificantEvents(),
      trending_threats: securityData.top_threats
    };

  } catch (error) {
    logger.error('Failed to get overview data', { error });
    throw error;
  }
}

async function getMonitoringData(timeRange: string) {
  try {
    const dashboardData = await monitoringSystem.getDashboardData(timeRange as any);

    return {
      metrics: {
        performance: dashboardData.metrics.map((m: any) => ({
          timestamp: m.timestamp,
          cpu: m.cpu,
          memory: m.memory,
          response_time: m.responseTime,
          throughput: m.throughput
        })),
        errors: dashboardData.metrics.map((m: any) => ({
          timestamp: m.timestamp,
          error_rate: m.errorRate,
          active_connections: m.activeConnections
        })),
        scraping: dashboardData.metrics.map((m: any) => ({
          timestamp: m.timestamp,
          scraper_success: m.scraperSuccess,
          scraper_failure: m.scraperFailure,
          queue_size: m.queueSize
        }))
      },
      alerts: {
        active: dashboardData.alerts.filter((a: any) => a.enabled),
        triggered: await getTriggeredAlerts(timeRange),
        configurations: dashboardData.alerts
      },
      health_checks: {
        database: await checkDatabaseHealth(),
        redis: await checkRedisHealth(),
        external_apis: await checkExternalApisHealth(),
        disk_space: await checkDiskSpace()
      },
      integrations: {
        datadog: {
          status: !!process.env.DATADOG_API_KEY ? 'connected' : 'disconnected',
          last_sync: new Date().toISOString()
        },
        newrelic: {
          status: !!process.env.NEW_RELIC_LICENSE_KEY ? 'connected' : 'disconnected',
          last_sync: new Date().toISOString()
        }
      }
    };

  } catch (error) {
    logger.error('Failed to get monitoring data', { error });
    throw error;
  }
}

async function getSecurityData(timeRange: string) {
  try {
    const securityDashboard = intrusionDetection.getDashboardData();

    return {
      threat_overview: {
        events_analyzed: securityDashboard.events_last_24h,
        threats_blocked: securityDashboard.blocked_requests,
        risk_level: calculateOverallRiskLevel(securityDashboard),
        active_signatures: securityDashboard.active_signatures
      },
      threat_breakdown: {
        by_severity: securityDashboard.threat_levels,
        by_type: securityDashboard.top_threats,
        by_source: await getThreatsBySource(),
        by_time: await getThreatsByTime(timeRange)
      },
      blocked_entities: {
        ips: securityDashboard.blocked_ips,
        user_agents: await getBlockedUserAgents(),
        countries: await getBlockedCountries()
      },
      intrusion_detection: {
        active_rules: await getActiveSecurityRules(),
        signature_matches: await getSignatureMatches(timeRange),
        behavioral_anomalies: await getBehavioralAnomalies(timeRange),
        false_positives: await getFalsePositives(timeRange)
      },
      incident_response: {
        open_incidents: await getOpenSecurityIncidents(),
        recent_responses: await getRecentSecurityResponses(),
        escalated_threats: await getEscalatedThreats()
      }
    };

  } catch (error) {
    logger.error('Failed to get security data', { error });
    throw error;
  }
}

async function getComplianceData(timeRange: string) {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - getTimeRangeMs(timeRange));

    const complianceReport = await auditSystem.generateComplianceReport(startDate, endDate);

    return {
      compliance_overview: {
        overall_score: calculateComplianceScore(complianceReport),
        last_assessment: endDate.toISOString(),
        next_audit: getNextAuditDate(),
        certifications: ['SOC2', 'ISO27001', 'GDPR', 'CCPA']
      },
      gdpr_compliance: {
        requests: complianceReport.gdpr_activities,
        data_processing: {
          lawful_basis_documented: true,
          consent_management: true,
          data_retention_policies: true,
          breach_procedures: true
        },
        privacy_impact_assessments: await getPrivacyImpactAssessments(),
        data_protection_officer_contact: 'dpo@datavault.pro'
      },
      audit_logs: {
        total_events: complianceReport.summary.total_events,
        data_access_events: complianceReport.summary.data_access_events,
        data_modification_events: complianceReport.summary.data_modification_events,
        security_events: complianceReport.summary.security_events,
        retention_compliance: await getRetentionCompliance()
      },
      policy_compliance: {
        access_control: await getAccessControlCompliance(),
        data_encryption: await getDataEncryptionCompliance(),
        backup_procedures: await getBackupCompliance(),
        incident_response: await getIncidentResponseCompliance()
      },
      risk_assessment: {
        identified_risks: complianceReport.top_risks,
        mitigation_strategies: await getRiskMitigationStrategies(),
        residual_risk_level: 'low'
      }
    };

  } catch (error) {
    logger.error('Failed to get compliance data', { error });
    throw error;
  }
}

async function getAlertsData(timeRange: string) {
  try {
    const alerts = await getTriggeredAlerts(timeRange);

    return {
      active_alerts: alerts.filter((a: any) => a.status === 'active'),
      resolved_alerts: alerts.filter((a: any) => a.status === 'resolved'),
      alert_statistics: {
        total_triggered: alerts.length,
        critical: alerts.filter((a: any) => a.severity === 'critical').length,
        high: alerts.filter((a: any) => a.severity === 'high').length,
        medium: alerts.filter((a: any) => a.severity === 'medium').length,
        low: alerts.filter((a: any) => a.severity === 'low').length,
        avg_resolution_time: calculateAverageResolutionTime(alerts)
      },
      notification_channels: {
        email: { enabled: true, status: 'operational' },
        slack: { enabled: !!process.env.SLACK_WEBHOOK, status: 'operational' },
        pagerduty: { enabled: false, status: 'disabled' },
        webhook: { enabled: !!process.env.MONITORING_WEBHOOK_URL, status: 'operational' }
      },
      escalation_policies: await getEscalationPolicies()
    };

  } catch (error) {
    logger.error('Failed to get alerts data', { error });
    throw error;
  }
}

// Helper functions
function calculateSystemHealth(monitoringData: any): 'healthy' | 'warning' | 'critical' {
  const latestMetrics = monitoringData.metrics[monitoringData.metrics.length - 1];
  if (!latestMetrics) return 'warning';

  if (latestMetrics.cpu > 90 || latestMetrics.memory > 90 || latestMetrics.errorRate > 10) {
    return 'critical';
  }
  if (latestMetrics.cpu > 70 || latestMetrics.memory > 70 || latestMetrics.errorRate > 5) {
    return 'warning';
  }
  return 'healthy';
}

function calculateSecurityStatus(securityData: any): 'secure' | 'monitoring' | 'alert' {
  const threatLevel = securityData.threat_levels;
  if (threatLevel?.critical > 0) return 'alert';
  if (threatLevel?.high > 5) return 'monitoring';
  return 'secure';
}

function calculateComplianceStatus(complianceData: any): 'compliant' | 'review_needed' | 'non_compliant' {
  const score = complianceData.compliance_score || 95;
  if (score >= 95) return 'compliant';
  if (score >= 85) return 'review_needed';
  return 'non_compliant';
}

function getTimeRangeMs(range: string): number {
  switch (range) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

// Placeholder functions - implement with real data
async function getComplianceSummary() {
  return {
    pending_gdpr_requests: 0,
    audit_events_24h: 150,
    compliance_score: 96,
    policy_violations: 0
  };
}

async function getRecentSignificantEvents() {
  return [
    { type: 'security', message: 'Blocked potential SQL injection', timestamp: new Date() },
    { type: 'performance', message: 'High memory usage detected', timestamp: new Date() },
    { type: 'compliance', message: 'GDPR data export completed', timestamp: new Date() }
  ];
}

async function getTriggeredAlerts(timeRange: string) {
  return []; // Implement with real alert data
}

async function checkDatabaseHealth() {
  return { status: 'healthy', response_time: 5, connections: 10 };
}

async function checkRedisHealth() {
  return { status: 'healthy', response_time: 2, memory_usage: 45 };
}

async function checkExternalApisHealth() {
  return { status: 'healthy', apis_tested: 5, failures: 0 };
}

async function checkDiskSpace() {
  return { status: 'healthy', usage_percent: 45, free_gb: 150 };
}

// Additional helper functions would be implemented here...
function getAverageResponseTime(metrics: any[]): number {
  if (!metrics.length) return 0;
  return metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
}

function getErrorRate(metrics: any[]): number {
  if (!metrics.length) return 0;
  return metrics[metrics.length - 1].errorRate;
}

function getThroughput(metrics: any[]): number {
  if (!metrics.length) return 0;
  return metrics[metrics.length - 1].throughput;
}

function calculateUptime(metrics: any[]): number {
  return 99.9; // Placeholder
}

function calculateRiskScore(securityData: any): number {
  const threats = securityData.threat_levels;
  if (!threats) return 0;

  return (threats.critical * 4 + threats.high * 3 + threats.medium * 2 + threats.low * 1) / 10;
}

function calculateOverallRiskLevel(securityData: any): 'low' | 'medium' | 'high' | 'critical' {
  const score = calculateRiskScore(securityData);
  if (score >= 8) return 'critical';
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

function calculateComplianceScore(report: any): number {
  // Calculate based on various compliance metrics
  return 96; // Placeholder
}

function getNextAuditDate(): string {
  const nextAudit = new Date();
  nextAudit.setMonth(nextAudit.getMonth() + 3);
  return nextAudit.toISOString();
}

function calculateAverageResolutionTime(alerts: any[]): number {
  return 15; // minutes - placeholder
}

// Additional placeholder functions
async function getThreatsBySource() { return []; }
async function getThreatsByTime(timeRange: string) { return []; }
async function getBlockedUserAgents() { return []; }
async function getBlockedCountries() { return []; }
async function getActiveSecurityRules() { return []; }
async function getSignatureMatches(timeRange: string) { return []; }
async function getBehavioralAnomalies(timeRange: string) { return []; }
async function getFalsePositives(timeRange: string) { return []; }
async function getOpenSecurityIncidents() { return []; }
async function getRecentSecurityResponses() { return []; }
async function getEscalatedThreats() { return []; }
async function getPrivacyImpactAssessments() { return []; }
async function getRetentionCompliance() { return {}; }
async function getAccessControlCompliance() { return {}; }
async function getDataEncryptionCompliance() { return {}; }
async function getBackupCompliance() { return {}; }
async function getIncidentResponseCompliance() { return {}; }
async function getRiskMitigationStrategies() { return []; }
async function getEscalationPolicies() { return []; }
