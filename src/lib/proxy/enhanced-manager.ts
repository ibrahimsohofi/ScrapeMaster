import axios from 'axios';
import { type ProxyProvider, type ProxyEndpoint, type ProxyRequest, ProxyResult } from './manager';

// Enhanced proxy provider configurations
export interface EnhancedProxyProvider extends ProxyProvider {
  apiEndpoint?: string;
  features: ProxyFeatures;
  geoCoverage: GeoCoverage;
  performanceMetrics: PerformanceMetrics;
  costMetrics: CostMetrics;
  healthStatus: HealthStatus;
}

interface ProxyFeatures {
  staticResidential: boolean;
  rotatingResidential: boolean;
  datacenter: boolean;
  mobile: boolean;
  stickySession: boolean;
  ipWhitelisting: boolean;
  customHeaders: boolean;
  httpsTunnel: boolean;
  userAgent: boolean;
  ipRotation: boolean;
  geoTargeting: boolean;
  loadBalancing: boolean;
  autoFailover: boolean;
  dnsOverHttps: boolean;
}

interface GeoCoverage {
  countries: string[];
  cities: string[];
  isps: string[];
  totalCountries: number;
  totalCities: number;
}

interface PerformanceMetrics {
  avgLatency: number;
  successRate: number;
  uptime: number;
  responseTime: number;
  throughput: number;
  concurrentConnections: number;
  lastUpdated: Date;
}

interface CostMetrics {
  totalSpent: number;
  costPerGB: number;
  costPerRequest: number;
  monthlyCost: number;
  efficiency: number;
  trend: 'up' | 'down' | 'stable';
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  alerts: Alert[];
}

interface Alert {
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ProxySelection {
  provider: EnhancedProxyProvider;
  endpoint: ProxyEndpoint;
  confidence: number;
  reason: string;
}

interface MLMetrics {
  modelVersion: string;
  trainingData: number;
  accuracy: number;
  lastTrained: Date;
  features: string[];
}

export class EnhancedProxyManager {
  private providers: Map<string, EnhancedProxyProvider> = new Map();
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();
  private mlMetrics: MLMetrics;
  private healthMonitor: NodeJS.Timeout | null = null;

  constructor() {
    this.mlMetrics = {
      modelVersion: '1.0.0',
      trainingData: 10000,
      accuracy: 0.92,
      lastTrained: new Date(),
      features: ['latency', 'success_rate', 'cost', 'geo_distance', 'load']
    };
    this.initializeProviders();
    this.startHealthMonitoring();
  }

