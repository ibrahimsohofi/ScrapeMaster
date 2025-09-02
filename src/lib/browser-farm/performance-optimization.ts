import { type Page, Browser, Response } from 'playwright';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number; // requests per second
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  bandwidth: number; // bytes per second
  cacheHitRate: number;
  timestamp: Date;
}

export interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
  retryableStatusCodes: number[];
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
    halfOpenMaxCalls: number;
  };
}

export interface TimeoutPolicy {
  navigation: number;
  request: number;
  response: number;
  idle: number;
  adaptive: {
    enabled: boolean;
    minTimeout: number;
    maxTimeout: number;
    adjustmentFactor: number;
    responseTimeThreshold: number;
  };
}

export interface CacheStrategy {
  enabled: boolean;
  ttl: number; // time to live in milliseconds
  maxSize: number; // maximum cache size in bytes
  compression: boolean;
  storage: 'memory' | 'disk' | 'hybrid';
  invalidation: {
    manual: boolean;
    timeBasedExpiry: boolean;
    versionBasedExpiry: boolean;
    sizeBasedEviction: boolean;
  };
  policies: {
    cacheControl: boolean;
    etag: boolean;
    lastModified: boolean;
    vary: boolean;
  };
}

export interface BandwidthOptimization {
  compression: {
    enabled: boolean;
    level: number; // 1-9
    types: string[]; // mime types to compress
  };
  prioritization: {
    enabled: boolean;
    priorities: Map<string, number>; // resource type -> priority
  };
  throttling: {
    enabled: boolean;
    maxBandwidth: number; // bytes per second
    burstSize: number; // bytes
  };
  resourceBlocking: {
    enabled: boolean;
    blockedTypes: string[];
    blockedDomains: string[];
    allowedTypes: string[];
  };
}

export interface OptimizationProfile {
  id: string;
  name: string;
  description: string;
  retryPolicy: RetryPolicy;
  timeoutPolicy: TimeoutPolicy;
  cacheStrategy: CacheStrategy;
  bandwidthOptimization: BandwidthOptimization;
  aggressiveness: 'conservative' | 'balanced' | 'aggressive';
  targetMetrics: {
    maxResponseTime: number;
    minThroughput: number;
    maxErrorRate: number;
    maxMemoryUsage: number;
  };
}

export interface RequestOptimization {
  connectionPooling: {
    enabled: boolean;
    maxConnections: number;
    maxConnectionsPerHost: number;
    keepAliveTimeout: number;
  };
  requestBatching: {
    enabled: boolean;
    batchSize: number;
    batchTimeout: number;
  };
  resourcePreloading: {
    enabled: boolean;
    preloadTypes: string[];
    maxPreloadSize: number;
  };
  parallelization: {
    enabled: boolean;
    maxConcurrentRequests: number;
    requestQueuing: boolean;
  };
}

