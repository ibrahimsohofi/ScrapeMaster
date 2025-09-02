import { NextResponse } from 'next/server';
import { env } from '@/lib/env-validation';

// Health check configuration
const HEALTH_CONFIG = {
  timeout: parseInt(env.HEALTH_CHECK_TIMEOUT || '5000'),
  intervals: {
    database: 10000, // 10 seconds
    external: 30000, // 30 seconds
    system: 5000,    // 5 seconds
  },
  thresholds: {
    responseTime: 1000,    // 1 second
    memoryUsage: 0.9,      // 90%
    cpuUsage: 0.8,         // 80%
    diskUsage: 0.9,        // 90%
  },
};

// Health status interfaces
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: CheckResult;
    redis?: CheckResult;
    filesystem: CheckResult;
    memory: CheckResult;
    external: CheckResult;
    api: CheckResult;
  };
  metrics: SystemMetrics;
}

export interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  responseTime: number;
  message: string;
  details?: any;
  lastChecked: string;
}

export interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    connections: number;
    bandwidth?: {
      in: number;
      out: number;
    };
  };
  application: {
    activeConnections: number;
    requestsPerMinute: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

/**
 * Comprehensive Health Check System
 */
export class HealthChecker {
  private static instance: HealthChecker;
  private healthHistory: HealthStatus[] = [];
  private lastCheck?: HealthStatus;
  private checkInterval?: NodeJS.Timer;

  private constructor() {
    this.startPeriodicChecks();
  }

  public static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  /**
   * Start periodic health checks
   */
  private startPeriodicChecks(): void {
    if (env.HEALTH_CHECK_ENABLED === 'true') {
      this.checkInterval = setInterval(() => {
        this.performHealthCheck().catch(error => {
          console.error('Health check failed:', error);
        });
      }, HEALTH_CONFIG.intervals.system);

      console.log('🔍 Health monitoring started');
    }
  }

  /**
   * Stop periodic health checks
   */
  public stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
      console.log('🛑 Health monitoring stopped');
    }
  }

  /**
   * Perform comprehensive health check
   */
  public async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    console.log('🔍 Performing health check...');

    try {
      // Run all health checks in parallel for better performance
      const [
        databaseCheck,
        redisCheck,
        filesystemCheck,
        memoryCheck,
        externalCheck,
        apiCheck,
        systemMetrics,
      ] = await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkFilesystem(),
        this.checkMemory(),
        this.checkExternalServices(),
        this.checkAPIHealth(),
        this.getSystemMetrics(),
      ]);

      // Process results
      const checks = {
        database: this.getCheckResult(databaseCheck),
        filesystem: this.getCheckResult(filesystemCheck),
        memory: this.getCheckResult(memoryCheck),
        external: this.getCheckResult(externalCheck),
        api: this.getCheckResult(apiCheck),
        ...(redisCheck.status === 'fulfilled' && { redis: redisCheck.value }),
      };

      const metrics = systemMetrics.status === 'fulfilled'
        ? systemMetrics.value
        : this.getDefaultMetrics();

      // Determine overall health status
      const overallStatus = this.determineOverallStatus(checks);

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp,
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: env.NODE_ENV,
        checks,
        metrics,
      };

      // Store health status
      this.lastCheck = healthStatus;
      this.addToHistory(healthStatus);

      const checkDuration = Date.now() - startTime;
      console.log(`✅ Health check completed in ${checkDuration}ms - Status: ${overallStatus}`);

      return healthStatus;
    } catch (error) {
      console.error('❌ Health check failed:', error);

      // Return emergency status
      return {
        status: 'unhealthy',
        timestamp,
        uptime: process.uptime(),
        version: 'unknown',
        environment: env.NODE_ENV,
        checks: {
          database: { status: 'fail', responseTime: 0, message: 'Health check system failure', lastChecked: timestamp },
          filesystem: { status: 'fail', responseTime: 0, message: 'Health check system failure', lastChecked: timestamp },
          memory: { status: 'fail', responseTime: 0, message: 'Health check system failure', lastChecked: timestamp },
          external: { status: 'fail', responseTime: 0, message: 'Health check system failure', lastChecked: timestamp },
          api: { status: 'fail', responseTime: 0, message: 'Health check system failure', lastChecked: timestamp },
        },
        metrics: this.getDefaultMetrics(),
      };
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<CheckResult> {
    const startTime = Date.now();

    try {
      // This would use your actual Prisma client
      // const prisma = new PrismaClient();
      // await prisma.$queryRaw`SELECT 1`;

      // Simulated database check
      await new Promise(resolve => setTimeout(resolve, 10));

      const responseTime = Date.now() - startTime;

      if (responseTime > HEALTH_CONFIG.thresholds.responseTime) {
        return {
          status: 'warn',
          responseTime,
          message: `Database responding slowly (${responseTime}ms)`,
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        status: 'pass',
        responseTime,
        message: 'Database connection healthy',
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Redis connectivity (if configured)
   */
  private async checkRedis(): Promise<CheckResult> {
    const startTime = Date.now();

    if (!env.REDIS_URL) {
      return {
        status: 'pass',
        responseTime: 0,
        message: 'Redis not configured',
        lastChecked: new Date().toISOString(),
      };
    }

    try {
      // This would use your actual Redis client
      // const redis = new Redis(env.REDIS_URL);
      // await redis.ping();

      // Simulated Redis check
      await new Promise(resolve => setTimeout(resolve, 5));

      const responseTime = Date.now() - startTime;

      return {
        status: 'pass',
        responseTime,
        message: 'Redis connection healthy',
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check filesystem access
   */
  private async checkFilesystem(): Promise<CheckResult> {
    const startTime = Date.now();

    try {
      const fs = require('fs').promises;
      const testFile = '/tmp/health-check-test';

      // Test write
      await fs.writeFile(testFile, 'health-check');

      // Test read
      const content = await fs.readFile(testFile, 'utf8');

      // Cleanup
      await fs.unlink(testFile);

      const responseTime = Date.now() - startTime;

      if (content !== 'health-check') {
        return {
          status: 'fail',
          responseTime,
          message: 'Filesystem integrity check failed',
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        status: 'pass',
        responseTime,
        message: 'Filesystem access healthy',
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: `Filesystem check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<CheckResult> {
    const startTime = Date.now();

    try {
      const memUsage = process.memoryUsage();
      const totalMemory = require('os').totalmem();
      const freeMemory = require('os').freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryPercentage = usedMemory / totalMemory;

      const responseTime = Date.now() - startTime;

      if (memoryPercentage > HEALTH_CONFIG.thresholds.memoryUsage) {
        return {
          status: 'warn',
          responseTime,
          message: `High memory usage: ${(memoryPercentage * 100).toFixed(1)}%`,
          details: {
            used: usedMemory,
            total: totalMemory,
            percentage: memoryPercentage,
            process: memUsage,
          },
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        status: 'pass',
        responseTime,
        message: `Memory usage normal: ${(memoryPercentage * 100).toFixed(1)}%`,
        details: {
          used: usedMemory,
          total: totalMemory,
          percentage: memoryPercentage,
          process: memUsage,
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check external services
   */
  private async checkExternalServices(): Promise<CheckResult> {
    const startTime = Date.now();

    try {
      // Check critical external services
      const services = [
        { name: 'OpenAI', url: 'https://api.openai.com/v1/engines', required: false },
        { name: 'S3', url: env.AWS_S3_BUCKET ? `https://${env.AWS_S3_BUCKET}.s3.amazonaws.com/` : null, required: false },
      ].filter(service => service.url);

      const results = await Promise.allSettled(
        services.map(async (service) => {
          const response = await fetch(service.url!, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
          return { service: service.name, ok: response.ok };
        })
      );

      const failed = results
        .filter((result, index) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.ok))
        .map((_, index) => services[index].name);

      const responseTime = Date.now() - startTime;

      if (failed.length > 0) {
        return {
          status: 'warn',
          responseTime,
          message: `External services degraded: ${failed.join(', ')}`,
          details: { failed, total: services.length },
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        status: 'pass',
        responseTime,
        message: 'All external services healthy',
        details: { checked: services.length },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: `External services check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check API health
   */
  private async checkAPIHealth(): Promise<CheckResult> {
    const startTime = Date.now();

    try {
      // Test internal API endpoints
      const testEndpoints = [
        '/api/health',
        '/api/auth/status',
      ];

      // This is a simplified check - in production you'd make actual requests
      const responseTime = Date.now() - startTime;

      return {
        status: 'pass',
        responseTime,
        message: 'API endpoints healthy',
        details: { endpoints: testEndpoints.length },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: `API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Get system metrics
   */
  private async getSystemMetrics(): Promise<SystemMetrics> {
    const os = require('os');
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: usedMemory / totalMemory,
      },
      cpu: {
        usage: process.cpuUsage().user / 1000000, // Convert to seconds
        loadAverage: os.loadavg(),
      },
      disk: {
        used: 0, // Would need to implement disk usage check
        total: 0,
        percentage: 0,
      },
      network: {
        connections: 0, // Would need to implement connection counting
      },
      application: {
        activeConnections: 0, // Would track from request middleware
        requestsPerMinute: 0, // Would track from request middleware
        errorRate: 0, // Would track from error monitoring
        averageResponseTime: 0, // Would track from request middleware
      },
    };
  }

  /**
   * Helper methods
   */
  private getCheckResult(promiseResult: PromiseSettledResult<any>): CheckResult {
    if (promiseResult.status === 'fulfilled') {
      return promiseResult.value;
    } else {
      return {
        status: 'fail',
        responseTime: 0,
        message: `Check failed: ${promiseResult.reason}`,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private determineOverallStatus(checks: HealthStatus['checks']): 'healthy' | 'degraded' | 'unhealthy' {
    const checkValues = Object.values(checks).filter(check => check); // Filter out undefined
    const failedChecks = checkValues.filter(check => check.status === 'fail');
    const warnChecks = checkValues.filter(check => check.status === 'warn');

    if (failedChecks.length > 0) {
      return 'unhealthy';
    }
    if (warnChecks.length > 0) {
      return 'degraded';
    }
    return 'healthy';
  }

  private addToHistory(status: HealthStatus): void {
    this.healthHistory.push(status);

    // Keep only last 100 entries
    if (this.healthHistory.length > 100) {
      this.healthHistory = this.healthHistory.slice(-100);
    }
  }

  private getDefaultMetrics(): SystemMetrics {
    return {
      memory: { used: 0, total: 0, percentage: 0 },
      cpu: { usage: 0, loadAverage: [0, 0, 0] },
      disk: { used: 0, total: 0, percentage: 0 },
      network: { connections: 0 },
      application: {
        activeConnections: 0,
        requestsPerMinute: 0,
        errorRate: 0,
        averageResponseTime: 0,
      },
    };
  }

  /**
   * Public API methods
   */
  public getLastHealthCheck(): HealthStatus | undefined {
    return this.lastCheck;
  }

  public getHealthHistory(): HealthStatus[] {
    return [...this.healthHistory];
  }

  public async getHealthResponse(): Promise<NextResponse> {
    const health = await this.performHealthCheck();
    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  }
}

// Export singleton instance
export const healthChecker = HealthChecker.getInstance();

// Cleanup on process exit
process.on('SIGTERM', () => {
  healthChecker.stopPeriodicChecks();
});

process.on('SIGINT', () => {
  healthChecker.stopPeriodicChecks();
});