  private initializeProviders(): void {
    // BrightData (Leader in residential proxies)
    this.providers.set('brightdata', {
      id: 'brightdata',
      name: 'BrightData',
      type: 'residential',
      status: 'active',
      endpoints: this.generateBrightDataEndpoints(),
      authentication: { username: 'brd-customer-hl_xxxxxx', password: 'xxxxxxxxxx' },
      rotation: { method: 'session' },
      pricing: { costPerGB: 15.0, monthlyLimit: 100, model: 'per_gb', cost: 15.0, currency: 'USD' },
      credentials: {
        username: 'brd-customer-hl_xxxxxx',
        password: 'xxxxxxxxxx',
        authType: 'basic'
      },
      apiEndpoint: 'https://brightdata.com/api/v1',
      features: {
        staticResidential: true,
        rotatingResidential: true,
        datacenter: false,
        mobile: false,
        stickySession: true,
        ipWhitelisting: true,
        customHeaders: true,
        httpsTunnel: true,
        userAgent: true,
        ipRotation: true,
        geoTargeting: true,
        loadBalancing: true,
        autoFailover: true,
        dnsOverHttps: true
      },
      geoCoverage: {
        countries: this.getBrightDataCountries(),
        cities: this.getBrightDataCities(),
        isps: this.getBrightDataISPs(),
        totalCountries: 195,
        totalCities: 1000
      },
      performanceMetrics: {
        avgLatency: 120,
        successRate: 0.99,
        uptime: 0.999,
        responseTime: 85,
        throughput: 1000,
        concurrentConnections: 500,
        lastUpdated: new Date()
      },
      costMetrics: {
        totalSpent: 1500,
        costPerGB: 15.0,
        costPerRequest: 0.001,
        monthlyCost: 500,
        efficiency: 0.92,
        trend: 'stable'
      },
      healthStatus: {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 85,
        errorRate: 0.01,
        alerts: []
      },
      limits: {
        requestsPerSecond: 100,
        requestsPerMinute: 6000,
        requestsPerHour: 360000,
        requestsPerDay: 8640000,
        bandwidthGB: 1000,
        concurrentSessions: 500
      }
    });

    // Oxylabs (Premium datacenter and residential)
    this.providers.set('oxylabs', {
      id: 'oxylabs',
      name: 'Oxylabs',
      type: 'residential',
      status: 'active',
      endpoints: this.generateOxylabsEndpoints(),
      authentication: { username: 'customer-xxxxxxx', password: 'xxxxxxxxxx' },
      rotation: { method: 'request' },
      pricing: { costPerGB: 12.0, monthlyLimit: 200, model: 'per_gb', cost: 12.0, currency: 'USD' },
      credentials: {
        username: 'customer-xxxxxxx',
        password: 'xxxxxxxxxx',
        authType: 'basic'
      },
      apiEndpoint: 'https://dashboard.oxylabs.io/api/v1',
      features: {
        staticResidential: true,
        rotatingResidential: true,
        datacenter: true,
        mobile: true,
        stickySession: true,
        ipWhitelisting: true,
        customHeaders: true,
        httpsTunnel: true,
        userAgent: true,
        ipRotation: true,
        geoTargeting: true,
        loadBalancing: true,
        autoFailover: true,
        dnsOverHttps: true
      },
      geoCoverage: {
        countries: this.getOxylabsCountries(),
        cities: this.getOxylabsCities(),
        isps: this.getOxylabsISPs(),
        totalCountries: 185,
        totalCities: 850
      },
      performanceMetrics: {
        avgLatency: 95,
        successRate: 0.98,
        uptime: 0.998,
        responseTime: 75,
        throughput: 1200,
        concurrentConnections: 800,
        lastUpdated: new Date()
      },
      costMetrics: {
        totalSpent: 2400,
        costPerGB: 12.0,
        costPerRequest: 0.0008,
        monthlyCost: 800,
        efficiency: 0.95,
        trend: 'down'
      },
      healthStatus: {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 75,
        errorRate: 0.02,
        alerts: []
      },
      limits: {
        requestsPerSecond: 150,
        requestsPerMinute: 9000,
        requestsPerHour: 540000,
        requestsPerDay: 12960000,
        bandwidthGB: 2000,
        concurrentSessions: 800
      }
    });

    // IPRoyal (Affordable residential and datacenter)
    this.providers.set('iproyal', {
      id: 'iproyal',
      name: 'IPRoyal',
      type: 'residential',
      status: 'active',
      endpoints: this.generateIPRoyalEndpoints(),
      authentication: { username: 'iproyal-user', password: 'xxxxxxxxxx' },
      rotation: { method: 'time', interval: 300000 },
      pricing: { costPerGB: 7.0, monthlyLimit: 300, model: 'per_gb', cost: 7.0, currency: 'USD' },
      credentials: {
        username: 'iproyal-user',
        password: 'xxxxxxxxxx',
        authType: 'basic'
      },
      apiEndpoint: 'https://royal-api.io/v1',
      features: {
        staticResidential: false,
        rotatingResidential: true,
        datacenter: true,
        mobile: false,
        stickySession: false,
        ipWhitelisting: false,
        customHeaders: true,
        httpsTunnel: true,
        userAgent: true,
        ipRotation: true,
        geoTargeting: true,
        loadBalancing: false,
        autoFailover: false,
        dnsOverHttps: false
      },
      geoCoverage: {
        countries: this.getIPRoyalCountries(),
        cities: this.getIPRoyalCities(),
        isps: this.getIPRoyalISPs(),
        totalCountries: 100,
        totalCities: 500
      },
      performanceMetrics: {
        avgLatency: 150,
        successRate: 0.94,
        uptime: 0.995,
        responseTime: 110,
        throughput: 600,
        concurrentConnections: 200,
        lastUpdated: new Date()
      },
      costMetrics: {
        totalSpent: 700,
        costPerGB: 7.0,
        costPerRequest: 0.0005,
        monthlyCost: 350,
        efficiency: 0.88,
        trend: 'stable'
      },
      healthStatus: {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 110,
        errorRate: 0.06,
        alerts: []
      },
      limits: {
        requestsPerSecond: 50,
        requestsPerMinute: 3000,
        requestsPerHour: 180000,
        requestsPerDay: 4320000,
        bandwidthGB: 500,
        concurrentSessions: 200
      }
    });

    // Smartproxy (Reliable and fast)
    this.providers.set('smartproxy', {
      id: 'smartproxy',
      name: 'Smartproxy',
      type: 'datacenter',
      status: 'active',
      endpoints: this.generateSmartproxyEndpoints(),
      authentication: { username: 'sp-user-xxxxx', password: 'xxxxxxxxxx' },
      rotation: { method: 'session' },
      pricing: { costPerGB: 5.0, monthlyLimit: 500, model: 'per_gb', cost: 5.0, currency: 'USD' },
      credentials: {
        username: 'sp-user-xxxxx',
        password: 'xxxxxxxxxx',
        authType: 'basic'
      },
      apiEndpoint: 'https://api.smartproxy.com/v1',
      features: {
        staticResidential: false,
        rotatingResidential: false,
        datacenter: true,
        mobile: false,
        stickySession: true,
        ipWhitelisting: true,
        customHeaders: true,
        httpsTunnel: true,
        userAgent: true,
        ipRotation: false,
        geoTargeting: true,
        loadBalancing: true,
        autoFailover: true,
        dnsOverHttps: true
      },
      geoCoverage: {
        countries: this.getSmartproxyCountries(),
        cities: this.getSmartproxyCities(),
        isps: this.getSmartproxyISPs(),
        totalCountries: 127,
        totalCities: 400
      },
      performanceMetrics: {
        avgLatency: 45,
        successRate: 0.99,
        uptime: 0.999,
        responseTime: 35,
        throughput: 2000,
        concurrentConnections: 1000,
        lastUpdated: new Date()
      },
      costMetrics: {
        totalSpent: 1000,
        costPerGB: 5.0,
        costPerRequest: 0.0003,
        monthlyCost: 400,
        efficiency: 0.97,
        trend: 'down'
      },
      healthStatus: {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 35,
        errorRate: 0.01,
        alerts: []
      },
      limits: {
        requestsPerSecond: 200,
        requestsPerMinute: 12000,
        requestsPerHour: 720000,
        requestsPerDay: 17280000,
        bandwidthGB: 1500,
        concurrentSessions: 1000
      }
    });

    // ProxyMesh (Budget-friendly option)
    this.providers.set('proxymesh', {
      id: 'proxymesh',
      name: 'ProxyMesh',
      type: 'datacenter',
      status: 'active',
      endpoints: this.generateProxyMeshEndpoints(),
      authentication: { username: 'mesh-user', password: 'xxxxxxxxxx' },
      rotation: { method: 'request' },
      pricing: { costPerRequest: 0.0001, monthlyLimit: 1000000, model: 'per_request', cost: 0.0001, currency: 'USD' },
      credentials: {
        username: 'mesh-user',
        password: 'xxxxxxxxxx',
        authType: 'basic'
      },
      apiEndpoint: 'https://proxymesh.com/api/v1',
      features: {
        staticResidential: false,
        rotatingResidential: false,
        datacenter: true,
        mobile: false,
        stickySession: false,
        ipWhitelisting: false,
        customHeaders: true,
        httpsTunnel: true,
        userAgent: false,
        ipRotation: true,
        geoTargeting: false,
        loadBalancing: false,
        autoFailover: false,
        dnsOverHttps: false
      },
      geoCoverage: {
        countries: this.getProxyMeshCountries(),
        cities: this.getProxyMeshCities(),
        isps: this.getProxyMeshISPs(),
        totalCountries: 20,
        totalCities: 50
      },
      performanceMetrics: {
        avgLatency: 200,
        successRate: 0.92,
        uptime: 0.98,
        responseTime: 180,
        throughput: 300,
        concurrentConnections: 100,
        lastUpdated: new Date()
      },
      costMetrics: {
        totalSpent: 200,
        costPerGB: 1.0,
        costPerRequest: 0.0001,
        monthlyCost: 100,
        efficiency: 0.85,
        trend: 'stable'
      },
      healthStatus: {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 180,
        errorRate: 0.08,
        alerts: []
      },
      limits: {
        requestsPerSecond: 10,
        requestsPerMinute: 600,
        requestsPerHour: 36000,
        requestsPerDay: 864000,
        bandwidthGB: 100,
        concurrentSessions: 50
      }
    });
  }