export class PerformanceOptimizer extends EventEmitter {
  private profiles: Map<string, OptimizationProfile> = new Map();
  private activeOptimizations: Map<string, {
    profile: OptimizationProfile;
    metrics: PerformanceMetrics[];
    cache: Map<string, CacheEntry>;
    circuitBreakers: Map<string, CircuitBreaker>;
    adaptiveTimeouts: Map<string, AdaptiveTimeout>;
  }> = new Map();
  private logger: winston.Logger;
  private metricsCollector: MetricsCollector;

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
        new winston.transports.File({ filename: 'performance-optimizer.log' })
      ]
    });

    this.metricsCollector = new MetricsCollector();
    this.initializeDefaultProfiles();
  }

  // Profile Management
  createProfile(profile: Omit<OptimizationProfile, 'id'>): string {
    const profileId = uuidv4();
    const fullProfile: OptimizationProfile = {
      ...profile,
      id: profileId
    };

    this.profiles.set(profileId, fullProfile);
    this.logger.info(`Created optimization profile ${profileId}: ${profile.name}`);

    return profileId;
  }

  async optimizePage(page: Page, profileId: string): Promise<string> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Optimization profile ${profileId} not found`);
    }

    const optimizationId = uuidv4();

    // Initialize optimization context
    const optimization = {
      profile,
      metrics: [],
      cache: new Map<string, CacheEntry>(),
      circuitBreakers: new Map<string, CircuitBreaker>(),
      adaptiveTimeouts: new Map<string, AdaptiveTimeout>()
    };

    this.activeOptimizations.set(optimizationId, optimization);

    // Apply optimizations
    await this.applyRetryLogic(page, optimization);
    await this.applyTimeoutManagement(page, optimization);
    await this.applyCaching(page, optimization);
    await this.applyBandwidthOptimization(page, optimization);
    await this.applyRequestOptimization(page, optimization);

    // Start metrics collection
    this.startMetricsCollection(optimizationId, page);

    this.logger.info(`Applied optimization profile ${profileId} to page`);
    this.emit('optimizationApplied', { optimizationId, profileId });

    return optimizationId;
  }

  // Intelligent Retry Logic
  private async applyRetryLogic(page: Page, optimization: any): Promise<void> {
    const policy = optimization.profile.retryPolicy;

    // Set up circuit breakers for different domains
    page.on('response', (response) => {
      const url = new URL(response.url());
      const domain = url.hostname;

      if (!optimization.circuitBreakers.has(domain)) {
        optimization.circuitBreakers.set(domain, new CircuitBreaker(policy.circuitBreaker));
      }

      const circuitBreaker = optimization.circuitBreakers.get(domain)!;

      if (response.status() >= 400) {
        circuitBreaker.recordFailure();
      } else {
        circuitBreaker.recordSuccess();
      }
    });

    // Override request handling with retry logic
    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = request.url();
      const domain = new URL(url).hostname;

      const circuitBreaker = optimization.circuitBreakers.get(domain);
      if (circuitBreaker && !circuitBreaker.canExecute()) {
        await route.abort('failed');
        return;
      }

      await this.executeWithRetry(route, policy);
    });
  }

  private async executeWithRetry(route: any, policy: RetryPolicy): Promise<void> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < policy.maxAttempts) {
      try {
        await route.continue();
        return;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt >= policy.maxAttempts) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error as Error, policy)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateRetryDelay(attempt, policy);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries failed
    await route.abort('failed');
    this.logger.warn(`Request failed after ${attempt} attempts: ${lastError?.message}`);
  }

  private isRetryableError(error: Error, policy: RetryPolicy): boolean {
    return policy.retryableErrors.some(pattern =>
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private calculateRetryDelay(attempt: number, policy: RetryPolicy): number {
    let delay = policy.baseDelay * Math.pow(policy.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, policy.maxDelay);

    if (policy.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5); // 50-100% of calculated delay
    }

    return delay;
  }

  // Adaptive Timeout Management
  private async applyTimeoutManagement(page: Page, optimization: any): Promise<void> {
    const policy = optimization.profile.timeoutPolicy;

    // Set initial timeouts
    page.setDefaultTimeout(policy.navigation);
    page.setDefaultNavigationTimeout(policy.navigation);

    if (policy.adaptive.enabled) {
      // Create adaptive timeout manager for different resource types
      const adaptiveManager = new AdaptiveTimeout(policy.adaptive);
      optimization.adaptiveTimeouts.set('default', adaptiveManager);

      // Monitor request performance and adjust timeouts
      page.on('response', (response) => {
        const responseTime = Date.now() - response.request().timing().startTime;
        adaptiveManager.recordResponseTime(responseTime);

        // Adjust timeout if needed
        const newTimeout = adaptiveManager.getOptimalTimeout();
        const currentTimeout = (page as any).getDefaultTimeout?.() || 30000;
        if (newTimeout !== currentTimeout) {
          page.setDefaultTimeout(newTimeout);
        }
      });
    }
  }

  // Caching Strategies
  private async applyCaching(page: Page, optimization: any): Promise<void> {
    const strategy = optimization.profile.cacheStrategy;
    if (!strategy.enabled) return;

    await page.route('**/*', async (route) => {
      const request = route.request();
      const cacheKey = this.generateCacheKey(request);

      // Check cache first
      const cachedResponse = optimization.cache.get(cacheKey);
      if (cachedResponse && !cachedResponse.isExpired()) {
        await route.fulfill({
          status: cachedResponse.status,
          headers: cachedResponse.headers,
          body: cachedResponse.body
        });
        return;
      }

      // Continue with request
      await route.continue();

      // Cache response handling would be done through response interception
      // For now, we'll skip caching for continued requests
      // In a real implementation, this would require response interception
    });
  }

  private generateCacheKey(request: any): string {
    return `${request.method()}_${request.url()}_${JSON.stringify(request.headers())}`;
  }

  private shouldCache(request: any, response: any, strategy: CacheStrategy): boolean {
    // Basic caching logic - can be enhanced
    if (response.status() >= 400) return false;
    if (request.method() !== 'GET') return false;

    const contentType = response.headers()['content-type'] || '';
    const cacheableTypes = ['text/', 'application/json', 'application/javascript', 'image/'];

    return cacheableTypes.some(type => contentType.includes(type));
  }

  private enforceCacheSize(cache: Map<string, CacheEntry>, maxSize: number): void {
    let totalSize = 0;
    const entries = Array.from(cache.entries());

    // Calculate total cache size
    for (const [key, entry] of entries) {
      totalSize += entry.getSize();
    }

    // Remove oldest entries if over limit
    if (totalSize > maxSize) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      while (totalSize > maxSize && entries.length > 0) {
        const [key, entry] = entries.shift()!;
        cache.delete(key);
        totalSize -= entry.getSize();
      }
    }
  }

  // Bandwidth Optimization
  private async applyBandwidthOptimization(page: Page, optimization: any): Promise<void> {
    const bandwidthOpt = optimization.profile.bandwidthOptimization;

    if (bandwidthOpt.resourceBlocking.enabled) {
      await page.route('**/*', async (route) => {
        const request = route.request();
        const resourceType = request.resourceType();
        const url = new URL(request.url());

        // Block unwanted resource types
        if (bandwidthOpt.resourceBlocking.blockedTypes.includes(resourceType)) {
          await route.abort('blockedbyclient');
          return;
        }

        // Block unwanted domains
        if (bandwidthOpt.resourceBlocking.blockedDomains.includes(url.hostname)) {
          await route.abort('blockedbyclient');
          return;
        }

        await route.continue();
      });
    }

    if (bandwidthOpt.compression.enabled) {
      await page.route('**/*', async (route) => {
        const request = route.request();
        const headers = { ...request.headers() };

        // Add compression headers
        headers['accept-encoding'] = 'gzip, deflate, br';

        await route.continue({ headers });
      });
    }

    if (bandwidthOpt.throttling.enabled) {
      // Note: This would require CDP integration in a real implementation
      await page.evaluate((maxBandwidth) => {
        // Client-side bandwidth throttling simulation
        (window as any).__bandwidthThrottle = maxBandwidth;
      }, bandwidthOpt.throttling.maxBandwidth);
    }
  }

  // Request Optimization
  private async applyRequestOptimization(page: Page, optimization: any): Promise<void> {
    const requestOpt: RequestOptimization = {
      connectionPooling: {
        enabled: true,
        maxConnections: 10,
        maxConnectionsPerHost: 6,
        keepAliveTimeout: 30000
      },
      requestBatching: {
        enabled: false,
        batchSize: 10,
        batchTimeout: 1000
      },
      resourcePreloading: {
        enabled: true,
        preloadTypes: ['stylesheet', 'script', 'font'],
        maxPreloadSize: 1024 * 1024 // 1MB
      },
      parallelization: {
        enabled: true,
        maxConcurrentRequests: 8,
        requestQueuing: true
      }
    };

    if (requestOpt.resourcePreloading.enabled) {
      // Implement resource preloading
      await page.route('**/*', async (route) => {
        const request = route.request();

        if (requestOpt.resourcePreloading.preloadTypes.includes(request.resourceType())) {
          // Priority handling for preloadable resources
          const headers = { ...request.headers() };
          headers['priority'] = 'high';
          await route.continue({ headers });
        } else {
          await route.continue();
        }
      });
    }
  }

  // Metrics Collection
  private startMetricsCollection(optimizationId: string, page: Page): void {
    const optimization = this.activeOptimizations.get(optimizationId)!;

    const collectMetrics = async () => {
      try {
        const metrics = await this.metricsCollector.collect(page);
        optimization.metrics.push(metrics);

        // Keep only last 100 metrics
        if (optimization.metrics.length > 100) {
          optimization.metrics.shift();
        }

        this.emit('metricsCollected', { optimizationId, metrics });

        // Check if adjustments are needed
        await this.evaluatePerformance(optimizationId, metrics);
      } catch (error) {
        this.logger.error(`Failed to collect metrics: ${error}`);
      }
    };

    // Collect metrics every 30 seconds
    const metricsInterval = setInterval(collectMetrics, 30000);

    // Store interval for cleanup
    (optimization as any).metricsInterval = metricsInterval;
  }

  private async evaluatePerformance(optimizationId: string, metrics: PerformanceMetrics): Promise<void> {
    const optimization = this.activeOptimizations.get(optimizationId)!;
    const targets = optimization.profile.targetMetrics;

    let adjustmentNeeded = false;
    const suggestions: string[] = [];

    // Check response time
    if (metrics.responseTime > targets.maxResponseTime) {
      adjustmentNeeded = true;
      suggestions.push('Consider reducing timeout values or enabling more aggressive caching');
    }

    // Check throughput
    if (metrics.throughput < targets.minThroughput) {
      adjustmentNeeded = true;
      suggestions.push('Consider increasing parallelization or enabling request batching');
    }

    // Check error rate
    if (metrics.errorRate > targets.maxErrorRate) {
      adjustmentNeeded = true;
      suggestions.push('Consider adjusting retry policies or circuit breaker settings');
    }

    // Check memory usage
    if (metrics.memoryUsage > targets.maxMemoryUsage) {
      adjustmentNeeded = true;
      suggestions.push('Consider reducing cache size or enabling compression');
    }

    if (adjustmentNeeded) {
      this.emit('performanceIssue', {
        optimizationId,
        metrics,
        suggestions
      });
    }
  }

  // Default Profiles
  private initializeDefaultProfiles(): void {
    const profiles: Omit<OptimizationProfile, 'id'>[] = [
      {
        name: 'Conservative',
        description: 'Safe optimization settings with minimal risk',
        aggressiveness: 'conservative',
        retryPolicy: {
          maxAttempts: 2,
          baseDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
          jitter: true,
          retryableErrors: ['timeout', 'network', 'connection'],
          retryableStatusCodes: [408, 429, 500, 502, 503, 504],
          circuitBreaker: {
            enabled: true,
            failureThreshold: 5,
            recoveryTimeout: 30000,
            halfOpenMaxCalls: 3
          }
        },
        timeoutPolicy: {
          navigation: 30000,
          request: 10000,
          response: 10000,
          idle: 5000,
          adaptive: {
            enabled: false,
            minTimeout: 5000,
            maxTimeout: 30000,
            adjustmentFactor: 0.1,
            responseTimeThreshold: 2000
          }
        },
        cacheStrategy: {
          enabled: true,
          ttl: 300000, // 5 minutes
          maxSize: 50 * 1024 * 1024, // 50MB
          compression: false,
          storage: 'memory',
          invalidation: {
            manual: true,
            timeBasedExpiry: true,
            versionBasedExpiry: false,
            sizeBasedEviction: true
          },
          policies: {
            cacheControl: true,
            etag: true,
            lastModified: true,
            vary: false
          }
        },
        bandwidthOptimization: {
          compression: {
            enabled: true,
            level: 6,
            types: ['text/html', 'text/css', 'application/javascript']
          },
          prioritization: {
            enabled: false,
            priorities: new Map()
          },
          throttling: {
            enabled: false,
            maxBandwidth: 0,
            burstSize: 0
          },
          resourceBlocking: {
            enabled: true,
            blockedTypes: ['media'],
            blockedDomains: ['analytics.google.com', 'facebook.com'],
            allowedTypes: ['document', 'stylesheet', 'script', 'xhr', 'fetch']
          }
        },
        targetMetrics: {
          maxResponseTime: 5000,
          minThroughput: 10,
          maxErrorRate: 5,
          maxMemoryUsage: 100 * 1024 * 1024
        }
      },
      {
        name: 'Aggressive',
        description: 'Maximum optimization for high performance',
        aggressiveness: 'aggressive',
        retryPolicy: {
          maxAttempts: 5,
          baseDelay: 500,
          maxDelay: 10000,
          backoffMultiplier: 1.5,
          jitter: true,
          retryableErrors: ['timeout', 'network', 'connection', 'dns'],
          retryableStatusCodes: [408, 409, 429, 500, 502, 503, 504],
          circuitBreaker: {
            enabled: true,
            failureThreshold: 10,
            recoveryTimeout: 15000,
            halfOpenMaxCalls: 5
          }
        },
        timeoutPolicy: {
          navigation: 60000,
          request: 20000,
          response: 20000,
          idle: 10000,
          adaptive: {
            enabled: true,
            minTimeout: 2000,
            maxTimeout: 60000,
            adjustmentFactor: 0.2,
            responseTimeThreshold: 1000
          }
        },
        cacheStrategy: {
          enabled: true,
          ttl: 3600000, // 1 hour
          maxSize: 200 * 1024 * 1024, // 200MB
          compression: true,
          storage: 'hybrid',
          invalidation: {
            manual: true,
            timeBasedExpiry: true,
            versionBasedExpiry: true,
            sizeBasedEviction: true
          },
          policies: {
            cacheControl: true,
            etag: true,
            lastModified: true,
            vary: true
          }
        },
        bandwidthOptimization: {
          compression: {
            enabled: true,
            level: 9,
            types: ['text/html', 'text/css', 'application/javascript', 'application/json']
          },
          prioritization: {
            enabled: true,
            priorities: new Map([
              ['document', 10],
              ['stylesheet', 9],
              ['script', 8],
              ['xhr', 7],
              ['image', 5],
              ['media', 3]
            ])
          },
          throttling: {
            enabled: false,
            maxBandwidth: 0,
            burstSize: 0
          },
          resourceBlocking: {
            enabled: true,
            blockedTypes: ['media', 'other'],
            blockedDomains: [
              'analytics.google.com',
              'facebook.com',
              'twitter.com',
              'linkedin.com',
              'doubleclick.net'
            ],
            allowedTypes: ['document', 'stylesheet', 'script', 'xhr', 'fetch', 'image']
          }
        },
        targetMetrics: {
          maxResponseTime: 2000,
          minThroughput: 50,
          maxErrorRate: 2,
          maxMemoryUsage: 200 * 1024 * 1024
        }
      }
    ];

    profiles.forEach(profile => {
      this.createProfile(profile);
    });
  }

  // Public API
  getOptimizationMetrics(optimizationId: string): PerformanceMetrics[] {
    const optimization = this.activeOptimizations.get(optimizationId);
    return optimization ? optimization.metrics : [];
  }

  getCacheStats(optimizationId: string): { size: number; hitRate: number; entries: number } {
    const optimization = this.activeOptimizations.get(optimizationId);
    if (!optimization) return { size: 0, hitRate: 0, entries: 0 };

    const cache = optimization.cache;
    let totalSize = 0;
    let hits = 0;
    let total = 0;

    for (const entry of cache.values()) {
      totalSize += entry.getSize();
      hits += entry.hits;
      total += entry.hits + entry.misses;
    }

    return {
      size: totalSize,
      hitRate: total > 0 ? (hits / total) * 100 : 0,
      entries: cache.size
    };
  }

  clearCache(optimizationId: string): void {
    const optimization = this.activeOptimizations.get(optimizationId);
    if (optimization) {
      optimization.cache.clear();
    }
  }

  async cleanup(optimizationId: string): Promise<void> {
    const optimization = this.activeOptimizations.get(optimizationId);
    if (optimization) {
      // Clear metrics interval
      if ((optimization as any).metricsInterval) {
        clearInterval((optimization as any).metricsInterval);
      }

      this.activeOptimizations.delete(optimizationId);
      this.logger.info(`Cleaned up optimization ${optimizationId}`);
    }
  }
}

// Helper Classes
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private halfOpenCalls = 0;

  constructor(private config: any) {}

  canExecute(): boolean {
    const now = Date.now();

    switch (this.state) {
      case 'closed':
        return true;
      case 'open':
        if (now - this.lastFailureTime > this.config.recoveryTimeout) {
          this.state = 'half-open';
          this.halfOpenCalls = 0;
          return true;
        }
        return false;
      case 'half-open':
        return this.halfOpenCalls < this.config.halfOpenMaxCalls;
    }
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      this.halfOpenCalls++;
      this.state = 'open';
    } else if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }
}

class AdaptiveTimeout {
  private responseTimes: number[] = [];
  private currentTimeout: number;

  constructor(private config: any) {
    this.currentTimeout = config.minTimeout;
  }

  recordResponseTime(time: number): void {
    this.responseTimes.push(time);

    // Keep only last 100 measurements
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    this.adjustTimeout();
  }

  private adjustTimeout(): void {
    if (this.responseTimes.length < 10) return;

    const avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    const p95ResponseTime = this.responseTimes.sort((a, b) => a - b)[Math.floor(this.responseTimes.length * 0.95)];

    if (p95ResponseTime > this.config.responseTimeThreshold) {
      // Increase timeout
      this.currentTimeout = Math.min(
        this.config.maxTimeout,
        this.currentTimeout * (1 + this.config.adjustmentFactor)
      );
    } else if (avgResponseTime < this.config.responseTimeThreshold * 0.5) {
      // Decrease timeout
      this.currentTimeout = Math.max(
        this.config.minTimeout,
        this.currentTimeout * (1 - this.config.adjustmentFactor)
      );
    }
  }

  getOptimalTimeout(): number {
    return Math.round(this.currentTimeout);
  }
}

class CacheEntry {
  public hits = 0;
  public misses = 0;
  public timestamp: number;

  constructor(
    public status: number,
    public headers: Record<string, string>,
    public body: Buffer,
    data: { timestamp: number; ttl: number }
  ) {
    this.timestamp = data.timestamp;
  }

  isExpired(): boolean {
    return Date.now() - this.timestamp > 300000; // 5 minutes default TTL
  }

  getSize(): number {
    return this.body.length + JSON.stringify(this.headers).length;
  }
}

class MetricsCollector {
  async collect(page: Page): Promise<PerformanceMetrics> {
    // This would collect real metrics in a production environment
    return {
      responseTime: Math.random() * 2000 + 500,
      throughput: Math.random() * 100 + 10,
      errorRate: Math.random() * 5,
      memoryUsage: Math.random() * 100 * 1024 * 1024,
      cpuUsage: Math.random() * 100,
      networkLatency: Math.random() * 200 + 50,
      bandwidth: Math.random() * 10 * 1024 * 1024,
      cacheHitRate: Math.random() * 100,
      timestamp: new Date()
    };
  }
}
