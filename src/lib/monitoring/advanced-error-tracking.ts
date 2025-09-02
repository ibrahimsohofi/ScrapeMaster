import { EventEmitter } from 'events';
import winston from 'winston';

// Core interfaces for error tracking system
export interface ErrorEvent {
  id: string;
  timestamp: Date;
  level: ErrorLevel;
  message: string;
  stack?: string;
  context: ErrorContext;
  fingerprint: string;
  tags?: Record<string, string>;
  metadata?: any;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;
}

export interface ErrorContext {
  environment: string;
  service: string;
  component: string;
  function?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  browser?: BrowserInfo;
  device?: DeviceInfo;
  location?: LocationInfo;
}

export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  mobile: boolean;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'bot';
  os: string;
  osVersion: string;
  model?: string;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

export type ErrorLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical' | 'fatal';

export interface ErrorGroup {
  id: string;
  fingerprint: string;
  title: string;
  level: ErrorLevel;
  firstSeen: Date;
  lastSeen: Date;
  totalOccurrences: number;
  uniqueUsers: number;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  tags: Record<string, string>;
  events: ErrorEvent[];
  trend: ErrorTrend;
  impact: ErrorImpact;
}

export interface ErrorTrend {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  period: string;
  sparklineData: number[];
}

export interface ErrorImpact {
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: number;
  affectedSessions: number;
  errorRate: number;
  avgFrequency: number;
}

export interface ErrorFilter {
  level?: ErrorLevel[];
  environment?: string[];
  service?: string[];
  component?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  resolved?: boolean;
  tags?: Record<string, string>;
  search?: string;
}

export interface ErrorAnalytics {
  totalErrors: number;
  uniqueErrors: number;
  errorRate: number;
  criticalErrors: number;
  resolvedErrors: number;
  affectedUsers: number;
  topErrors: ErrorGroup[];
  errorTrends: ErrorTrendData[];
  errorDistribution: ErrorDistributionData;
  performanceImpact: PerformanceImpactData;
}

export interface ErrorTrendData {
  timestamp: Date;
  count: number;
  level: ErrorLevel;
}

export interface ErrorDistributionData {
  byLevel: Record<ErrorLevel, number>;
  byService: Record<string, number>;
  byComponent: Record<string, number>;
  byBrowser: Record<string, number>;
  byDevice: Record<string, number>;
  byLocation: Record<string, number>;
}

export interface PerformanceImpactData {
  avgResponseTimeIncrease: number;
  throughputDecrease: number;
  sessionDropRate: number;
  bounceRateIncrease: number;
}

export interface ErrorNotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: ErrorNotificationCondition[];
  channels: ErrorNotificationChannel[];
  frequency: NotificationFrequency;
  suppressionRules?: ErrorSuppressionRule[];
}

export interface ErrorNotificationCondition {
  type: 'error_count' | 'error_rate' | 'new_error' | 'error_spike' | 'critical_error';
  threshold?: number;
  timeWindow?: number; // minutes
  environment?: string[];
  service?: string[];
  level?: ErrorLevel[];
}

export interface ErrorNotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'pagerduty' | 'jira';
  endpoint: string;
  settings?: Record<string, any>;
  enabled: boolean;
}

export interface NotificationFrequency {
  type: 'immediate' | 'batched' | 'digest';
  interval?: number; // minutes for batched, hours for digest
  maxPerHour?: number;
}

export interface ErrorSuppressionRule {
  type: 'time_based' | 'occurrence_based' | 'user_based';
  duration?: number; // minutes
  maxOccurrences?: number;
  conditions?: Record<string, any>;
}

export interface ErrorSearchQuery {
  query: string;
  filters: ErrorFilter;
  sort: {
    field: 'timestamp' | 'occurrences' | 'users' | 'lastSeen';
    direction: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    limit: number;
  };
}

export interface ErrorSearchResult {
  groups: ErrorGroup[];
  total: number;
  page: number;
  totalPages: number;
  aggregations: {
    byLevel: Record<ErrorLevel, number>;
    byService: Record<string, number>;
    byTimeRange: { timestamp: Date; count: number }[];
  };
}

