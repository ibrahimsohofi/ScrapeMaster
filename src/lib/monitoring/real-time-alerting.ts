import { EventEmitter } from 'events';
import winston from 'winston';
import { metricsEngine } from './metrics-engine';
import { errorTracker } from './advanced-error-tracking';
import axios from 'axios';

// Core interfaces for real-time alerting system
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: AlertPriority;
  conditions: AlertCondition[];
  channels: NotificationChannel[];
  escalation: EscalationPolicy;
  suppressionRules: SuppressionRule[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical' | 'emergency';

export interface AlertCondition {
  id: string;
  type: AlertConditionType;
  metric: string;
  operator: ComparisonOperator;
  threshold: number;
  timeWindow: number; // seconds
  aggregation: AggregationType;
  filters?: MetricFilter[];
}

export type AlertConditionType =
  | 'metric_threshold'
  | 'metric_change'
  | 'metric_anomaly'
  | 'error_rate'
  | 'uptime_check'
  | 'composite';

export type ComparisonOperator = '>' | '<' | '>=' | '<=' | '==' | '!=' | 'between' | 'not_between';
export type AggregationType = 'avg' | 'sum' | 'min' | 'max' | 'count' | 'rate' | 'percentile';

export interface MetricFilter {
  field: string;
  operator: 'equals' | 'contains' | 'regex' | 'in' | 'not_in';
  value: string | string[];
}

export interface NotificationChannel {
  id: string;
  type: NotificationChannelType;
  name: string;
  config: NotificationConfig;
  enabled: boolean;
  retryPolicy: RetryPolicy;
}

export type NotificationChannelType = 'email' | 'webhook' | 'slack' | 'discord' | 'sms' | 'pagerduty' | 'teams';

export interface NotificationConfig {
  // Email config
  to?: string[];
  from?: string;
  subject?: string;
  template?: string;

  // Webhook config
  url?: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payload?: any;

  // Slack config
  webhook_url?: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;

  // SMS config
  phone_numbers?: string[];
  service_provider?: 'twilio' | 'aws_sns';

  // PagerDuty config
  integration_key?: string;
  severity?: string;

  // Teams config
  webhook_url_teams?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  timeout: number; // minutes
  autoAcknowledge: boolean;
  autoResolve: boolean;
}

export interface EscalationLevel {
  level: number;
  delay: number; // minutes
  channels: string[]; // channel IDs
  oncall?: string[]; // user IDs
}

export interface SuppressionRule {
  id: string;
  type: 'time_based' | 'condition_based' | 'maintenance';
  schedule?: TimeSchedule;
  conditions?: AlertCondition[];
  description: string;
  enabled: boolean;
}

export interface TimeSchedule {
  timezone: string;
  days: string[]; // ['monday', 'tuesday', etc.]
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface Alert {
  id: string;
  ruleId: string;
  status: AlertStatus;
  priority: AlertPriority;
  title: string;
  description: string;
  conditions: AlertCondition[];
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  escalationLevel: number;
  notificationsSent: NotificationLog[];
  metadata: Record<string, any>;
}

export type AlertStatus = 'triggered' | 'acknowledged' | 'resolved' | 'suppressed';

export interface NotificationLog {
  id: string;
  channelId: string;
  channelType: NotificationChannelType;
  sentAt: Date;
  status: 'success' | 'failed' | 'pending' | 'retrying';
  attempts: number;
  error?: string;
  metadata?: any;
}

export class RealTimeAlertingSystem extends EventEmitter {
  private logger: winston.Logger;
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();
  private suppressionCache: Map<string, boolean> = new Map();
  private evaluationInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'alerts.log' })
      ]
    });

    this.startEvaluationLoop();
    this.setupEventListeners();
  }

  // Add alert rule
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    this.logger.info(`Alert rule added: ${rule.name}`, { ruleId: rule.id });
    this.emit('rule:added', rule);
  }

  // Update alert rule
  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Alert rule not found: ${ruleId}`);
    }

    const updatedRule = { ...rule, ...updates, updatedAt: new Date() };
    this.rules.set(ruleId, updatedRule);
    this.logger.info(`Alert rule updated: ${rule.name}`, { ruleId });
    this.emit('rule:updated', updatedRule);
  }

  // Delete alert rule
  deleteRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Alert rule not found: ${ruleId}`);
    }

    this.rules.delete(ruleId);
    this.logger.info(`Alert rule deleted: ${rule.name}`, { ruleId });
    this.emit('rule:deleted', { ruleId, rule });
  }

  // Add notification channel
  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
    this.logger.info(`Notification channel added: ${channel.name}`, { channelId: channel.id });
    this.emit('channel:added', channel);
  }

  // Update notification channel
  updateChannel(channelId: string, updates: Partial<NotificationChannel>): void {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Notification channel not found: ${channelId}`);
    }

    const updatedChannel = { ...channel, ...updates };
    this.channels.set(channelId, updatedChannel);
    this.logger.info(`Notification channel updated: ${channel.name}`, { channelId });
    this.emit('channel:updated', updatedChannel);
  }

  // Delete notification channel
  deleteChannel(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Notification channel not found: ${channelId}`);
    }

    this.channels.delete(channelId);
    this.logger.info(`Notification channel deleted: ${channel.name}`, { channelId });
    this.emit('channel:deleted', { channelId, channel });
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string, userId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    if (alert.status === 'acknowledged') {
      throw new Error(`Alert already acknowledged: ${alertId}`);
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    // Clear escalation timer
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    this.logger.info(`Alert acknowledged: ${alert.title}`, { alertId, userId });
    this.emit('alert:acknowledged', alert);
  }

  // Resolve alert
  resolveAlert(alertId: string, userId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = userId;

    // Clear escalation timer
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    // Remove from active alerts after a delay (for history)
    setTimeout(() => {
      this.activeAlerts.delete(alertId);
    }, 300000); // 5 minutes

    this.logger.info(`Alert resolved: ${alert.title}`, { alertId, userId });
    this.emit('alert:resolved', alert);
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.status !== 'resolved')
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
  }

  // Get alert history
  getAlertHistory(ruleId?: string, limit = 100): Alert[] {
    let alerts = Array.from(this.activeAlerts.values());

    if (ruleId) {
      alerts = alerts.filter(alert => alert.ruleId === ruleId);
    }

    return alerts
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }

  // Start evaluation loop
  private startEvaluationLoop(): void {
    this.evaluationInterval = setInterval(async () => {
      await this.evaluateRules();
    }, 30000); // Every 30 seconds
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Listen to metrics engine events
    metricsEngine.on('metric:recorded', (metric) => {
      this.evaluateMetricRules(metric);
    });

    // Listen to error tracker events
    errorTracker.on('error:recorded', (error) => {
      this.evaluateErrorRules(error);
    });
  }

  // Evaluate all rules
  private async evaluateRules(): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      try {
        // Check suppression rules
        if (await this.isRuleSuppressed(rule)) {
          continue;
        }

        // Evaluate conditions
        const conditionResults = await Promise.all(
          rule.conditions.map(condition => this.evaluateCondition(condition))
        );

        // Check if all conditions are met
        const allConditionsMet = conditionResults.every(result => result);

        if (allConditionsMet) {
          await this.triggerAlert(rule);
        }
      } catch (error) {
        this.logger.error(`Error evaluating rule ${rule.name}:`, error);
      }
    }
  }

  // Evaluate metric-specific rules
  private async evaluateMetricRules(metric: any): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const relevantConditions = rule.conditions.filter(condition =>
        condition.metric === metric.name && condition.type === 'metric_threshold'
      );

      if (relevantConditions.length === 0) continue;

      try {
        if (await this.isRuleSuppressed(rule)) continue;

        const conditionResults = await Promise.all(
          relevantConditions.map(condition => this.evaluateCondition(condition))
        );

        if (conditionResults.every(result => result)) {
          await this.triggerAlert(rule);
        }
      } catch (error) {
        this.logger.error(`Error evaluating metric rule ${rule.name}:`, error);
      }
    }
  }

  // Evaluate error-specific rules
  private async evaluateErrorRules(error: any): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const relevantConditions = rule.conditions.filter(condition =>
        condition.type === 'error_rate'
      );

      if (relevantConditions.length === 0) continue;

      try {
        if (await this.isRuleSuppressed(rule)) continue;

        const conditionResults = await Promise.all(
          relevantConditions.map(condition => this.evaluateCondition(condition))
        );

        if (conditionResults.every(result => result)) {
          await this.triggerAlert(rule);
        }
      } catch (error) {
        this.logger.error(`Error evaluating error rule ${rule.name}:`, error);
      }
    }
  }

  // Evaluate a single condition
  private async evaluateCondition(condition: AlertCondition): Promise<boolean> {
    try {
      switch (condition.type) {
        case 'metric_threshold':
          return await this.evaluateMetricThreshold(condition);
        case 'metric_change':
          return await this.evaluateMetricChange(condition);
        case 'metric_anomaly':
          return await this.evaluateMetricAnomaly(condition);
        case 'error_rate':
          return await this.evaluateErrorRate(condition);
        case 'uptime_check':
          return await this.evaluateUptimeCheck(condition);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error('Error evaluating condition:', error);
      return false;
    }
  }

  // Evaluate metric threshold condition
  private async evaluateMetricThreshold(condition: AlertCondition): Promise<boolean> {
    const aggregation = await metricsEngine.getAggregation(
      condition.metric,
      condition.timeWindow,
      condition.aggregation
    );

    if (!aggregation) return false;

    switch (condition.operator) {
      case '>':
        return aggregation.value > condition.threshold;
      case '<':
        return aggregation.value < condition.threshold;
      case '>=':
        return aggregation.value >= condition.threshold;
      case '<=':
        return aggregation.value <= condition.threshold;
      case '==':
        return aggregation.value === condition.threshold;
      case '!=':
        return aggregation.value !== condition.threshold;
      default:
        return false;
    }
  }

  // Evaluate metric change condition
  private async evaluateMetricChange(condition: AlertCondition): Promise<boolean> {
    const currentAggregation = await metricsEngine.getAggregation(
      condition.metric,
      condition.timeWindow,
      condition.aggregation
    );

    const previousAggregation = await metricsEngine.getAggregation(
      condition.metric,
      condition.timeWindow * 2,
      condition.aggregation
    );

    if (!currentAggregation || !previousAggregation) return false;

    const changePercent = ((currentAggregation.value - previousAggregation.value) / previousAggregation.value) * 100;

    switch (condition.operator) {
      case '>':
        return changePercent > condition.threshold;
      case '<':
        return changePercent < condition.threshold;
      default:
        return false;
    }
  }

  // Evaluate metric anomaly condition (simplified)
  private async evaluateMetricAnomaly(condition: AlertCondition): Promise<boolean> {
    // This would use more sophisticated anomaly detection algorithms
    // For now, using a simple deviation-based approach
    const metrics = await metricsEngine.queryMetrics({
      metric: condition.metric,
      timeRange: {
        start: new Date(Date.now() - condition.timeWindow * 1000),
        end: new Date()
      }
    });

    if (metrics.length < 10) return false;

    const values = metrics.map(m => m.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const latestValue = values[values.length - 1];
    const deviations = Math.abs(latestValue - mean) / stdDev;

    return deviations > condition.threshold;
  }

  // Evaluate error rate condition
  private async evaluateErrorRate(condition: AlertCondition): Promise<boolean> {
    const errorAggregation = await metricsEngine.getAggregation(
      'errors.count',
      condition.timeWindow,
      'sum'
    );

    const totalAggregation = await metricsEngine.getAggregation(
      'requests.count',
      condition.timeWindow,
      'sum'
    );

    if (!errorAggregation || !totalAggregation || totalAggregation.value === 0) return false;

    const errorRate = (errorAggregation.value / totalAggregation.value) * 100;

    switch (condition.operator) {
      case '>':
        return errorRate > condition.threshold;
      case '<':
        return errorRate < condition.threshold;
      default:
        return false;
    }
  }

  // Evaluate uptime check condition
  private async evaluateUptimeCheck(condition: AlertCondition): Promise<boolean> {
    const uptimeAggregation = await metricsEngine.getAggregation(
      'system.uptime.percentage',
      condition.timeWindow,
      'avg'
    );

    if (!uptimeAggregation) return false;

    switch (condition.operator) {
      case '<':
        return uptimeAggregation.value < condition.threshold;
      case '<=':
        return uptimeAggregation.value <= condition.threshold;
      default:
        return false;
    }
  }

  // Check if rule is suppressed
  private async isRuleSuppressed(rule: AlertRule): Promise<boolean> {
    const cacheKey = `suppression:${rule.id}`;
    const cached = this.suppressionCache.get(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    for (const suppressionRule of rule.suppressionRules) {
      if (!suppressionRule.enabled) continue;

      let suppressed = false;

      switch (suppressionRule.type) {
        case 'time_based':
          suppressed = this.isTimeBasedSuppressed(suppressionRule);
          break;
        case 'condition_based':
          suppressed = await this.isConditionBasedSuppressed(suppressionRule);
          break;
        case 'maintenance':
          suppressed = true; // Maintenance mode suppresses all alerts
          break;
      }

      if (suppressed) {
        this.suppressionCache.set(cacheKey, true);
        // Cache for 1 minute
        setTimeout(() => this.suppressionCache.delete(cacheKey), 60000);
        return true;
      }
    }

    this.suppressionCache.set(cacheKey, false);
    setTimeout(() => this.suppressionCache.delete(cacheKey), 60000);
    return false;
  }

  // Check time-based suppression
  private isTimeBasedSuppressed(suppressionRule: SuppressionRule): boolean {
    if (!suppressionRule.schedule) return false;

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase(); // Get day of week
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return suppressionRule.schedule.days.includes(currentDay) &&
           currentTime >= suppressionRule.schedule.startTime &&
           currentTime <= suppressionRule.schedule.endTime;
  }

  // Check condition-based suppression
  private async isConditionBasedSuppressed(suppressionRule: SuppressionRule): Promise<boolean> {
    if (!suppressionRule.conditions) return false;

    const conditionResults = await Promise.all(
      suppressionRule.conditions.map(condition => this.evaluateCondition(condition))
    );

    return conditionResults.every(result => result);
  }

  // Trigger alert
  private async triggerAlert(rule: AlertRule): Promise<void> {
    // Check if alert is already active
    const existingAlert = Array.from(this.activeAlerts.values()).find(
      alert => alert.ruleId === rule.id && alert.status !== 'resolved'
    );

    if (existingAlert) {
      // Update existing alert
      existingAlert.escalationLevel = Math.min(existingAlert.escalationLevel + 1, rule.escalation.levels.length - 1);
      this.logger.debug(`Alert escalated: ${existingAlert.title}`, { alertId: existingAlert.id });
      return;
    }

    // Create new alert
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      ruleId: rule.id,
      status: 'triggered',
      priority: rule.priority,
      title: rule.name,
      description: rule.description,
      conditions: rule.conditions,
      triggeredAt: new Date(),
      escalationLevel: 0,
      notificationsSent: [],
      metadata: rule.metadata || {}
    };

    this.activeAlerts.set(alert.id, alert);

    // Send notifications
    await this.sendNotifications(alert, rule);

    // Setup escalation timer
    this.setupEscalationTimer(alert, rule);

    this.logger.info(`Alert triggered: ${alert.title}`, { alertId: alert.id, ruleId: rule.id });
    this.emit('alert:triggered', alert);
  }

  // Send notifications
  private async sendNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    const escalationLevel = rule.escalation.levels[alert.escalationLevel];
    if (!escalationLevel) return;

    const channelIds = escalationLevel.channels;

    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId);
      if (!channel || !channel.enabled) continue;

      try {
        await this.sendNotification(alert, channel);
      } catch (error) {
        this.logger.error(`Failed to send notification via ${channel.type}:`, error);
      }
    }
  }

  // Send individual notification
  private async sendNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const notificationLog: NotificationLog = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      channelId: channel.id,
      channelType: channel.type,
      sentAt: new Date(),
      status: 'pending',
      attempts: 0
    };

    alert.notificationsSent.push(notificationLog);

    try {
      switch (channel.type) {
        case 'webhook':
          await this.sendWebhookNotification(alert, channel, notificationLog);
          break;
        case 'slack':
          await this.sendSlackNotification(alert, channel, notificationLog);
          break;
        case 'discord':
          await this.sendDiscordNotification(alert, channel, notificationLog);
          break;
        case 'email':
          await this.sendEmailNotification(alert, channel, notificationLog);
          break;
        case 'sms':
          await this.sendSMSNotification(alert, channel, notificationLog);
          break;
        case 'teams':
          await this.sendTeamsNotification(alert, channel, notificationLog);
          break;
        default:
          throw new Error(`Unsupported notification channel type: ${channel.type}`);
      }

      notificationLog.status = 'success';
      this.logger.info(`Notification sent successfully`, {
        alertId: alert.id,
        channelId: channel.id,
        channelType: channel.type
      });
    } catch (error) {
      notificationLog.status = 'failed';
      notificationLog.error = error instanceof Error ? error.message : String(error);
      this.logger.error(`Notification failed`, {
        alertId: alert.id,
        channelId: channel.id,
        channelType: channel.type,
        error
      });

      // Retry logic
      if (notificationLog.attempts < channel.retryPolicy.maxRetries) {
        setTimeout(() => {
          this.retryNotification(alert, channel, notificationLog);
        }, this.calculateRetryDelay(notificationLog.attempts, channel.retryPolicy));
      }
    }
  }

  // Send webhook notification
  private async sendWebhookNotification(alert: Alert, channel: NotificationChannel, log: NotificationLog): Promise<void> {
    const config = channel.config;
    if (!config.url) throw new Error('Webhook URL not configured');

    const payload = {
      alert: {
        id: alert.id,
        title: alert.title,
        description: alert.description,
        priority: alert.priority,
        status: alert.status,
        triggeredAt: alert.triggeredAt,
        escalationLevel: alert.escalationLevel
      },
      ...config.payload
    };

    log.attempts++;

    const response = await axios({
      method: config.method || 'POST',
      url: config.url,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      data: payload,
      timeout: 10000
    });

    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Send Slack notification
  private async sendSlackNotification(alert: Alert, channel: NotificationChannel, log: NotificationLog): Promise<void> {
    const config = channel.config;
    if (!config.webhook_url) throw new Error('Slack webhook URL not configured');

    const color = this.getAlertColor(alert.priority);
    const payload = {
      username: config.username || 'DataVault Pro Alerts',
      icon_emoji: config.icon_emoji || ':warning:',
      channel: config.channel,
      attachments: [{
        color,
        title: `🚨 ${alert.title}`,
        text: alert.description,
        fields: [
          {
            title: 'Priority',
            value: alert.priority.toUpperCase(),
            short: true
          },
          {
            title: 'Status',
            value: alert.status.toUpperCase(),
            short: true
          },
          {
            title: 'Triggered At',
            value: alert.triggeredAt.toISOString(),
            short: true
          },
          {
            title: 'Alert ID',
            value: alert.id,
            short: true
          }
        ],
        footer: 'DataVault Pro Monitoring',
        ts: Math.floor(alert.triggeredAt.getTime() / 1000)
      }]
    };

    log.attempts++;

    const response = await axios.post(config.webhook_url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Send Discord notification
  private async sendDiscordNotification(alert: Alert, channel: NotificationChannel, log: NotificationLog): Promise<void> {
    const config = channel.config;
    if (!config.webhook_url) throw new Error('Discord webhook URL not configured');

    const color = this.getAlertColorNumber(alert.priority);
    const payload = {
      username: 'DataVault Pro Alerts',
      embeds: [{
        title: `🚨 ${alert.title}`,
        description: alert.description,
        color,
        fields: [
          {
            name: 'Priority',
            value: alert.priority.toUpperCase(),
            inline: true
          },
          {
            name: 'Status',
            value: alert.status.toUpperCase(),
            inline: true
          },
          {
            name: 'Triggered At',
            value: alert.triggeredAt.toISOString(),
            inline: true
          }
        ],
        footer: {
          text: `Alert ID: ${alert.id}`
        },
        timestamp: alert.triggeredAt.toISOString()
      }]
    };

    log.attempts++;

    const response = await axios.post(config.webhook_url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Send email notification (placeholder)
  private async sendEmailNotification(alert: Alert, channel: NotificationChannel, log: NotificationLog): Promise<void> {
    // This would integrate with an email service like SendGrid, AWS SES, etc.
    log.attempts++;
    this.logger.info('Email notification would be sent here', { alert: alert.id, channel: channel.id });
  }

  // Send SMS notification (placeholder)
  private async sendSMSNotification(alert: Alert, channel: NotificationChannel, log: NotificationLog): Promise<void> {
    // This would integrate with an SMS service like Twilio, AWS SNS, etc.
    log.attempts++;
    this.logger.info('SMS notification would be sent here', { alert: alert.id, channel: channel.id });
  }

  // Send Teams notification
  private async sendTeamsNotification(alert: Alert, channel: NotificationChannel, log: NotificationLog): Promise<void> {
    const config = channel.config;
    if (!config.webhook_url_teams) throw new Error('Teams webhook URL not configured');

    const color = this.getAlertColor(alert.priority);
    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: color,
      summary: `Alert: ${alert.title}`,
      sections: [{
        activityTitle: `🚨 ${alert.title}`,
        activitySubtitle: alert.description,
        facts: [
          {
            name: 'Priority',
            value: alert.priority.toUpperCase()
          },
          {
            name: 'Status',
            value: alert.status.toUpperCase()
          },
          {
            name: 'Triggered At',
            value: alert.triggeredAt.toISOString()
          },
          {
            name: 'Alert ID',
            value: alert.id
          }
        ]
      }]
    };

    log.attempts++;

    const response = await axios.post(config.webhook_url_teams, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Retry notification
  private async retryNotification(alert: Alert, channel: NotificationChannel, log: NotificationLog): Promise<void> {
    log.status = 'retrying';
    try {
      await this.sendNotification(alert, channel);
    } catch (error) {
      this.logger.error(`Notification retry failed`, {
        alertId: alert.id,
        channelId: channel.id,
        attempt: log.attempts,
        error
      });
    }
  }

  // Calculate retry delay
  private calculateRetryDelay(attempt: number, retryPolicy: RetryPolicy): number {
    const delay = retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, attempt);
    return Math.min(delay, retryPolicy.maxDelay);
  }

  // Setup escalation timer
  private setupEscalationTimer(alert: Alert, rule: AlertRule): void {
    if (alert.escalationLevel >= rule.escalation.levels.length - 1) return;

    const timeout = rule.escalation.timeout * 60 * 1000; // Convert to milliseconds

    const timer = setTimeout(async () => {
      if (alert.status === 'triggered') {
        alert.escalationLevel++;
        await this.sendNotifications(alert, rule);
        this.setupEscalationTimer(alert, rule);

        this.logger.info(`Alert escalated to level ${alert.escalationLevel}`, { alertId: alert.id });
        this.emit('alert:escalated', alert);
      }
    }, timeout);

    this.escalationTimers.set(alert.id, timer);
  }

  // Get alert color for Slack
  private getAlertColor(priority: AlertPriority): string {
    switch (priority) {
      case 'emergency':
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'good';
      case 'low':
        return '#36a64f';
      default:
        return '#36a64f';
    }
  }

  // Get alert color number for Discord
  private getAlertColorNumber(priority: AlertPriority): number {
    switch (priority) {
      case 'emergency':
      case 'critical':
        return 0xff0000; // Red
      case 'high':
        return 0xff8c00; // Orange
      case 'medium':
        return 0xffff00; // Yellow
      case 'low':
        return 0x00ff00; // Green
      default:
        return 0x00ff00;
    }
  }

  // Get priority weight for sorting
  private getPriorityWeight(priority: AlertPriority): number {
    switch (priority) {
      case 'emergency': return 5;
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Clear evaluation interval
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
    }

    // Clear all escalation timers
    for (const timer of this.escalationTimers.values()) {
      clearTimeout(timer);
    }
    this.escalationTimers.clear();

    this.logger.info('Real-time alerting system cleaned up');
  }
}

// Export singleton instance
export const alertingSystem = new RealTimeAlertingSystem();