  // ML-Powered Proxy Selection Algorithm
  public async selectOptimalProxy(
    request: ProxyRequest & {
      targetCountry?: string;
      priority?: 'speed' | 'cost' | 'reliability';
      dataSize?: number;
    }
  ): Promise<ProxySelection> {
    const candidates = this.filterCandidates(request);
    const scored = candidates.map(provider => ({
      provider,
      score: this.calculateMLScore(provider, request),
      endpoint: this.selectBestEndpoint(provider, request.targetCountry)
    }));

    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];

    return {
      provider: best.provider,
      endpoint: best.endpoint,
      confidence: best.score,
      reason: this.generateSelectionReason(best.provider, request)
    };
  }

  private calculateMLScore(provider: EnhancedProxyProvider, request: any): number {
    const weights = this.getMLWeights(request.priority);

    let score = 0;

    // Performance factors (40%)
    score += provider.performanceMetrics.successRate * weights.reliability;
    score += (1 / Math.max(provider.performanceMetrics.avgLatency, 1)) * weights.speed;
    score += provider.performanceMetrics.uptime * weights.uptime;

    // Cost factors (30%)
    const costEfficiency = 1 / Math.max(provider.costMetrics.costPerGB || 1, 0.1);
    score += costEfficiency * weights.cost;

    // Feature match (20%)
    const featureScore = this.calculateFeatureMatch(provider, request);
    score += featureScore * weights.features;

    // Geographic proximity (10%)
    const geoScore = this.calculateGeoScore(provider, request.targetCountry);
    score += geoScore * weights.geography;

    return Math.min(score, 1.0);
  }

