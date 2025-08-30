// Advanced usage tracking and billing system
import { PrismaClient } from '@prisma/client';

export interface UsageEvent {
  userId: string;
  organizationId: string;
  eventType: 'scrape_request' | 'data_export' | 'api_call' | 'proxy_request' | 'ai_generation';
  resourceId?: string; // Job ID, scraper ID, etc.
  metadata: {
    url?: string;
    dataPoints?: number;
    fileSize?: number; // in bytes
    responseTime?: number; // in milliseconds
    proxyProvider?: string;
    proxyRegion?: string;
    success: boolean;
    errorCode?: string;
  };
  cost?: number; // Cost in credits or dollars
  timestamp: Date;
}

export interface UsageQuota {
  organizationId: string;
  planType: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  period: 'monthly' | 'daily' | 'hourly';
  limits: {
    scrapeRequests: number;
    dataPoints: number;
    concurrentJobs: number;
    apiCalls: number;
    proxyRequests: number;
    storageGB: number;
    exportRequests: number;
  };
  usage: {
    scrapeRequests: number;
    dataPoints: number;
    concurrentJobs: number;
    apiCalls: number;
    proxyRequests: number;
    storageGB: number;
    exportRequests: number;
  };
  resetDate: Date;
  overage: {
    scrapeRequests: number;
    dataPoints: number;
    apiCalls: number;
    proxyRequests: number;
    storageGB: number;
  };
}

export interface BillingMetrics {
  organizationId: string;
  period: { start: Date; end: Date };
  usage: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalDataPoints: number;
    totalStorageUsed: number;
    totalApiCalls: number;
    totalProxyRequests: number;
    averageResponseTime: number;
  };
  costs: {
    baseSubscription: number;
    overageCharges: number;
    proxyUsage: number;
    storageCharges: number;
    total: number;
    currency: 'USD';
  };
  topResources: Array<{
    type: 'job' | 'scraper' | 'api_endpoint';
    id: string;
    name: string;
    requests: number;
    cost: number;
  }>;
}

export interface RateLimitInfo {
  organizationId: string;
  resource: string; // API endpoint, job type, etc.
  limit: number;
  window: number; // seconds
  current: number;
  resetTime: Date;
  isLimited: boolean;
}

