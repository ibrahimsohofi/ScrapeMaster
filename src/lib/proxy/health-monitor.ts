import axios, { type AxiosError } from 'axios';
import { EventEmitter } from 'events';
import type { EnhancedProxyProvider } from './enhanced-manager';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  statusCode: number;
  uptime: number;
  issues: HealthIssue[];
  metrics: HealthMetrics;
  timestamp: Date;
}

interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'latency' | 'availability' | 'error_rate' | 'ssl' | 'geo_blocking' | 'rate_limiting';
  message: string;
  affectedEndpoints: string[];
  detectedAt: Date;
  autoResolved?: boolean;
}

interface HealthMetrics {
  availability: number; // percentage
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  concurrentConnections: number;
  sslCertificateExpiry?: Date;
  lastSuccessfulRequest: Date;
  consecutiveFailures: number;
}

interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: AlertChannel[];
  cooldownMinutes: number;
  enabled: boolean;
}

interface AlertCondition {
  metric: keyof HealthMetrics;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  duration: number; // minutes
}

interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  endpoint: string;
  enabled: boolean;
}

export class ProxyHealthMonitor extends EventEmitter {
  private healthHistory: Map<string, HealthCheckResult[]> = new Map();
  private alertRules: Map<string, AlertRule[]> = new Map();
  private activeAlerts: Map<string, Set<string>> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private testEndpoints: string[] = [
    'https://httpbin.org/ip',
    'https://httpbin.org/headers',
    'https://api.ipify.org?format=json',
    'https://jsonplaceholder.typicode.com/posts/1'
  ];

  constructor() {
    super();
    this.setupDefaultAlertRules();
  }

  // Start monitoring a provider
  async startMonitoring(provider: EnhancedProxyProvider, intervalMinutes = 2): Promise<void> {
    // Clear existing monitoring
    this.stopMonitoring(provider.name);

    // Initialize health history
    if (!this.healthHistory.has(provider.name)) {
      this.healthHistory.set(provider.name, []);
    }

    // Start periodic health checks
    const interval = setInterval(async () => {
      try {
        const result = await this.performHealthCheck(provider);
        this.recordHealthResult(provider.name, result);
        await this.evaluateAlerts(provider.name, result);
      } catch (error) {
        console.error(`Health monitoring error for ${provider.name}:`, error);
      }
    }, intervalMinutes * 60 * 1000);

    this.monitoringIntervals.set(provider.name, interval);

    // Perform initial health check
    const initialResult = await this.performHealthCheck(provider);
    this.recordHealthResult(provider.name, initialResult);
  }

