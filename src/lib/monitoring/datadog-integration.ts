import { logger } from '@/lib/utils';

interface DataDogConfig {
  apiKey: string;
  appKey: string;
  site: string;
  service: string;
  env: string;
  version: string;
}

interface MetricData {
  metric: string;
  points: Array<[number, number]>;
  tags?: string[];
  host?: string;
  type?: 'count' | 'rate' | 'gauge' | 'histogram' | 'distribution';
}

interface LogData {
  timestamp?: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  service: string;
  tags?: Record<string, string>;
  attributes?: Record<string, any>;
}

interface TraceData {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime: number;
  tags: Record<string, any>;
  logs?: Array<{
    timestamp: number;
    fields: Record<string, any>;
  }>;
}

export class DataDogIntegration {
  private config: DataDogConfig;
  private baseUrl: string;
  private isEnabled: boolean;

  constructor() {
    this.config = {
      apiKey: process.env.DATADOG_API_KEY || '',
      appKey: process.env.DATADOG_APP_KEY || '',
      site: process.env.DATADOG_SITE || 'datadoghq.com',
      service: 'datavault-pro',
      env: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };

    this.baseUrl = `https://api.${this.config.site}`;
    this.isEnabled = !!(this.config.apiKey && this.config.appKey);

    if (!this.isEnabled) {
      logger.warn('DataDog integration disabled - API keys not configured');
    }
  }

  /**
   * Send custom metrics to DataDog
   */
  async sendMetrics(metrics: MetricData[]): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const payload = {
        series: metrics.map(metric => ({
          ...metric,
          tags: [
            ...(metric.tags || []),
            `service:${this.config.service}`,
            `env:${this.config.env}`,
            `version:${this.config.version}`,
          ],
        })),
      };

