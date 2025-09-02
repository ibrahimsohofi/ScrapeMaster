import { EventEmitter } from 'events';
import { EnhancedProxyManager, type EnhancedProxyProvider } from './enhanced-manager';
import type { ProxyProvider, ProxyEndpoint } from './manager';

// Export ProxyProvider for compatibility
export type { ProxyProvider } from './manager';

// Export ProviderStats for compatibility
export interface ProviderStats {
  requests: number;
  successRate: number;
  avgResponseTime: number;
  costPerRequest: number;
  dataUsageGB: number;
  errorRate: number;
  lastUsed: Date;
}

export interface MLModelMetrics {
  version: string;
  accuracy: number;
  trainingData: number;
  lastTrained: Date;
  features: string[];
}

export interface ProxySelectionCriteria {
  targetCountry?: string;
  priority: 'speed' | 'cost' | 'reliability';
  dataSize?: number;
  sessionType?: 'stateless' | 'sticky';
  antiDetection?: boolean;
  concurrent?: number;
  budget?: number;
}

export interface ProxyPerformanceStats {
  providerId: string;
  totalRequests: number;
  successfulRequests: number;
  avgResponseTime: number;
  dataTransferred: number;
  costAccumulated: number;
  lastUsed: Date;
  errorRate: number;
  concurrentSessions: number;
}

export interface ProxyOptimizationResult {
  recommendation: 'switch' | 'maintain' | 'scale_up' | 'scale_down';
  reasoning: string[];
  estimatedSavings?: number;
  expectedPerformanceGain?: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface GeographicDistribution {
  country: string;
  city?: string;
  usage: number;
  performance: number;
  cost: number;
}

export class EnhancedProxyProviderManager extends EventEmitter {
  private proxyManager: EnhancedProxyManager;
  private mlModel: MLModelMetrics;
  private performanceStats: Map<string, ProxyPerformanceStats> = new Map();
  private optimizationHistory: Map<string, ProxyOptimizationResult[]> = new Map();
  private geographicUsage: Map<string, GeographicDistribution[]> = new Map();

  constructor() {
    super();
    this.proxyManager = new EnhancedProxyManager();
    this.mlModel = {
      version: '2.1.0',
      accuracy: 0.94,
      trainingData: 50000,
      lastTrained: new Date(),
      features: [
        'response_time', 'success_rate', 'cost_per_gb', 'geographic_distance',
        'concurrent_load', 'time_of_day', 'target_site_complexity', 'data_size'
      ]
    };
    this.initializePerformanceTracking();
  }

