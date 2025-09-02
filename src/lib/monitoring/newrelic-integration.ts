import { logger } from '@/lib/utils';

interface NewRelicConfig {
  licenseKey: string;
  appId: string;
  apiKey: string;
  region: 'US' | 'EU';
  appName: string;
  environment: string;
}

interface CustomEvent {
  eventType: string;
  timestamp?: number;
  attributes: Record<string, any>;
}

interface MetricPayload {
  metrics: Array<{
    name: string;
    type: 'gauge' | 'count' | 'summary';
    value: number | { count: number; sum: number; min: number; max: number };
    timestamp: number;
    interval?: number;
    attributes?: Record<string, any>;
  }>;
}

interface ErrorTrace {
  message: string;
  errorType: string;
  stackTrace?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
  userId?: string;
  attributes?: Record<string, any>;
}

export class NewRelicIntegration {
  private config: NewRelicConfig;
  private baseUrl: string;
  private isEnabled: boolean;

  constructor() {
    this.config = {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY || '',
      appId: process.env.NEW_RELIC_APP_ID || '',
      apiKey: process.env.NEW_RELIC_API_KEY || '',
      region: (process.env.NEW_RELIC_REGION as 'US' | 'EU') || 'US',
      appName: 'DataVault Pro',
      environment: process.env.NODE_ENV || 'development',
    };

    this.baseUrl = this.config.region === 'EU'
      ? 'https://metric-api.eu.newrelic.com'
      : 'https://metric-api.newrelic.com';

    this.isEnabled = !!(this.config.licenseKey && this.config.apiKey);

    if (!this.isEnabled) {
      logger.warn('New Relic integration disabled - API keys not configured');
    }
  }

  /**
   * Send custom events to New Relic
   */
  async sendCustomEvents(events: CustomEvent[]): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const payload = events.map(event => ({
        eventType: event.eventType,
        timestamp: event.timestamp || Date.now(),
        ...event.attributes,
        appName: this.config.appName,
        environment: this.config.environment,
      }));

