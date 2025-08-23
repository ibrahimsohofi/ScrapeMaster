export interface AnalyticsInsights {
  successRate: number;
  averageExecutionTime: number;
  totalDataPoints: number;
  errorRate: number;
  mostCommonErrors: string[];
  proxyEffectiveness: number;
  costPerDataPoint: number;
}

export interface ScrapingMetrics {
  timestamp: Date;
  jobId: string;
  userId: string;
  organizationId: string;
  url: string;
  success: boolean;
  executionTime: number;
  dataPointsExtracted: number;
  proxyUsed: boolean;
  proxyProvider?: string;
  proxyCountry?: string;
  browserType: string;
  retryCount: number;
  complianceChecks: string[];
  errorType?: string;
  errorMessage?: string;
  costEstimate: number;
  aiSelectorsUsed: boolean;
  selectorsCount: number;
  pageSize: number;
  networkRequests: number;
  failedRequests: number;
}

export interface UsageMetrics {
  organizationId: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  timestamp: Date;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  totalDataPoints: number;
  totalCost: number;
  avgExecutionTime: number;
  uniqueUrls: number;
  proxyUsage: Record<string, number>;
  errorBreakdown: Record<string, number>;
  complianceViolations: number;
}

export interface PerformanceInsights {
  successRate: number;
  avgExecutionTime: number;
  topErrorTypes: Array<{ type: string; count: number; percentage: number }>;
  costEfficiency: {
    costPerDataPoint: number;
    costPerSuccessfulJob: number;
    monthlyBurn: number;
  };
  proxyPerformance: Array<{
    provider: string;
    successRate: number;
    avgLatency: number;
    cost: number;
  }>;
  recommendations: string[];
}

class ScrapingAnalytics {
  private metrics: ScrapingMetrics[] = [];
  private usageCache = new Map<string, UsageMetrics>();
  private readonly maxMetricsInMemory = 10000;

  // Record a scraping job
  recordScrapingJob(metrics: ScrapingMetrics): void {
    this.metrics.push(metrics);

    // Keep memory usage under control
    if (this.metrics.length > this.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.maxMetricsInMemory);
    }

    // Update real-time usage statistics
    this.updateUsageMetrics(metrics);

