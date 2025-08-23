import { StatsD } from 'node-statsd';

// DataDog Integration
export class DataDogIntegration {
  private statsd: StatsD;
  private apiKey: string;
  private appKey: string;
  private environment: string;

  constructor() {
    this.apiKey = process.env.DATADOG_API_KEY || '';
    this.appKey = process.env.DATADOG_APP_KEY || '';
    this.environment = process.env.NODE_ENV || 'development';

    // Initialize StatsD client for DataDog
    this.statsd = new StatsD({
      host: process.env.DATADOG_AGENT_HOST || 'localhost',
      port: parseInt(process.env.DATADOG_AGENT_PORT || '8125'),
      prefix: 'datavault.',
      suffix: '',
      globalize: false,
      cacheDns: true,
      mock: !this.apiKey, // Mock if no API key provided
    });
  }

  // Application Performance Metrics
  async trackRequest(endpoint: string, method: string, statusCode: number, duration: number) {
    const tags = [
      `endpoint:${endpoint}`,
      `method:${method}`,
      `status:${statusCode}`,
      `environment:${this.environment}`
    ];

    this.statsd.increment('http.requests', 1, tags);
    this.statsd.histogram('http.request.duration', duration, tags);

    if (statusCode >= 400) {
      this.statsd.increment('http.errors', 1, tags);
    }
  }

  // Business Metrics
  async trackScraperJob(scraperId: string, status: 'success' | 'failed', duration: number, pagesScraped: number) {
    const tags = [
      `scraper_id:${scraperId}`,
      `status:${status}`,
      `environment:${this.environment}`
    ];

    this.statsd.increment('scraper.jobs', 1, tags);
    this.statsd.histogram('scraper.duration', duration, tags);
    this.statsd.gauge('scraper.pages_scraped', pagesScraped, tags);
  }

  // Proxy Metrics
  async trackProxyUsage(provider: string, success: boolean, responseTime: number, cost: number) {
    const tags = [
      `provider:${provider}`,
      `success:${success}`,
      `environment:${this.environment}`
    ];

    this.statsd.increment('proxy.requests', 1, tags);
    this.statsd.histogram('proxy.response_time', responseTime, tags);
    this.statsd.gauge('proxy.cost', cost, tags);
  }

  // Custom Business Events
  async trackBusinessEvent(eventName: string, value: number, tags: Record<string, string> = {}) {
    const formattedTags = Object.entries(tags).map(([key, val]) => `${key}:${val}`);
    formattedTags.push(`environment:${this.environment}`);

    this.statsd.increment(`business.${eventName}`, value, formattedTags);
  }

  // System Health Metrics
  async trackSystemMetrics(cpu: number, memory: number, disk: number) {
    const tags = [`environment:${this.environment}`];

    this.statsd.gauge('system.cpu_usage', cpu, tags);
    this.statsd.gauge('system.memory_usage', memory, tags);
    this.statsd.gauge('system.disk_usage', disk, tags);
  }

  // Send custom logs to DataDog
  async sendLog(level: 'info' | 'warn' | 'error', message: string, metadata: Record<string, any> = {}) {
    if (!this.apiKey) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'datavault-pro',
      environment: this.environment,
      ...metadata
    };

    // In a real implementation, you'd send this to DataDog Logs API
    console.log(`[DataDog Log] ${JSON.stringify(logEntry)}`);
  }
}

// New Relic Integration
export class NewRelicIntegration {
  private apiKey: string;
  private appName: string;
  private licenseKey: string;

  constructor() {
    this.apiKey = process.env.NEW_RELIC_API_KEY || '';
    this.appName = process.env.NEW_RELIC_APP_NAME || 'DataVault Pro';
    this.licenseKey = process.env.NEW_RELIC_LICENSE_KEY || '';
  }

