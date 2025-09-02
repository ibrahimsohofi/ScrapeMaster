// Base proxy provider interface for all proxy providers
export interface ProxyProvider {
  name: string;
  type: 'residential' | 'datacenter' | 'mobile';
  regions: string[];
  isConfigured(): boolean;
  getProxy(options?: ProxyRequestOptions): Promise<ProxyCredentials>;
  validateCredentials(): Promise<boolean>;
  getUsageStats(): Promise<ProxyUsageStats>;
  rotateProxy(sessionId: string): Promise<ProxyCredentials>;
  releaseProxy(sessionId: string): Promise<void>;
}

export interface ProxyRequestOptions {
  region?: string;
  sticky?: boolean;
  sessionId?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
}

export interface ProxyCredentials {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks5';
  sessionId: string;
  expiresAt?: Date;
  region?: string;
  country?: string;
  city?: string;
}

export interface ProxyUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  bandwidthUsed: number; // in bytes
  averageResponseTime: number; // in milliseconds
  successRate: number; // percentage
  lastUpdated: Date;
}

export interface ProxyProviderConfig {
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  endpoint?: string;
  timeout?: number;
  retries?: number;
  rateLimitPerSecond?: number;
}

export interface ProxyHealthCheck {
  isHealthy: boolean;
  latency: number;
  location: string;
  lastChecked: Date;
  errorMessage?: string;
}

// Abstract base class for proxy providers
export abstract class BaseProxyProvider implements ProxyProvider {
  abstract name: string;
  abstract type: 'residential' | 'datacenter' | 'mobile';
  abstract regions: string[];

  protected config: ProxyProviderConfig;
  protected rateLimiter: Map<string, number> = new Map();
  protected sessionCache: Map<string, ProxyCredentials> = new Map();

  constructor(config: ProxyProviderConfig) {
    this.config = config;
  }

  abstract isConfigured(): boolean;
  abstract getProxy(options?: ProxyRequestOptions): Promise<ProxyCredentials>;
  abstract validateCredentials(): Promise<boolean>;
  abstract getUsageStats(): Promise<ProxyUsageStats>;

  async rotateProxy(sessionId: string): Promise<ProxyCredentials> {
    // Release existing proxy
    await this.releaseProxy(sessionId);

    // Get new proxy with same session ID
    return this.getProxy({ sessionId });
  }

  async releaseProxy(sessionId: string): Promise<void> {
    this.sessionCache.delete(sessionId);
  }

  protected generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  protected isRateLimited(endpoint: string): boolean {
    const now = Date.now();
    const lastCall = this.rateLimiter.get(endpoint) || 0;
    const rateLimitMs = 1000 / (this.config.rateLimitPerSecond || 10);

    if (now - lastCall < rateLimitMs) {
      return true;
    }

    this.rateLimiter.set(endpoint, now);
    return false;
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async healthCheck(): Promise<ProxyHealthCheck> {
    const startTime = Date.now();

    try {
      const isHealthy = await this.validateCredentials();
      const latency = Date.now() - startTime;

      return {
        isHealthy,
        latency,
        location: this.regions[0] || 'unknown',
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        isHealthy: false,
        latency: Date.now() - startTime,
        location: 'unknown',
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  protected async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ScrapeCloud-ProxyManager/1.0',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