      const response = await fetch(`${this.baseUrl}/api/v1/series`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`DataDog metrics API error: ${response.statusText}`);
      }

      logger.debug('DataDog metrics sent successfully', { count: metrics.length });
    } catch (error) {
      logger.error('Failed to send DataDog metrics', { error });
    }
  }

  /**
   * Send logs to DataDog
   */
  async sendLogs(logs: LogData[]): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const payload = logs.map(log => ({
        timestamp: log.timestamp || Date.now(),
        level: log.level,
        message: log.message,
        service: log.service,
        ddsource: 'nodejs',
        ddtags: Object.entries({
          env: this.config.env,
          version: this.config.version,
          ...log.tags,
        }).map(([key, value]) => `${key}:${value}`).join(','),
        ...log.attributes,
      }));

      const response = await fetch(`${this.baseUrl}/v1/input/${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`DataDog logs API error: ${response.statusText}`);
      }

      logger.debug('DataDog logs sent successfully', { count: logs.length });
    } catch (error) {
      logger.error('Failed to send DataDog logs', { error });
    }
  }

  /**
   * Track scraper performance metrics
   */
  async trackScraperMetrics(scraperData: {
    scraperId: string;
    jobId: string;
    duration: number;
    status: 'success' | 'failed' | 'timeout';
    recordsExtracted: number;
    errorCount: number;
    proxyUsed?: string;
    browserType?: string;
  }): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const tags = [
      `scraper_id:${scraperData.scraperId}`,
      `status:${scraperData.status}`,
      `proxy:${scraperData.proxyUsed || 'none'}`,
      `browser:${scraperData.browserType || 'jsdom'}`,
    ];

    const metrics: MetricData[] = [
      {
        metric: 'scraper.execution.duration',
        points: [[timestamp, scraperData.duration]],
        tags,
        type: 'gauge',
      },
      {
        metric: 'scraper.records.extracted',
        points: [[timestamp, scraperData.recordsExtracted]],
        tags,
        type: 'count',
      },
      {
        metric: 'scraper.errors.count',
        points: [[timestamp, scraperData.errorCount]],
        tags,
        type: 'count',
      },
      {
        metric: 'scraper.execution.total',
        points: [[timestamp, 1]],
        tags,
        type: 'count',
      },
    ];

    await this.sendMetrics(metrics);

    // Send execution log
    await this.sendLogs([{
      level: scraperData.status === 'success' ? 'info' : 'error',
      message: `Scraper execution ${scraperData.status}`,
      service: 'scraper-engine',
      tags: {
        scraper_id: scraperData.scraperId,
        job_id: scraperData.jobId,
        status: scraperData.status,
      },
      attributes: {
        duration: scraperData.duration,
        records_extracted: scraperData.recordsExtracted,
        error_count: scraperData.errorCount,
      },
    }]);
  }

  /**
   * Track API endpoint performance
   */
  async trackAPIMetrics(apiData: {
    endpoint: string;
    method: string;
    statusCode: number;
    duration: number;
    userId?: string;
    organizationId?: string;
  }): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const tags = [
      `endpoint:${apiData.endpoint}`,
      `method:${apiData.method}`,
      `status_code:${apiData.statusCode}`,
      `status_class:${Math.floor(apiData.statusCode / 100)}xx`,
    ];

    const metrics: MetricData[] = [
      {
        metric: 'api.request.duration',
        points: [[timestamp, apiData.duration]],
        tags,
        type: 'histogram',
      },
      {
        metric: 'api.request.count',
        points: [[timestamp, 1]],
        tags,
        type: 'count',
      },
    ];

    await this.sendMetrics(metrics);
  }

  /**
   * Track proxy performance metrics
   */
  async trackProxyMetrics(proxyData: {
    provider: string;
    endpoint: string;
    responseTime: number;
    success: boolean;
    errorType?: string;
    location?: string;
  }): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const tags = [
      `provider:${proxyData.provider}`,
      `endpoint:${proxyData.endpoint}`,
      `success:${proxyData.success}`,
      `location:${proxyData.location || 'unknown'}`,
    ];

    if (proxyData.errorType) {
      tags.push(`error_type:${proxyData.errorType}`);
    }

    const metrics: MetricData[] = [
      {
        metric: 'proxy.response_time',
        points: [[timestamp, proxyData.responseTime]],
        tags,
        type: 'gauge',
      },
      {
        metric: 'proxy.request.count',
        points: [[timestamp, 1]],
        tags,
        type: 'count',
      },
    ];

    if (!proxyData.success) {
      metrics.push({
        metric: 'proxy.error.count',
        points: [[timestamp, 1]],
        tags,
        type: 'count',
      });
    }

    await this.sendMetrics(metrics);
  }

  /**
   * Track system resource metrics
   */
  async trackSystemMetrics(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const memUsage = process.memoryUsage();
      const timestamp = Math.floor(Date.now() / 1000);

      const metrics: MetricData[] = [
        {
          metric: 'system.memory.rss',
          points: [[timestamp, memUsage.rss]],
          type: 'gauge',
        },
        {
          metric: 'system.memory.heap_used',
          points: [[timestamp, memUsage.heapUsed]],
          type: 'gauge',
        },
        {
          metric: 'system.memory.heap_total',
          points: [[timestamp, memUsage.heapTotal]],
          type: 'gauge',
        },
        {
          metric: 'system.memory.external',
          points: [[timestamp, memUsage.external]],
          type: 'gauge',
        },
      ];

      await this.sendMetrics(metrics);
    } catch (error) {
      logger.error('Failed to track system metrics', { error });
    }
  }

  /**
   * Create a custom dashboard configuration
   */
  createDashboardConfig() {
    return {
      title: 'DataVault Pro - Application Monitoring',
      description: 'Comprehensive monitoring dashboard for DataVault Pro scraping platform',
      template_variables: [
        {
          name: 'env',
          default: this.config.env,
          prefix: 'env',
        },
        {
          name: 'service',
          default: this.config.service,
          prefix: 'service',
        },
      ],
      widgets: [
        {
          id: 'scraper-performance',
          definition: {
            type: 'timeseries',
            title: 'Scraper Execution Performance',
            requests: [
              {
                q: 'avg:scraper.execution.duration{$env,$service} by {scraper_id}',
                display_type: 'line',
              },
            ],
          },
        },
        {
          id: 'api-response-times',
          definition: {
            type: 'timeseries',
            title: 'API Response Times',
            requests: [
              {
                q: 'avg:api.request.duration{$env,$service} by {endpoint}',
                display_type: 'line',
              },
            ],
          },
        },
        {
          id: 'proxy-health',
          definition: {
            type: 'timeseries',
            title: 'Proxy Health',
            requests: [
              {
                q: 'avg:proxy.response_time{$env,$service} by {provider}',
                display_type: 'line',
              },
            ],
          },
        },
        {
          id: 'system-resources',
          definition: {
            type: 'timeseries',
            title: 'System Resources',
            requests: [
              {
                q: 'avg:system.memory.heap_used{$env,$service}',
                display_type: 'area',
              },
            ],
          },
        },
      ],
    };
  }

  /**
   * Test DataDog connectivity
   */
  async testConnection(): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/validate`, {
        method: 'GET',
        headers: {
          'DD-API-KEY': this.config.apiKey,
          'DD-APPLICATION-KEY': this.config.appKey,
        },
      });

      return response.ok;
    } catch (error) {
      logger.error('DataDog connection test failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const dataDogIntegration = new DataDogIntegration();
