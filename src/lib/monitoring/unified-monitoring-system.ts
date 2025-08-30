import { DataDogIntegration } from './datadog-integration';
import { NewRelicIntegration } from './newrelic-integration';
import { logger } from '@/lib/utils';

interface MonitoringConfig {
  dataDog?: {
    enabled: boolean;
    apiKey: string;
    appKey: string;
  };
  newRelic?: {
    enabled: boolean;
    licenseKey: string;
    apiKey: string;
  };
  alerting?: {
    enabled: boolean;
    webhookUrl?: string;
    emailNotifications?: boolean;
  };
}

interface MetricAlert {
  id: string;
  name: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  metric: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notificationChannels: string[];
}

interface PerformanceMetrics {
  timestamp: number;
  cpu: number;
  memory: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  activeConnections: number;
  queueSize: number;
  scraperSuccess: number;
  scraperFailure: number;
}

interface ScrapingMetrics {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  averageExecutionTime: number;
  dataPointsExtracted: number;
  proxiesUsed: number;
  captchasSolved: number;
  bypassSuccess: number;
}

export class UnifiedMonitoringSystem {
  private dataDog?: DataDogIntegration;
  private newRelic?: NewRelicIntegration;
  private config: MonitoringConfig;
  private alerts: Map<string, MetricAlert> = new Map();
  private metricsBuffer: PerformanceMetrics[] = [];
  private alertCooldowns: Map<string, number> = new Map();

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.initializeProviders();
    this.setupDefaultAlerts();

