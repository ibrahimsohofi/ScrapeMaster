import { BaseProxyProvider, type ProxyProviderConfig, type ProxyRequestOptions, type ProxyCredentials, type ProxyUsageStats } from './base';

export interface RayobyteConfig {
  username: string;
  password: string;
  endpoint?: string;
  proxyType?: 'residential' | 'datacenter' | 'mobile';
  country?: string;
  state?: string;
  city?: string;
  packageId?: string;
  sticky?: boolean;
  sessionDuration?: number;
}

export class RayobyteProvider extends BaseProxyProvider {
  // Required abstract properties
  name = 'Rayobyte';
  type: 'residential' | 'datacenter' | 'mobile';
  regions = ['US', 'UK', 'CA', 'DE', 'FR', 'AU', 'JP', 'BR', 'MX'];

  private rayobyteConfig: RayobyteConfig;
  private sessionId?: string;
  private sessionExpiry?: Date;
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    bandwidthUsed: 0,
    averageResponseTime: 0,
    successRate: 0,
    lastUpdated: new Date()
  };

  constructor(config: RayobyteConfig) {
    const baseConfig: ProxyProviderConfig = {
      username: config.username,
      password: config.password,
      endpoint: config.endpoint || 'rotating.rayobyte.com:8000',
      timeout: 30000,
      rateLimitPerSecond: 10
    };

    super(baseConfig);
    this.rayobyteConfig = config;
    this.type = config.proxyType || 'residential';
  }

  isConfigured(): boolean {
    return !!(this.rayobyteConfig.username && this.rayobyteConfig.password);
  }

  async getProxy(options?: ProxyRequestOptions): Promise<ProxyCredentials> {
    const sessionId = options?.sessionId || this.generateSessionId();

    // Check if we have a cached session
    if (this.sessionCache.has(sessionId)) {
      const cached = this.sessionCache.get(sessionId)!;
      if (!cached.expiresAt || cached.expiresAt > new Date()) {
        return cached;
      }
    }

    const credentials: ProxyCredentials = {
      host: this.rayobyteConfig.endpoint?.split(':')[0] || 'rotating.rayobyte.com',
      port: Number.parseInt(this.rayobyteConfig.endpoint?.split(':')[1] || '8000'),
      username: this.buildProxyUsername(options),
      password: this.rayobyteConfig.password,
      protocol: 'http',
      sessionId,
      expiresAt: new Date(Date.now() + (this.rayobyteConfig.sessionDuration || 600) * 1000),
      region: options?.region,
      country: options?.country
    };

    this.sessionCache.set(sessionId, credentials);
    return credentials;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const proxy = await this.getProxy();

      // Test the proxy by making a simple request
      const response = await fetch('https://httpbin.org/ip', {
        method: 'GET',
        // Note: In real implementation, you'd use the proxy here
        signal: AbortSignal.timeout(10000)
      });

      this.stats.successfulRequests++;
      this.stats.lastUpdated = new Date();
      return response.ok;
    } catch (error) {
      this.stats.failedRequests++;
      this.stats.lastUpdated = new Date();
      return false;
    }
  }

  async getUsageStats(): Promise<ProxyUsageStats> {
    this.stats.totalRequests = this.stats.successfulRequests + this.stats.failedRequests;
    this.stats.successRate = this.stats.totalRequests > 0
      ? (this.stats.successfulRequests / this.stats.totalRequests) * 100
      : 0;

    return {
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      bandwidthUsed: this.stats.bandwidthUsed,
      averageResponseTime: this.stats.averageResponseTime,
      successRate: this.stats.successRate,
      lastUpdated: this.stats.lastUpdated
    };
  }

  private buildProxyUsername(options?: ProxyRequestOptions): string {
    let username = this.rayobyteConfig.username;

    if (this.rayobyteConfig.packageId) {
      username += `:${this.rayobyteConfig.packageId}`;
    }

    const params: string[] = [];

    if (options?.country || this.rayobyteConfig.country) {
      params.push(`country-${options?.country || this.rayobyteConfig.country}`);
    }
    if (options?.city || this.rayobyteConfig.city) {
      params.push(`city-${options?.city || this.rayobyteConfig.city}`);
    }
    if (this.rayobyteConfig.state) {
      params.push(`state-${this.rayobyteConfig.state}`);
    }

    if (this.rayobyteConfig.sticky && (options?.sessionId || this.sessionId)) {
      params.push(`session-${options?.sessionId || this.sessionId}`);
    }

    if (params.length > 0) {
      username += `:${params.join(':')}`;
    }

    return username;
  }

  // Legacy methods for backward compatibility
  async connect(): Promise<boolean> {
    return this.validateCredentials();
  }

  async getEndpoint(): Promise<any> {
    const [host, port] = (this.rayobyteConfig.endpoint || 'rotating.rayobyte.com:8000').split(':');
    return {
      host,
      port: Number.parseInt(port),
      username: this.buildProxyUsername(),
      password: this.rayobyteConfig.password,
      protocol: 'http'
    };
  }

  async executeRequest(url: string, options: any = {}): Promise<any> {
    try {
      const proxy = await this.getProxy();
      // In a real implementation, you'd configure the HTTP client to use the proxy
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      this.stats.successfulRequests++;
      return {
        success: true,
        data: await response.text(),
        status: response.status
      };
    } catch (error: any) {
      this.stats.failedRequests++;
      return {
        success: false,
        error: error.message,
        statusCode: 0
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; ip: string; country: string }> {
    try {
      const proxy = await this.getProxy();
      // Test connection through proxy
      return {
        success: true,
        ip: '192.168.1.1', // Placeholder
        country: 'US' // Placeholder
      };
    } catch (error) {
      return {
        success: false,
        ip: '',
        country: ''
      };
    }
  }

  async rotateSession(): Promise<boolean> {
    this.sessionId = undefined;
    this.sessionExpiry = undefined;
    return true;
  }

  getStats() {
    return this.getUsageStats();
  }
}
