import { EventEmitter } from 'events';
import { metricsEngine } from './advanced-metrics';

// Core error tracking interfaces
export interface ErrorEvent {
  id: string;
  timestamp: Date;
  level: ErrorLevel;
  message: string;
  type: string;
  source: ErrorSource;
  stack?: string;
  context: ErrorContext;
  fingerprint: string;
  tags: { [key: string]: string };
  user?: UserContext;
  request?: RequestContext;
  metadata?: { [key: string]: any };
}

export interface ErrorGroup {
  id: string;
  fingerprint: string;
  title: string;
  message: string;
  type: string;
  level: ErrorLevel;
  status: ErrorStatus;
  firstSeen: Date;
  lastSeen: Date;
  count: number;
  userCount: number;
  events: ErrorEvent[];
  trends: ErrorTrend[];
  assignee?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  tags: string[];
}

export interface ErrorContext {
  environment: string;
  component: string;
  function?: string;
  file?: string;
  line?: number;
  column?: number;
  version?: string;
  build?: string;
}

export interface UserContext {
  id: string;
  email?: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RequestContext {
  method: string;
  url: string;
  headers: { [key: string]: string };
  query?: { [key: string]: string };
  body?: any;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
}

export interface ErrorTrend {
  timestamp: Date;
  count: number;
  userCount: number;
}

export type ErrorLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal';
export type ErrorStatus = 'unresolved' | 'resolved' | 'ignored' | 'monitoring';
export type ErrorSource = 'api' | 'scraper' | 'pipeline' | 'proxy' | 'database' | 'external' | 'client';

export interface ErrorFilter {
  level?: ErrorLevel[];
  source?: ErrorSource[];
  status?: ErrorStatus[];
  dateRange?: { start: Date; end: Date };
  search?: string;
  tags?: string[];
  assignee?: string;
  resolved?: boolean;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByLevel: { [key in ErrorLevel]: number };
  errorsBySource: { [key in ErrorSource]: number };
  errorsByStatus: { [key in ErrorStatus]: number };
  errorRate: number;
  avgResolutionTime: number;
  topErrorGroups: ErrorGroup[];
  recentErrors: ErrorEvent[];
}

export interface ErrorAlert {
  id: string;
  name: string;
  conditions: ErrorAlertCondition[];
  threshold: number;
  timeWindow: number; // minutes
  cooldown: number; // minutes
  channels: string[];
  enabled: boolean;
  lastTriggered?: Date;
}

export interface ErrorAlertCondition {
  field: 'count' | 'rate' | 'new_errors' | 'error_percentage';
  operator: '>' | '<' | '>=' | '<=' | '==';
  value: number;
  filters?: ErrorFilter;
}

export interface ReleaseContext {
  version: string;
  build: string;
  deployedAt: Date;
  environment: string;
  author?: string;
  commitHash?: string;
}

export interface ErrorInsight {
  type: 'spike' | 'new_error' | 'regression' | 'resolved' | 'trending';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  actionable: boolean;
  suggestions?: string[];
  detectedAt: Date;
}

export class ErrorTrackingEngine extends EventEmitter {
  private errorGroups: Map<string, ErrorGroup> = new Map();
  private errorEvents: Map<string, ErrorEvent> = new Map();
  private releases: Map<string, ReleaseContext> = new Map();
  private alerts: Map<string, ErrorAlert> = new Map();
  private retentionDays = 90;
  private aggregationInterval?: NodeJS.Timeout;
  private alertEvaluationInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.startBackgroundTasks();
  }

  // Core error capture
  captureError(
    error: Error,
    context: Partial<ErrorContext> = {},
    user?: UserContext,
    request?: RequestContext,
    tags: { [key: string]: string } = {}
  ): string {
    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      level: this.determineErrorLevel(error),
      message: error.message,
      type: error.constructor.name,
      source: context.component as ErrorSource || 'api',
      stack: error.stack,
      context: {
        environment: process.env.NODE_ENV || 'development',
        component: 'unknown',
        version: process.env.APP_VERSION || '1.0.0',
        ...context
      },
      fingerprint: this.generateFingerprint(error, context),
      tags,
      user,
      request
    };