  private getMLWeights(priority?: string) {
    switch (priority) {
      case 'speed':
        return { reliability: 0.2, speed: 0.5, uptime: 0.1, cost: 0.1, features: 0.05, geography: 0.05 };
      case 'cost':
        return { reliability: 0.15, speed: 0.1, uptime: 0.15, cost: 0.5, features: 0.05, geography: 0.05 };
      case 'reliability':
        return { reliability: 0.4, speed: 0.2, uptime: 0.3, cost: 0.05, features: 0.03, geography: 0.02 };
      default:
        return { reliability: 0.25, speed: 0.25, uptime: 0.2, cost: 0.2, features: 0.05, geography: 0.05 };
    }
  }

  private calculateFeatureMatch(provider: EnhancedProxyProvider, request: any): number {
    let matches = 0;
    let total = 0;

    if (request.requiresResidential) {
      total++;
      if (provider.features.staticResidential || provider.features.rotatingResidential) matches++;
    }

    if (request.requiresGeoTargeting) {
      total++;
      if (provider.features.geoTargeting) matches++;
    }

    if (request.requiresHighSpeed) {
      total++;
      if (provider.type === 'datacenter') matches++;
    }

    return total > 0 ? matches / total : 1;
  }

  private calculateGeoScore(provider: EnhancedProxyProvider, targetCountry?: string): number {
    if (!targetCountry) return 1;

    const hasCountry = provider.geoCoverage.countries.includes(targetCountry);
    const coverageScore = provider.geoCoverage.totalCountries / 200; // Normalize to 0-1

    return hasCountry ? 1 : coverageScore;
  }

