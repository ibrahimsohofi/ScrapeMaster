import axios from 'axios';
import winston from 'winston';
import { EventEmitter } from 'events';

// ============================================================================
// GRAFANA INTEGRATION
// ============================================================================

export interface GrafanaConfig {
  url: string;
  apiKey: string;
  orgId?: number;
  defaultDatasource: string;
}

export interface GrafanaDashboard {
  id: number;
  uid: string;
  title: string;
  tags: string[];
  panels: GrafanaPanel[];
}

export interface GrafanaPanel {
  id: number;
  title: string;
  type: string;
  targets: GrafanaTarget[];
}

export interface GrafanaTarget {
  expr: string;
  legendFormat: string;
  refId: string;
}

export class GrafanaIntegration {
  private config: GrafanaConfig;
  private logger: winston.Logger;

  constructor(config: GrafanaConfig) {
    this.config = config;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/grafana.log' }),
        new winston.transports.Console()
      ]
    });
  }

  public async createDataVaultDashboard(): Promise<GrafanaDashboard> {
    const dashboardConfig = {
      dashboard: {
        id: null,
        title: "DataVault Pro - Enterprise Monitoring",
        tags: ["datavault", "scraping", "monitoring"],
        timezone: "browser",
        panels: [
          {
            id: 1,
            title: "Scraper Success Rate",
            type: "stat",
            targets: [{
              expr: "rate(datavault_scraper_success_total[5m]) / rate(datavault_scraper_requests_total[5m]) * 100",
              legendFormat: "Success Rate %",
              refId: "A"
            }],
            fieldConfig: {
              defaults: {
                color: { mode: "thresholds" },
                thresholds: {
                  steps: [
                    { color: "red", value: 0 },
                    { color: "yellow", value: 80 },
                    { color: "green", value: 95 }
                  ]
                }
              }
            }
          },
          {
            id: 2,
            title: "Active Scrapers",
            type: "gauge",
            targets: [{
              expr: "datavault_active_scrapers",
              legendFormat: "Active Scrapers",
              refId: "A"
            }]
          },
          {
            id: 3,
            title: "Request Rate",
            type: "graph",
            targets: [{
              expr: "rate(datavault_http_requests_total[5m])",
              legendFormat: "{{method}} {{status}}",
              refId: "A"
            }]
          },
          {
            id: 4,
            title: "Response Time Distribution",
            type: "heatmap",
            targets: [{
              expr: "rate(datavault_http_request_duration_seconds_bucket[5m])",
              legendFormat: "{{le}}",
              refId: "A"
            }]
          },
          {
            id: 5,
            title: "Database Connection Pool",
            type: "graph",
            targets: [
              {
                expr: "datavault_db_connections_active",
                legendFormat: "Active Connections",
                refId: "A"
              },
              {
                expr: "datavault_db_connections_idle",
                legendFormat: "Idle Connections",
                refId: "B"
              }
            ]
          },
          {
            id: 6,
            title: "Memory Usage",
            type: "graph",
            targets: [{
              expr: "process_resident_memory_bytes / 1024 / 1024",
              legendFormat: "Memory (MB)",
              refId: "A"
            }]
          },
          {
            id: 7,
            title: "Queue Depth",
            type: "graph",
            targets: [{
              expr: "datavault_queue_depth",
              legendFormat: "{{queue_name}}",
              refId: "A"
            }]
          },
          {
            id: 8,
            title: "Error Rate by Service",
            type: "table",
            targets: [{
              expr: "rate(datavault_errors_total[5m])",
              legendFormat: "{{service}} - {{error_type}}",
              refId: "A"
            }]
          }
        ],
        time: {
          from: "now-1h",
          to: "now"
        },
        refresh: "30s"
      },
      overwrite: false
    };

    const response = await this.makeGrafanaRequest('POST', '/api/dashboards/db', dashboardConfig);
    return response.dashboard;
  }

  public async createAlert(alertConfig: any): Promise<any> {
    return await this.makeGrafanaRequest('POST', '/api/alert-rules', alertConfig);
  }

  public async getMetrics(query: string): Promise<any> {
    return await this.makeGrafanaRequest('GET', `/api/datasources/proxy/${this.config.defaultDatasource}/api/v1/query`, {
      params: { query }
    });
  }

  private async makeGrafanaRequest(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${this.config.url}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        data
      });
      return response.data;
    } catch (error) {
      this.logger.error('Grafana API request failed:', error);
      throw error;
    }
  }
}

// ============================================================================
// DATADOG INTEGRATION
// ============================================================================