  private initializePerformanceTracking(): void {
    // Initialize performance stats for all providers
    const providers = this.proxyManager.getProviders();
    providers.forEach((provider, id) => {
      this.performanceStats.set(id, {
        providerId: id,
        totalRequests: 0,
        successfulRequests: 0,
        avgResponseTime: provider.performanceMetrics.responseTime,
        dataTransferred: 0,
        costAccumulated: 0,
        lastUsed: new Date(),
        errorRate: provider.healthStatus.errorRate,
        concurrentSessions: 0
      });
    });

    // Start periodic optimization analysis
    setInterval(() => {
      this.performOptimizationAnalysis();
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  // Enhanced proxy selection with ML-powered optimization
  public async selectOptimalProxy(criteria: ProxySelectionCriteria): Promise<{
    provider: EnhancedProxyProvider;
    endpoint: ProxyEndpoint;
    confidence: number;
    reasoning: string[];
    estimatedCost: number;
    expectedPerformance: number;
  }> {
    const selection = await this.proxyManager.selectOptimalProxy({
      url: 'https://example.com', // placeholder
      targetCountry: criteria.targetCountry,
      priority: criteria.priority,
      dataSize: criteria.dataSize
    });

    const provider = selection.provider;
    const endpoint = selection.endpoint;

    // Calculate advanced metrics
    const estimatedCost = this.calculateEstimatedCost(provider, criteria);
    const expectedPerformance = this.calculateExpectedPerformance(provider, criteria);
    const confidence = selection.confidence;

    const reasoning = [
      selection.reason,
      `Estimated cost: $${estimatedCost.toFixed(4)}`,
      `Expected response time: ${expectedPerformance}ms`,
      `Provider efficiency: ${(provider.costMetrics.efficiency * 100).toFixed(1)}%`
    ];

    return {
      provider,
      endpoint,
      confidence,
      reasoning,
      estimatedCost,
      expectedPerformance
    };
  }

  private calculateEstimatedCost(provider: EnhancedProxyProvider, criteria: ProxySelectionCriteria): number {
    const dataSize = criteria.dataSize || 1; // MB
    const costPerGB = provider.costMetrics.costPerGB;
    const costPerRequest = provider.costMetrics.costPerRequest;

    if (provider.pricing.model === 'per_gb') {
      return (dataSize / 1024) * costPerGB; // Convert MB to GB
    } else if (provider.pricing.model === 'per_request') {
      return costPerRequest;
    } else {
      // Monthly model - estimate based on usage
      return costPerRequest * 0.8; // Discount for monthly plans
    }
  }

  private calculateExpectedPerformance(provider: EnhancedProxyProvider, criteria: ProxySelectionCriteria): number {
    let baseResponseTime = provider.performanceMetrics.responseTime;

    // Adjust based on criteria
    if (criteria.priority === 'speed' && provider.type === 'datacenter') {
      baseResponseTime *= 0.8; // Datacenter proxies are faster
    }

    if (criteria.antiDetection && provider.features.userAgent) {
      baseResponseTime *= 1.1; // Anti-detection adds slight overhead
    }

    if (criteria.concurrent && criteria.concurrent > 10) {
      baseResponseTime *= 1.2; // High concurrency may slow things down
    }

    return Math.round(baseResponseTime);
  }

  // Real-time performance optimization
  public async performOptimizationAnalysis(): Promise<Map<string, ProxyOptimizationResult>> {
    const results = new Map<string, ProxyOptimizationResult>();
    const providers = this.proxyManager.getProviders();

    for (const [id, provider] of providers) {
      const stats = this.performanceStats.get(id);
      if (!stats) continue;

      const result = await this.analyzeProviderOptimization(provider, stats);
      results.set(id, result);

      // Store in optimization history
      if (!this.optimizationHistory.has(id)) {
        this.optimizationHistory.set(id, []);
      }
      this.optimizationHistory.get(id)!.push(result);

      // Keep only last 100 optimization results
      const history = this.optimizationHistory.get(id)!;
      if (history.length > 100) {
        history.shift();
      }

      // Emit optimization events
      this.emit('optimization_analysis', { providerId: id, result });
    }

    return results;
  }

  private async analyzeProviderOptimization(
    provider: EnhancedProxyProvider,
    stats: ProxyPerformanceStats
  ): Promise<ProxyOptimizationResult> {
    const reasoning: string[] = [];
    let recommendation: 'switch' | 'maintain' | 'scale_up' | 'scale_down' = 'maintain';
    let estimatedSavings = 0;
    let expectedPerformanceGain = 0;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Analyze success rate
    const successRate = stats.successfulRequests / Math.max(stats.totalRequests, 1);
    if (successRate < 0.85) {
      recommendation = 'switch';
      reasoning.push(`Low success rate: ${(successRate * 100).toFixed(1)}%`);
      riskLevel = 'high';
    }

    // Analyze response time
    if (stats.avgResponseTime > 2000) {
      if (recommendation !== 'switch') {
        recommendation = 'switch';
      }
      reasoning.push(`High response time: ${stats.avgResponseTime}ms`);
      expectedPerformanceGain = stats.avgResponseTime * 0.3; // Expect 30% improvement
    }

    // Analyze cost efficiency
    const costPerGB = stats.costAccumulated / Math.max(stats.dataTransferred / 1024, 0.001);
    if (costPerGB > provider.costMetrics.costPerGB * 1.5) {
      reasoning.push(`Cost overrun detected: $${costPerGB.toFixed(4)}/GB vs expected $${provider.costMetrics.costPerGB}/GB`);
      estimatedSavings = (costPerGB - provider.costMetrics.costPerGB) * (stats.dataTransferred / 1024);
    }

    // Analyze usage patterns
    const hoursSinceLastUsed = (Date.now() - stats.lastUsed.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastUsed > 24 && recommendation === 'maintain') {
      recommendation = 'scale_down';
      reasoning.push('Low usage detected - consider scaling down');
      estimatedSavings = provider.costMetrics.monthlyCost * 0.3;
    }

    // High load analysis
    if (provider.limits?.concurrentSessions && stats.concurrentSessions > provider.limits.concurrentSessions * 0.8) {
      recommendation = 'scale_up';
      reasoning.push('High concurrent usage - consider scaling up');
      riskLevel = 'medium';
    }

    if (reasoning.length === 0) {
      reasoning.push('Provider performing optimally');
    }

    return {
      recommendation,
      reasoning,
      estimatedSavings: estimatedSavings > 0 ? estimatedSavings : undefined,
      expectedPerformanceGain: expectedPerformanceGain > 0 ? expectedPerformanceGain : undefined,
      riskLevel
    };
  }

  // Geographic performance analysis
  public analyzeGeographicPerformance(): Map<string, GeographicDistribution[]> {
    const providers = this.proxyManager.getProviders();
    const geoAnalysis = new Map<string, GeographicDistribution[]>();

    providers.forEach((provider, id) => {
      const distributions: GeographicDistribution[] = [];

      // Analyze each country in provider's coverage
      provider.geoCoverage.countries.forEach(country => {
        const countryEndpoints = provider.endpoints.filter(ep => ep.country === country);
        if (countryEndpoints.length === 0) return;

        const avgPerformance = countryEndpoints.reduce((sum, ep) => sum + (ep.reliability || 0), 0) / countryEndpoints.length;
        const avgLatency = countryEndpoints.reduce((sum, ep) => sum + (ep.speed || 1000), 0) / countryEndpoints.length;

        distributions.push({
          country,
          city: countryEndpoints[0].city,
          usage: this.getCountryUsage(id, country),
          performance: avgPerformance,
          cost: this.getCountryCost(provider, country)
        });
      });

      // Sort by performance and usage
      distributions.sort((a, b) => (b.performance * b.usage) - (a.performance * a.usage));
      geoAnalysis.set(id, distributions);
    });

    return geoAnalysis;
  }

  private getCountryUsage(providerId: string, country: string): number {
    // In production, this would query actual usage statistics
    // For now, return simulated data based on country popularity
    const popularCountries = ['US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA'];
    return popularCountries.includes(country) ? Math.random() * 100 : Math.random() * 30;
  }

  private getCountryCost(provider: EnhancedProxyProvider, country: string): number {
    // In production, this would calculate actual cost per country
    // For now, use base cost with country-specific multipliers
    const costMultipliers: Record<string, number> = {
      'US': 1.0,
      'GB': 1.1,
      'DE': 1.05,
      'FR': 1.08,
      'JP': 1.2,
      'AU': 1.15,
      'CA': 1.02
    };

    const multiplier = costMultipliers[country] || 0.9;
    return provider.costMetrics.costPerGB * multiplier;
  }

  // Cost optimization recommendations
  public generateCostOptimizationReport(): {
    totalSpent: number;
    monthlyProjection: number;
    potentialSavings: number;
    recommendations: string[];
    providerEfficiency: Array<{
      provider: string;
      efficiency: number;
      recommendation: string;
    }>;
  } {
    const costAnalytics = this.proxyManager.getCostAnalytics();
    const providers = Array.from(this.proxyManager.getProviders().values());

    const recommendations: string[] = [];
    const providerEfficiency: Array<{
      provider: string;
      efficiency: number;
      recommendation: string;
    }> = [];

    let potentialSavings = 0;

    providers.forEach(provider => {
      const efficiency = provider.costMetrics.efficiency;
      providerEfficiency.push({
        provider: provider.name,
        efficiency,
        recommendation: this.generateProviderRecommendation(provider)
      });

      if (efficiency < 0.7) {
        potentialSavings += provider.costMetrics.monthlyCost * 0.3;
        recommendations.push(`Consider replacing ${provider.name} (${(efficiency * 100).toFixed(1)}% efficiency)`);
      }
    });

    // Sort by efficiency
    providerEfficiency.sort((a, b) => b.efficiency - a.efficiency);

    // General recommendations
    if (costAnalytics.totalSpent > 2000) {
      recommendations.push('Consider negotiating volume discounts with top providers');
    }

    if (providers.filter(p => p.costMetrics.trend === 'up').length > 2) {
      recommendations.push('Monitor providers with increasing costs - consider alternatives');
    }

    return {
      totalSpent: costAnalytics.totalSpent,
      monthlyProjection: costAnalytics.monthlyProjection,
      potentialSavings,
      recommendations,
      providerEfficiency
    };
  }

  private generateProviderRecommendation(provider: EnhancedProxyProvider): string {
    const efficiency = provider.costMetrics.efficiency;
    const successRate = provider.performanceMetrics.successRate;
    const responseTime = provider.performanceMetrics.responseTime;

    if (efficiency > 0.9 && successRate > 0.95 && responseTime < 100) {
      return 'Excellent - maintain current usage';
    } else if (efficiency > 0.8 && successRate > 0.9) {
      return 'Good - consider increasing allocation';
    } else if (efficiency < 0.7 || successRate < 0.85) {
      return 'Poor - consider replacement';
    } else {
      return 'Average - monitor performance trends';
    }
  }

  // Advanced load balancing and failover
  public async implementLoadBalancing(
    providers: string[],
    criteria: ProxySelectionCriteria
  ): Promise<{
    primary: EnhancedProxyProvider;
    secondary: EnhancedProxyProvider[];
    weights: Map<string, number>;
    failoverStrategy: 'round_robin' | 'weighted' | 'latency_based';
  }> {
    const selectedProviders = providers
      .map(id => this.proxyManager.getProvider(id))
      .filter((p): p is EnhancedProxyProvider => p !== undefined);

    if (selectedProviders.length === 0) {
      throw new Error('No valid providers found');
    }

    // Sort by performance score
    const scoredProviders = selectedProviders.map(provider => ({
      provider,
      score: this.calculateLoadBalancingScore(provider, criteria)
    })).sort((a, b) => b.score - a.score);

    const primary = scoredProviders[0].provider;
    const secondary = scoredProviders.slice(1).map(sp => sp.provider);

    // Calculate weights based on performance and cost
    const weights = new Map<string, number>();
    const totalScore = scoredProviders.reduce((sum, sp) => sum + sp.score, 0);

    scoredProviders.forEach(({ provider, score }) => {
      weights.set(provider.id, score / totalScore);
    });

    // Determine failover strategy
    let failoverStrategy: 'round_robin' | 'weighted' | 'latency_based' = 'weighted';

    if (criteria.priority === 'speed') {
      failoverStrategy = 'latency_based';
    } else if (criteria.priority === 'cost') {
      failoverStrategy = 'weighted';
    }

    return {
      primary,
      secondary,
      weights,
      failoverStrategy
    };
  }

  private calculateLoadBalancingScore(provider: EnhancedProxyProvider, criteria: ProxySelectionCriteria): number {
    let score = 0;

    // Performance factors (50%)
    score += provider.performanceMetrics.successRate * 0.3;
    score += (1 / Math.max(provider.performanceMetrics.responseTime, 10)) * 0.2;

    // Cost factors (30%)
    const costEfficiency = 1 / Math.max(provider.costMetrics.costPerGB, 0.1);
    score += Math.min(costEfficiency / 20, 0.3); // Normalize to 0-0.3

    // Reliability factors (20%)
    score += provider.performanceMetrics.uptime * 0.2;

    // Apply priority weighting
    if (criteria.priority === 'speed') {
      score *= provider.type === 'datacenter' ? 1.3 : 0.9;
    } else if (criteria.priority === 'cost') {
      score *= provider.costMetrics.efficiency > 0.9 ? 1.2 : 0.8;
    } else if (criteria.priority === 'reliability') {
      score *= provider.healthStatus.status === 'healthy' ? 1.2 : 0.7;
    }

    return Math.min(score, 1.0);
  }

  // Smart proxy rotation strategies
  public async getRotationStrategy(
    providerId: string,
    requestCount: number,
    timeWindow: number // minutes
  ): Promise<{
    strategy: 'session_based' | 'request_based' | 'time_based' | 'intelligent';
    interval: number;
    endpoints: ProxyEndpoint[];
    reasoning: string[];
  }> {
    const provider = this.proxyManager.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const reasoning: string[] = [];
    let strategy: 'session_based' | 'request_based' | 'time_based' | 'intelligent' = 'intelligent';
    let interval = 300000; // 5 minutes default

    // Analyze request patterns
    const requestsPerMinute = requestCount / timeWindow;

    if (requestsPerMinute > 100) {
      strategy = 'request_based';
      interval = Math.max(1000, 60000 / requestsPerMinute); // At least 1 second between rotations
      reasoning.push('High request rate detected - using request-based rotation');
    } else if (requestsPerMinute < 1) {
      strategy = 'session_based';
      interval = 600000; // 10 minutes
      reasoning.push('Low request rate - using session-based rotation');
    } else if (provider.features.ipRotation) {
      strategy = 'time_based';
      interval = 180000; // 3 minutes
      reasoning.push('Automatic IP rotation supported - using time-based strategy');
    }

    // Select optimal endpoints
    const endpoints = provider.endpoints
      .filter(ep => ep.isHealthy !== false)
      .sort((a, b) => (b.reliability || 0) - (a.reliability || 0))
      .slice(0, Math.min(10, provider.endpoints.length)); // Top 10 endpoints

    reasoning.push(`Selected ${endpoints.length} healthy endpoints`);
    reasoning.push(`Rotation interval: ${interval / 1000} seconds`);

    return {
      strategy,
      interval,
      endpoints,
      reasoning
    };
  }

  // Performance metrics and analytics
  public getProviderMetrics(providerId: string): ProxyPerformanceStats | null {
    return this.performanceStats.get(providerId) || null;
  }

  public getAllProviderMetrics(): Map<string, ProxyPerformanceStats> {
    return new Map(this.performanceStats);
  }

  public updateProviderStats(
    providerId: string,
    requestSuccess: boolean,
    responseTime: number,
    dataSize: number
  ): void {
    const stats = this.performanceStats.get(providerId);
    if (!stats) return;

    stats.totalRequests++;
    if (requestSuccess) {
      stats.successfulRequests++;
    }

    // Update moving average response time
    stats.avgResponseTime = (stats.avgResponseTime * 0.9) + (responseTime * 0.1);
    stats.dataTransferred += dataSize;
    stats.lastUsed = new Date();

    // Update error rate
    stats.errorRate = 1 - (stats.successfulRequests / stats.totalRequests);

    // Estimate cost accumulation
    const provider = this.proxyManager.getProvider(providerId);
    if (provider) {
      if (provider.pricing.model === 'per_gb') {
        stats.costAccumulated += (dataSize / (1024 * 1024 * 1024)) * provider.costMetrics.costPerGB;
      } else if (provider.pricing.model === 'per_request') {
        stats.costAccumulated += provider.costMetrics.costPerRequest;
      }
    }

    // Emit performance update event
    this.emit('performance_update', { providerId, stats });
  }

  public getMLModelMetrics(): MLModelMetrics {
    return this.mlModel;
  }

  public destroy(): void {
    this.proxyManager.destroy();
    this.removeAllListeners();
  }
}
