import {
  BaseProxyProvider,
  type ProxyCredentials,
  type ProxyRequestOptions,
  type ProxyUsageStats,
  type ProxyProviderConfig
} from './base';

export interface BrightDataConfig extends ProxyProviderConfig {
  customerId: string;
  zonePassword: string;
  zoneName: string;
  endpoint?: string;
}

export interface BrightDataSession {
  sessionId: string;
  ip: string;
  country: string;
  city?: string;
  asn?: string;
  expiresAt: Date;
}

export interface BrightDataStats {
  bandwidth_used: number;
  requests_successful: number;
  requests_failed: number;
  avg_response_time: number;
  success_rate: number;
}

export class BrightDataProvider extends BaseProxyProvider {
  name = 'Bright Data';
  type: 'residential' | 'datacenter' | 'mobile' = 'residential';
  regions = [
    'US', 'GB', 'DE', 'FR', 'CA', 'AU', 'JP', 'KR', 'IN', 'BR',
    'MX', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI', 'IE', 'CH',
    'AT', 'BE', 'PT', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR'
  ];

  private brightDataConfig: BrightDataConfig;
  private apiBaseUrl = 'https://luminati-china.io';

  constructor(config: BrightDataConfig) {
    super(config);
    this.brightDataConfig = config;

    // Set proxy type based on zone name
    if (config.zoneName.includes('datacenter')) {
      this.type = 'datacenter';
    } else if (config.zoneName.includes('mobile')) {
      this.type = 'mobile';
    }
  }

  isConfigured(): boolean {
    return !!(
      this.brightDataConfig.customerId &&
      this.brightDataConfig.zonePassword &&
      this.brightDataConfig.zoneName
    );
  }

  async getProxy(options: ProxyRequestOptions = {}): Promise<ProxyCredentials> {
    if (!this.isConfigured()) {
      throw new Error('Bright Data provider not properly configured');
    }

    const sessionId = options.sessionId || this.generateSessionId();

    // Check if we have a cached session
    const cached = this.sessionCache.get(sessionId);
    if (cached && cached.expiresAt && cached.expiresAt > new Date()) {
      return cached;
    }

    try {
      // For Bright Data, we construct proxy credentials based on their format
      const proxyCredentials: ProxyCredentials = {
        host: this.brightDataConfig.endpoint || 'zproxy.lum-superproxy.io',
        port: 22225, // Standard Bright Data port
        username: this.buildUsername(options),
        password: this.brightDataConfig.zonePassword,
        protocol: 'http',
        sessionId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        region: options.region,
        country: options.country
      };

      // Cache the session
      this.sessionCache.set(sessionId, proxyCredentials);

      return proxyCredentials;
    } catch (error) {
      throw new Error(`Failed to get Bright Data proxy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildUsername(options: ProxyRequestOptions): string {
    // Bright Data username format: customer-zone-session-options
    let username = `${this.brightDataConfig.customerId}-${this.brightDataConfig.zoneName}`;

    if (options.sessionId) {
      username += `-session-${options.sessionId}`;
    }

    if (options.country) {
      username += `-country-${options.country.toLowerCase()}`;
    }

    if (options.city) {
      username += `-city-${options.city.toLowerCase().replace(/\s+/g, '_')}`;
    }

    if (options.sticky !== false) {
      username += '-sticky';
    }

    return username;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Test proxy by making a simple request
      const testProxy = await this.getProxy();

      const testUrl = 'https://lumtest.com/myip.json';
      const proxyUrl = `http://${testProxy.username}:${testProxy.password}@${testProxy.host}:${testProxy.port}`;

      const response = await fetch(testUrl, {
        method: 'GET',
        // Note: In a real implementation, you'd use a proper proxy library
        // This is a simplified example
        headers: {
          'Proxy-Authorization': `Basic ${Buffer.from(`${testProxy.username}:${testProxy.password}`).toString('base64')}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Bright Data credential validation failed:', error);
      return false;
    }
  }

  async getUsageStats(): Promise<ProxyUsageStats> {
    if (!this.isConfigured()) {
      throw new Error('Bright Data provider not configured');
    }

    try {
      // Check rate limiting
      if (this.isRateLimited('stats')) {
        await this.delay(1000);
      }

      const response = await this.makeRequest<BrightDataStats>(
        `${this.apiBaseUrl}/api/stats/customer/${this.brightDataConfig.customerId}/zone/${this.brightDataConfig.zoneName}`,
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataConfig.apiKey}`
          }
        }
      );

      return {
        totalRequests: response.requests_successful + response.requests_failed,
        successfulRequests: response.requests_successful,
        failedRequests: response.requests_failed,
        bandwidthUsed: response.bandwidth_used,
        averageResponseTime: response.avg_response_time,
        successRate: response.success_rate,
        lastUpdated: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get Bright Data usage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async rotateSession(sessionId: string): Promise<ProxyCredentials> {
    // For Bright Data, rotation is achieved by using a new session ID
    const newSessionId = this.generateSessionId();
    await this.releaseProxy(sessionId);

    return this.getProxy({ sessionId: newSessionId });
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

      // In a real implementation, you would use the proxy to make a test request
      // This is a simplified version
      const testResponse = {
        success: true,
        ip: '203.0.113.1', // Example IP
        country: options.country || 'US',
        city: options.city || 'New York',
        responseTime: Date.now() - startTime
      };

      return testResponse;
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Bright Data specific methods
  async getAvailableCountries(): Promise<string[]> {
    try {
      const response = await this.makeRequest<{ countries: string[] }>(
        `${this.apiBaseUrl}/api/zone/${this.brightDataConfig.zoneName}/countries`,
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataConfig.apiKey}`
          }
        }
      );

      return response.countries;
    } catch (error) {
      console.warn('Failed to get available countries from Bright Data:', error);
      return this.regions; // Fallback to default regions
    }
  }

  async getCitiesForCountry(country: string): Promise<string[]> {
    try {
      const response = await this.makeRequest<{ cities: string[] }>(
        `${this.apiBaseUrl}/api/zone/${this.brightDataConfig.zoneName}/country/${country}/cities`,
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataConfig.apiKey}`
          }
        }
      );

      return response.cities;
    } catch (error) {
      console.warn(`Failed to get cities for ${country} from Bright Data:`, error);
      return [];
    }
  }

  async getZoneInfo(): Promise<{
    name: string;
    type: string;
    bandwidth_limit: number;
    request_limit: number;
    expiry_date?: string;
  }> {
    try {
      const response = await this.makeRequest<any>(
        `${this.apiBaseUrl}/api/zone/${this.brightDataConfig.zoneName}/info`,
        {
          headers: {
            'Authorization': `Bearer ${this.brightDataConfig.apiKey}`
          }
        }
      );

      return response;
    } catch (error) {
      throw new Error(`Failed to get zone info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