  // Initialize New Relic (would typically be done at app startup)
  initialize() {
    if (!this.licenseKey) {
      console.warn('New Relic license key not provided. Monitoring disabled.');
      return;
    }

    // In a real implementation, you'd initialize the New Relic agent here
    console.log('New Relic APM initialized for DataVault Pro');
  }

  // Custom Metrics
  async recordCustomMetric(name: string, value: number, unit?: string) {
    if (!this.apiKey) return;

    const metric = {
      name: `Custom/${name}`,
      value,
      unit: unit || 'count',
      timestamp: Date.now() / 1000
    };

    // In a real implementation, you'd send this to New Relic Metric API
    console.log(`[New Relic Metric] ${JSON.stringify(metric)}`);
  }

  // Application Performance Events
  async recordEvent(eventType: string, attributes: Record<string, any>) {
    if (!this.apiKey) return;

    const event = {
      eventType,
      timestamp: Date.now(),
      appName: this.appName,
      ...attributes
    };

    // In a real implementation, you'd send this to New Relic Insights API
    console.log(`[New Relic Event] ${JSON.stringify(event)}`);
  }

  // Error Tracking
  async recordError(error: Error, customAttributes: Record<string, any> = {}) {
    if (!this.apiKey) return;

    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      appName: this.appName,
      ...customAttributes
    };

    // In a real implementation, you'd send this to New Relic Error API
    console.log(`[New Relic Error] ${JSON.stringify(errorData)}`);
  }

  // Browser Performance (Real User Monitoring)
  async trackPageLoad(url: string, loadTime: number, userId?: string) {
    const attributes = {
      url,
      loadTime,
      userId,
      userAgent: 'DataVault-Browser-Client'
    };

    await this.recordEvent('PageLoad', attributes);
  }

  // Database Performance
  async trackDatabaseQuery(query: string, duration: number, success: boolean) {
    const attributes = {
      queryType: query.split(' ')[0]?.toLowerCase() || 'unknown',
      duration,
      success,
      database: 'sqlite'
    };

    await this.recordEvent('DatabaseQuery', attributes);
  }
}

// Unified External Monitoring Service
export class ExternalMonitoringService {
  private datadog: DataDogIntegration;
  private newrelic: NewRelicIntegration;

  constructor() {
    this.datadog = new DataDogIntegration();
    this.newrelic = new NewRelicIntegration();
    this.newrelic.initialize();
  }

  // Track request across all platforms
  async trackRequest(endpoint: string, method: string, statusCode: number, duration: number) {
    await Promise.all([
      this.datadog.trackRequest(endpoint, method, statusCode, duration),
      this.newrelic.recordCustomMetric('http.requests', 1),
      this.newrelic.recordCustomMetric('http.response_time', duration)
    ]);
  }

  // Track business metrics across platforms
  async trackBusinessMetric(name: string, value: number, attributes: Record<string, any> = {}) {
    await Promise.all([
      this.datadog.trackBusinessEvent(name, value, attributes),
      this.newrelic.recordCustomMetric(`business.${name}`, value),
      this.newrelic.recordEvent('BusinessMetric', { name, value, ...attributes })
    ]);
  }

  // Track errors across platforms
  async trackError(error: Error, context: Record<string, any> = {}) {
    await Promise.all([
      this.datadog.sendLog('error', error.message, { ...context, stack: error.stack }),
      this.newrelic.recordError(error, context)
    ]);
  }

  // System health monitoring
  async trackSystemHealth(metrics: { cpu: number; memory: number; disk: number }) {
    await Promise.all([
      this.datadog.trackSystemMetrics(metrics.cpu, metrics.memory, metrics.disk),
      this.newrelic.recordCustomMetric('system.cpu', metrics.cpu),
      this.newrelic.recordCustomMetric('system.memory', metrics.memory),
      this.newrelic.recordCustomMetric('system.disk', metrics.disk)
    ]);
  }
}

// Singleton instance
export const externalMonitoring = new ExternalMonitoringService();