    // Log to external systems if configured
    this.logToExternalSystems(metrics);
  }

  // Get performance insights for an organization
  getPerformanceInsights(
    organizationId: string,
    timeRange: { start: Date; end: Date }
  ): PerformanceInsights {
    const orgMetrics = this.metrics.filter(m =>
      m.organizationId === organizationId &&
      m.timestamp >= timeRange.start &&
      m.timestamp <= timeRange.end
    );

    if (orgMetrics.length === 0) {
      return this.getEmptyInsights();
    }

    const successfulJobs = orgMetrics.filter(m => m.success);
    const failedJobs = orgMetrics.filter(m => !m.success);

    // Success rate
    const successRate = successfulJobs.length / orgMetrics.length;

    // Average execution time
    const avgExecutionTime = successfulJobs.reduce((sum, m) => sum + m.executionTime, 0) / successfulJobs.length;

    // Error analysis
    const errorCounts = new Map<string, number>();
    failedJobs.forEach(job => {
      const errorType = job.errorType || 'Unknown';
      errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1);
    });

    const topErrorTypes = Array.from(errorCounts.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / failedJobs.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Cost analysis
    const totalCost = orgMetrics.reduce((sum, m) => sum + m.costEstimate, 0);
    const totalDataPoints = successfulJobs.reduce((sum, m) => sum + m.dataPointsExtracted, 0);
    const costPerDataPoint = totalDataPoints > 0 ? totalCost / totalDataPoints : 0;
    const costPerSuccessfulJob = successfulJobs.length > 0 ? totalCost / successfulJobs.length : 0;

    // Estimate monthly burn rate
    const daysInRange = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const monthlyBurn = daysInRange > 0 ? (totalCost / daysInRange) * 30 : 0;

    // Proxy performance analysis
    const proxyStats = new Map<string, { total: number; successful: number; totalLatency: number; cost: number }>();

    orgMetrics.filter(m => m.proxyUsed && m.proxyProvider).forEach(job => {
      const provider = job.proxyProvider!;
      const stats = proxyStats.get(provider) || { total: 0, successful: 0, totalLatency: 0, cost: 0 };

      stats.total++;
      if (job.success) stats.successful++;
      stats.totalLatency += job.executionTime;
      stats.cost += job.costEstimate;

      proxyStats.set(provider, stats);
    });

    const proxyPerformance = Array.from(proxyStats.entries()).map(([provider, stats]) => ({
      provider,
      successRate: stats.successful / stats.total,
      avgLatency: stats.totalLatency / stats.total,
      cost: stats.cost
    }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(orgMetrics, {
      successRate,
      averageExecutionTime: avgExecutionTime,
      totalDataPoints: 0, // TODO: Calculate total data points
      errorRate: 1 - successRate,
      mostCommonErrors: [], // TODO: Implement error tracking
      proxyEffectiveness: proxyPerformance.length > 0 ? proxyPerformance.reduce((sum, p) => sum + p.successRate, 0) / proxyPerformance.length : 0,
      costPerDataPoint
    });

    return {
      successRate,
      avgExecutionTime,
      topErrorTypes,
      costEfficiency: {
        costPerDataPoint,
        costPerSuccessfulJob,
        monthlyBurn
      },
      proxyPerformance,
      recommendations
    };
  }

  // Get usage metrics for a specific period
  getUsageMetrics(
    organizationId: string,
    period: 'hourly' | 'daily' | 'weekly' | 'monthly',
    count = 30
  ): UsageMetrics[] {
    const now = new Date();
    const metrics: UsageMetrics[] = [];

    for (let i = 0; i < count; i++) {
      const periodStart = this.getPeriodStart(now, period, i);
      const periodEnd = this.getPeriodEnd(periodStart, period);

      const periodMetrics = this.metrics.filter(m =>
        m.organizationId === organizationId &&
        m.timestamp >= periodStart &&
        m.timestamp < periodEnd
      );

      const successfulJobs = periodMetrics.filter(m => m.success);
      const failedJobs = periodMetrics.filter(m => !m.success);

      // Proxy usage breakdown
      const proxyUsage: Record<string, number> = {};
      periodMetrics.forEach(m => {
        if (m.proxyUsed && m.proxyProvider) {
          proxyUsage[m.proxyProvider] = (proxyUsage[m.proxyProvider] || 0) + 1;
        }
      });

      // Error breakdown
      const errorBreakdown: Record<string, number> = {};
      failedJobs.forEach(m => {
        const errorType = m.errorType || 'Unknown';
        errorBreakdown[errorType] = (errorBreakdown[errorType] || 0) + 1;
      });

      // Unique URLs
      const uniqueUrls = new Set(periodMetrics.map(m => m.url)).size;

      // Compliance violations
      const complianceViolations = periodMetrics.filter(m =>
        m.complianceChecks.some(check => check.includes('violation') || check.includes('blocked'))
      ).length;

      metrics.push({
        organizationId,
        period,
        timestamp: periodStart,
        totalJobs: periodMetrics.length,
        successfulJobs: successfulJobs.length,
        failedJobs: failedJobs.length,
        totalDataPoints: successfulJobs.reduce((sum, m) => sum + m.dataPointsExtracted, 0),
        totalCost: periodMetrics.reduce((sum, m) => sum + m.costEstimate, 0),
        avgExecutionTime: successfulJobs.length > 0 ?
          successfulJobs.reduce((sum, m) => sum + m.executionTime, 0) / successfulJobs.length : 0,
        uniqueUrls,
        proxyUsage,
        errorBreakdown,
        complianceViolations
      });
    }

    return metrics.reverse(); // Most recent first
  }

  // Real-time monitoring
  getRealTimeStats(organizationId: string): RealTimeStats {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m =>
      m.organizationId === organizationId &&
      m.timestamp >= last24Hours
    );

    const activeJobs = recentMetrics.filter(m =>
      Date.now() - m.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    ).length;

    const last1Hour = new Date(Date.now() - 60 * 60 * 1000);
    const lastHourMetrics = recentMetrics.filter(m => m.timestamp >= last1Hour);

    return {
      activeJobs,
      jobsLastHour: lastHourMetrics.length,
      successRateLastHour: lastHourMetrics.length > 0 ?
        lastHourMetrics.filter(m => m.success).length / lastHourMetrics.length : 0,
      avgExecutionTimeLastHour: lastHourMetrics.length > 0 ?
        lastHourMetrics.reduce((sum, m) => sum + m.executionTime, 0) / lastHourMetrics.length : 0,
      dataPointsLastHour: lastHourMetrics.filter(m => m.success)
        .reduce((sum, m) => sum + m.dataPointsExtracted, 0),
      errorsLastHour: lastHourMetrics.filter(m => !m.success).length,
      costLastHour: lastHourMetrics.reduce((sum, m) => sum + m.costEstimate, 0)
    };
  }

  // Anomaly detection
  detectAnomalies(organizationId: string): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const recent = this.getUsageMetrics(organizationId, 'hourly', 24);

    if (recent.length < 2) return anomalies;

    // Check for success rate drops
    const currentSuccessRate = recent[0].successfulJobs / Math.max(recent[0].totalJobs, 1);
    const avgSuccessRate = recent.slice(1, 8).reduce((sum, m) =>
      sum + (m.successfulJobs / Math.max(m.totalJobs, 1)), 0) / 7;

    if (currentSuccessRate < avgSuccessRate * 0.7 && recent[0].totalJobs > 5) {
      anomalies.push({
        type: 'success_rate_drop',
        severity: 'high',
        description: `Success rate dropped to ${(currentSuccessRate * 100).toFixed(1)}% (avg: ${(avgSuccessRate * 100).toFixed(1)}%)`,
        timestamp: new Date(),
        metric: 'success_rate',
        currentValue: currentSuccessRate,
        expectedValue: avgSuccessRate
      });
    }

    // Check for execution time spikes
    const currentAvgTime = recent[0].avgExecutionTime;
    const avgExecutionTime = recent.slice(1, 8).reduce((sum, m) => sum + m.avgExecutionTime, 0) / 7;

    if (currentAvgTime > avgExecutionTime * 2 && recent[0].totalJobs > 3) {
      anomalies.push({
        type: 'execution_time_spike',
        severity: 'medium',
        description: `Execution time increased to ${currentAvgTime.toFixed(0)}ms (avg: ${avgExecutionTime.toFixed(0)}ms)`,
        timestamp: new Date(),
        metric: 'execution_time',
        currentValue: currentAvgTime,
        expectedValue: avgExecutionTime
      });
    }

    // Check for cost spikes
    const currentCost = recent[0].totalCost;
    const avgCost = recent.slice(1, 8).reduce((sum, m) => sum + m.totalCost, 0) / 7;

    if (currentCost > avgCost * 3 && avgCost > 0) {
      anomalies.push({
        type: 'cost_spike',
        severity: 'high',
        description: `Hourly cost increased to $${currentCost.toFixed(2)} (avg: $${avgCost.toFixed(2)})`,
        timestamp: new Date(),
        metric: 'cost',
        currentValue: currentCost,
        expectedValue: avgCost
      });
    }

    return anomalies;
  }

  // Helper methods
  private updateUsageMetrics(metrics: ScrapingMetrics): void {
    const cacheKey = `${metrics.organizationId}-${this.getPeriodKey(metrics.timestamp, 'hourly')}`;
    // Implementation for real-time cache updates
  }

  private logToExternalSystems(metrics: ScrapingMetrics): void {
    // Log to Sentry, DataDog, etc.
    if (process.env.SENTRY_DSN && !metrics.success) {
      console.error('Scraping job failed:', {
        jobId: metrics.jobId,
        url: metrics.url,
        error: metrics.errorMessage
      });
    }
  }

  private generateRecommendations(
    metrics: ScrapingMetrics[],
    insights: AnalyticsInsights
  ): string[] {
    const recommendations: string[] = [];

    if (insights.successRate < 0.8) {
      recommendations.push("Success rate is below 80%. Consider reviewing target websites for changes.");
    }

    if (insights.averageExecutionTime > 10000) {
      recommendations.push("Average execution time is high. Consider optimizing selectors or using faster proxies.");
    }

    if (insights.costPerDataPoint > 0.01) {
      recommendations.push("Cost per data point is high. Consider using cheaper proxy providers or optimizing scraping frequency.");
    }

    const highErrorRate = metrics.filter(m => !m.success).length / metrics.length > 0.2;
    if (highErrorRate) {
      recommendations.push("High error rate detected. Review error logs and consider implementing retry logic.");
    }

    const heavyProxyUsage = metrics.filter(m => m.proxyUsed).length / metrics.length > 0.8;
    if (heavyProxyUsage) {
      recommendations.push("Heavy proxy usage detected. Consider direct connections where possible to reduce costs.");
    }

    return recommendations;
  }

  private getEmptyInsights(): PerformanceInsights {
    return {
      successRate: 0,
      avgExecutionTime: 0,
      topErrorTypes: [],
      costEfficiency: { costPerDataPoint: 0, costPerSuccessfulJob: 0, monthlyBurn: 0 },
      proxyPerformance: [],
      recommendations: ['No data available for the selected time range']
    };
  }

  private getPeriodStart(date: Date, period: string, periodsAgo: number): Date {
    const result = new Date(date);

    switch (period) {
      case 'hourly':
        result.setHours(result.getHours() - periodsAgo, 0, 0, 0);
        break;
      case 'daily':
        result.setDate(result.getDate() - periodsAgo);
        result.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        result.setDate(result.getDate() - (periodsAgo * 7));
        result.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        result.setMonth(result.getMonth() - periodsAgo, 1);
        result.setHours(0, 0, 0, 0);
        break;
    }

    return result;
  }

  private getPeriodEnd(periodStart: Date, period: string): Date {
    const result = new Date(periodStart);

    switch (period) {
      case 'hourly':
        result.setHours(result.getHours() + 1);
        break;
      case 'daily':
        result.setDate(result.getDate() + 1);
        break;
      case 'weekly':
        result.setDate(result.getDate() + 7);
        break;
      case 'monthly':
        result.setMonth(result.getMonth() + 1);
        break;
    }

    return result;
  }

  private getPeriodKey(date: Date, period: string): string {
    switch (period) {
      case 'hourly':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      case 'daily':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      case 'weekly':
        const weekNum = Math.floor(date.getDate() / 7);
        return `${date.getFullYear()}-${date.getMonth()}-${weekNum}`;
      case 'monthly':
        return `${date.getFullYear()}-${date.getMonth()}`;
      default:
        return date.toISOString();
    }
  }
}

interface RealTimeStats {
  activeJobs: number;
  jobsLastHour: number;
  successRateLastHour: number;
  avgExecutionTimeLastHour: number;
  dataPointsLastHour: number;
  errorsLastHour: number;
  costLastHour: number;
}

interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
  metric: string;
  currentValue: number;
  expectedValue: number;
}

// Export singleton instance
export const scrapingAnalytics = new ScrapingAnalytics();

export { ScrapingAnalytics };