    return this.processErrorEvent(errorEvent);
  }

  // Capture different types of errors
  captureException(error: Error, extras?: any): string {
    return this.captureError(error, extras?.context, extras?.user, extras?.request, extras?.tags);
  }

  captureMessage(
    message: string,
    level: ErrorLevel = 'info',
    context?: Partial<ErrorContext>,
    extras?: any
  ): string {
    const error = new Error(message);
    error.name = 'CapturedMessage';

    const errorEvent: ErrorEvent = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      level,
      message,
      type: 'Message',
      source: context?.component as ErrorSource || 'api',
      context: {
        environment: process.env.NODE_ENV || 'development',
        component: 'unknown',
        version: process.env.APP_VERSION || '1.0.0',
        ...context
      },
      fingerprint: this.generateFingerprintFromMessage(message, context),
      tags: extras?.tags || {},
      user: extras?.user,
      request: extras?.request,
      metadata: extras?.metadata
    };

    return this.processErrorEvent(errorEvent);
  }

  // Error processing and grouping
  private processErrorEvent(errorEvent: ErrorEvent): string {
    // Store the event
    this.errorEvents.set(errorEvent.id, errorEvent);

    // Find or create error group
    let errorGroup = this.errorGroups.get(errorEvent.fingerprint);

    if (!errorGroup) {
      errorGroup = this.createErrorGroup(errorEvent);
      this.errorGroups.set(errorGroup.fingerprint, errorGroup);
      this.emit('newErrorGroup', errorGroup);
    } else {
      this.updateErrorGroup(errorGroup, errorEvent);
    }

    // Update metrics
    this.updateErrorMetrics(errorEvent);

    // Emit events
    this.emit('errorCaptured', errorEvent);
    this.emit('errorGroupUpdated', errorGroup);

    // Clean up old errors
    this.cleanupOldErrors();

    // Evaluate alerts
    this.evaluateErrorAlerts(errorEvent);

    return errorEvent.id;
  }

  private createErrorGroup(errorEvent: ErrorEvent): ErrorGroup {
    return {
      id: this.generateErrorId(),
      fingerprint: errorEvent.fingerprint,
      title: this.generateErrorTitle(errorEvent),
      message: errorEvent.message,
      type: errorEvent.type,
      level: errorEvent.level,
      status: 'unresolved',
      firstSeen: errorEvent.timestamp,
      lastSeen: errorEvent.timestamp,
      count: 1,
      userCount: errorEvent.user ? 1 : 0,
      events: [errorEvent],
      trends: [],
      tags: Object.keys(errorEvent.tags)
    };
  }

  private updateErrorGroup(errorGroup: ErrorGroup, errorEvent: ErrorEvent): void {
    errorGroup.lastSeen = errorEvent.timestamp;
    errorGroup.count++;

    if (errorEvent.user) {
      const uniqueUsers = new Set(
        errorGroup.events
          .filter(e => e.user)
          .map(e => e.user!.id)
      );
      uniqueUsers.add(errorEvent.user.id);
      errorGroup.userCount = uniqueUsers.size;
    }

    errorGroup.events.push(errorEvent);

    // Keep only recent events for memory efficiency
    if (errorGroup.events.length > 100) {
      errorGroup.events = errorGroup.events.slice(-100);
    }

    // Update level if higher severity
    if (this.getErrorLevelPriority(errorEvent.level) > this.getErrorLevelPriority(errorGroup.level)) {
      errorGroup.level = errorEvent.level;
    }

    // Update trends
    this.updateErrorTrends(errorGroup);
  }

  // Error grouping and fingerprinting
  private generateFingerprint(error: Error, context: Partial<ErrorContext>): string {
    const components = [
      error.constructor.name,
      this.normalizeErrorMessage(error.message),
      context.component || '',
      this.extractStackSignature(error.stack)
    ];

    return this.hash(components.join('|'));
  }

  private generateFingerprintFromMessage(
    message: string,
    context?: Partial<ErrorContext>
  ): string {
    const components = [
      'Message',
      this.normalizeErrorMessage(message),
      context?.component || '',
      context?.function || ''
    ];

    return this.hash(components.join('|'));
  }

  private normalizeErrorMessage(message: string): string {
    // Remove dynamic parts from error messages for better grouping
    return message
      .replace(/\b\d+\b/g, 'N') // Replace numbers
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  private extractStackSignature(stack?: string): string {
    if (!stack) return '';

    const lines = stack.split('\n').slice(1, 4); // Take first 3 stack frames
    return lines
      .map(line => {
        // Extract function name and file
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        return match ? `${match[1]}@${match[2]}` : line.trim();
      })
      .join('|');
  }

  private hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Error management
  resolveErrorGroup(groupId: string, resolvedBy: string): boolean {
    const group = Array.from(this.errorGroups.values()).find(g => g.id === groupId);
    if (!group) return false;

    group.status = 'resolved';
    group.resolvedAt = new Date();
    group.resolvedBy = resolvedBy;

    this.emit('errorGroupResolved', group);
    return true;
  }

  ignoreErrorGroup(groupId: string): boolean {
    const group = Array.from(this.errorGroups.values()).find(g => g.id === groupId);
    if (!group) return false;

    group.status = 'ignored';
    this.emit('errorGroupIgnored', group);
    return true;
  }

  assignErrorGroup(groupId: string, assignee: string): boolean {
    const group = Array.from(this.errorGroups.values()).find(g => g.id === groupId);
    if (!group) return false;

    group.assignee = assignee;
    this.emit('errorGroupAssigned', { group, assignee });
    return true;
  }

  addTagsToErrorGroup(groupId: string, tags: string[]): boolean {
    const group = Array.from(this.errorGroups.values()).find(g => g.id === groupId);
    if (!group) return false;

    group.tags = [...new Set([...group.tags, ...tags])];
    this.emit('errorGroupTagged', { group, tags });
    return true;
  }

  // Querying and filtering
  getErrorGroups(filter: ErrorFilter = {}, limit = 50, offset = 0): ErrorGroup[] {
    let groups = Array.from(this.errorGroups.values());

    // Apply filters
    if (filter.level?.length) {
      groups = groups.filter(g => filter.level!.includes(g.level));
    }

    if (filter.status?.length) {
      groups = groups.filter(g => filter.status!.includes(g.status));
    }

    if (filter.dateRange) {
      groups = groups.filter(g =>
        g.lastSeen >= filter.dateRange!.start &&
        g.lastSeen <= filter.dateRange!.end
      );
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      groups = groups.filter(g =>
        g.title.toLowerCase().includes(searchTerm) ||
        g.message.toLowerCase().includes(searchTerm)
      );
    }

    if (filter.tags?.length) {
      groups = groups.filter(g =>
        filter.tags!.some(tag => g.tags.includes(tag))
      );
    }

    if (filter.assignee) {
      groups = groups.filter(g => g.assignee === filter.assignee);
    }

    if (filter.resolved !== undefined) {
      groups = groups.filter(g =>
        filter.resolved ? g.status === 'resolved' : g.status !== 'resolved'
      );
    }

    // Sort by last seen (most recent first)
    groups.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());

    return groups.slice(offset, offset + limit);
  }

  getErrorGroup(groupId: string): ErrorGroup | null {
    return Array.from(this.errorGroups.values()).find(g => g.id === groupId) || null;
  }

  getErrorEvent(eventId: string): ErrorEvent | null {
    return this.errorEvents.get(eventId) || null;
  }

  getErrorStats(timeWindow: number = 24 * 60 * 60 * 1000): ErrorStats {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - timeWindow);

    const recentEvents = Array.from(this.errorEvents.values())
      .filter(e => e.timestamp >= startTime);

    const recentGroups = Array.from(this.errorGroups.values())
      .filter(g => g.lastSeen >= startTime);

    const errorsByLevel = this.groupByLevel(recentEvents);
    const errorsBySource = this.groupBySource(recentEvents);
    const errorsByStatus = this.groupByStatus(recentGroups);

    const totalRequests = metricsEngine.getMetricSummary('performance.requestsPerSecond', timeWindow / 1000).sum || 1;
    const errorRate = (recentEvents.length / totalRequests) * 100;

    const resolvedGroups = recentGroups.filter(g => g.status === 'resolved' && g.resolvedAt);
    const avgResolutionTime = resolvedGroups.length > 0
      ? resolvedGroups.reduce((sum, g) => {
          return sum + (g.resolvedAt!.getTime() - g.firstSeen.getTime());
        }, 0) / resolvedGroups.length / (1000 * 60) // minutes
      : 0;

    const topErrorGroups = Array.from(this.errorGroups.values())
      .filter(g => g.status === 'unresolved')
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: recentEvents.length,
      errorsByLevel,
      errorsBySource,
      errorsByStatus,
      errorRate,
      avgResolutionTime,
      topErrorGroups,
      recentErrors: recentEvents.slice(-20)
    };
  }

  // Release tracking
  addRelease(release: ReleaseContext): void {
    this.releases.set(release.version, release);
    this.emit('releaseAdded', release);
  }

  associateErrorsWithRelease(version: string): void {
    const release = this.releases.get(version);
    if (!release) return;

    // Mark errors that occurred after this release
    Array.from(this.errorGroups.values()).forEach(group => {
      if (group.firstSeen >= release.deployedAt) {
        group.tags = [...group.tags, `release:${version}`];
      }
    });
  }

  // Error insights and analytics
  generateInsights(timeWindow: number = 24 * 60 * 60 * 1000): ErrorInsight[] {
    const insights: ErrorInsight[] = [];
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - timeWindow);

    // Detect error spikes
    const spikeInsight = this.detectErrorSpikes(startTime, endTime);
    if (spikeInsight) insights.push(spikeInsight);

    // Detect new errors
    const newErrorInsights = this.detectNewErrors(startTime, endTime);
    insights.push(...newErrorInsights);

    // Detect regressions
    const regressionInsights = this.detectRegressions(startTime, endTime);
    insights.push(...regressionInsights);

    // Trending errors
    const trendingInsights = this.detectTrendingErrors(startTime, endTime);
    insights.push(...trendingInsights);

    return insights.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  // Error alerts
  createErrorAlert(alert: Omit<ErrorAlert, 'id'>): string {
    const alertId = `error-alert-${Date.now()}`;
    this.alerts.set(alertId, { ...alert, id: alertId });
    return alertId;
  }

  updateErrorAlert(alertId: string, updates: Partial<ErrorAlert>): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    Object.assign(alert, updates);
    return true;
  }

  deleteErrorAlert(alertId: string): boolean {
    return this.alerts.delete(alertId);
  }

  getErrorAlerts(): ErrorAlert[] {
    return Array.from(this.alerts.values());
  }

  // Private helper methods
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorTitle(errorEvent: ErrorEvent): string {
    if (errorEvent.type === 'Message') {
      return errorEvent.message;
    }

    const contextInfo = errorEvent.context.function
      ? ` in ${errorEvent.context.function}()`
      : '';

    return `${errorEvent.type}: ${errorEvent.message}${contextInfo}`;
  }

  private determineErrorLevel(error: Error): ErrorLevel {
    const message = error.message.toLowerCase();

    if (message.includes('fatal') || message.includes('critical')) return 'fatal';
    if (message.includes('warn')) return 'warning';
    if (message.includes('info')) return 'info';
    if (message.includes('debug')) return 'debug';

    return 'error';
  }

  private getErrorLevelPriority(level: ErrorLevel): number {
    const priorities = { debug: 1, info: 2, warning: 3, error: 4, fatal: 5 };
    return priorities[level] || 0;
  }

  private updateErrorMetrics(errorEvent: ErrorEvent): void {
    metricsEngine.recordMetric(`errors.total`, 1);
    metricsEngine.recordMetric(`errors.by_level.${errorEvent.level}`, 1);
    metricsEngine.recordMetric(`errors.by_source.${errorEvent.source}`, 1);
    metricsEngine.recordMetric(`errors.by_type.${errorEvent.type}`, 1);
  }

  private updateErrorTrends(errorGroup: ErrorGroup): void {
    const now = new Date();
    const hourBoundary = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    let lastTrend = errorGroup.trends[errorGroup.trends.length - 1];

    if (!lastTrend || lastTrend.timestamp.getTime() !== hourBoundary.getTime()) {
      // Create new trend point
      lastTrend = {
        timestamp: hourBoundary,
        count: 0,
        userCount: 0
      };
      errorGroup.trends.push(lastTrend);
    }

    lastTrend.count++;

    // Keep only last 24 hours of trends
    if (errorGroup.trends.length > 24) {
      errorGroup.trends = errorGroup.trends.slice(-24);
    }
  }

  private cleanupOldErrors(): void {
    const cutoff = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000);

    // Remove old events
    for (const [id, event] of this.errorEvents.entries()) {
      if (event.timestamp < cutoff) {
        this.errorEvents.delete(id);
      }
    }

    // Remove old error groups with no recent events
    for (const [fingerprint, group] of this.errorGroups.entries()) {
      if (group.lastSeen < cutoff) {
        this.errorGroups.delete(fingerprint);
      }
    }
  }

  private evaluateErrorAlerts(errorEvent: ErrorEvent): void {
    Array.from(this.alerts.values())
      .filter(alert => alert.enabled)
      .forEach(alert => {
        this.evaluateAlert(alert, errorEvent);
      });
  }

  private evaluateAlert(alert: ErrorAlert, errorEvent: ErrorEvent): void {
    // Check cooldown
    if (alert.lastTriggered) {
      const cooldownMs = alert.cooldown * 60 * 1000;
      if (Date.now() - alert.lastTriggered.getTime() < cooldownMs) {
        return;
      }
    }

    // Evaluate conditions
    const shouldTrigger = alert.conditions.every(condition =>
      this.evaluateAlertCondition(condition, alert.timeWindow)
    );

    if (shouldTrigger) {
      alert.lastTriggered = new Date();
      this.triggerErrorAlert(alert, errorEvent);
    }
  }

  private evaluateAlertCondition(condition: ErrorAlertCondition, timeWindow: number): boolean {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - timeWindow * 60 * 1000);

    const recentEvents = Array.from(this.errorEvents.values())
      .filter(e => e.timestamp >= startTime);

    let value: number;

    switch (condition.field) {
      case 'count':
        value = recentEvents.length;
        break;
      case 'rate':
        value = recentEvents.length / (timeWindow / 60); // per minute
        break;
      case 'new_errors':
        value = Array.from(this.errorGroups.values())
          .filter(g => g.firstSeen >= startTime).length;
        break;
      case 'error_percentage':
        const totalRequests = metricsEngine.getMetricSummary('performance.requestsPerSecond', timeWindow * 60).sum || 1;
        value = (recentEvents.length / totalRequests) * 100;
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case '>': return value > condition.value;
      case '<': return value < condition.value;
      case '>=': return value >= condition.value;
      case '<=': return value <= condition.value;
      case '==': return value === condition.value;
      default: return false;
    }
  }

  private triggerErrorAlert(alert: ErrorAlert, errorEvent: ErrorEvent): void {
    const alertData = {
      alert,
      triggeringEvent: errorEvent,
      timestamp: new Date()
    };

    this.emit('errorAlertTriggered', alertData);

    // Send to notification channels
    alert.channels.forEach(channel => {
      this.sendErrorNotification(channel, alertData);
    });
  }

  private sendErrorNotification(channel: string, alertData: any): void {
    // Implementation would send to actual notification channels
    console.log(`Error alert sent to ${channel}:`, alertData);
  }

  private groupBy<T extends Record<string, any>>(
    items: T[],
    key: keyof T
  ): { [key: string]: number } {
    return items.reduce((acc, item) => {
      const groupKey = String(item[key]);
      acc[groupKey] = (acc[groupKey] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private groupByLevel(events: ErrorEvent[]): { [key in ErrorLevel]: number } {
    const result = {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      fatal: 0
    };

    events.forEach(event => {
      result[event.level]++;
    });

    return result;
  }

  private groupBySource(events: ErrorEvent[]): { [key in ErrorSource]: number } {
    const result = {
      api: 0,
      scraper: 0,
      pipeline: 0,
      proxy: 0,
      database: 0,
      external: 0,
      client: 0
    };

    events.forEach(event => {
      result[event.source]++;
    });

    return result;
  }

  private groupByStatus(groups: ErrorGroup[]): { [key in ErrorStatus]: number } {
    const result = {
      unresolved: 0,
      resolved: 0,
      ignored: 0,
      monitoring: 0
    };

    groups.forEach(group => {
      result[group.status]++;
    });

    return result;
  }

  private detectErrorSpikes(startTime: Date, endTime: Date): ErrorInsight | null {
    // Simple spike detection - compare recent hour to previous hours
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);

    const previousHour = new Date(currentHour.getTime() - 60 * 60 * 1000);

    const currentErrors = Array.from(this.errorEvents.values())
      .filter(e => e.timestamp >= currentHour).length;

    const previousErrors = Array.from(this.errorEvents.values())
      .filter(e => e.timestamp >= previousHour && e.timestamp < currentHour).length;

    const threshold = previousErrors * 2; // 100% increase threshold

    if (currentErrors > threshold && currentErrors > 10) {
      return {
        type: 'spike',
        title: 'Error Spike Detected',
        description: `Error rate increased by ${Math.round(((currentErrors - previousErrors) / Math.max(previousErrors, 1)) * 100)}% in the last hour`,
        severity: 'high',
        data: { currentErrors, previousErrors },
        actionable: true,
        suggestions: [
          'Check recent deployments',
          'Review system metrics',
          'Investigate top error groups'
        ],
        detectedAt: new Date()
      };
    }

    return null;
  }

  private detectNewErrors(startTime: Date, endTime: Date): ErrorInsight[] {
    const newGroups = Array.from(this.errorGroups.values())
      .filter(g => g.firstSeen >= startTime);

    if (newGroups.length === 0) return [];

    return [{
      type: 'new_error',
      title: `${newGroups.length} New Error Types Detected`,
      description: `New error patterns have emerged in the last ${Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60))} hours`,
      severity: newGroups.length > 5 ? 'high' : 'medium',
      data: { newGroups: newGroups.slice(0, 5) },
      actionable: true,
      suggestions: [
        'Review new error patterns',
        'Check for recent code changes',
        'Verify deployment success'
      ],
      detectedAt: new Date()
    }];
  }

  private detectRegressions(startTime: Date, endTime: Date): ErrorInsight[] {
    const insights: ErrorInsight[] = [];

    // Find resolved errors that reappeared
    const reappearedErrors = Array.from(this.errorGroups.values())
      .filter(g => {
        return g.status === 'resolved' &&
               g.resolvedAt &&
               g.lastSeen > g.resolvedAt &&
               g.lastSeen >= startTime;
      });

    if (reappearedErrors.length > 0) {
      insights.push({
        type: 'regression',
        title: `${reappearedErrors.length} Resolved Errors Reappeared`,
        description: 'Previously resolved errors have reoccurred',
        severity: 'high',
        data: { reappearedErrors },
        actionable: true,
        suggestions: [
          'Review recent changes',
          'Check if fixes were properly deployed',
          'Investigate root cause resolution'
        ],
        detectedAt: new Date()
      });
    }

    return insights;
  }

  private detectTrendingErrors(startTime: Date, endTime: Date): ErrorInsight[] {
    // Find errors with increasing frequency
    const trendingGroups = Array.from(this.errorGroups.values())
      .filter(g => g.trends.length >= 3)
      .map(g => {
        const recentTrends = g.trends.slice(-3);
        const trend = this.calculateTrend(recentTrends.map(t => t.count));
        return { group: g, trend };
      })
      .filter(({ trend }) => trend > 0.5) // Significant upward trend
      .sort((a, b) => b.trend - a.trend)
      .slice(0, 3);

    if (trendingGroups.length === 0) return [];

    return [{
      type: 'trending',
      title: `${trendingGroups.length} Errors Trending Upward`,
      description: 'Some error types are showing increasing frequency',
      severity: 'medium',
      data: { trendingGroups },
      actionable: true,
      suggestions: [
        'Investigate trending error patterns',
        'Check system resource usage',
        'Review recent configuration changes'
      ],
      detectedAt: new Date()
    }];
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = values.reduce((sum, _, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private startBackgroundTasks(): void {
    // Aggregate trends every hour
    this.aggregationInterval = setInterval(() => {
      this.aggregateHourlyTrends();
    }, 60 * 60 * 1000);

    // Evaluate alerts every minute
    this.alertEvaluationInterval = setInterval(() => {
      this.evaluateAllErrorAlerts();
    }, 60 * 1000);
  }

  private aggregateHourlyTrends(): void {
    // Update hourly trend data for all error groups
    Array.from(this.errorGroups.values()).forEach(group => {
      this.updateErrorTrends(group);
    });
  }

  private evaluateAllErrorAlerts(): void {
    Array.from(this.alerts.values())
      .filter(alert => alert.enabled)
      .forEach(alert => {
        // Evaluate with a dummy event for time-based alerts
        this.evaluateAlert(alert, {} as ErrorEvent);
      });
  }

  // Cleanup
  destroy(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    if (this.alertEvaluationInterval) {
      clearInterval(this.alertEvaluationInterval);
    }
    this.removeAllListeners();
  }
}

// Export singleton instance
export const errorTracker = new ErrorTrackingEngine();

// Export error capture helper functions
export const captureError = (error: Error, extras?: any) =>
  errorTracker.captureError(error, extras?.context, extras?.user, extras?.request, extras?.tags);

export const captureMessage = (message: string, level: ErrorLevel = 'info', extras?: any) =>
  errorTracker.captureMessage(message, level, extras?.context, extras);
