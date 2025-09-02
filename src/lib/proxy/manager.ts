export interface ProxyProvider {
  id: string;
  name: string;
  type: 'residential' | 'datacenter' | 'mobile';
  status: 'active' | 'inactive' | 'maintenance';
  endpoints: ProxyEndpoint[];
  authentication?: {
    username: string;
    password: string;
    apiKey?: string;
  };
  rotation: {
    method: 'session' | 'request' | 'time';
    interval?: number; // milliseconds for time-based rotation
  };
  pricing: {
    costPerGB?: number;
    costPerRequest?: number;
    monthlyLimit?: number;
    model?: 'per_gb' | 'per_request' | 'monthly';
    cost?: number;
    currency?: string;
  };
  credentials?: {
    username: string;
    password: string;
    apiKey?: string;
    authType?: string;
  };
  limits?: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    bandwidthGB: number;
    concurrentSessions: number;
  };
}

export interface ProxyEndpoint {
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks5';
  country?: string;
  city?: string;
  isp?: string;
  speed?: number; // ms latency
  reliability?: number; // 0-1 success rate
  lastChecked?: Date;
  isHealthy?: boolean;
}

export interface ProxyRequest {
  url: string;
  targetCountry?: string;
  maxLatency?: number;
  requireMobile?: boolean;
  sessionId?: string;
  retryCount?: number;
}

export interface ProxyResult {
  success: boolean;
  proxy: ProxyEndpoint;
  responseTime: number;
  error?: string;
  ipAddress?: string;
  location?: {
    country: string;
    city: string;
    lat?: number;
    lng?: number;
  };
}

class ProxyManager {
  private providers: Map<string, ProxyProvider> = new Map();
  private sessionProxies: Map<string, ProxyEndpoint> = new Map();
  private proxyHealth: Map<string, HealthMetrics> = new Map();
  private rotationIndex: Map<string, number> = new Map();
  private requestCount: Map<string, number> = new Map();

  constructor() {
    this.initializeDefaultProviders();
    this.startHealthCheckInterval();
  }

  private initializeDefaultProviders() {
    // Bright Data configuration
    this.addProvider({
      id: 'bright-data',
      name: 'bright-data',
      type: 'residential',
      status: 'active',
      endpoints: [
        {
          host: 'brd-customer-hl_12345678-zone-residential_proxy1',
          port: 22225,
          protocol: 'http',
          reliability: 0.95,
          speed: 800
        },
        {
          host: 'brd-customer-hl_12345678-zone-datacenter_proxy1',
          port: 22225,
          protocol: 'http',
          reliability: 0.98,
          speed: 200
        }
      ],
      authentication: {
        username: process.env.BRIGHT_DATA_USERNAME || '',
        password: process.env.BRIGHT_DATA_PASSWORD || ''
      },
      rotation: {
        method: 'session'
      },
      pricing: {
        costPerGB: 15.0,
        monthlyLimit: 100
      }
    });

    // Oxylabs configuration
    this.addProvider({
      id: 'oxylabs',
      name: 'oxylabs',
      type: 'residential',
      status: 'active',
      endpoints: [
        {
          host: 'pr.oxylabs.io',
          port: 7777,
          protocol: 'http',
          reliability: 0.93,
          speed: 1200
        }
      ],
      authentication: {
        username: process.env.OXYLABS_USERNAME || '',
        password: process.env.OXYLABS_PASSWORD || ''
      },
      rotation: {
        method: 'request'
      },
      pricing: {
        costPerGB: 12.0,
        monthlyLimit: 100
      }
    });

    // Free/public proxies for testing
    this.addProvider({
      id: 'free-proxy',
      name: 'free-proxy',
      type: 'datacenter',
      status: 'active',
      endpoints: [
        {
          host: 'proxy-server.scraperapi.com',
          port: 8001,
          protocol: 'http',
          reliability: 0.7,
          speed: 2000
        }
      ],
      rotation: {
        method: 'time',
        interval: 300000 // 5 minutes
      },
      pricing: {
        costPerRequest: 0.001
      }
    });
  }

  addProvider(provider: ProxyProvider) {
    this.providers.set(provider.name, provider);
    this.rotationIndex.set(provider.name, 0);
    this.requestCount.set(provider.name, 0);
  }