export class UsageTracker {
  private prisma: PrismaClient;
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private usageBuffer: UsageEvent[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    this.prisma = new PrismaClient();

    // Batch flush usage events every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushUsageBuffer();
    }, 30000);
  }

  async trackUsage(event: UsageEvent): Promise<void> {
    // Add to buffer for batch processing
    this.usageBuffer.push(event);

    // Update real-time quota tracking
    await this.updateQuotaUsage(event);

    // Check rate limits
    await this.checkRateLimit(event);

    // Flush immediately if buffer is large
    if (this.usageBuffer.length > 100) {
      await this.flushUsageBuffer();
    }
  }

  private async flushUsageBuffer(): Promise<void> {
    if (this.usageBuffer.length === 0) return;

    const events = [...this.usageBuffer];
    this.usageBuffer = [];

    try {
      await this.prisma.usageStats.createMany({
        data: events.map(event => ({
          organizationId: event.organizationId,
          userId: event.userId,
          eventType: event.eventType,
          resourceId: event.resourceId,
          metadata: event.metadata as any,
          cost: event.cost || 0,
          timestamp: event.timestamp,
          period: new Date().toISOString().substring(0, 7), // YYYY-MM format
          dataPointsCount: 0,
          requestsCount: 1,
          storageBytes: 0,
          executionTimeMs: 0
        }))
      });

      console.log(`✅ Flushed ${events.length} usage events to database`);
    } catch (error) {
      console.error('❌ Failed to flush usage events:', error);
      // Re-add events to buffer for retry
      this.usageBuffer.unshift(...events);
    }
  }

  private async updateQuotaUsage(event: UsageEvent): Promise<void> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: event.organizationId }
      });

      if (!organization) return;

      // Update the appropriate usage counter based on event type
      const updateData: any = {};

      switch (event.eventType) {
        case 'scrape_request':
          updateData.monthlyRequestsUsed = {
            increment: 1
          };
          break;
        case 'proxy_request':
          // Track proxy usage separately if needed
          break;
        case 'api_call':
          // Track API usage
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.organization.update({
          where: { id: event.organizationId },
          data: updateData
        });
      }
    } catch (error) {
      console.error('Failed to update quota usage:', error);
    }
  }

  private async checkRateLimit(event: UsageEvent): Promise<void> {
    const key = `${event.organizationId}:${event.eventType}`;
    const now = new Date();

    let rateLimit = this.rateLimits.get(key);

    if (!rateLimit) {
      // Initialize rate limit based on plan
      const organization = await this.prisma.organization.findUnique({
        where: { id: event.organizationId }
      });

      if (!organization) return;

      rateLimit = {
        organizationId: event.organizationId,
        resource: event.eventType,
        limit: this.getRateLimitForPlan(organization.plan, event.eventType),
        window: 60, // 1 minute window
        current: 0,
        resetTime: new Date(now.getTime() + 60000),
        isLimited: false
      };

      this.rateLimits.set(key, rateLimit);
    }

    // Reset if window expired
    if (now > rateLimit.resetTime) {
      rateLimit.current = 0;
      rateLimit.resetTime = new Date(now.getTime() + rateLimit.window * 1000);
      rateLimit.isLimited = false;
    }

    // Increment counter
    rateLimit.current++;

    // Check if rate limited
    if (rateLimit.current > rateLimit.limit) {
      rateLimit.isLimited = true;
      throw new Error(`Rate limit exceeded for ${event.eventType}. Limit: ${rateLimit.limit} per ${rateLimit.window}s`);
    }
  }

  private getRateLimitForPlan(plan: string, eventType: string): number {
    const limits: Record<string, Record<string, number>> = {
      FREE: {
        scrape_request: 10, // per minute
        api_call: 20,
        data_export: 2,
        proxy_request: 5
      },
      STARTER: {
        scrape_request: 50,
        api_call: 100,
        data_export: 10,
        proxy_request: 25
      },
      PRO: {
        scrape_request: 200,
        api_call: 500,
        data_export: 50,
        proxy_request: 100
      },
      ENTERPRISE: {
        scrape_request: 1000,
        api_call: 2000,
        data_export: 200,
        proxy_request: 500
      }
    };

    return limits[plan]?.[eventType] || 1;
  }

  async getUsageQuota(organizationId: string): Promise<UsageQuota | null> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) return null;

      const limits = this.getPlanLimits(organization.plan);

      return {
        organizationId,
        planType: organization.plan,
        period: 'monthly',
        limits,
        usage: {
          scrapeRequests: organization.monthlyRequestsUsed || 0,
          dataPoints: 0, // Calculate from usage stats
          concurrentJobs: 0, // Get from active jobs
          apiCalls: 0, // Calculate from usage stats
          proxyRequests: 0, // Calculate from usage stats
          storageGB: 0, // Calculate storage usage
          exportRequests: 0 // Calculate from usage stats
        },
        resetDate: organization.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        overage: {
          scrapeRequests: Math.max(0, (organization.monthlyRequestsUsed || 0) - limits.scrapeRequests),
          dataPoints: 0,
          apiCalls: 0,
          proxyRequests: 0,
          storageGB: 0
        }
      };
    } catch (error) {
      console.error('Failed to get usage quota:', error);
      return null;
    }
  }

  private getPlanLimits(plan: string): UsageQuota['limits'] {
    const planLimits: Record<string, UsageQuota['limits']> = {
      FREE: {
        scrapeRequests: 1000,
        dataPoints: 10000,
        concurrentJobs: 1,
        apiCalls: 1000,
        proxyRequests: 500,
        storageGB: 1,
        exportRequests: 10
      },
      STARTER: {
        scrapeRequests: 50000,
        dataPoints: 500000,
        concurrentJobs: 3,
        apiCalls: 10000,
        proxyRequests: 5000,
        storageGB: 10,
        exportRequests: 100
      },
      PRO: {
        scrapeRequests: 250000,
        dataPoints: 2500000,
        concurrentJobs: 10,
        apiCalls: 50000,
        proxyRequests: 25000,
        storageGB: 100,
        exportRequests: 500
      },
      ENTERPRISE: {
        scrapeRequests: -1, // Unlimited
        dataPoints: -1,
        concurrentJobs: -1,
        apiCalls: -1,
        proxyRequests: -1,
        storageGB: 1000,
        exportRequests: -1
      }
    };

    return planLimits[plan] || planLimits.FREE;
  }

  async getBillingMetrics(organizationId: string, period: { start: Date; end: Date }): Promise<BillingMetrics> {
    try {
      const usageStats = await this.prisma.usageStats.findMany({
        where: {
          organizationId,
          createdAt: {
            gte: period.start,
            lte: period.end
          }
        }
      });

      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      // Calculate usage metrics
      const usage = {
        totalRequests: usageStats.reduce((sum, s) => sum + s.requestsCount, 0),
        successfulRequests: usageStats.reduce((sum, s) => sum + s.requestsCount, 0), // Simplified for now
        failedRequests: 0, // Simplified for now
        totalDataPoints: usageStats.reduce((sum, s) => sum + s.dataPointsCount, 0),
        totalStorageUsed: usageStats.reduce((sum, s) => sum + Number(s.storageBytes), 0),
        totalApiCalls: usageStats.reduce((sum, s) => sum + s.requestsCount, 0),
        totalProxyRequests: 0, // Simplified for now
        averageResponseTime: this.calculateAverageResponseTime(usageStats)
      };

      // Calculate costs
      const baseSubscription = this.getBasePlanCost(organization.plan);
      const overageCharges = this.calculateOverageCharges(organization, usage);
      const proxyUsage = this.calculateProxyUsage(usageStats);
      const storageCharges = this.calculateStorageCharges(usage.totalStorageUsed);

      const costs = {
        baseSubscription,
        overageCharges,
        proxyUsage,
        storageCharges,
        total: baseSubscription + overageCharges + proxyUsage + storageCharges,
        currency: 'USD' as const
      };

      // Get top resources
      const topResources = this.getTopResources(usageStats);

      return {
        organizationId,
        period,
        usage,
        costs,
        topResources
      };
    } catch (error) {
      console.error('Failed to get billing metrics:', error);
      throw error;
    }
  }

  private calculateAverageResponseTime(usageStats: any[]): number {
    const responseTimes = usageStats
      .map(s => s.metadata?.responseTime)
      .filter(Boolean);

    return responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;
  }

  private getBasePlanCost(plan: string): number {
    const costs: Record<string, number> = {
      FREE: 0,
      STARTER: 19,
      PRO: 59,
      ENTERPRISE: 499 // Base enterprise cost
    };

    return costs[plan] || 0;
  }

  private calculateOverageCharges(organization: any, usage: any): number {
    // Calculate overage charges based on plan limits
    let overageCharges = 0;

    const limits = this.getPlanLimits(organization.plan);

    if (limits.scrapeRequests > 0 && usage.totalRequests > limits.scrapeRequests) {
      const overage = usage.totalRequests - limits.scrapeRequests;
      overageCharges += overage * 0.01; // $0.01 per extra request
    }

    if (limits.dataPoints > 0 && usage.totalDataPoints > limits.dataPoints) {
      const overage = usage.totalDataPoints - limits.dataPoints;
      overageCharges += overage * 0.001; // $0.001 per extra data point
    }

    return overageCharges;
  }

  private calculateProxyUsage(usageStats: any[]): number {
    const proxyRequests = usageStats.filter(s => s.eventType === 'proxy_request');
    return proxyRequests.length * 0.005; // $0.005 per proxy request
  }

  private calculateStorageCharges(storageGB: number): number {
    return Math.max(0, storageGB - 1) * 0.10; // $0.10 per GB over 1GB
  }

  private getTopResources(usageStats: any[]): BillingMetrics['topResources'] {
    const resourceMap = new Map<string, { requests: number; cost: number; name: string; type: string }>();

    for (const stat of usageStats) {
      if (stat.resourceId) {
        const existing = resourceMap.get(stat.resourceId) || {
          requests: 0,
          cost: 0,
          name: stat.resourceId,
          type: 'job'
        };

        existing.requests++;
        existing.cost += stat.cost || 0.01;

        resourceMap.set(stat.resourceId, existing);
      }
    }

    return Array.from(resourceMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10) as BillingMetrics['topResources'];
  }

  async isQuotaExceeded(organizationId: string, eventType: UsageEvent['eventType']): Promise<boolean> {
    try {
      const quota = await this.getUsageQuota(organizationId);
      if (!quota) return false;

      switch (eventType) {
        case 'scrape_request':
          return quota.limits.scrapeRequests > 0 && quota.usage.scrapeRequests >= quota.limits.scrapeRequests;
        case 'api_call':
          return quota.limits.apiCalls > 0 && quota.usage.apiCalls >= quota.limits.apiCalls;
        case 'proxy_request':
          return quota.limits.proxyRequests > 0 && quota.usage.proxyRequests >= quota.limits.proxyRequests;
        case 'data_export':
          return quota.limits.exportRequests > 0 && quota.usage.exportRequests >= quota.limits.exportRequests;
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to check quota:', error);
      return false;
    }
  }

  async getRateLimit(organizationId: string, resource: string): Promise<RateLimitInfo | null> {
    const key = `${organizationId}:${resource}`;
    return this.rateLimits.get(key) || null;
  }

  async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    await this.flushUsageBuffer();
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const usageTracker = new UsageTracker();