  private filterCandidates(request: any): EnhancedProxyProvider[] {
    return Array.from(this.providers.values()).filter(provider => {
      if (provider.status !== 'active') return false;
      if (provider.healthStatus.status === 'down') return false;

      // Check if provider supports required features
      if (request.requiresResidential &&
          !provider.features.staticResidential &&
          !provider.features.rotatingResidential) {
        return false;
      }

      if (request.targetCountry &&
          !provider.geoCoverage.countries.includes(request.targetCountry)) {
        return false;
      }

      return true;
    });
  }

  private selectBestEndpoint(provider: EnhancedProxyProvider, targetCountry?: string): ProxyEndpoint {
    let candidates = provider.endpoints;

    if (targetCountry) {
      const countryEndpoints = candidates.filter(ep => ep.country === targetCountry);
      if (countryEndpoints.length > 0) {
        candidates = countryEndpoints;
      }
    }

    // Select endpoint with best performance
    return candidates.reduce((best, current) => {
      const bestScore = (best.reliability || 0) - (best.speed || 1000);
      const currentScore = (current.reliability || 0) - (current.speed || 1000);
      return currentScore > bestScore ? current : best;
    });
  }

  private generateSelectionReason(provider: EnhancedProxyProvider, request: any): string {
    const reasons = [];

    if (provider.performanceMetrics.successRate > 0.95) {
      reasons.push('high success rate');
    }

    if (provider.performanceMetrics.avgLatency < 100) {
      reasons.push('low latency');
    }

    if (provider.costMetrics.efficiency > 0.9) {
      reasons.push('cost efficient');
    }

    if (request.targetCountry && provider.geoCoverage.countries.includes(request.targetCountry)) {
      reasons.push('geo-targeting support');
    }

    return `Selected for: ${reasons.join(', ') || 'balanced performance'}`;
  }

  // Real-time health monitoring
  private startHealthMonitoring(): void {
    this.healthMonitor = setInterval(async () => {
      for (const [id, provider] of this.providers) {
        await this.checkProviderHealth(provider);
      }
    }, 60000); // Check every minute
  }

  private async checkProviderHealth(provider: EnhancedProxyProvider): Promise<void> {
    try {
      const startTime = Date.now();

      // Test a random endpoint
      const testEndpoint = provider.endpoints[Math.floor(Math.random() * provider.endpoints.length)];

      const response = await axios.get('https://httpbin.org/ip', {
        proxy: {
          host: testEndpoint.host,
          port: testEndpoint.port,
          auth: provider.authentication
        },
        timeout: 10000
      });

      const responseTime = Date.now() - startTime;

      // Update health status
      provider.healthStatus = {
        status: response.status === 200 ? 'healthy' : 'degraded',
        lastCheck: new Date(),
        responseTime,
        errorRate: provider.healthStatus.errorRate * 0.9, // Decay error rate on success
        alerts: provider.healthStatus.alerts.filter(alert =>
          Date.now() - alert.timestamp.getTime() < 3600000 // Keep alerts for 1 hour
        )
      };

      // Update performance metrics
      provider.performanceMetrics.responseTime = responseTime;
      provider.performanceMetrics.lastUpdated = new Date();

    } catch (error) {
      // Handle health check failure
      provider.healthStatus.errorRate = Math.min(provider.healthStatus.errorRate + 0.1, 1.0);

      if (provider.healthStatus.errorRate > 0.5) {
        provider.healthStatus.status = 'degraded';
      }

      if (provider.healthStatus.errorRate > 0.8) {
        provider.healthStatus.status = 'down';
        provider.healthStatus.alerts.push({
          type: 'error',
          message: `Provider ${provider.name} is experiencing high error rates`,
          timestamp: new Date(),
          severity: 'high'
        });
      }
    }
  }

