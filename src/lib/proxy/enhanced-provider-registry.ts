import { BrightDataProvider } from './providers/brightdata';
import { OxylabsProvider } from './providers/oxylabs';
import { SmartProxyProvider } from './providers/smartproxy';
import { ProxyMeshProvider } from './providers/proxymesh';
import { IPRoyalProvider } from './providers/iproyal';
import { RayobyteProvider } from './providers/rayobyte';
import type { BaseProxyProvider } from './providers/base';

export interface ProviderConfig {
  brightdata?: {
    username: string;
    password: string;
    customerId: string;
    zonePassword: string;
    zoneName: string;
    zone?: string;
  };
  oxylabs?: {
    username: string;
    password: string;
    endpoint?: string;
    productType: 'residential' | 'datacenter' | 'mobile';
  };
  smartproxy?: {
    username: string;
    password: string;
    stickySession?: boolean;
  };
  proxymesh?: {
    username: string;
    password: string;
    endpoint?: string;
  };
  iproyal?: {
    username: string;
    password: string;
    proxyType?: 'residential' | 'datacenter' | 'mobile';
    country?: string;
  };
  rayobyte?: {
    username: string;
    password: string;
    proxyType?: 'residential' | 'datacenter' | 'mobile';
    country?: string;
  };
}

export interface SelectionCriteria {
  priority: 'speed' | 'cost' | 'reliability' | 'geo_coverage';
  targetCountry?: string;
  targetCity?: string;
  proxyType?: 'residential' | 'datacenter' | 'mobile' | 'isp';
  budgetLimit?: number;
  sessionSticky?: boolean;
  antiDetection?: boolean;
  concurrentRequests?: number;
  dataVolume?: number; // in MB
  previousFailures?: string[]; // provider IDs to avoid
}

export interface ProviderRanking {
  providerId: string;
  provider: BaseProxyProvider;
  score: number;
  reasoning: string[];
  estimatedCost: number;
  estimatedLatency: number;
  availabilityScore: number;
  geoMatchScore: number;
  reliabilityScore: number;
}

export interface MLModelWeights {
  speed: number;
  cost: number;
  reliability: number;
  geoAccuracy: number;
  successRate: number;
  responseTime: number;
  uptime: number;
}

export class EnhancedProxyProviderRegistry {
  private providers: Map<string, BaseProxyProvider> = new Map();
  private performanceHistory: Map<string, any[]> = new Map();
  private costsHistory: Map<string, number> = new Map();
  private mlWeights: MLModelWeights = {
    speed: 0.2,
    cost: 0.15,
    reliability: 0.25,
    geoAccuracy: 0.15,
    successRate: 0.15,
    responseTime: 0.05,
    uptime: 0.05
  };
  private geoDatabase: Map<string, string[]> = new Map();

  constructor(config: ProviderConfig) {
    this.initializeProviders(config);
    this.initializeGeoDatabase();
  }

  private initializeProviders(config: ProviderConfig) {
    // Initialize all available providers with proper configuration
    if (config.brightdata && this.isValidBrightDataConfig(config.brightdata)) {
      try {
        this.providers.set('brightdata', new BrightDataProvider(config.brightdata));
      } catch (error) {
        console.warn('Failed to initialize BrightData provider:', error);
      }
    }

    if (config.oxylabs && this.isValidOxylabsConfig(config.oxylabs)) {
      try {
        this.providers.set('oxylabs', new OxylabsProvider(config.oxylabs));
      } catch (error) {
        console.warn('Failed to initialize Oxylabs provider:', error);
      }
    }

    if (config.smartproxy) {
      try {
        this.providers.set('smartproxy', new SmartProxyProvider(config.smartproxy));
      } catch (error) {
        console.warn('Failed to initialize SmartProxy provider:', error);
      }
    }

    if (config.proxymesh) {
      try {
        this.providers.set('proxymesh', new ProxyMeshProvider(config.proxymesh));
      } catch (error) {
        console.warn('Failed to initialize ProxyMesh provider:', error);
      }
    }

    if (config.iproyal) {
      try {
        this.providers.set('iproyal', new IPRoyalProvider(config.iproyal));
      } catch (error) {
        console.warn('Failed to initialize IPRoyal provider:', error);
      }
    }

    if (config.rayobyte) {
      try {
        this.providers.set('rayobyte', new RayobyteProvider(config.rayobyte));
      } catch (error) {
        console.warn('Failed to initialize Rayobyte provider:', error);
      }
    }
  }

  private isValidBrightDataConfig(config: any): config is Required<ProviderConfig['brightdata']> {
    return config.username && config.password && config.customerId && config.zonePassword && config.zoneName;
  }

  private isValidOxylabsConfig(config: any): config is Required<ProviderConfig['oxylabs']> {
    return config.username && config.password && config.productType;
  }

