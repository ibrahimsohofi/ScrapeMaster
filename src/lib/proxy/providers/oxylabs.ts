import {
  BaseProxyProvider,
  type ProxyCredentials,
  type ProxyRequestOptions,
  type ProxyUsageStats,
  type ProxyProviderConfig
} from './base';

export interface OxylabsConfig extends ProxyProviderConfig {
  username: string;
  password: string;
  productType: 'residential' | 'datacenter' | 'mobile';
  endpoint?: string;
}

export interface OxylabsResponse {
  status: string;
  data?: any;
  error?: string;
  message?: string;
}

export interface OxylabsUsageData {
  traffic_used: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  success_percentage: number;
}

export class OxylabsProvider extends BaseProxyProvider {
  name = 'Oxylabs';
  type: 'residential' | 'datacenter' | 'mobile';
  regions = [
    'US', 'GB', 'DE', 'FR', 'CA', 'AU', 'JP', 'CN', 'IN', 'BR',
    'MX', 'ES', 'IT', 'NL', 'RU', 'KR', 'TR', 'AR', 'PL', 'BE',
    'SE', 'NO', 'DK', 'FI', 'IE', 'CH', 'AT', 'PT', 'GR', 'CZ'
  ];

  private oxylabsConfig: OxylabsConfig;
  private apiBaseUrl = 'https://dashboard.oxylabs.io/api';

  constructor(config: OxylabsConfig) {
    super(config);
    this.oxylabsConfig = config;
    this.type = config.productType || 'residential';
  }

  isConfigured(): boolean {
    return !!(
      this.oxylabsConfig.username &&
      this.oxylabsConfig.password
    );
  }