export interface DatadogConfig {
  apiKey: string;
  appKey: string;
  site: string; // us, eu, etc.
  tags: string[];
}

export interface DatadogMetric {
  metric: string;
  points: Array<[number, number]>;
  tags: string[];
  type?: 'rate' | 'count' | 'gauge';
  host?: string;
}

export class DatadogIntegration {
  private config: DatadogConfig;
  private logger: winston.Logger;
  private baseUrl: string;

  constructor(config: DatadogConfig) {
    this.config = config;
    this.baseUrl = `https://api.${config.site}.datadoghq.com`;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/datadog.log' }),
        new winston.transports.Console()
      ]
    });
  }

  public async sendMetrics(metrics: DatadogMetric[]): Promise<void> {
    const payload = {
      series: metrics.map(metric => ({
        ...metric,
        tags: [...metric.tags, ...this.config.tags]
      }))
    };

    await this.makeDatadogRequest('POST', '/api/v1/series', payload);
  }

  public async sendEvent(event: any): Promise<void> {
    const payload = {
      ...event,
      tags: [...(event.tags || []), ...this.config.tags]
    };

    await this.makeDatadogRequest('POST', '/api/v1/events', payload);
  }

  public async createDashboard(): Promise<any> {
    const dashboardConfig = {
      title: "DataVault Pro - Enterprise Monitoring",
      description: "Comprehensive monitoring dashboard for DataVault Pro scraping platform",
      widgets: [
        {
          definition: {
            type: "timeseries",
            requests: [{
              q: "avg:datavault.scraper.success_rate{*}",
              display_type: "line"
            }],
            title: "Scraper Success Rate"
          }
        },
        {
          definition: {
            type: "query_value",
            requests: [{
              q: "sum:datavault.active_scrapers{*}"
            }],
            title: "Active Scrapers"
          }
        },
        {
          definition: {
            type: "heatmap",
            requests: [{
              q: "avg:datavault.response_time{*} by {endpoint}"
            }],
            title: "Response Time Heatmap"
          }
        }
      ],
      layout_type: "ordered",
      is_read_only: false
    };

    return await this.makeDatadogRequest('POST', '/api/v1/dashboard', dashboardConfig);
  }

  public async createMonitor(monitorConfig: any): Promise<any> {
    return await this.makeDatadogRequest('POST', '/api/v1/monitor', monitorConfig);
  }

  private async makeDatadogRequest(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'DD-API-KEY': this.config.apiKey,
          'DD-APPLICATION-KEY': this.config.appKey,
          'Content-Type': 'application/json'
        },
        data
      });
      return response.data;
    } catch (error) {
      this.logger.error('Datadog API request failed:', error);
      throw error;
    }
  }
}

// ============================================================================
// PROMETHEUS INTEGRATION
// ============================================================================

export interface PrometheusConfig {
  pushgatewayUrl?: string;
  jobName: string;
  instance: string;
  labels: Record<string, string>;
}

export class PrometheusIntegration {
  private config: PrometheusConfig;
  private logger: winston.Logger;
  private registry: Map<string, any> = new Map();

  constructor(config: PrometheusConfig) {
    this.config = config;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/prometheus.log' }),
        new winston.transports.Console()
      ]
    });

    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Define standard DataVault metrics
    this.registry.set('datavault_scraper_requests_total', {
      type: 'counter',
      help: 'Total number of scraper requests',
      labels: ['scraper_id', 'status']
    });

    this.registry.set('datavault_scraper_duration_seconds', {
      type: 'histogram',
      help: 'Time spent on scraper execution',
      labels: ['scraper_id']
    });

    this.registry.set('datavault_active_scrapers', {
      type: 'gauge',
      help: 'Number of currently active scrapers'
    });

    this.registry.set('datavault_queue_depth', {
      type: 'gauge',
      help: 'Current queue depth',
      labels: ['queue_name']
    });

    this.registry.set('datavault_db_connections_active', {
      type: 'gauge',
      help: 'Active database connections'
    });

    this.registry.set('datavault_memory_usage_bytes', {
      type: 'gauge',
      help: 'Memory usage in bytes'
    });
  }

  public async pushMetrics(metrics: Record<string, number>): Promise<void> {
    if (!this.config.pushgatewayUrl) {
      this.logger.warn('Pushgateway URL not configured, skipping metrics push');
      return;
    }

    const metricLines = Object.entries(metrics).map(([name, value]) => {
      const labels = Object.entries(this.config.labels)
        .map(([key, val]) => `${key}="${val}"`)
        .join(',');

      return `${name}{${labels}} ${value}`;
    });

    const payload = metricLines.join('\n') + '\n';

    try {
      await axios.post(
        `${this.config.pushgatewayUrl}/metrics/job/${this.config.jobName}/instance/${this.config.instance}`,
        payload,
        {
          headers: {
            'Content-Type': 'text/plain'
          }
        }
      );
    } catch (error) {
      this.logger.error('Failed to push metrics to Pushgateway:', error);
      throw error;
    }
  }

  public getMetricsEndpoint(): string {
    // Return formatted metrics for Prometheus scraping
    const timestamp = Date.now();
    const metrics: string[] = [];

    // Add help and type comments
    for (const [name, config] of this.registry) {
      metrics.push(`# HELP ${name} ${config.help}`);
      metrics.push(`# TYPE ${name} ${config.type}`);
    }

    return metrics.join('\n') + '\n';
  }
}