    // Start metrics collection
    this.startMetricsCollection();
  }

  private initializeProviders(): void {
    if (this.config.dataDog?.enabled) {
      this.dataDog = new DataDogIntegration();
    }

    if (this.config.newRelic?.enabled) {
      this.newRelic = new NewRelicIntegration();
    }
  }

  private setupDefaultAlerts(): void {
    const defaultAlerts: MetricAlert[] = [
      {
        id: 'high-cpu',
        name: 'High CPU Usage',
        condition: 'greater_than',
        threshold: 80,
        metric: 'system.cpu.usage',
        severity: 'high',
        enabled: true,
        notificationChannels: ['email', 'slack']
      },
      {
        id: 'high-memory',
        name: 'High Memory Usage',
        condition: 'greater_than',
        threshold: 85,
        metric: 'system.memory.usage',
        severity: 'high',
        enabled: true,
        notificationChannels: ['email', 'slack']
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: 'greater_than',
        threshold: 5,
        metric: 'scraper.error.rate',
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email', 'slack', 'pagerduty']
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        condition: 'greater_than',
        threshold: 2000,
        metric: 'api.response.time',
        severity: 'medium',
        enabled: true,
        notificationChannels: ['email']
      }
    ];

    defaultAlerts.forEach(alert => {
      this.alerts.set(alert.id, alert);
    });
  }

  /**
   * Record performance metrics
   */
  async recordMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      this.metricsBuffer.push(metrics);

      // Send to DataDog
      if (this.dataDog) {
        await this.dataDog.sendMetrics([
          {
            metric: 'system.cpu.usage',
            points: [[metrics.timestamp, metrics.cpu]],
            tags: ['service:datavault-pro', 'env:production']
          },
          {
            metric: 'system.memory.usage',
            points: [[metrics.timestamp, metrics.memory]],
            tags: ['service:datavault-pro', 'env:production']
          },
          {
            metric: 'api.response.time',
            points: [[metrics.timestamp, metrics.responseTime]],
            tags: ['service:datavault-pro', 'env:production']
          },
          {
            metric: 'scraper.error.rate',
            points: [[metrics.timestamp, metrics.errorRate]],
            tags: ['service:datavault-pro', 'env:production']
          }
        ]);
      }

      // Send to New Relic
      if (this.newRelic) {
        await this.newRelic.sendCustomEvents([{
          eventType: 'PerformanceMetrics',
          attributes: {
            cpu: metrics.cpu,
            memory: metrics.memory,
            responseTime: metrics.responseTime,
            errorRate: metrics.errorRate,
            throughput: metrics.throughput,
            activeConnections: metrics.activeConnections
          }
        }]);
      }

      // Check alerts
      await this.checkAlerts(metrics);

      logger.info('Performance metrics recorded successfully', {
        timestamp: metrics.timestamp,
        providers: {
          dataDog: !!this.dataDog,
          newRelic: !!this.newRelic
        }
      });

    } catch (error) {
      logger.error('Failed to record performance metrics', { error });
    }
  }

  /**
   * Record scraping-specific metrics
   */
  async recordScrapingMetrics(metrics: ScrapingMetrics): Promise<void> {
    try {
      const timestamp = Date.now();

      // Send to DataDog
      if (this.dataDog) {
        await this.dataDog.sendMetrics([
          {
            metric: 'scraper.jobs.total',
            points: [[timestamp, metrics.totalJobs]],
            tags: ['service:datavault-pro']
          },
          {
            metric: 'scraper.jobs.successful',
            points: [[timestamp, metrics.successfulJobs]],
            tags: ['service:datavault-pro']
          },
          {
            metric: 'scraper.jobs.failed',
            points: [[timestamp, metrics.failedJobs]],
            tags: ['service:datavault-pro']
          },
          {
            metric: 'scraper.execution.time.avg',
            points: [[timestamp, metrics.averageExecutionTime]],
            tags: ['service:datavault-pro']
          }
        ]);
      }

      // Send to New Relic
      if (this.newRelic) {
        await this.newRelic.sendCustomEvents([{
          eventType: 'ScrapingMetrics',
          attributes: metrics
        }]);
      }

      logger.info('Scraping metrics recorded successfully', { metrics });

    } catch (error) {
      logger.error('Failed to record scraping metrics', { error });
    }
  }

  /**
   * Check alert conditions
   */
  private async checkAlerts(metrics: PerformanceMetrics): Promise<void> {
    const now = Date.now();

    for (const [alertId, alert] of this.alerts) {
      if (!alert.enabled) continue;

      // Check cooldown
      const lastAlert = this.alertCooldowns.get(alertId);
      if (lastAlert && (now - lastAlert) < 300000) { // 5 minute cooldown
        continue;
      }

      let metricValue: number;
      switch (alert.metric) {
        case 'system.cpu.usage':
          metricValue = metrics.cpu;
          break;
        case 'system.memory.usage':
          metricValue = metrics.memory;
          break;
        case 'api.response.time':
          metricValue = metrics.responseTime;
          break;
        case 'scraper.error.rate':
          metricValue = metrics.errorRate;
          break;
        default:
          continue;
      }

      if (this.evaluateCondition(metricValue, alert.condition, alert.threshold)) {
        await this.triggerAlert(alert, metricValue, metrics.timestamp);
        this.alertCooldowns.set(alertId, now);
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(alert: MetricAlert, value: number, timestamp: number): Promise<void> {
    try {
      const alertData = {
        id: alert.id,
        name: alert.name,
        severity: alert.severity,
        value,
        threshold: alert.threshold,
        timestamp,
        message: `Alert: ${alert.name} - Value ${value} ${alert.condition} ${alert.threshold}`
      };

      // Send to monitoring providers
      if (this.dataDog) {
        // Send as logs since sendEvent method doesn't exist
        await this.dataDog.sendLogs([{
          level: alert.severity === 'critical' ? 'error' : 'warn',
          message: alertData.message,
          service: 'scrapemaster',
          tags: { alert: alert.name, severity: alert.severity }
        }]);
      }

      if (this.newRelic) {
        await this.newRelic.sendCustomEvents([{
          eventType: 'Alert',
          attributes: alertData
        }]);
      }

      // Send notifications
      await this.sendNotifications(alert, alertData);

      logger.warn('Alert triggered', alertData);

    } catch (error) {
      logger.error('Failed to trigger alert', { error, alert: alert.id });
    }
  }

  /**
   * Send alert notifications
   */
  private async sendNotifications(alert: MetricAlert, alertData: any): Promise<void> {
    // Implementation would depend on configured notification channels
    // This is a placeholder for webhook, email, Slack, PagerDuty integration

    if (this.config.alerting?.webhookUrl) {
      try {
        await fetch(this.config.alerting.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertData)
        });
      } catch (error) {
        logger.error('Failed to send webhook notification', { error });
      }
    }
  }

  /**
   * Start continuous metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        await this.recordMetrics(metrics);
      } catch (error) {
        logger.error('Failed to collect system metrics', { error });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<PerformanceMetrics> {
    // Placeholder implementation - would integrate with actual system monitoring
    return {
      timestamp: Date.now(),
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      responseTime: Math.random() * 1000,
      errorRate: Math.random() * 10,
      throughput: Math.random() * 1000,
      activeConnections: Math.floor(Math.random() * 100),
      queueSize: Math.floor(Math.random() * 50),
      scraperSuccess: Math.random() * 100,
      scraperFailure: Math.random() * 10
    };
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboardData(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<any> {
    const endTime = Date.now();
    const startTime = endTime - this.getTimeRangeMs(timeRange);

    return {
      metrics: this.metricsBuffer.filter(m => m.timestamp >= startTime),
      alerts: Array.from(this.alerts.values()),
      summary: {
        totalMetrics: this.metricsBuffer.length,
        activeAlerts: Array.from(this.alerts.values()).filter(a => a.enabled).length,
        lastUpdate: endTime
      }
    };
  }

  private getTimeRangeMs(range: string): number {
    switch (range) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }
}

// Export singleton instance
export const monitoringSystem = new UnifiedMonitoringSystem({
  dataDog: {
    enabled: !!process.env.DATADOG_API_KEY,
    apiKey: process.env.DATADOG_API_KEY || '',
    appKey: process.env.DATADOG_APP_KEY || ''
  },
  newRelic: {
    enabled: !!process.env.NEW_RELIC_LICENSE_KEY,
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY || '',
    apiKey: process.env.NEW_RELIC_API_KEY || ''
  },
  alerting: {
    enabled: true,
    webhookUrl: process.env.MONITORING_WEBHOOK_URL,
    emailNotifications: true
  }
});