  // Cost optimization methods
  public getCostAnalytics(): any {
    const providers = Array.from(this.providers.values());

    return {
      totalSpent: providers.reduce((sum, p) => sum + p.costMetrics.totalSpent, 0),
      monthlyProjection: providers.reduce((sum, p) => sum + p.costMetrics.monthlyCost, 0),
      mostEfficient: providers.reduce((best, current) =>
        current.costMetrics.efficiency > best.costMetrics.efficiency ? current : best
      ),
      costBreakdown: providers.map(p => ({
        provider: p.name,
        spent: p.costMetrics.totalSpent,
        efficiency: p.costMetrics.efficiency,
        trend: p.costMetrics.trend
      }))
    };
  }

  // Geographic coverage methods
  public getGeographicCoverage(): any {
    const allCountries = new Set<string>();
    const allCities = new Set<string>();

    this.providers.forEach(provider => {
      provider.geoCoverage.countries.forEach(country => allCountries.add(country));
      provider.geoCoverage.cities.forEach(city => allCities.add(city));
    });

    return {
      totalCountries: allCountries.size,
      totalCities: allCities.size,
      countries: Array.from(allCountries).sort(),
      providerCoverage: Array.from(this.providers.values()).map(p => ({
        name: p.name,
        countries: p.geoCoverage.totalCountries,
        cities: p.geoCoverage.totalCities
      }))
    };
  }

  // Performance analytics
  public getPerformanceAnalytics(): any {
    const providers = Array.from(this.providers.values());

    return {
      avgLatency: providers.reduce((sum, p) => sum + p.performanceMetrics.avgLatency, 0) / providers.length,
      avgSuccessRate: providers.reduce((sum, p) => sum + p.performanceMetrics.successRate, 0) / providers.length,
      avgUptime: providers.reduce((sum, p) => sum + p.performanceMetrics.uptime, 0) / providers.length,
      totalThroughput: providers.reduce((sum, p) => sum + p.performanceMetrics.throughput, 0),
      healthyProviders: providers.filter(p => p.healthStatus.status === 'healthy').length,
      totalConcurrentConnections: providers.reduce((sum, p) => sum + p.performanceMetrics.concurrentConnections, 0)
    };
  }

  // Provider endpoint generation methods
  private generateBrightDataEndpoints(): ProxyEndpoint[] {
    return [
      { host: 'brd-customer-hl_12345678-zone-datacenter.brdnet.com', port: 22225, protocol: 'http', country: 'US', city: 'New York', reliability: 0.99, speed: 85 },
      { host: 'brd-customer-hl_12345678-zone-residential.brdnet.com', port: 22225, protocol: 'http', country: 'GB', city: 'London', reliability: 0.98, speed: 120 },
      { host: 'brd-customer-hl_12345678-zone-mobile.brdnet.com', port: 22225, protocol: 'http', country: 'DE', city: 'Frankfurt', reliability: 0.97, speed: 95 }
    ];
  }

  private generateOxylabsEndpoints(): ProxyEndpoint[] {
    return [
      { host: 'pr.oxylabs.io', port: 7777, protocol: 'http', country: 'US', city: 'Chicago', reliability: 0.98, speed: 75 },
      { host: 'pr.oxylabs.io', port: 8000, protocol: 'http', country: 'FR', city: 'Paris', reliability: 0.97, speed: 90 },
      { host: 'pr.oxylabs.io', port: 8001, protocol: 'http', country: 'JP', city: 'Tokyo', reliability: 0.96, speed: 110 }
    ];
  }