      const response = await fetch(`${this.baseUrl}/v1/accounts/${this.config.appId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`New Relic events API error: ${response.statusText}`);
      }

      logger.debug('New Relic events sent successfully', { count: events.length });
    } catch (error) {
      logger.error('Failed to send New Relic events', { error });
    }
  }

  /**
   * Send custom metrics to New Relic
   */
  async sendMetrics(payload: MetricPayload): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const response = await fetch(`${this.baseUrl}/metric/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.config.apiKey,
        },
        body: JSON.stringify([{
          common: {
            timestamp: Date.now(),
            'interval.ms': 10000,
            attributes: {
              service: this.config.appName,
              environment: this.config.environment,
            },
          },
          ...payload,
        }]),
      });

      if (!response.ok) {
        throw new Error(`New Relic metrics API error: ${response.statusText}`);
      }

      logger.debug('New Relic metrics sent successfully', { count: payload.metrics.length });
    } catch (error) {
      logger.error('Failed to send New Relic metrics', { error });
    }
  }

  /**
   * Track scraper execution metrics and events
   */
  async trackScraperExecution(scraperData: {
    scraperId: string;
    jobId: string;
    duration: number;
    status: 'success' | 'failed' | 'timeout';
    recordsExtracted: number;
    errorCount: number;
    proxyUsed?: string;
    browserType?: string;
    targetUrl: string;
    organizationId: string;
  }): Promise<void> {
    const timestamp = Date.now();

    // Send custom event
    await this.sendCustomEvents([{
      eventType: 'ScraperExecution',
      timestamp,
      attributes: {
        scraperId: scraperData.scraperId,
        jobId: scraperData.jobId,
        duration: scraperData.duration,
        status: scraperData.status,
        recordsExtracted: scraperData.recordsExtracted,
        errorCount: scraperData.errorCount,
        proxyUsed: scraperData.proxyUsed || 'none',
        browserType: scraperData.browserType || 'jsdom',
        targetUrl: scraperData.targetUrl,
        organizationId: scraperData.organizationId,
      },
    }]);

    // Send performance metrics
    await this.sendMetrics({
      metrics: [
        {
          name: 'custom.scraper.execution.duration',
          type: 'gauge',
          value: scraperData.duration,
          timestamp,
          attributes: {
            scraperId: scraperData.scraperId,
            status: scraperData.status,
            browserType: scraperData.browserType,
          },
        },
        {
          name: 'custom.scraper.records.extracted',
          type: 'count',
          value: scraperData.recordsExtracted,
          timestamp,
          attributes: {
            scraperId: scraperData.scraperId,
          },
        },
        {
          name: 'custom.scraper.errors.count',
          type: 'count',
          value: scraperData.errorCount,
          timestamp,
          attributes: {
            scraperId: scraperData.scraperId,
          },
        },
      ],
    });
  }

  /**
   * Track API performance metrics
   */
  async trackAPIPerformance(apiData: {
    endpoint: string;
    method: string;
    statusCode: number;
    duration: number;
    userId?: string;
    organizationId?: string;
    userAgent?: string;
  }): Promise<void> {
    const timestamp = Date.now();

    // Send API performance event
    await this.sendCustomEvents([{
      eventType: 'APIRequest',
      timestamp,
      attributes: {
        endpoint: apiData.endpoint,
        method: apiData.method,
        statusCode: apiData.statusCode,
        duration: apiData.duration,
        userId: apiData.userId,
        organizationId: apiData.organizationId,
        userAgent: apiData.userAgent,
        statusClass: `${Math.floor(apiData.statusCode / 100)}xx`,
      },
    }]);

    // Send performance metrics
    await this.sendMetrics({
      metrics: [
        {
          name: 'custom.api.response.time',
          type: 'gauge',
          value: apiData.duration,
          timestamp,
          attributes: {
            endpoint: apiData.endpoint,
            method: apiData.method,
            statusCode: apiData.statusCode.toString(),
          },
        },
        {
          name: 'custom.api.requests.total',
          type: 'count',
          value: 1,
          timestamp,
          attributes: {
            endpoint: apiData.endpoint,
            method: apiData.method,
            statusCode: apiData.statusCode.toString(),
          },
        },
      ],
    });
  }

  /**
   * Track proxy performance and health
   */
  async trackProxyMetrics(proxyData: {
    provider: string;
    endpoint: string;
    responseTime: number;
    success: boolean;
    errorType?: string;
    location?: string;
    cost?: number;
  }): Promise<void> {
    const timestamp = Date.now();

    // Send proxy usage event
    await this.sendCustomEvents([{
      eventType: 'ProxyUsage',
      timestamp,
      attributes: {
        provider: proxyData.provider,
        endpoint: proxyData.endpoint,
        responseTime: proxyData.responseTime,
        success: proxyData.success,
        errorType: proxyData.errorType,
        location: proxyData.location || 'unknown',
        cost: proxyData.cost || 0,
      },
    }]);

    // Send proxy performance metrics
    await this.sendMetrics({
      metrics: [
        {
          name: 'custom.proxy.response.time',
          type: 'gauge',
          value: proxyData.responseTime,
          timestamp,
          attributes: {
            provider: proxyData.provider,
            location: proxyData.location,
          },
        },
        {
          name: 'custom.proxy.requests.total',
          type: 'count',
          value: 1,
          timestamp,
          attributes: {
            provider: proxyData.provider,
            success: proxyData.success.toString(),
          },
        },
      ],
    });

    if (proxyData.cost) {
      await this.sendMetrics({
        metrics: [
          {
            name: 'custom.proxy.cost.total',
            type: 'count',
            value: proxyData.cost,
            timestamp,
            attributes: {
              provider: proxyData.provider,
            },
          },
        ],
      });
    }
  }

  /**
   * Track error occurrences
   */
  async trackError(errorData: ErrorTrace): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const response = await fetch(`${this.baseUrl}/v1/accounts/${this.config.appId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.config.apiKey,
        },
        body: JSON.stringify([{
          eventType: 'ApplicationError',
          timestamp: errorData.timestamp,
          message: errorData.message,
          errorType: errorData.errorType,
          stackTrace: errorData.stackTrace,
          url: errorData.url,
          userId: errorData.userId,
          userAgent: errorData.userAgent,
          appName: this.config.appName,
          environment: this.config.environment,
          ...errorData.attributes,
        }]),
      });

      if (!response.ok) {
        throw new Error(`New Relic error tracking API error: ${response.statusText}`);
      }

      logger.debug('New Relic error tracked successfully');
    } catch (error) {
      logger.error('Failed to track error in New Relic', { error });
    }
  }

  /**
   * Track user behavior and engagement
   */
  async trackUserEngagement(userData: {
    userId: string;
    organizationId: string;
    action: string;
    feature: string;
    duration?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.sendCustomEvents([{
      eventType: 'UserEngagement',
      attributes: {
        userId: userData.userId,
        organizationId: userData.organizationId,
        action: userData.action,
        feature: userData.feature,
        duration: userData.duration,
        ...userData.metadata,
      },
    }]);
  }

  /**
   * Track business metrics
   */
  async trackBusinessMetrics(businessData: {
    organizationId: string;
    plan: string;
    activeScrapers: number;
    totalJobs: number;
    dataExtracted: number;
    costIncurred: number;
  }): Promise<void> {
    const timestamp = Date.now();

    await this.sendCustomEvents([{
      eventType: 'BusinessMetrics',
      timestamp,
      attributes: businessData,
    }]);

    await this.sendMetrics({
      metrics: [
        {
          name: 'custom.business.active.scrapers',
          type: 'gauge',
          value: businessData.activeScrapers,
          timestamp,
          attributes: {
            organizationId: businessData.organizationId,
            plan: businessData.plan,
          },
        },
        {
          name: 'custom.business.jobs.total',
          type: 'count',
          value: businessData.totalJobs,
          timestamp,
          attributes: {
            organizationId: businessData.organizationId,
          },
        },
        {
          name: 'custom.business.cost.total',
          type: 'gauge',
          value: businessData.costIncurred,
          timestamp,
          attributes: {
            organizationId: businessData.organizationId,
          },
        },
      ],
    });
  }

  /**
   * Generate browser monitoring script
   */
  generateBrowserScript(): string {
    if (!this.isEnabled) return '';

    return `
      <script type="text/javascript">
        ;(function(a,s,y,n,c,h,i,d,e){s.className+=' '+y;h.start=1*new Date;
        h.end=i=function(){s.className=s.className.replace(RegExp(' ?'+y),'')};
        (a[n]=a[n]||[]).hide=h;setTimeout(function(){i();h.end=null},c);h.hash=y})
        (window,document.documentElement,'async-hide','dataLayer',4000,
        {'GTM-XXXX':true});
      </script>
      <script>
        window.NREUM||(NREUM={});NREUM.info = {
          "beacon":"bam.nr-data.net",
          "licenseKey":"${this.config.licenseKey}",
          "applicationID":"${this.config.appId}",
          "transactionName":"",
          "queueTime":0,
          "applicationTime":0,
          "ttGuid":"",
          "agent":""
        };
      </script>
    `;
  }

  /**
   * Create dashboard configuration for New Relic
   */
  createDashboardConfig() {
    return {
      name: 'DataVault Pro - Application Performance',
      description: 'Comprehensive APM dashboard for DataVault Pro',
      pages: [
        {
          name: 'Application Overview',
          widgets: [
            {
              title: 'Scraper Performance',
              visualization: {
                id: 'viz.line'
              },
              rawConfiguration: {
                nrqlQueries: [
                  {
                    query: `SELECT average(duration) FROM ScraperExecution TIMESERIES AUTO WHERE appName = '${this.config.appName}' FACET status`,
                  },
                ],
              },
            },
            {
              title: 'API Response Times',
              visualization: {
                id: 'viz.line'
              },
              rawConfiguration: {
                nrqlQueries: [
                  {
                    query: `SELECT average(duration) FROM APIRequest TIMESERIES AUTO WHERE appName = '${this.config.appName}' FACET endpoint`,
                  },
                ],
              },
            },
            {
              title: 'Error Rate',
              visualization: {
                id: 'viz.billboard'
              },
              rawConfiguration: {
                nrqlQueries: [
                  {
                    query: `SELECT count(*) FROM ApplicationError WHERE appName = '${this.config.appName}' SINCE 1 hour ago`,
                  },
                ],
              },
            },
            {
              title: 'Proxy Health',
              visualization: {
                id: 'viz.table'
              },
              rawConfiguration: {
                nrqlQueries: [
                  {
                    query: `SELECT average(responseTime), percentage(count(*), WHERE success = true) AS successRate FROM ProxyUsage WHERE appName = '${this.config.appName}' FACET provider SINCE 1 hour ago`,
                  },
                ],
              },
            },
          ],
        },
      ],
    };
  }

  /**
   * Test New Relic connectivity
   */
  async testConnection(): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      // Test with a simple metric
      await this.sendMetrics({
        metrics: [
          {
            name: 'custom.test.connection',
            type: 'count',
            value: 1,
            timestamp: Date.now(),
          },
        ],
      });
      return true;
    } catch (error) {
      logger.error('New Relic connection test failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const newRelicIntegration = new NewRelicIntegration();