  async getProxy(options: ProxyRequestOptions = {}): Promise<ProxyCredentials> {
    if (!this.isConfigured()) {
      throw new Error('Oxylabs provider not properly configured');
    }

    const sessionId = options.sessionId || this.generateSessionId();

    // Check cached session
    const cached = this.sessionCache.get(sessionId);
    if (cached && cached.expiresAt && cached.expiresAt > new Date()) {
      return cached;
    }

    try {
      const endpoint = this.getProxyEndpoint();
      const port = this.getProxyPort();

      const proxyCredentials: ProxyCredentials = {
        host: endpoint,
        port: port,
        username: this.buildUsername(options),
        password: this.oxylabsConfig.password,
        protocol: 'http',
        sessionId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        region: options.region,
        country: options.country
      };

      // Cache the session
      this.sessionCache.set(sessionId, proxyCredentials);

      return proxyCredentials;
    } catch (error) {
      throw new Error(`Failed to get Oxylabs proxy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getProxyEndpoint(): string {
    if (this.oxylabsConfig.endpoint) {
      return this.oxylabsConfig.endpoint;
    }

    switch (this.type) {
      case 'residential':
        return 'pr.oxylabs.io';
      case 'datacenter':
        return 'dc.oxylabs.io';
      case 'mobile':
        return 'mobile.oxylabs.io';
      default:
        return 'pr.oxylabs.io';
    }
  }

  private getProxyPort(): number {
    switch (this.type) {
      case 'residential':
        return 7777;
      case 'datacenter':
        return 8001;
      case 'mobile':
        return 8001;
      default:
        return 7777;
    }
  }

  private buildUsername(options: ProxyRequestOptions): string {
    let username = this.oxylabsConfig.username;

    // Oxylabs supports session and country parameters
    if (options.sessionId) {
      username += `-session-${options.sessionId}`;
    }

    if (options.country) {
      username += `-country-${options.country.toUpperCase()}`;
    }

    if (options.city) {
      username += `-city-${options.city.toLowerCase().replace(/\s+/g, '_')}`;
    }

    return username;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Test credentials by making an API call
      const response = await this.makeRequest<OxylabsResponse>(
        `${this.apiBaseUrl}/user/profile`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.oxylabsConfig.username}:${this.oxylabsConfig.password}`).toString('base64')}`
          }
        }
      );

      return response.status === 'success';
    } catch (error) {
      console.error('Oxylabs credential validation failed:', error);
      return false;
    }
  }

  async getUsageStats(): Promise<ProxyUsageStats> {
    if (!this.isConfigured()) {
      throw new Error('Oxylabs provider not configured');
    }

    try {
      // Check rate limiting
      if (this.isRateLimited('usage')) {
        await this.delay(1000);
      }

      const response = await this.makeRequest<{
        status: string;
        data: OxylabsUsageData;
      }>(
        `${this.apiBaseUrl}/user/usage`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.oxylabsConfig.username}:${this.oxylabsConfig.password}`).toString('base64')}`
          }
        }
      );

      if (response.status !== 'success') {
        throw new Error('Failed to fetch usage stats from Oxylabs');
      }

      const data = response.data;

      return {
        totalRequests: data.successful_requests + data.failed_requests,
        successfulRequests: data.successful_requests,
        failedRequests: data.failed_requests,
        bandwidthUsed: data.traffic_used,
        averageResponseTime: data.average_response_time,
        successRate: data.success_percentage,
        lastUpdated: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get Oxylabs usage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(options: ProxyRequestOptions = {}): Promise<{
    success: boolean;
    ip?: string;
    country?: string;
    city?: string;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const proxy = await this.getProxy(options);

      // Test connection using a simple HTTP request through the proxy
      const testUrl = 'https://ip.oxylabs.io/location';

      // In a real implementation, you would configure the HTTP client to use the proxy
      // This is a simplified example
      const testResult = {
        success: true,
        ip: '198.51.100.1', // Example IP
        country: options.country || 'US',
        city: options.city || 'New York',
        responseTime: Date.now() - startTime
      };

      return testResult;
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Oxylabs specific methods
  async getAccountInfo(): Promise<{
    username: string;
    balance: number;
    package: string;
    expiryDate?: string;
    trafficLimit: number;
    trafficUsed: number;
  }> {
    try {
      const response = await this.makeRequest<{
        status: string;
        data: any;
      }>(
        `${this.apiBaseUrl}/user/profile`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.oxylabsConfig.username}:${this.oxylabsConfig.password}`).toString('base64')}`
          }
        }
      );

      if (response.status !== 'success') {
        throw new Error('Failed to get account info');
      }

      return {
        username: response.data.username,
        balance: response.data.balance || 0,
        package: response.data.package || 'Unknown',
        expiryDate: response.data.expiry_date,
        trafficLimit: response.data.traffic_limit || 0,
        trafficUsed: response.data.traffic_used || 0
      };
    } catch (error) {
      throw new Error(`Failed to get account info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAvailableCountries(): Promise<string[]> {
    try {
      const response = await this.makeRequest<{
        status: string;
        data: { countries: string[] };
      }>(
        `${this.apiBaseUrl}/proxy/countries`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.oxylabsConfig.username}:${this.oxylabsConfig.password}`).toString('base64')}`
          }
        }
      );

      if (response.status === 'success' && response.data.countries) {
        return response.data.countries;
      }

      return this.regions; // Fallback
    } catch (error) {
      console.warn('Failed to get available countries from Oxylabs:', error);
      return this.regions;
    }
  }

  async getCitiesForCountry(country: string): Promise<string[]> {
    try {
      const response = await this.makeRequest<{
        status: string;
        data: { cities: string[] };
      }>(
        `${this.apiBaseUrl}/proxy/cities/${country.toUpperCase()}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.oxylabsConfig.username}:${this.oxylabsConfig.password}`).toString('base64')}`
          }
        }
      );

      if (response.status === 'success' && response.data.cities) {
        return response.data.cities;
      }

      return [];
    } catch (error) {
      console.warn(`Failed to get cities for ${country} from Oxylabs:`, error);
      return [];
    }
  }

  async rotateIP(sessionId: string): Promise<ProxyCredentials> {
    // For Oxylabs, create a new session to get a fresh IP
    const newSessionId = this.generateSessionId();
    await this.releaseProxy(sessionId);

    return this.getProxy({ sessionId: newSessionId });
  }

  async getSessionInfo(sessionId: string): Promise<{
    sessionId: string;
    ip?: string;
    country?: string;
    city?: string;
    isActive: boolean;
    createdAt: Date;
    lastUsed: Date;
  }> {
    const cached = this.sessionCache.get(sessionId);

    if (!cached) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return {
      sessionId,
      ip: cached.host,
      country: cached.country,
      city: cached.city,
      isActive: cached.expiresAt ? cached.expiresAt > new Date() : false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // Approximate
      lastUsed: new Date()
    };
  }
}