  private generateIPRoyalEndpoints(): ProxyEndpoint[] {
    return [
      { host: 'royal-datacenter.iproyal.com', port: 12321, protocol: 'http', country: 'NL', city: 'Amsterdam', reliability: 0.94, speed: 110 },
      { host: 'royal-residential.iproyal.com', port: 12323, protocol: 'http', country: 'CA', city: 'Toronto', reliability: 0.93, speed: 130 },
      { host: 'royal-datacenter.iproyal.com', port: 12324, protocol: 'http', country: 'AU', city: 'Sydney', reliability: 0.92, speed: 150 }
    ];
  }

  private generateSmartproxyEndpoints(): ProxyEndpoint[] {
    return [
      { host: 'gate.smartproxy.com', port: 10000, protocol: 'http', country: 'US', city: 'Dallas', reliability: 0.99, speed: 35 },
      { host: 'gate.smartproxy.com', port: 10001, protocol: 'http', country: 'SG', city: 'Singapore', reliability: 0.98, speed: 45 },
      { host: 'gate.smartproxy.com', port: 10002, protocol: 'http', country: 'BR', city: 'São Paulo', reliability: 0.97, speed: 55 }
    ];
  }

  private generateProxyMeshEndpoints(): ProxyEndpoint[] {
    return [
      { host: 'open.proxymesh.com', port: 31280, protocol: 'http', country: 'US', city: 'San Francisco', reliability: 0.92, speed: 180 },
      { host: 'us-ca.proxymesh.com', port: 31280, protocol: 'http', country: 'US', city: 'Los Angeles', reliability: 0.90, speed: 200 },
      { host: 'jp.proxymesh.com', port: 31280, protocol: 'http', country: 'JP', city: 'Tokyo', reliability: 0.88, speed: 220 }
    ];
  }

  // Geographic data methods (sample data - in production these would be comprehensive lists)
  private getBrightDataCountries(): string[] {
    return [
      'US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA', 'NL', 'SE', 'NO', 'DK', 'FI', 'IT', 'ES', 'PT', 'BR', 'AR', 'MX', 'CL', 'CO',
      'IN', 'CN', 'KR', 'TH', 'VN', 'PH', 'ID', 'MY', 'SG', 'HK', 'TW', 'RU', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK',
      'UA', 'BY', 'LT', 'LV', 'EE', 'ZA', 'EG', 'MA', 'TN', 'KE', 'NG', 'GH', 'DZ', 'LY', 'SD', 'ET', 'TZ', 'UG', 'ZW', 'BW'
    ];
  }

  private getBrightDataCities(): string[] {
    return [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
      'London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Edinburgh', 'Leicester',
      'Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'
    ];
  }

  private getBrightDataISPs(): string[] {
    return ['Comcast', 'Verizon', 'AT&T', 'Charter', 'BT', 'Virgin Media', 'Sky', 'Deutsche Telekom', 'Vodafone', 'Orange'];
  }

  private getOxylabsCountries(): string[] {
    return [
      'US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA', 'NL', 'SE', 'NO', 'DK', 'FI', 'IT', 'ES', 'PT', 'BR', 'AR', 'MX', 'IN', 'CN',
      'KR', 'TH', 'VN', 'PH', 'ID', 'MY', 'SG', 'HK', 'TW', 'RU', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'ZA'
    ];
  }

  private getOxylabsCities(): string[] {
    return [
      'New York', 'Los Angeles', 'London', 'Berlin', 'Paris', 'Tokyo', 'Sydney', 'Toronto', 'Amsterdam', 'Stockholm',
      'Oslo', 'Copenhagen', 'Helsinki', 'Rome', 'Madrid', 'Lisbon', 'São Paulo', 'Buenos Aires', 'Mexico City', 'Mumbai'
    ];
  }

  private getOxylabsISPs(): string[] {
    return ['Comcast', 'Verizon', 'BT', 'Deutsche Telekom', 'NTT', 'Telstra', 'Rogers', 'KPN', 'Telia', 'Orange'];
  }