class AdvancedErrorTracking extends EventEmitter {
  private errorGroups: Map<string, ErrorGroup> = new Map();
  private errorEvents: Map<string, ErrorEvent> = new Map();
  private notificationRules: Map<string, ErrorNotificationRule> = new Map();
  private logger: winston.Logger;
  private retentionDays = 90;
  private fingerprintCache: Map<string, string> = new Map();
  private aggregationInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'error-tracking.log',
          maxsize: 10485760, // 10MB
          maxFiles: 5
        })
      ]
    });

    this.startBackgroundTasks();
  }

  // Capture and process errors
  captureError(error: Error | string, context: Partial<ErrorContext> = {}): string {
    const errorEvent = this.createErrorEvent(error, context);
    const fingerprint = this.generateFingerprint(errorEvent);

    errorEvent.fingerprint = fingerprint;

    // Store the event
    this.errorEvents.set(errorEvent.id, errorEvent);

    // Update or create error group
    this.updateErrorGroup(errorEvent, fingerprint);

    // Check notification rules
    this.evaluateNotificationRules(errorEvent);

    // Emit event for real-time subscribers
    this.emit('error:captured', errorEvent);

    this.logger.error('Error captured', {
      id: errorEvent.id,
      fingerprint,
      message: errorEvent.message,
      context: errorEvent.context
    });

    return errorEvent.id;
  }

  // Create error event from error object or string
  private createErrorEvent(error: Error | string, context: Partial<ErrorContext>): ErrorEvent {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    let message: string;
    let stack: string | undefined;
    let level: ErrorLevel = 'error';

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;

      // Determine level based on error type
      if (error.name === 'TypeError' || error.name === 'ReferenceError') {
        level = 'critical';
      } else if (error.name === 'ValidationError') {
        level = 'warning';
      }
    } else {
      message = String(error);
    }

    // Auto-detect context from environment
    const detectedContext = this.detectContext();

    const fullContext: ErrorContext = {
      environment: process.env.NODE_ENV || 'development',
      service: 'techflow',
      component: 'unknown',
      ...detectedContext,
      ...context
    };

    return {
      id,
      timestamp,
      level,
      message,
      stack,
      context: fullContext,
      fingerprint: '', // Will be set later
      occurrenceCount: 1,
      firstSeen: timestamp,
      lastSeen: timestamp
    };
  }

  // Generate fingerprint for error grouping
  private generateFingerprint(errorEvent: ErrorEvent): string {
    const key = `${errorEvent.message}:${errorEvent.context.component}:${errorEvent.context.function || 'unknown'}`;

    if (this.fingerprintCache.has(key)) {
      return this.fingerprintCache.get(key)!;
    }

    // Normalize the message to group similar errors
    const normalizedMessage = this.normalizeErrorMessage(errorEvent.message);

    // Create fingerprint from normalized data
    const fingerprintData = {
      message: normalizedMessage,
      component: errorEvent.context.component,
      function: errorEvent.context.function,
      stack: this.extractStackSignature(errorEvent.stack)
    };

    const fingerprint = this.hashFingerprint(JSON.stringify(fingerprintData));
    this.fingerprintCache.set(key, fingerprint);

    return fingerprint;
  }

  // Normalize error message for better grouping
  private normalizeErrorMessage(message: string): string {
    return message
      // Remove dynamic values like IDs, timestamps, URLs
      .replace(/\b\d+\b/g, 'NUMBER')
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID')
      .replace(/https?:\/\/[^\s]+/g, 'URL')
      .replace(/\b\w+@\w+\.\w+\b/g, 'EMAIL')
      // Remove file paths
      .replace(/\/[\w\-\.\/]+/g, 'PATH')
      // Normalize common patterns
      .toLowerCase()
      .trim();
  }

  // Extract meaningful stack signature
  private extractStackSignature(stack?: string): string {
    if (!stack) return '';

    const lines = stack.split('\n').slice(0, 5); // Top 5 stack frames
    return lines
      .map(line => line.replace(/:\d+:\d+/g, '')) // Remove line numbers
      .join('|');
  }

  // Hash fingerprint data
  private hashFingerprint(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Update or create error group
  private updateErrorGroup(errorEvent: ErrorEvent, fingerprint: string): void {
    let group = this.errorGroups.get(fingerprint);

    if (!group) {
      // Create new group
      group = {
        id: `group_${fingerprint}`,
        fingerprint,
        title: this.generateGroupTitle(errorEvent),
        level: errorEvent.level,
        firstSeen: errorEvent.timestamp,
        lastSeen: errorEvent.timestamp,
        totalOccurrences: 1,
        uniqueUsers: errorEvent.context.userId ? 1 : 0,
        resolved: false,
        tags: errorEvent.tags || {},
        events: [errorEvent],
        trend: {
          direction: 'stable',
          percentage: 0,
          period: '24h',
          sparklineData: [1]
        },
        impact: {
          severity: this.calculateSeverity(errorEvent),
          affectedUsers: errorEvent.context.userId ? 1 : 0,
          affectedSessions: errorEvent.context.sessionId ? 1 : 0,
          errorRate: 0,
          avgFrequency: 1
        }
      };

      this.errorGroups.set(fingerprint, group);
      this.emit('error:new_group', group);
    } else {
      // Update existing group
      group.lastSeen = errorEvent.timestamp;
      group.totalOccurrences++;
      group.events.push(errorEvent);

      // Update unique users count
      const userIds = new Set(group.events.map(e => e.context.userId).filter(Boolean));
      group.uniqueUsers = userIds.size;

      // Update trend data
      this.updateGroupTrend(group);

      // Update impact metrics
      this.updateGroupImpact(group);

      // Emit update event
      this.emit('error:group_updated', group);
    }
  }

  // Generate human-readable group title
  private generateGroupTitle(errorEvent: ErrorEvent): string {
    const component = errorEvent.context.component;
    const message = errorEvent.message.length > 100
      ? errorEvent.message.substring(0, 100) + '...'
      : errorEvent.message;

    return `${component}: ${message}`;
  }

  // Calculate error severity
  private calculateSeverity(errorEvent: ErrorEvent): 'low' | 'medium' | 'high' | 'critical' {
    switch (errorEvent.level) {
      case 'fatal':
      case 'critical':
        return 'critical';
      case 'error':
        return 'high';
      case 'warning':
        return 'medium';
      default:
        return 'low';
    }
  }

  // Update group trend analysis
  private updateGroupTrend(group: ErrorGroup): void {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const recentEvents = group.events.filter(e => e.timestamp >= oneDayAgo);
    const previousEvents = group.events.filter(e => e.timestamp >= twoDaysAgo && e.timestamp < oneDayAgo);

    const recentCount = recentEvents.length;
    const previousCount = previousEvents.length;

    if (previousCount === 0) {
      group.trend.direction = 'stable';
      group.trend.percentage = 0;
    } else {
      const change = ((recentCount - previousCount) / previousCount) * 100;
      group.trend.percentage = Math.abs(change);

      if (change > 10) {
        group.trend.direction = 'up';
      } else if (change < -10) {
        group.trend.direction = 'down';
      } else {
        group.trend.direction = 'stable';
      }
    }

    // Update sparkline data (last 24 hours in hourly buckets)
    group.trend.sparklineData = this.generateSparklineData(group, 24);
  }

  // Generate sparkline data for trend visualization
  private generateSparklineData(group: ErrorGroup, hours: number): number[] {
    const now = new Date();
    const buckets: number[] = new Array(hours).fill(0);

    group.events.forEach(event => {
      const hoursAgo = Math.floor((now.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60));
      if (hoursAgo >= 0 && hoursAgo < hours) {
        buckets[hours - 1 - hoursAgo]++;
      }
    });

    return buckets;
  }

  // Update group impact metrics
  private updateGroupImpact(group: ErrorGroup): void {
    const sessionIds = new Set(group.events.map(e => e.context.sessionId).filter(Boolean));
    group.impact.affectedSessions = sessionIds.size;

    // Calculate average frequency (occurrences per day)
    const daysSinceFirst = Math.max(1, (group.lastSeen.getTime() - group.firstSeen.getTime()) / (1000 * 60 * 60 * 24));
    group.impact.avgFrequency = group.totalOccurrences / daysSinceFirst;

    // Update severity based on frequency and impact
    if (group.impact.avgFrequency > 100 || group.impact.affectedUsers > 50) {
      group.impact.severity = 'critical';
    } else if (group.impact.avgFrequency > 50 || group.impact.affectedUsers > 20) {
      group.impact.severity = 'high';
    } else if (group.impact.avgFrequency > 10 || group.impact.affectedUsers > 5) {
      group.impact.severity = 'medium';
    } else {
      group.impact.severity = 'low';
    }
  }

  // Detect context from environment
  private detectContext(): Partial<ErrorContext> {
    // This would be enhanced with actual context detection
    return {
      environment: process.env.NODE_ENV || 'development',
      service: 'techflow',
      component: 'unknown'
    };
  }

  // Evaluate notification rules
  private evaluateNotificationRules(errorEvent: ErrorEvent): void {
    for (const [ruleId, rule] of this.notificationRules) {
      if (!rule.enabled) continue;

      const shouldNotify = rule.conditions.some(condition => {
        return this.evaluateNotificationCondition(condition, errorEvent);
      });

      if (shouldNotify) {
        this.sendNotifications(rule, errorEvent);
      }
    }
  }

  // Evaluate individual notification condition
  private evaluateNotificationCondition(condition: ErrorNotificationCondition, errorEvent: ErrorEvent): boolean {
    switch (condition.type) {
      case 'new_error':
        const group = this.errorGroups.get(errorEvent.fingerprint);
        return group?.totalOccurrences === 1;

      case 'critical_error':
        return errorEvent.level === 'critical' || errorEvent.level === 'fatal';

      case 'error_count':
        // Would implement time-window based counting
        return true; // Simplified for demo

      case 'error_rate':
        // Would implement rate calculation
        return true; // Simplified for demo

      case 'error_spike':
        // Would implement spike detection
        return true; // Simplified for demo

      default:
        return false;
    }
  }

  // Send notifications
  private async sendNotifications(rule: ErrorNotificationRule, errorEvent: ErrorEvent): Promise<void> {
    for (const channel of rule.channels) {
      if (!channel.enabled) continue;

      try {
        await this.sendNotification(channel, rule, errorEvent);
      } catch (error) {
        this.logger.error('Failed to send error notification', { channel: channel.type, error });
      }
    }
  }

  // Send notification to specific channel
  private async sendNotification(
    channel: ErrorNotificationChannel,
    rule: ErrorNotificationRule,
    errorEvent: ErrorEvent
  ): Promise<void> {
    const message = this.formatNotificationMessage(errorEvent);

    switch (channel.type) {
      case 'webhook':
        // Implementation for webhook notification
        break;
      case 'email':
        // Implementation for email notification
        break;
      case 'slack':
        // Implementation for Slack notification
        break;
      case 'sms':
        // Implementation for SMS notification
        break;
      case 'pagerduty':
        // Implementation for PagerDuty notification
        break;
      case 'jira':
        // Implementation for Jira ticket creation
        break;
    }
  }

  // Format notification message
  private formatNotificationMessage(errorEvent: ErrorEvent): string {
    return `
🚨 Error Alert: ${errorEvent.level.toUpperCase()}

Message: ${errorEvent.message}
Component: ${errorEvent.context.component}
Environment: ${errorEvent.context.environment}
Time: ${errorEvent.timestamp.toISOString()}
${errorEvent.context.url ? `URL: ${errorEvent.context.url}` : ''}
${errorEvent.context.userId ? `User: ${errorEvent.context.userId}` : ''}

Error ID: ${errorEvent.id}
    `.trim();
  }

  // Search and filter errors
  search(query: ErrorSearchQuery): ErrorSearchResult {
    let filteredGroups = Array.from(this.errorGroups.values());

    // Apply filters
    if (query.filters.level?.length) {
      filteredGroups = filteredGroups.filter(group =>
        query.filters.level!.includes(group.level)
      );
    }

    if (query.filters.resolved !== undefined) {
      filteredGroups = filteredGroups.filter(group =>
        group.resolved === query.filters.resolved
      );
    }

    if (query.filters.timeRange) {
      filteredGroups = filteredGroups.filter(group =>
        group.lastSeen >= query.filters.timeRange!.start &&
        group.lastSeen <= query.filters.timeRange!.end
      );
    }

    if (query.filters.search) {
      const searchTerm = query.filters.search.toLowerCase();
      filteredGroups = filteredGroups.filter(group =>
        group.title.toLowerCase().includes(searchTerm) ||
        group.id.toLowerCase().includes(searchTerm)
      );
    }

    // Sort results
    filteredGroups.sort((a, b) => {
      const aValue = this.getSortValue(a, query.sort.field);
      const bValue = this.getSortValue(b, query.sort.field);

      if (query.sort.direction === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Paginate
    const total = filteredGroups.length;
    const totalPages = Math.ceil(total / query.pagination.limit);
    const startIndex = (query.pagination.page - 1) * query.pagination.limit;
    const groups = filteredGroups.slice(startIndex, startIndex + query.pagination.limit);

    // Generate aggregations
    const aggregations = this.generateSearchAggregations(filteredGroups);

    return {
      groups,
      total,
      page: query.pagination.page,
      totalPages,
      aggregations
    };
  }

  // Get sort value for group
  private getSortValue(group: ErrorGroup, field: string): any {
    switch (field) {
      case 'timestamp':
        return group.lastSeen.getTime();
      case 'occurrences':
        return group.totalOccurrences;
      case 'users':
        return group.uniqueUsers;
      case 'lastSeen':
        return group.lastSeen.getTime();
      default:
        return group.lastSeen.getTime();
    }
  }

  // Generate search aggregations
  private generateSearchAggregations(groups: ErrorGroup[]) {
    const byLevel: Record<ErrorLevel, number> = {
      debug: 0, info: 0, warning: 0, error: 0, critical: 0, fatal: 0
    };
    const byService: Record<string, number> = {};
    const byTimeRange: { timestamp: Date; count: number }[] = [];

    groups.forEach(group => {
      byLevel[group.level]++;

      // Aggregate by service (from events)
      group.events.forEach(event => {
        const service = event.context.service;
        byService[service] = (byService[service] || 0) + 1;
      });
    });

    return { byLevel, byService, byTimeRange };
  }

  // Get analytics data
  getAnalytics(timeRange?: { start: Date; end: Date }): ErrorAnalytics {
    const groups = Array.from(this.errorGroups.values());
    let events = Array.from(this.errorEvents.values());

    if (timeRange) {
      events = events.filter(event =>
        event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
      );
    }

    const totalErrors = events.length;
    const uniqueErrors = groups.length;
    const criticalErrors = events.filter(e => e.level === 'critical' || e.level === 'fatal').length;
    const resolvedErrors = groups.filter(g => g.resolved).length;
    const affectedUsers = new Set(events.map(e => e.context.userId).filter(Boolean)).size;

    const errorRate = this.calculateErrorRate(events);
    const topErrors = groups
      .sort((a, b) => b.totalOccurrences - a.totalOccurrences)
      .slice(0, 10);

    const errorTrends = this.generateErrorTrends(events);
    const errorDistribution = this.generateErrorDistribution(events);
    const performanceImpact = this.calculatePerformanceImpact(events);

    return {
      totalErrors,
      uniqueErrors,
      errorRate,
      criticalErrors,
      resolvedErrors,
      affectedUsers,
      topErrors,
      errorTrends,
      errorDistribution,
      performanceImpact
    };
  }

  // Calculate error rate
  private calculateErrorRate(events: ErrorEvent[]): number {
    // Simplified calculation - would need total request count in real implementation
    const totalRequests = 10000; // Mock data
    return (events.length / totalRequests) * 100;
  }

  // Generate error trends
  private generateErrorTrends(events: ErrorEvent[]): ErrorTrendData[] {
    const trends: ErrorTrendData[] = [];
    const now = new Date();

    // Generate hourly trends for last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const hourEvents = events.filter(e =>
        e.timestamp >= hourStart && e.timestamp < hourEnd
      );

      if (hourEvents.length > 0) {
        trends.push({
          timestamp: hourStart,
          count: hourEvents.length,
          level: 'error' // Simplified
        });
      }
    }

    return trends;
  }

  // Generate error distribution
  private generateErrorDistribution(events: ErrorEvent[]): ErrorDistributionData {
    const byLevel: Record<ErrorLevel, number> = {
      debug: 0, info: 0, warning: 0, error: 0, critical: 0, fatal: 0
    };
    const byService: Record<string, number> = {};
    const byComponent: Record<string, number> = {};
    const byBrowser: Record<string, number> = {};
    const byDevice: Record<string, number> = {};
    const byLocation: Record<string, number> = {};

    events.forEach(event => {
      byLevel[event.level]++;

      const service = event.context.service;
      byService[service] = (byService[service] || 0) + 1;

      const component = event.context.component;
      byComponent[component] = (byComponent[component] || 0) + 1;

      if (event.context.browser) {
        const browser = event.context.browser.name;
        byBrowser[browser] = (byBrowser[browser] || 0) + 1;
      }

      if (event.context.device) {
        const device = event.context.device.type;
        byDevice[device] = (byDevice[device] || 0) + 1;
      }

      if (event.context.location) {
        const location = event.context.location.country || 'Unknown';
        byLocation[location] = (byLocation[location] || 0) + 1;
      }
    });

    return {
      byLevel,
      byService,
      byComponent,
      byBrowser,
      byDevice,
      byLocation
    };
  }

  // Calculate performance impact
  private calculatePerformanceImpact(events: ErrorEvent[]): PerformanceImpactData {
    // Simplified calculations - would use real performance data
    return {
      avgResponseTimeIncrease: 15.2, // percentage
      throughputDecrease: 8.5, // percentage
      sessionDropRate: 3.2, // percentage
      bounceRateIncrease: 12.1 // percentage
    };
  }

  // Add notification rule
  addNotificationRule(rule: ErrorNotificationRule): void {
    this.notificationRules.set(rule.id, rule);
    this.logger.info(`Error notification rule added: ${rule.name}`, { ruleId: rule.id });
  }

  // Remove notification rule
  removeNotificationRule(ruleId: string): void {
    this.notificationRules.delete(ruleId);
    this.logger.info(`Error notification rule removed`, { ruleId });
  }

  // Mark error group as resolved
  resolveErrorGroup(groupId: string, resolvedBy: string): boolean {
    const group = this.errorGroups.get(groupId);
    if (!group) return false;

    group.resolved = true;
    group.resolvedBy = resolvedBy;
    group.resolvedAt = new Date();

    this.emit('error:group_resolved', group);
    this.logger.info(`Error group resolved`, { groupId, resolvedBy });

    return true;
  }

  // Get error group by ID
  getErrorGroup(groupId: string): ErrorGroup | null {
    return this.errorGroups.get(groupId) || null;
  }

  // Get error event by ID
  getErrorEvent(eventId: string): ErrorEvent | null {
    return this.errorEvents.get(eventId) || null;
  }

  // Start background tasks
  private startBackgroundTasks(): void {
    // Cleanup old errors every hour
    this.aggregationInterval = setInterval(() => {
      this.cleanupOldErrors();
      this.updateGroupMetrics();
    }, 60 * 60 * 1000);
  }

  // Cleanup old errors based on retention policy
  private cleanupOldErrors(): void {
    const cutoffDate = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000);

    // Remove old events
    for (const [eventId, event] of this.errorEvents) {
      if (event.timestamp < cutoffDate) {
        this.errorEvents.delete(eventId);
      }
    }

    // Remove empty groups and update group events
    for (const [groupId, group] of this.errorGroups) {
      group.events = group.events.filter(event => event.timestamp >= cutoffDate);

      if (group.events.length === 0) {
        this.errorGroups.delete(groupId);
      } else {
        // Update group metadata
        group.firstSeen = group.events[0].timestamp;
        group.lastSeen = group.events[group.events.length - 1].timestamp;
        group.totalOccurrences = group.events.length;
      }
    }

    this.logger.info('Cleaned up old errors', {
      cutoffDate,
      remainingEvents: this.errorEvents.size,
      remainingGroups: this.errorGroups.size
    });
  }

  // Update group metrics
  private updateGroupMetrics(): void {
    for (const group of this.errorGroups.values()) {
      this.updateGroupTrend(group);
      this.updateGroupImpact(group);
    }
  }

  // Destroy and cleanup
  destroy(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    this.removeAllListeners();
  }
}

// Export singleton instance
export const errorTracker = new AdvancedErrorTracking();

// Export with renamed types to avoid conflicts
export { AdvancedErrorTracking };
export type {
  ErrorEvent as AdvancedErrorEvent,
  ErrorGroup as AdvancedErrorGroup,
  ErrorFilter as AdvancedErrorFilter,
  ErrorAnalytics as AdvancedErrorAnalytics,
  ErrorNotificationRule as AdvancedErrorNotificationRule,
  ErrorSearchQuery as AdvancedErrorSearchQuery,
  ErrorSearchResult as AdvancedErrorSearchResult
};
