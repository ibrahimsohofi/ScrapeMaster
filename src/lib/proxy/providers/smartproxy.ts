import { BaseProxyProvider, ProxyProviderConfig, type ProxyRequestOptions, type ProxyCredentials, type ProxyUsageStats } from './base';
import axios from 'axios';

export interface SmartProxyConfig {
  username: string;
  password: string;
  endpoint?: string;
  stickySession?: boolean;
  sessionDuration?: number;
}

export class SmartProxyProvider extends BaseProxyProvider {
  readonly name = 'SmartProxy';
  readonly type: 'residential' | 'datacenter' | 'mobile' = 'residential';
  readonly regions: string[] = ['US', 'EU', 'ASIA'];

  private smartProxyConfig: SmartProxyConfig;
  private sessionId?: string;
  private isConnected = false;
  private lastHealthCheck?: Date;
  private stats = {
    totalRequests: 0,
    successRate: 0,
    avgResponseTime: 0,
    lastUsed: new Date()
  };

  constructor(config: SmartProxyConfig) {
    super({
      username: config.username,
      password: config.password,
      endpoint: config.endpoint || 'http://gate.smartproxy.com:7000',
      timeout: 30000,
      rateLimitPerSecond: 10
    });

    this.smartProxyConfig = config;
  }

  async connect(): Promise<boolean> {
    try {
      // Test connection with SmartProxy
      const testResponse = await axios.get('http://ip-api.com/json', {
        proxy: {
          host: 'gate.smartproxy.com',
          port: 7000,
          auth: {
            username: this.config.username || '',
            password: this.config.password || ''
          }
        },
        timeout: 10000
      });

      if (testResponse.status === 200) {
        this.isConnected = true;
        this.lastHealthCheck = new Date();
        return true;
      }
      return false;
    } catch (error) {
      console.error('SmartProxy connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  isConfigured(): boolean {
    return !!(this.smartProxyConfig.username && this.smartProxyConfig.password);
  }

  async getProxy(options?: ProxyRequestOptions): Promise<ProxyCredentials> {
    // Generate session ID for sticky sessions if enabled
    if (this.smartProxyConfig.stickySession && !this.sessionId) {
      this.sessionId = this.generateSessionId();
    }

    const sessionParam = this.sessionId ? `-session-${this.sessionId}` : '';

    return {
      host: 'gate.smartproxy.com',
      port: 7000,
      username: `${this.smartProxyConfig.username}${sessionParam}`,
      password: this.smartProxyConfig.password,
      protocol: 'http',
      sessionId: this.sessionId || this.generateSessionId(),
      region: options?.region || 'US'
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const proxy = await this.getProxy();
      const testResponse = await axios.get('http://ip-api.com/json', {
        proxy: {
          host: proxy.host,
          port: proxy.port,
          auth: {
            username: proxy.username || '',
            password: proxy.password || ''
          }
        },
        timeout: 10000
      });

      return testResponse.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getUsageStats(): Promise<ProxyUsageStats> {
    return {
      totalRequests: this.stats.totalRequests,
      successfulRequests: Math.floor(this.stats.totalRequests * (this.stats.successRate / 100)),
      failedRequests: Math.floor(this.stats.totalRequests * (1 - this.stats.successRate / 100)),
      bandwidthUsed: 0, // SmartProxy doesn't provide this data
      averageResponseTime: this.stats.avgResponseTime,
      successRate: this.stats.successRate,
      lastUpdated: this.stats.lastUsed
    };
  }



  async executeRequest(url: string, options: any = {}): Promise<any> {
    const startTime = Date.now();

    try {
      const proxy = await this.getProxy();
      this.stats.totalRequests++;

      const response = await axios({
        ...options,
        url,
        proxy: {
          host: proxy.host,
          port: proxy.port,
          auth: {
            username: proxy.username || '',
            password: proxy.password || ''
          }
        },
        timeout: options.timeout || 30000
      });

      const responseTime = Date.now() - startTime;
      this.stats.avgResponseTime = (this.stats.avgResponseTime + responseTime) / 2;
      this.stats.lastUsed = new Date();

      return {
        success: true,
        data: response.data,
        headers: response.headers,
        statusCode: response.status,
        responseTime,
        proxyUsed: `${proxy.host}:${proxy.port}`
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        responseTime,
        statusCode: error.response?.status || 0
      };
    }
  }

  async rotateIP(): Promise<boolean> {
    // Clear current session to force new IP
    this.sessionId = undefined;
    return true;
  }

  async getProviderStats() {
    return {
      provider: this.name,
      totalRequests: this.stats.totalRequests,
      successRate: this.stats.successRate,
      avgResponseTime: this.stats.avgResponseTime,
      lastUsed: this.stats.lastUsed,
      sessionId: this.sessionId,
      stickySessionEnabled: this.smartProxyConfig.stickySession
    };
  }
}
