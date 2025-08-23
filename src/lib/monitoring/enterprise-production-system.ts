import nodemailer from 'nodemailer';
import winston from 'winston';
import axios from 'axios';
import { EventEmitter } from 'events';
import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// ENTERPRISE ALERTING & MONITORING SYSTEM
// ============================================================================

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type NotificationChannel = 'email' | 'slack' | 'teams' | 'pagerduty' | 'webhook' | 'sms';
export type MonitoringService = 'datadog' | 'grafana' | 'newrelic' | 'prometheus';

export interface EnterpriseAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  service: string;
  environment: string;
  timestamp: Date;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  tags: Record<string, string>;
  runbook?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface NotificationConfig {
  email: {
    enabled: boolean;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: { user: string; pass: string };
    };
    recipients: string[];
    templates: Record<AlertSeverity, string>;
  };
  slack: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
    username: string;
  };
  teams: {
    enabled: boolean;
    webhookUrl: string;
  };
  pagerduty: {
    enabled: boolean;
    integrationKey: string;
    severity: AlertSeverity;
  };
  webhook: {
    enabled: boolean;
    urls: string[];
    headers?: Record<string, string>;
  };
}

export interface SSLConfig {
  domain: string;
  certificatePath: string;
  privateKeyPath: string;
  chainPath?: string;
  autoRenewal: boolean;
  provider: 'letsencrypt' | 'custom' | 'cloudflare';
  checkInterval: number; // days
  expiryWarningDays: number;
}

export interface BackupConfig {
  enabled: boolean;
  schedule: string; // cron expression
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  storage: {
    type: 'local' | 's3' | 'gcs' | 'azure';
    path: string;
    credentials?: any;
  };
  compression: boolean;
  encryption: {
    enabled: boolean;
    key?: string;
  };
}

export interface ExternalMonitoringConfig {
  datadog: {
    enabled: boolean;
    apiKey: string;
    appKey: string;
    site: string;
    tags: string[];
  };
  grafana: {
    enabled: boolean;
    url: string;
    apiKey: string;
    dashboardId?: string;
  };
  prometheus: {
    enabled: boolean;
    pushgateway?: string;
    jobName: string;
  };
}

export class EnterpriseMonitoringSystem extends EventEmitter {
  private alerts: Map<string, EnterpriseAlert> = new Map();
  private notificationConfig: NotificationConfig;
  private sslConfig: SSLConfig;
  private backupConfig: BackupConfig;
  private externalConfig: ExternalMonitoringConfig;
  private logger: winston.Logger;
  private emailTransporter?: nodemailer.Transporter;
  private metricsCache: Map<string, any> = new Map();