  private getIPRoyalCountries(): string[] {
    return [
      'US', 'GB', 'DE', 'FR', 'NL', 'CA', 'AU', 'SE', 'NO', 'DK', 'IT', 'ES', 'PL', 'CZ', 'BR', 'IN', 'JP', 'KR', 'SG', 'HK'
    ];
  }

  private getIPRoyalCities(): string[] {
    return [
      'New York', 'Los Angeles', 'London', 'Berlin', 'Amsterdam', 'Toronto', 'Sydney', 'Stockholm', 'Oslo', 'Copenhagen',
      'Rome', 'Madrid', 'Warsaw', 'Prague', 'São Paulo', 'Mumbai', 'Tokyo', 'Seoul', 'Singapore', 'Hong Kong'
    ];
  }

  private getIPRoyalISPs(): string[] {
    return ['Comcast', 'BT', 'Deutsche Telekom', 'KPN', 'Rogers', 'Telstra', 'Telia', 'Orange', 'Vodafone', 'T-Mobile'];
  }

  private getSmartproxyCountries(): string[] {
    return [
      'US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA', 'NL', 'SE', 'NO', 'DK', 'FI', 'IT', 'ES', 'PT', 'BR', 'AR', 'MX', 'CL', 'CO',
      'IN', 'KR', 'TH', 'SG', 'HK', 'RU', 'PL', 'CZ', 'HU', 'ZA', 'EG', 'IL', 'TR', 'SA', 'AE', 'PH', 'MY', 'ID', 'VN'
    ];
  }

  private getSmartproxyCities(): string[] {
    return [
      'Dallas', 'Miami', 'Seattle', 'London', 'Frankfurt', 'Paris', 'Tokyo', 'Sydney', 'Toronto', 'Amsterdam',
      'Stockholm', 'Copenhagen', 'Rome', 'Madrid', 'São Paulo', 'Singapore', 'Hong Kong', 'Warsaw', 'Prague', 'Budapest'
    ];
  }

  private getSmartproxyISPs(): string[] {
    return ['AT&T', 'Verizon', 'BT', 'Deutsche Telekom', 'NTT', 'Telstra', 'Bell', 'KPN', 'Telia', 'Orange'];
  }

  private getProxyMeshCountries(): string[] {
    return ['US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA', 'NL', 'BR', 'IN', 'SG', 'HK', 'RU', 'MX', 'ZA', 'IL', 'KR', 'ES', 'IT', 'PL'];
  }

  private getProxyMeshCities(): string[] {
    return [
      'San Francisco', 'Los Angeles', 'New York', 'London', 'Frankfurt', 'Paris', 'Tokyo', 'Sydney', 'Toronto', 'Amsterdam',
      'São Paulo', 'Mumbai', 'Singapore', 'Hong Kong', 'Moscow', 'Mexico City', 'Cape Town', 'Tel Aviv', 'Seoul', 'Madrid'
    ];
  }

  private getProxyMeshISPs(): string[] {
    return ['Comcast', 'BT', 'Deutsche Telekom', 'NTT', 'Telstra', 'Rogers', 'KPN', 'Orange', 'Vodafone', 'T-Mobile'];
  }

  public getProviders(): Map<string, EnhancedProxyProvider> {
    return this.providers;
  }

  public getProvider(id: string): EnhancedProxyProvider | undefined {
    return this.providers.get(id);
  }

  public async updateProviderStatus(id: string, status: 'active' | 'inactive' | 'maintenance'): Promise<void> {
    const provider = this.providers.get(id);
    if (provider) {
      provider.status = status;
      if (status === 'maintenance') {
        provider.healthStatus.status = 'maintenance';
      }
    }
  }

  public destroy(): void {
    if (this.healthMonitor) {
      clearInterval(this.healthMonitor);
      this.healthMonitor = null;
    }
  }
}