  async getProxy(request: ProxyRequest): Promise<ProxyResult> {
    const startTime = Date.now();

    try {
      // Choose best provider based on request requirements
      const provider = await this.selectOptimalProvider(request);

      if (!provider) {
        throw new Error('No suitable proxy provider available');
      }

      // Get proxy endpoint from provider
      const proxy = await this.getProxyFromProvider(provider, request);

      if (!proxy) {
        throw new Error(`No available proxy from provider ${provider.name}`);
      }

      // Test proxy if needed
      const isHealthy = await this.verifyProxyHealth(proxy);

      if (!isHealthy) {
        // Try to get another proxy
        return this.getProxy({ ...request, retryCount: (request.retryCount || 0) + 1 });
      }

      // Record usage
      this.recordProxyUsage(provider.name, proxy);

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        proxy,
        responseTime,
        ipAddress: await this.getProxyIP(proxy),
        location: await this.getProxyLocation(proxy)
      };

    } catch (error) {
      return {
        success: false,
        proxy: { host: '', port: 0, protocol: 'http' },
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown proxy error'
      };
    }
  }

  private async selectOptimalProvider(request: ProxyRequest): Promise<ProxyProvider | null> {
    const availableProviders = Array.from(this.providers.values()).filter(provider => {
      // Filter by requirements
      if (request.requireMobile && provider.type !== 'mobile') {
        return false;
      }

      if (request.targetCountry) {
        const hasCountry = provider.endpoints.some(endpoint =>
          endpoint.country === request.targetCountry
        );
        if (!hasCountry) return false;
      }

      if (request.maxLatency) {
        const maxLatency = request.maxLatency; // Store in local variable
        const hasLowLatency = provider.endpoints.some(endpoint =>
          (endpoint.speed || 1000) <= maxLatency
        );
        if (!hasLowLatency) return false;
      }

      return true;
    });

    if (availableProviders.length === 0) {
      return null;
    }

    // Score providers based on reliability, speed, and cost
    const scoredProviders = availableProviders.map(provider => ({
      provider,
      score: this.calculateProviderScore(provider, request)
    }));

    // Sort by score and return best
    scoredProviders.sort((a, b) => b.score - a.score);
    return scoredProviders[0].provider;
  }

  private calculateProviderScore(provider: ProxyProvider, request: ProxyRequest): number {
    let score = 0;

    // Reliability weight (40%)
    const avgReliability = provider.endpoints.reduce((sum, endpoint) =>
      sum + (endpoint.reliability || 0.5), 0) / provider.endpoints.length;
    score += avgReliability * 40;

    // Speed weight (30%)
    const avgSpeed = provider.endpoints.reduce((sum, endpoint) =>
      sum + (endpoint.speed || 1000), 0) / provider.endpoints.length;
    const speedScore = Math.max(0, (3000 - avgSpeed) / 3000); // Normalize speed
    score += speedScore * 30;

    // Cost efficiency weight (20%)
    const costScore = provider.pricing.costPerGB ?
      Math.max(0, (20 - provider.pricing.costPerGB) / 20) : 0.5;
    score += costScore * 20;

    // Health status weight (10%)
    const healthScore = this.getProviderHealthScore(provider.name);
    score += healthScore * 10;

    return score;
  }

  private async getProxyFromProvider(provider: ProxyProvider, request: ProxyRequest): Promise<ProxyEndpoint | null> {
    // Handle session-based rotation
    if (provider.rotation.method === 'session' && request.sessionId) {
      const sessionProxy = this.sessionProxies.get(request.sessionId);
      if (sessionProxy && sessionProxy.isHealthy !== false) {
        return sessionProxy;
      }
    }

    // Filter endpoints by requirements
    const availableEndpoints = provider.endpoints.filter(endpoint => {
      if (request.targetCountry && endpoint.country !== request.targetCountry) {
        return false;
      }
      if (request.maxLatency && (endpoint.speed || 1000) > request.maxLatency) {
        return false;
      }
      return endpoint.isHealthy !== false;
    });

    if (availableEndpoints.length === 0) {
      return null;
    }

    let selectedEndpoint: ProxyEndpoint;

    switch (provider.rotation.method) {
      case 'session':
        // Use round-robin for session assignment
        const sessionIndex = this.rotationIndex.get(provider.name) || 0;
        selectedEndpoint = availableEndpoints[sessionIndex % availableEndpoints.length];
        this.rotationIndex.set(provider.name, sessionIndex + 1);

        if (request.sessionId) {
          this.sessionProxies.set(request.sessionId, selectedEndpoint);
        }
        break;

      case 'request':
        // Random selection for each request
        selectedEndpoint = availableEndpoints[Math.floor(Math.random() * availableEndpoints.length)];
        break;

      case 'time':
        // Time-based rotation
        const timeIndex = Math.floor(Date.now() / (provider.rotation.interval || 300000));
        selectedEndpoint = availableEndpoints[timeIndex % availableEndpoints.length];
        break;

      default:
        selectedEndpoint = availableEndpoints[0];
    }

    return selectedEndpoint;
  }

  private async verifyProxyHealth(proxy: ProxyEndpoint): Promise<boolean> {
    const proxyKey = `${proxy.host}:${proxy.port}`;
    const cached = this.proxyHealth.get(proxyKey);

    // Use cached result if recent
    if (cached && (Date.now() - cached.lastChecked.getTime()) < 60000) {
      return cached.isHealthy;
    }

    // Perform health check
    try {
      const startTime = Date.now();

      // Simple HTTP test through proxy
      const response = await fetch('http://httpbin.org/ip', {
        method: 'GET',
        // Note: In a real implementation, you'd configure the fetch to use the proxy
        signal: AbortSignal.timeout(10000)
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok && responseTime < 15000;

      this.proxyHealth.set(proxyKey, {
        isHealthy,
        responseTime,
        lastChecked: new Date(),
        errorCount: isHealthy ? 0 : (cached?.errorCount || 0) + 1
      });

      proxy.isHealthy = isHealthy;
      proxy.speed = responseTime;
      proxy.lastChecked = new Date();

      return isHealthy;

    } catch (error) {
      this.proxyHealth.set(proxyKey, {
        isHealthy: false,
        responseTime: 0,
        lastChecked: new Date(),
        errorCount: (cached?.errorCount || 0) + 1
      });

      proxy.isHealthy = false;
      return false;
    }
  }

  private async getProxyIP(proxy: ProxyEndpoint): Promise<string> {
    try {
      // In production, make request through proxy to get actual IP
      const response = await fetch('http://httpbin.org/ip');
      const data = await response.json();
      return data.origin || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async getProxyLocation(proxy: ProxyEndpoint): Promise<{ country: string; city: string } | undefined> {
    if (proxy.country && proxy.city) {
      return {
        country: proxy.country,
        city: proxy.city
      };
    }
    return undefined;
  }

  private recordProxyUsage(providerName: string, proxy: ProxyEndpoint) {
    const currentCount = this.requestCount.get(providerName) || 0;
    this.requestCount.set(providerName, currentCount + 1);

    // Log usage for billing/analytics
    console.log(`Proxy used: ${providerName} - ${proxy.host}:${proxy.port}`);
  }

  private getProviderHealthScore(providerName: string): number {
    const provider = this.providers.get(providerName);
    if (!provider) return 0;

    const healthyEndpoints = provider.endpoints.filter(endpoint =>
      endpoint.isHealthy !== false
    ).length;

    return healthyEndpoints / provider.endpoints.length;
  }

  private startHealthCheckInterval() {
    // Check proxy health every 5 minutes
    setInterval(() => {
      this.performBulkHealthCheck();
    }, 300000);
  }

  private async performBulkHealthCheck() {
    console.log('Performing bulk proxy health check...');

    for (const provider of this.providers.values()) {
      for (const endpoint of provider.endpoints) {
        // Don't block - run health checks in background
        this.verifyProxyHealth(endpoint).catch(console.error);
      }
    }
  }

  // Admin methods
  getProviderStats(providerName: string): ProviderStats | null {
    const provider = this.providers.get(providerName);
    if (!provider) return null;

    const totalEndpoints = provider.endpoints.length;
    const healthyEndpoints = provider.endpoints.filter(e => e.isHealthy !== false).length;
    const avgResponseTime = provider.endpoints.reduce((sum, e) => sum + (e.speed || 0), 0) / totalEndpoints;
    const totalRequests = this.requestCount.get(providerName) || 0;

    return {
      name: providerName,
      type: provider.type,
      totalEndpoints,
      healthyEndpoints,
      healthRate: healthyEndpoints / totalEndpoints,
      avgResponseTime,
      totalRequests,
      pricing: {
        perRequest: provider.pricing.costPerRequest,
        perGB: provider.pricing.costPerGB,
        monthly: provider.pricing.monthlyLimit,
        currency: 'USD'
      }
    };
  }

  getAllProviderStats(): ProviderStats[] {
    return Array.from(this.providers.keys())
      .map(name => this.getProviderStats(name))
      .filter(Boolean) as ProviderStats[];
  }

  // Cost optimization
  estimateCost(providerName: string, dataGB: number, requests: number): number {
    const provider = this.providers.get(providerName);
    if (!provider) return 0;

    let cost = 0;

    if (provider.pricing.costPerGB) {
      cost += dataGB * provider.pricing.costPerGB;
    }

    if (provider.pricing.costPerRequest) {
      cost += requests * provider.pricing.costPerRequest;
    }

    return cost;
  }

  getOptimalProvider(dataGB: number, requests: number): { provider: string; estimatedCost: number } | null {
    const providers = Array.from(this.providers.keys());
    const costs = providers.map(name => ({
      provider: name,
      estimatedCost: this.estimateCost(name, dataGB, requests)
    }));

    costs.sort((a, b) => a.estimatedCost - b.estimatedCost);
    return costs[0] || null;
  }
}

interface HealthMetrics {
  isHealthy: boolean;
  responseTime: number;
  lastChecked: Date;
  errorCount: number;
}

interface ProviderStats {
  name: string;
  type: string;
  totalEndpoints: number;
  healthyEndpoints: number;
  healthRate: number;
  avgResponseTime: number;
  totalRequests: number;
  pricing: {
    perRequest?: number;
    perGB?: number;
    monthly?: number;
    currency: string;
  };
}

// Export singleton instance
export const proxyManager = new ProxyManager();

export { ProxyManager };