  private initializeGeoDatabase() {
    this.geoDatabase.set('US', ['United States', 'USA', 'America']);
    this.geoDatabase.set('UK', ['United Kingdom', 'Britain', 'GB']);
    this.geoDatabase.set('CA', ['Canada']);
    this.geoDatabase.set('DE', ['Germany', 'Deutschland']);
    this.geoDatabase.set('FR', ['France']);
    this.geoDatabase.set('AU', ['Australia']);
    this.geoDatabase.set('JP', ['Japan']);
  }

  async selectOptimalProvider(criteria: SelectionCriteria): Promise<ProviderRanking | null> {
    const rankings: ProviderRanking[] = [];

    for (const [providerId, provider] of this.providers) {
      if (criteria.previousFailures?.includes(providerId)) {
        continue; // Skip providers that have recently failed
      }

      try {
        const stats = await this.getProviderStats(provider);
        const score = this.calculateProviderScore(provider, criteria, stats);
        const typeMatchScore = this.calculateTypeMatchScore(provider.type, criteria);
        const geoMatchScore = this.calculateGeoMatchScore(provider, criteria);

        rankings.push({
          providerId,
          provider,
          score: score * typeMatchScore * geoMatchScore,
          reasoning: this.generateReasoning(provider, criteria, stats),
          estimatedCost: this.estimateCost(provider, criteria),
          estimatedLatency: stats.averageResponseTime || 1000,
          availabilityScore: provider.isConfigured() ? 1.0 : 0.0,
          geoMatchScore,
          reliabilityScore: stats.successRate / 100
        });
      } catch (error) {
        console.warn(`Failed to evaluate provider ${providerId}:`, error);
      }
    }

    // Sort by score and return the best match
    rankings.sort((a, b) => b.score - a.score);
    return rankings.length > 0 ? rankings[0] : null;
  }

  private async getProviderStats(provider: BaseProxyProvider) {
    try {
      return await provider.getUsageStats();
    } catch (error) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        bandwidthUsed: 0,
        averageResponseTime: 1000,
        successRate: 50,
        lastUpdated: new Date()
      };
    }
  }

  private calculateProviderScore(provider: BaseProxyProvider, criteria: SelectionCriteria, stats: any): number {
    let score = 0;

    // Speed factor
    const speedScore = Math.max(0, 1 - (stats.averageResponseTime / 5000));
    score += speedScore * this.mlWeights.speed;

    // Reliability factor
    const reliabilityScore = stats.successRate / 100;
    score += reliabilityScore * this.mlWeights.reliability;

    // Cost factor (inverse - lower cost = higher score)
    const costScore = 1; // Placeholder - would need actual cost data
    score += costScore * this.mlWeights.cost;

    return Math.min(1, Math.max(0, score));
  }

  private calculateTypeMatchScore(providerType: string, criteria: SelectionCriteria): number {
    if (!criteria.proxyType) return 1.0;
    return providerType === criteria.proxyType ? 1.0 : 0.3;
  }

  private calculateGeoMatchScore(provider: BaseProxyProvider, criteria: SelectionCriteria): number {
    if (!criteria.targetCountry) return 1.0;

    return provider.regions.includes(criteria.targetCountry.toUpperCase()) ? 1.0 : 0.5;
  }

  private generateReasoning(provider: BaseProxyProvider, criteria: SelectionCriteria, stats: any): string[] {
    const reasons: string[] = [];

    reasons.push(`${provider.name} provider with ${provider.type} proxies`);
    reasons.push(`Success rate: ${stats.successRate.toFixed(1)}%`);
    reasons.push(`Average response time: ${stats.averageResponseTime}ms`);

    if (criteria.targetCountry && provider.regions.includes(criteria.targetCountry.toUpperCase())) {
      reasons.push(`Supports target country: ${criteria.targetCountry}`);
    }

    return reasons;
  }

  private estimateCost(provider: BaseProxyProvider, criteria: SelectionCriteria): number {
    // Placeholder cost estimation
    const baseCost = 0.001; // $0.001 per request
    const volumeMultiplier = Math.max(1, (criteria.dataVolume || 1) / 1000);
    return baseCost * volumeMultiplier;
  }

  async getProviderStatistics(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const [providerId, provider] of this.providers) {
      try {
        stats[providerId] = await this.getProviderStats(provider);
      } catch (error) {
        stats[providerId] = { error: (error as Error).message };
      }
    }

    return stats;
  }

  async getAvailableProviders(): Promise<string[]> {
    return Array.from(this.providers.keys());
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [providerId, provider] of this.providers) {
      try {
        results[providerId] = await provider.validateCredentials();
      } catch (error) {
        results[providerId] = false;
      }
    }

    return results;
  }
}
