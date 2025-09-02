import { EventEmitter } from 'events';
import Redis from 'ioredis';
import winston from 'winston';

// Core metric interfaces
export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
  metadata?: any;
}

export interface MetricAggregation {
  metric: string;
  timeWindow: number; // seconds
  aggregationType: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'rate' | 'percentile';
  value: number;
  dataPoints: number;
  timestamp: Date;
}

export interface AlertThreshold {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  duration: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MetricQuery {
  metric: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  aggregation?: string;
  granularity?: number; // seconds
  filters?: Record<string, string>;
}

export class MetricsEngine extends EventEmitter {
  private redis: Redis;
  private logger: winston.Logger;
  private metrics: Map<string, Metric[]> = new Map();
  private aggregations: Map<string, MetricAggregation> = new Map();
  private thresholds: Map<string, AlertThreshold> = new Map();
  private collectors: Map<string, NodeJS.Timeout> = new Map();

  constructor(redisUrl?: string) {
    super();

    // Initialize Redis connection
    this.redis = new Redis(redisUrl || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      lazyConnect: true,
    });

    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'metrics.log' })
      ]
    });

    this.startSystemMetricsCollection();
    this.startAggregationLoop();
    this.startAlertingLoop();
  }

  // Record a metric
  async recordMetric(name: string, value: number, tags: Record<string, string> = {}, metadata?: any): Promise<void> {
    try {
      const metric: Metric = {
        name,
        value,
        timestamp: new Date(),
        tags,
        metadata
      };

      // Store in memory for real-time access
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      const metricHistory = this.metrics.get(name)!;
      metricHistory.push(metric);

      // Keep only last 1000 data points in memory
      if (metricHistory.length > 1000) {
        metricHistory.shift();
      }

      // Store in Redis for persistence
      const key = `metric:${name}`;
      await this.redis.zadd(key, Date.now(), JSON.stringify(metric));

      // Set expiration for 30 days
      await this.redis.expire(key, 30 * 24 * 60 * 60);

      // Emit event for real-time processing
      this.emit('metric:recorded', metric);

      this.logger.debug(`Metric recorded: ${name}=${value}`, { tags, metadata });
    } catch (error) {
      this.logger.error('Failed to record metric:', error);
    }
  }

  // Query metrics
  async queryMetrics(query: MetricQuery): Promise<Metric[]> {
    try {
      const key = `metric:${query.metric}`;
      const startTimestamp = query.timeRange.start.getTime();
      const endTimestamp = query.timeRange.end.getTime();

      const results = await this.redis.zrangebyscore(
        key,
        startTimestamp,
        endTimestamp
      );

      const metrics: Metric[] = results.map(result => JSON.parse(result));

      // Apply filters
      if (query.filters) {
        return metrics.filter(metric => {
          return Object.entries(query.filters!).every(([key, value]) =>
            metric.tags[key] === value
          );
        });
      }

      return metrics;
    } catch (error) {
      this.logger.error('Failed to query metrics:', error);
      return [];
    }
  }

  // Get metric aggregation
  async getAggregation(
    metric: string,
    timeWindow: number,
    aggregationType: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'rate' | 'percentile'
  ): Promise<MetricAggregation | null> {
    try {
      const key = `aggregation:${metric}:${timeWindow}:${aggregationType}`;
      const cached = this.aggregations.get(key);

      if (cached && (Date.now() - cached.timestamp.getTime()) < 60000) {
        return cached;
      }

      // Calculate aggregation
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - timeWindow * 1000);

      const metrics = await this.queryMetrics({
        metric,
        timeRange: { start: startTime, end: endTime }
      });

      if (metrics.length === 0) {
        return null;
      }

      let value: number;
      const values = metrics.map(m => m.value);

      switch (aggregationType) {
        case 'sum':
          value = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          value = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case 'min':
          value = Math.min(...values);
          break;
        case 'max':
          value = Math.max(...values);
          break;
        case 'count':
          value = values.length;
          break;
        case 'rate':
          value = values.length / (timeWindow / 60); // per minute
          break;
        case 'percentile':
          const sorted = values.sort((a, b) => a - b);
          const index = Math.ceil(sorted.length * 0.95) - 1;
          value = sorted[index] || 0;
          break;
        default:
          value = 0;
      }

      const aggregation: MetricAggregation = {
        metric,
        timeWindow,
        aggregationType,
        value,
        dataPoints: metrics.length,
        timestamp: new Date()
      };

      this.aggregations.set(key, aggregation);
      return aggregation;
    } catch (error) {
      this.logger.error('Failed to get aggregation:', error);
      return null;
    }
  }

  // Set alert threshold
  setAlertThreshold(threshold: AlertThreshold): void {
    const key = `${threshold.metric}:${threshold.operator}:${threshold.value}`;
    this.thresholds.set(key, threshold);
    this.logger.info(`Alert threshold set: ${threshold.metric} ${threshold.operator} ${threshold.value}`);
  }

  // Get system health metrics
  async getSystemHealth(): Promise<Record<string, number>> {
    try {
      const health: Record<string, number> = {};

      // Get key system metrics
      const metrics = [
        'system.cpu.usage',
        'system.memory.usage',
        'system.disk.usage',
        'system.network.throughput',
        'scraper.success.rate',
        'scraper.response.time',
        'database.connection.count',
        'queue.jobs.pending'
      ];

      for (const metric of metrics) {
        const aggregation = await this.getAggregation(metric, 300, 'avg'); // 5 minute average
        if (aggregation) {
          health[metric] = aggregation.value;
        }
      }

      return health;
    } catch (error) {
      this.logger.error('Failed to get system health:', error);
      return {};
    }
  }

  // Start collecting system metrics
  private startSystemMetricsCollection(): void {
    // CPU usage
    this.collectors.set('cpu', setInterval(async () => {
      const usage = process.cpuUsage();
      const totalUsage = (usage.user + usage.system) / 1000000; // Convert to seconds
      await this.recordMetric('system.cpu.usage', totalUsage, { type: 'system' });
    }, 30000)); // Every 30 seconds

    // Memory usage
    this.collectors.set('memory', setInterval(async () => {
      const usage = process.memoryUsage();
      await this.recordMetric('system.memory.heap.used', usage.heapUsed, { type: 'system' });
      await this.recordMetric('system.memory.heap.total', usage.heapTotal, { type: 'system' });
      await this.recordMetric('system.memory.rss', usage.rss, { type: 'system' });
    }, 30000));

    // Uptime
    this.collectors.set('uptime', setInterval(async () => {
      await this.recordMetric('system.uptime', process.uptime(), { type: 'system' });
    }, 60000)); // Every minute
  }

  // Start aggregation loop
  private startAggregationLoop(): void {
    setInterval(() => {
      // Clear old aggregations
      const now = Date.now();
      for (const [key, aggregation] of this.aggregations.entries()) {
        if (now - aggregation.timestamp.getTime() > 300000) { // 5 minutes
          this.aggregations.delete(key);
        }
      }
    }, 60000); // Every minute
  }

  // Start alerting loop
  private startAlertingLoop(): void {
    setInterval(async () => {
      for (const [key, threshold] of this.thresholds.entries()) {
        try {
          const aggregation = await this.getAggregation(threshold.metric, threshold.duration, 'avg');
          if (!aggregation) continue;

          let shouldAlert = false;
          switch (threshold.operator) {
            case '>':
              shouldAlert = aggregation.value > threshold.value;
              break;
            case '<':
              shouldAlert = aggregation.value < threshold.value;
              break;
            case '>=':
              shouldAlert = aggregation.value >= threshold.value;
              break;
            case '<=':
              shouldAlert = aggregation.value <= threshold.value;
              break;
            case '==':
              shouldAlert = aggregation.value === threshold.value;
              break;
            case '!=':
              shouldAlert = aggregation.value !== threshold.value;
              break;
          }

          if (shouldAlert) {
            this.emit('alert:triggered', {
              threshold,
              currentValue: aggregation.value,
              timestamp: new Date()
            });
          }
        } catch (error) {
          this.logger.error('Failed to check alert threshold:', error);
        }
      }
    }, 30000); // Every 30 seconds
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Clear all collectors
    for (const [name, interval] of this.collectors.entries()) {
      clearInterval(interval);
    }
    this.collectors.clear();

    // Close Redis connection
    await this.redis.quit();
  }
}

// Export singleton instance
export const metricsEngine = new MetricsEngine(process.env.REDIS_URL);