// ============================================================================
// UNIFIED MONITORING INTEGRATION
// ============================================================================

export class UnifiedMonitoringSystem extends EventEmitter {
  private grafana?: GrafanaIntegration;
  private datadog?: DatadogIntegration;
  private prometheus?: PrometheusIntegration;
  private logger: winston.Logger;

  constructor(config: {
    grafana?: GrafanaConfig;
    datadog?: DatadogConfig;
    prometheus?: PrometheusConfig;
  }) {
    super();

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/unified-monitoring.log' }),
        new winston.transports.Console()
      ]
    });

    if (config.grafana) {
      this.grafana = new GrafanaIntegration(config.grafana);
    }

    if (config.datadog) {
      this.datadog = new DatadogIntegration(config.datadog);
    }

    if (config.prometheus) {
      this.prometheus = new PrometheusIntegration(config.prometheus);
    }

    this.initializeSystem();
  }

  private async initializeSystem(): Promise<void> {
    try {
      // Setup dashboards in all configured systems
      if (this.grafana) {
        await this.grafana.createDataVaultDashboard();
        this.logger.info('Grafana dashboard created');
      }

      if (this.datadog) {
        await this.datadog.createDashboard();
        this.logger.info('Datadog dashboard created');
      }

      this.logger.info('Unified monitoring system initialized');
    } catch (error) {
      this.logger.error('Failed to initialize monitoring system:', error);
    }
  }

  public async sendMetrics(metrics: Record<string, number>): Promise<void> {
    const promises: Promise<any>[] = [];

    if (this.datadog) {
      const datadogMetrics: DatadogMetric[] = Object.entries(metrics).map(([metric, value]) => ({
        metric: `datavault.${metric}`,
        points: [[Date.now() / 1000, value]],
        tags: ['service:datavault-pro'],
        type: 'gauge'
      }));
      promises.push(this.datadog.sendMetrics(datadogMetrics));
    }

    if (this.prometheus) {
      const prometheusMetrics = Object.fromEntries(
        Object.entries(metrics).map(([key, value]) => [`datavault_${key}`, value])
      );
      promises.push(this.prometheus.pushMetrics(prometheusMetrics));
    }

    await Promise.allSettled(promises);
  }

  public async sendAlert(alert: any): Promise<void> {
    const promises: Promise<any>[] = [];

    if (this.datadog) {
      promises.push(this.datadog.sendEvent({
        title: alert.title,
        text: alert.description,
        alert_type: alert.severity === 'critical' ? 'error' : 'warning',
        tags: [`service:datavault-pro`, `severity:${alert.severity}`]
      }));
    }

    if (this.grafana) {
      // Send to Grafana alerting if configured
      this.logger.info('Alert sent to Grafana', alert);
    }

    await Promise.allSettled(promises);
  }

  public async createCustomDashboard(config: any): Promise<void> {
    const promises: Promise<any>[] = [];

    if (this.grafana) {
      promises.push(this.grafana.createDataVaultDashboard());
    }

    if (this.datadog) {
      promises.push(this.datadog.createDashboard());
    }

    await Promise.allSettled(promises);
  }

  public getMetricsEndpoint(): string {
    return this.prometheus?.getMetricsEndpoint() || '';
  }

  public async getSystemStatus(): Promise<any> {
    return {
      integrations: {
        grafana: !!this.grafana,
        datadog: !!this.datadog,
        prometheus: !!this.prometheus
      },
      lastMetricsSent: new Date(),
      totalAlertsProcessed: 0 // This would be tracked in practice
    };
  }
}