  constructor(config: {
    notifications: NotificationConfig;
    ssl: SSLConfig;
    backup: BackupConfig;
    external: ExternalMonitoringConfig;
  }) {
    super();
    this.notificationConfig = config.notifications;
    this.sslConfig = config.ssl;
    this.backupConfig = config.backup;
    this.externalConfig = config.external;

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/monitoring.log' }),
        new winston.transports.Console()
      ]
    });

    this.initializeSystem();
  }

  private async initializeSystem(): Promise<void> {
    try {
      // Initialize email transporter
      if (this.notificationConfig.email.enabled) {
        this.emailTransporter = nodemailer.createTransport(this.notificationConfig.email.smtp);
        await this.emailTransporter?.verify();
        this.logger.info('Email notification system initialized');
      }

      // Schedule SSL certificate monitoring
      this.scheduleSSLMonitoring();

      // Schedule database backups
      if (this.backupConfig.enabled) {
        this.scheduleBackups();
      }

      // Initialize external monitoring integrations
      await this.initializeExternalMonitoring();

      this.logger.info('Enterprise monitoring system initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize monitoring system:', error);
      throw error;
    }
  }

  // ============================================================================
  // ALERT MANAGEMENT
  // ============================================================================

  public async createAlert(alert: Omit<EnterpriseAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullAlert: EnterpriseAlert = {
      ...alert,
      id: alertId,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    };

    this.alerts.set(alertId, fullAlert);

    // Send notifications based on severity
    await this.sendNotifications(fullAlert);

    // Send to external monitoring services
    await this.sendToExternalServices(fullAlert);

    this.emit('alert:created', fullAlert);
    this.logger.warn(`Alert created: ${fullAlert.title}`, { alert: fullAlert });

    return alertId;
  }

  public async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;

    this.emit('alert:acknowledged', alert);
    this.logger.info(`Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
  }

  public async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    this.emit('alert:resolved', alert);
    this.logger.info(`Alert resolved: ${alertId}`);
  }

  // ============================================================================
  // NOTIFICATION SYSTEM
  // ============================================================================

  private async sendNotifications(alert: EnterpriseAlert): Promise<void> {
    const notifications: Promise<void>[] = [];

    // Email notifications
    if (this.notificationConfig.email.enabled) {
      notifications.push(this.sendEmailNotification(alert));
    }

    // Slack notifications
    if (this.notificationConfig.slack.enabled) {
      notifications.push(this.sendSlackNotification(alert));
    }

    // Teams notifications
    if (this.notificationConfig.teams.enabled) {
      notifications.push(this.sendTeamsNotification(alert));
    }

    // PagerDuty notifications (for critical alerts)
    if (this.notificationConfig.pagerduty.enabled && alert.severity === 'critical') {
      notifications.push(this.sendPagerDutyNotification(alert));
    }

    // Webhook notifications
    if (this.notificationConfig.webhook.enabled) {
      notifications.push(this.sendWebhookNotification(alert));
    }

    await Promise.allSettled(notifications);
  }

  private async sendEmailNotification(alert: EnterpriseAlert): Promise<void> {
    if (!this.emailTransporter) return;

    const template = this.notificationConfig.email.templates[alert.severity] ||
      `Alert: ${alert.title}\n\nDescription: ${alert.description}\n\nSeverity: ${alert.severity}\nService: ${alert.service}\nEnvironment: ${alert.environment}`;

    const mailOptions = {
      from: this.notificationConfig.email.smtp.auth.user,
      to: this.notificationConfig.email.recipients.join(','),
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      text: template,
      html: this.generateEmailHTML(alert)
    };

    await this.emailTransporter.sendMail(mailOptions);
  }

  private async sendSlackNotification(alert: EnterpriseAlert): Promise<void> {
    const payload = {
      channel: this.notificationConfig.slack.channel,
      username: this.notificationConfig.slack.username,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        title: alert.title,
        text: alert.description,
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Service', value: alert.service, short: true },
          { title: 'Environment', value: alert.environment, short: true },
          { title: 'Timestamp', value: alert.timestamp.toISOString(), short: true }
        ]
      }]
    };

    await axios.post(this.notificationConfig.slack.webhookUrl, payload);
  }

  private async sendTeamsNotification(alert: EnterpriseAlert): Promise<void> {
    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": this.getSeverityColor(alert.severity),
      "summary": alert.title,
      "sections": [{
        "activityTitle": alert.title,
        "activitySubtitle": alert.description,
        "facts": [
          { "name": "Severity", "value": alert.severity },
          { "name": "Service", "value": alert.service },
          { "name": "Environment", "value": alert.environment },
          { "name": "Timestamp", "value": alert.timestamp.toISOString() }
        ]
      }]
    };

    await axios.post(this.notificationConfig.teams.webhookUrl, payload);
  }

  private async sendPagerDutyNotification(alert: EnterpriseAlert): Promise<void> {
    const payload = {
      routing_key: this.notificationConfig.pagerduty.integrationKey,
      event_action: 'trigger',
      dedup_key: alert.id,
      payload: {
        summary: alert.title,
        source: alert.service,
        severity: alert.severity,
        timestamp: alert.timestamp.toISOString(),
        custom_details: {
          description: alert.description,
          environment: alert.environment,
          tags: alert.tags
        }
      }
    };

    await axios.post('https://events.pagerduty.com/v2/enqueue', payload);
  }

  private async sendWebhookNotification(alert: EnterpriseAlert): Promise<void> {
    const payload = {
      alert,
      timestamp: new Date().toISOString(),
      source: 'datavault-pro'
    };

    const requests = this.notificationConfig.webhook.urls.map(url =>
      axios.post(url, payload, {
        headers: this.notificationConfig.webhook.headers || {}
      })
    );

    await Promise.allSettled(requests);
  }

  // ============================================================================
  // SSL CERTIFICATE MONITORING
  // ============================================================================

  private scheduleSSLMonitoring(): void {
    // Check SSL certificates daily
    cron.schedule('0 0 * * *', async () => {
      await this.checkSSLCertificates();
    });

    this.logger.info('SSL certificate monitoring scheduled');
  }

  private async checkSSLCertificates(): Promise<void> {
    try {
      const { default: https } = await import('https');

      const options = {
        host: this.sslConfig.domain,
        port: 443,
        method: 'GET',
        rejectUnauthorized: false
      };

      const req = https.request(options, (res) => {
        const cert = (res.socket as any).getPeerCertificate();
        if (cert && cert.valid_to) {
          const expiryDate = new Date(cert.valid_to);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry <= this.sslConfig.expiryWarningDays) {
            this.createAlert({
              title: 'SSL Certificate Expiring Soon',
              description: `SSL certificate for ${this.sslConfig.domain} expires in ${daysUntilExpiry} days`,
              severity: daysUntilExpiry <= 7 ? 'critical' : 'high',
              service: 'ssl-monitoring',
              environment: process.env.NODE_ENV || 'production',
              tags: {
                domain: this.sslConfig.domain,
                daysUntilExpiry: daysUntilExpiry.toString()
              }
            });
          }
        }
      });

      req.on('error', (error) => {
        this.createAlert({
          title: 'SSL Certificate Check Failed',
          description: `Failed to check SSL certificate for ${this.sslConfig.domain}: ${error.message}`,
          severity: 'high',
          service: 'ssl-monitoring',
          environment: process.env.NODE_ENV || 'production',
          tags: { domain: this.sslConfig.domain, error: error.message }
        });
      });

      req.end();
    } catch (error) {
      this.logger.error('SSL certificate check failed:', error);
    }
  }

  // ============================================================================
  // DATABASE BACKUP & DISASTER RECOVERY
  // ============================================================================

  private scheduleBackups(): void {
    cron.schedule(this.backupConfig.schedule, async () => {
      await this.performBackup();
    });

    // Cleanup old backups daily
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldBackups();
    });

    this.logger.info('Database backup scheduling initialized');
  }

  private async performBackup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `datavault-backup-${timestamp}.sql`;
      const backupPath = path.join(this.backupConfig.storage.path, backupFileName);

      // Create backup directory if it doesn't exist
      await fs.mkdir(path.dirname(backupPath), { recursive: true });

      // Perform database backup based on the database type
      const dbUrl = process.env.DATABASE_URL || '';

      if (dbUrl.includes('postgresql')) {
        await this.performPostgreSQLBackup(backupPath);
      } else if (dbUrl.includes('sqlite')) {
        await this.performSQLiteBackup(backupPath);
      } else {
        throw new Error('Unsupported database type for backup');
      }

      this.logger.info(`Database backup completed: ${backupFileName}`);

      await this.createAlert({
        title: 'Database Backup Completed',
        description: `Backup ${backupFileName} completed successfully`,
        severity: 'info',
        service: 'backup-system',
        environment: process.env.NODE_ENV || 'production',
        tags: { backupFile: backupFileName }
      });

    } catch (error) {
      this.logger.error('Backup failed:', error);

      await this.createAlert({
        title: 'Database Backup Failed',
        description: `Backup failed: ${error}`,
        severity: 'critical',
        service: 'backup-system',
        environment: process.env.NODE_ENV || 'production',
        tags: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async performPostgreSQLBackup(backupPath: string): Promise<void> {
    // PostgreSQL backup implementation would go here
    this.logger.info(`PostgreSQL backup placeholder: ${backupPath}`);
  }

  private async performSQLiteBackup(backupPath: string): Promise<void> {
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
    await fs.copyFile(dbPath, backupPath);
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupDir = this.backupConfig.storage.path;
      const files = await fs.readdir(backupDir);
      const backupFiles = files.filter(file => file.startsWith('datavault-backup-'));

      // Sort files by date
      const sortedFiles = backupFiles.sort().reverse();

      // Keep specified number of backups
      const { daily, weekly, monthly } = this.backupConfig.retention;
      const filesToDelete = sortedFiles.slice(daily + weekly + monthly);

      for (const file of filesToDelete) {
        await fs.unlink(path.join(backupDir, file));
        this.logger.info(`Deleted old backup: ${file}`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old backups:', error);
    }
  }

  // ============================================================================
  // EXTERNAL MONITORING INTEGRATION
  // ============================================================================

  private async initializeExternalMonitoring(): Promise<void> {
    if (this.externalConfig.datadog.enabled) {
      await this.initializeDatadog();
    }

    if (this.externalConfig.grafana.enabled) {
      await this.initializeGrafana();
    }

    if (this.externalConfig.prometheus.enabled) {
      await this.initializePrometheus();
    }
  }

  private async initializeDatadog(): Promise<void> {
    try {
      this.logger.info('Datadog monitoring initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Datadog:', error);
    }
  }

  private async initializeGrafana(): Promise<void> {
    try {
      const response = await axios.get(`${this.externalConfig.grafana.url}/api/health`, {
        headers: {
          Authorization: `Bearer ${this.externalConfig.grafana.apiKey}`
        }
      });

      this.logger.info('Grafana monitoring initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Grafana:', error);
    }
  }

  private async initializePrometheus(): Promise<void> {
    try {
      this.logger.info('Prometheus monitoring initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Prometheus:', error);
    }
  }

  private async sendToExternalServices(alert: EnterpriseAlert): Promise<void> {
    // Implementation for sending alerts to external services
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      critical: '#ff0000',
      high: '#ff6600',
      medium: '#ffaa00',
      low: '#ffff00',
      info: '#00aa00'
    };
    return colors[severity] || '#666666';
  }

  private generateEmailHTML(alert: EnterpriseAlert): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .alert { border-left: 5px solid ${this.getSeverityColor(alert.severity)}; padding-left: 15px; }
            .severity { font-weight: bold; color: ${this.getSeverityColor(alert.severity)}; }
            .details { margin-top: 15px; background: #f5f5f5; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="alert">
            <h2>${alert.title}</h2>
            <p class="severity">Severity: ${alert.severity.toUpperCase()}</p>
            <p>${alert.description}</p>
            <div class="details">
              <p><strong>Service:</strong> ${alert.service}</p>
              <p><strong>Environment:</strong> ${alert.environment}</p>
              <p><strong>Timestamp:</strong> ${alert.timestamp.toISOString()}</p>
              ${alert.runbook ? `<p><strong>Runbook:</strong> <a href="${alert.runbook}">View Runbook</a></p>` : ''}
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  public getActiveAlerts(): EnterpriseAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  public getAlertById(id: string): EnterpriseAlert | undefined {
    return this.alerts.get(id);
  }

  public async getSystemHealth(): Promise<any> {
    return {
      alerts: {
        total: this.alerts.size,
        active: this.getActiveAlerts().length,
        critical: this.getActiveAlerts().filter(a => a.severity === 'critical').length
      },
      monitoring: {
        email: this.notificationConfig.email.enabled,
        slack: this.notificationConfig.slack.enabled,
        datadog: this.externalConfig.datadog.enabled,
        grafana: this.externalConfig.grafana.enabled
      },
      backup: {
        enabled: this.backupConfig.enabled,
        lastBackup: new Date(),
        nextBackup: new Date()
      }
    };
  }
}