  // Stop monitoring a provider
  stopMonitoring(providerName: string): void {
    const interval = this.monitoringIntervals.get(providerName);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(providerName);
    }
  }

  // Check health of a specific provider (called by enhanced manager)
  async checkProviderHealth(providerId: string): Promise<HealthCheckResult | null> {
    // In production, this would find the provider by ID and perform health check
    // For now, we'll emit a mock health update event
    const mockHealthResult: HealthCheckResult = {
      status: 'healthy',
      responseTime: 1500,
      statusCode: 200,
      uptime: 99.5,
      issues: [],
      metrics: {
        availability: 99.5,
        averageResponseTime: 1500,
        errorRate: 0.5,
        throughput: 1000,
        concurrentConnections: 50,
        lastSuccessfulRequest: new Date(),
        consecutiveFailures: 0
      },
      timestamp: new Date()
    };

    // Emit health update event
    this.emit('healthUpdate', providerId, mockHealthResult);

    return mockHealthResult;
  }

  // Perform comprehensive health check
  async performHealthCheck(provider: EnhancedProxyProvider): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const issues: HealthIssue[] = [];
    let totalResponseTime = 0;
    let successfulRequests = 0;
    let totalRequests = 0;

    // Test multiple endpoints for comprehensive assessment
    for (const testUrl of this.testEndpoints) {
      for (const endpoint of provider.endpoints.slice(0, 3)) { // Test first 3 endpoints
        totalRequests++;

        try {
          const requestStart = Date.now();

          // Configure proxy request
          const response = await this.makeProxyRequest(testUrl, endpoint, provider);

          const requestTime = Date.now() - requestStart;
          totalResponseTime += requestTime;

          if (response.status === 200) {
            successfulRequests++;
          } else {
            issues.push({
              severity: 'medium',
              type: 'error_rate',
              message: `HTTP ${response.status} error from ${endpoint.host}`,
              affectedEndpoints: [endpoint.host],
              detectedAt: new Date()
            });
          }

          // Check for high latency
          if (requestTime > 10000) {
            issues.push({
              severity: 'high',
              type: 'latency',
              message: `High latency detected: ${requestTime}ms from ${endpoint.host}`,
              affectedEndpoints: [endpoint.host],
              detectedAt: new Date()
            });
          }

          // Check for rate limiting indicators
          if (response.status === 429 || response.headers['x-ratelimit-remaining'] === '0') {
            issues.push({
              severity: 'medium',
              type: 'rate_limiting',
              message: `Rate limiting detected on ${endpoint.host}`,
              affectedEndpoints: [endpoint.host],
              detectedAt: new Date()
            });
          }

        } catch (error) {
          const axiosError = error as AxiosError;

          if (axiosError.code === 'ECONNABORTED') {
            issues.push({
              severity: 'high',
              type: 'latency',
              message: `Timeout on ${endpoint.host}`,
              affectedEndpoints: [endpoint.host],
              detectedAt: new Date()
            });
          } else if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
            issues.push({
              severity: 'critical',
              type: 'availability',
              message: `Connection failed to ${endpoint.host}: ${axiosError.message}`,
              affectedEndpoints: [endpoint.host],
              detectedAt: new Date()
            });
          } else {
            issues.push({
              severity: 'medium',
              type: 'error_rate',
              message: `Request failed to ${endpoint.host}: ${axiosError.message}`,
              affectedEndpoints: [endpoint.host],
              detectedAt: new Date()
            });
          }
        }
      }
    }

    // Calculate metrics
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;
    const availability = successRate * 100;

    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (availability >= 95 && averageResponseTime < 3000) {
      status = 'healthy';
    } else if (availability >= 80 && averageResponseTime < 8000) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    // Check SSL certificate expiry for HTTPS endpoints
    const sslExpiry = await this.checkSSLCertificate(provider);
    if (sslExpiry && sslExpiry.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000) {
      issues.push({
        severity: 'medium',
        type: 'ssl',
        message: `SSL certificate expires soon: ${sslExpiry.toDateString()}`,
        affectedEndpoints: provider.endpoints.filter((e: any) => e.protocol === 'https').map((e: any) => e.host),
        detectedAt: new Date()
      });
    }

    const metrics: HealthMetrics = {
      availability,
      averageResponseTime,
      errorRate: (1 - successRate) * 100,
      throughput: provider.performanceMetrics.throughput,
      concurrentConnections: provider.performanceMetrics.concurrentConnections,
      sslCertificateExpiry: sslExpiry || undefined,
      lastSuccessfulRequest: successfulRequests > 0 ? new Date() : new Date(0),
      consecutiveFailures: this.calculateConsecutiveFailures(provider.name, successRate === 0)
    };

    return {
      status,
      responseTime: averageResponseTime,
      statusCode: successfulRequests > 0 ? 200 : 500,
      uptime: availability,
      issues,
      metrics,
      timestamp: new Date()
    };
  }

  // Make proxy request for testing
  private async makeProxyRequest(url: string, endpoint: any, provider: EnhancedProxyProvider) {
    const proxyConfig = {
      protocol: endpoint.protocol,
      host: endpoint.host,
      port: endpoint.port,
      auth: provider.authentication
    };

    return await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'TechFlow-HealthMonitor/1.0',
        'Accept': 'application/json'
      },
      // In production, configure actual proxy here
      // proxy: proxyConfig
    });
  }

  // Record health check result
  private recordHealthResult(providerName: string, result: HealthCheckResult): void {
    const history = this.healthHistory.get(providerName) || [];
    history.push(result);

    // Keep only last 1000 results
    if (history.length > 1000) {
      history.shift();
    }

    this.healthHistory.set(providerName, history);

    // Emit health update event
    this.emit('healthUpdate', providerName, result);
  }

  // Calculate consecutive failures
  private calculateConsecutiveFailures(providerName: string, currentFailed: boolean): number {
    const history = this.healthHistory.get(providerName) || [];
    if (history.length === 0) return currentFailed ? 1 : 0;

    let failures = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].status === 'unhealthy') {
        failures++;
      } else {
        break;
      }
    }

    return currentFailed ? failures + 1 : 0;
  }

  // Check SSL certificate expiry
  private async checkSSLCertificate(provider: EnhancedProxyProvider): Promise<Date | null> {
    // In production, implement actual SSL certificate checking
    // For now, return a mock expiry date
    const httpsEndpoints = provider.endpoints.filter((e: any) => e.protocol === 'https');
    if (httpsEndpoints.length === 0) return null;

    // Mock SSL expiry - in production, use TLS socket to check actual certificate
    return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
  }

  // Alert management
  async evaluateAlerts(providerName: string, result: HealthCheckResult): Promise<void> {
    const rules = this.alertRules.get(providerName) || [];

    for (const rule of rules) {
      if (!rule.enabled) continue;

      const shouldAlert = this.evaluateAlertCondition(rule.condition, result.metrics);
      const alertKey = `${providerName}-${rule.id}`;
      const activeAlerts = this.activeAlerts.get(providerName) || new Set();

      if (shouldAlert && !activeAlerts.has(alertKey)) {
        // Trigger alert
        await this.triggerAlert(providerName, rule, result);
        activeAlerts.add(alertKey);
        this.activeAlerts.set(providerName, activeAlerts);
      } else if (!shouldAlert && activeAlerts.has(alertKey)) {
        // Resolve alert
        await this.resolveAlert(providerName, rule, result);
        activeAlerts.delete(alertKey);
        this.activeAlerts.set(providerName, activeAlerts);
      }
    }
  }

  private evaluateAlertCondition(condition: AlertCondition, metrics: HealthMetrics): boolean {
    const value = metrics[condition.metric] as number;

    switch (condition.operator) {
      case '>': return value > condition.threshold;
      case '<': return value < condition.threshold;
      case '>=': return value >= condition.threshold;
      case '<=': return value <= condition.threshold;
      case '==': return value === condition.threshold;
      case '!=': return value !== condition.threshold;
      default: return false;
    }
  }

  private async triggerAlert(providerName: string, rule: AlertRule, result: HealthCheckResult): Promise<void> {
    const alertMessage = {
      provider: providerName,
      rule: rule.name,
      severity: rule.severity,
      condition: rule.condition,
      metrics: result.metrics,
      timestamp: new Date()
    };

    // Send to configured channels
    for (const channel of rule.channels) {
      if (!channel.enabled) continue;

      try {
        await this.sendAlert(channel, alertMessage);
      } catch (error) {
        console.error(`Failed to send alert via ${channel.type}:`, error);
      }
    }

    console.log(`🚨 Alert triggered: ${rule.name} for ${providerName}`);
  }

  private async resolveAlert(providerName: string, rule: AlertRule, result: HealthCheckResult): Promise<void> {
    const resolveMessage = {
      provider: providerName,
      rule: rule.name,
      resolved: true,
      metrics: result.metrics,
      timestamp: new Date()
    };

    // Send resolution notifications
    for (const channel of rule.channels) {
      if (!channel.enabled) continue;

      try {
        await this.sendAlert(channel, resolveMessage);
      } catch (error) {
        console.error(`Failed to send resolution via ${channel.type}:`, error);
      }
    }

    console.log(`✅ Alert resolved: ${rule.name} for ${providerName}`);
  }

  private async sendAlert(channel: AlertChannel, message: any): Promise<void> {
    switch (channel.type) {
      case 'webhook':
        await axios.post(channel.endpoint, message);
        break;
      case 'slack':
        await this.sendSlackAlert(channel.endpoint, message);
        break;
      case 'email':
        await this.sendEmailAlert(channel.endpoint, message);
        break;
      default:
        console.log(`Alert channel ${channel.type} not implemented`);
    }
  }

  private async sendSlackAlert(webhook: string, message: any): Promise<void> {
    const slackMessage = {
      text: `🚨 Proxy Alert: ${message.rule}`,
      attachments: [{
        color: message.severity === 'critical' ? 'danger' : 'warning',
        fields: [
          { title: 'Provider', value: message.provider, short: true },
          { title: 'Severity', value: message.severity.toUpperCase(), short: true },
          { title: 'Availability', value: `${message.metrics.availability.toFixed(1)}%`, short: true },
          { title: 'Response Time', value: `${message.metrics.averageResponseTime.toFixed(0)}ms`, short: true }
        ],
        timestamp: Math.floor(message.timestamp.getTime() / 1000)
      }]
    };

    await axios.post(webhook, slackMessage);
  }

  private async sendEmailAlert(email: string, message: any): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`Email alert would be sent to ${email}:`, message);
  }

  // Setup default alert rules
  private setupDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'availability-critical',
        name: 'Critical Availability Alert',
        condition: { metric: 'availability', operator: '<', threshold: 80, duration: 5 },
        severity: 'critical',
        channels: [{ type: 'webhook', endpoint: '/api/alerts/webhook', enabled: false }],
        cooldownMinutes: 15,
        enabled: true
      },
      {
        id: 'latency-high',
        name: 'High Latency Alert',
        condition: { metric: 'averageResponseTime', operator: '>', threshold: 5000, duration: 10 },
        severity: 'high',
        channels: [{ type: 'webhook', endpoint: '/api/alerts/webhook', enabled: false }],
        cooldownMinutes: 30,
        enabled: true
      },
      {
        id: 'error-rate-high',
        name: 'High Error Rate Alert',
        condition: { metric: 'errorRate', operator: '>', threshold: 20, duration: 5 },
        severity: 'medium',
        channels: [{ type: 'webhook', endpoint: '/api/alerts/webhook', enabled: false }],
        cooldownMinutes: 20,
        enabled: true
      }
    ];

    // Apply default rules to all providers (would be configured per provider in production)
    this.alertRules.set('default', defaultRules);
  }

  // Analytics and reporting
  getHealthSummary(providerName: string, hours = 24): HealthSummary | null {
    const history = this.healthHistory.get(providerName) || [];
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentHistory = history.filter(h => h.timestamp >= cutoff);

    if (recentHistory.length === 0) return null;

    const totalChecks = recentHistory.length;
    const healthyChecks = recentHistory.filter(h => h.status === 'healthy').length;
    const degradedChecks = recentHistory.filter(h => h.status === 'degraded').length;
    const unhealthyChecks = recentHistory.filter(h => h.status === 'unhealthy').length;

    const avgResponseTime = recentHistory.reduce((sum, h) => sum + h.responseTime, 0) / totalChecks;
    const avgUptime = recentHistory.reduce((sum, h) => sum + h.uptime, 0) / totalChecks;

    const allIssues = recentHistory.flatMap(h => h.issues);
    const issuesByType = this.groupIssuesByType(allIssues);

    return {
      provider: providerName,
      period: `${hours} hours`,
      totalChecks,
      healthyPercentage: (healthyChecks / totalChecks) * 100,
      degradedPercentage: (degradedChecks / totalChecks) * 100,
      unhealthyPercentage: (unhealthyChecks / totalChecks) * 100,
      averageResponseTime: avgResponseTime,
      averageUptime: avgUptime,
      issuesSummary: issuesByType,
      latestStatus: recentHistory[recentHistory.length - 1].status,
      lastCheck: recentHistory[recentHistory.length - 1].timestamp
    };
  }

  private groupIssuesByType(issues: HealthIssue[]): { [key: string]: number } {
    return issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  // Configuration management
  addAlertRule(providerName: string, rule: AlertRule): void {
    const rules = this.alertRules.get(providerName) || [];
    rules.push(rule);
    this.alertRules.set(providerName, rules);
  }

  removeAlertRule(providerName: string, ruleId: string): void {
    const rules = this.alertRules.get(providerName) || [];
    const filtered = rules.filter(r => r.id !== ruleId);
    this.alertRules.set(providerName, filtered);
  }

  getAlertRules(providerName: string): AlertRule[] {
    return this.alertRules.get(providerName) || [];
  }

  getHealthHistory(providerName: string, limit = 100): HealthCheckResult[] {
    const history = this.healthHistory.get(providerName) || [];
    return history.slice(-limit);
  }
}

// Interfaces
interface HealthSummary {
  provider: string;
  period: string;
  totalChecks: number;
  healthyPercentage: number;
  degradedPercentage: number;
  unhealthyPercentage: number;
  averageResponseTime: number;
  averageUptime: number;
  issuesSummary: { [key: string]: number };
  latestStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
}

// Export singleton
export const proxyHealthMonitor = new ProxyHealthMonitor();
export type { HealthCheckResult, HealthIssue, HealthMetrics, AlertRule, HealthSummary };
