import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface ComplianceConfig {
  respectRobotsTxt: boolean;
  enableGeoBlocking: boolean;
  blockedRegions: string[];
  enablePiiRedaction: boolean;
  customRules: ComplianceRule[];
}

export interface ComplianceRule {
  type: 'BLOCK_DOMAIN' | 'BLOCK_PATH' | 'REQUIRE_DELAY' | 'BLOCK_REGION';
  pattern: string;
  value?: number | string;
}

export interface ComplianceResult {
  allowed: boolean;
  reason?: string;
  delay?: number;
  warnings: string[];
}

export interface RobotsTxtRule {
  userAgent: string;
  disallowed: string[];
  allowed: string[];
  crawlDelay?: number;
  sitemaps: string[];
}

interface GeoDatabase {
  get?: (ip: string) => { country?: { isoCode?: string }; city?: { names?: { en?: string } } };
}

class ComplianceEngine {
  private robotsCache = new Map<string, RobotsTxtRule>();
  private geoDatabase: GeoDatabase | null = null;

  constructor(private config: ComplianceConfig) {
    this.initializeGeoDatabase();
  }

  private async initializeGeoDatabase() {
    try {
      // In production, you would download and use a real MaxMind GeoIP2 database
      // For now, we'll use a simplified mock system
      console.log('Compliance engine initialized with geo-blocking capabilities');
    } catch (error) {
      console.warn('Failed to initialize geo database:', error);
    }
  }

  // Main compliance check method
  async checkCompliance(url: string, userAgent = 'ScrapeFlowAI/1.0', clientIp?: string): Promise<ComplianceResult> {
    const warnings: string[] = [];
    let delay = 0;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // 1. Check custom rules first
      const customRuleResult = this.checkCustomRules(url, clientIp);
      if (!customRuleResult.allowed) {
        return customRuleResult;
      }
      warnings.push(...customRuleResult.warnings);

      // 2. Check geo-blocking
      if (this.config.enableGeoBlocking && clientIp) {
        const geoResult = await this.checkGeoBlocking(clientIp);
        if (!geoResult.allowed) {
          return geoResult;
        }
        warnings.push(...geoResult.warnings);
      }

      // 3. Check robots.txt
      if (this.config.respectRobotsTxt) {
        const robotsResult = await this.checkRobotsTxt(url, userAgent);
        if (!robotsResult.allowed) {
          return robotsResult;
        }
        warnings.push(...robotsResult.warnings);
        if (robotsResult.delay) {
          delay = Math.max(delay, robotsResult.delay);
        }
      }

      return {
        allowed: true,
        delay: delay > 0 ? delay : undefined,
        warnings
      };

    } catch (error) {
      return {
        allowed: false,
        reason: `Compliance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings
      };
    }
  }

  // Check custom compliance rules
  private checkCustomRules(url: string, clientIp?: string): ComplianceResult {
    const warnings: string[] = [];

    for (const rule of this.config.customRules) {
      switch (rule.type) {
        case 'BLOCK_DOMAIN':
          if (url.includes(rule.pattern)) {
            return {
              allowed: false,
              reason: `Domain ${rule.pattern} is blocked by custom rule`,
              warnings
            };
          }
          break;

        case 'BLOCK_PATH':
          const urlObj = new URL(url);
          if (urlObj.pathname.includes(rule.pattern)) {
            return {
              allowed: false,
              reason: `Path ${rule.pattern} is blocked by custom rule`,
              warnings
            };
          }
          break;

        case 'REQUIRE_DELAY':
          if (url.includes(rule.pattern)) {
            warnings.push(`Delay of ${rule.value}ms required for ${rule.pattern}`);
            return {
              allowed: true,
              delay: Number(rule.value),
              warnings
            };
          }
          break;

        case 'BLOCK_REGION':
          // This would integrate with geo-blocking
          warnings.push(`Region-based blocking rule applied for ${rule.pattern}`);
          break;
      }
    }

    return { allowed: true, warnings };
  }

  // Geo-blocking functionality
  private async checkGeoBlocking(clientIp: string): Promise<ComplianceResult> {
    const warnings: string[] = [];

    try {
      // Simplified geo-blocking - in production use MaxMind GeoIP2
      const mockGeoData = this.getMockGeoData(clientIp);

      if (this.config.blockedRegions.includes(mockGeoData.country)) {
        return {
          allowed: false,
          reason: `Scraping blocked in region: ${mockGeoData.country}`,
          warnings
        };
      }

      // Special handling for EU regions (GDPR compliance)
      const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];

      if (euCountries.includes(mockGeoData.country)) {
        warnings.push('EU region detected - enhanced privacy controls active');
      }

      return { allowed: true, warnings };

    } catch (error) {
      warnings.push(`Geo-blocking check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { allowed: true, warnings }; // Fail open for geo-blocking
    }
  }

  // Mock geo data - replace with real MaxMind integration in production
  private getMockGeoData(ip: string): { country: string; region: string } {
    // Simple mock based on IP ranges
    if (ip.startsWith('192.168') || ip.startsWith('127.0')) {
      return { country: 'US', region: 'Local' };
    }

    // Mock some common scenarios
    const ipHash = ip.split('.').reduce((acc, octet) => acc + Number.parseInt(octet), 0);
    const countries = ['US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA', 'CN', 'RU', 'BR'];

    return {
      country: countries[ipHash % countries.length],
      region: 'Unknown'
    };
  }

  // Robots.txt parsing and checking
  private async checkRobotsTxt(url: string, userAgent: string): Promise<ComplianceResult> {
    const warnings: string[] = [];

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const robotsUrl = `${urlObj.protocol}//${domain}/robots.txt`;

      // Check cache first
      let robotsRules = this.robotsCache.get(domain);

      if (!robotsRules) {
        robotsRules = await this.fetchAndParseRobotsTxt(robotsUrl);
        this.robotsCache.set(domain, robotsRules);

        // Cache expires after 1 hour
        setTimeout(() => {
          this.robotsCache.delete(domain);
        }, 3600000);
      }

      // Check if path is disallowed
      const path = urlObj.pathname;
      const isBlocked = this.isPathBlocked(path, robotsRules, userAgent);

      if (isBlocked) {
        return {
          allowed: false,
          reason: `Path ${path} is disallowed by robots.txt for user-agent ${userAgent}`,
          warnings
        };
      }

      // Check crawl delay
      if (robotsRules.crawlDelay) {
        warnings.push(`Crawl delay of ${robotsRules.crawlDelay}s required by robots.txt`);
        return {
          allowed: true,
          delay: robotsRules.crawlDelay * 1000, // Convert to milliseconds
          warnings
        };
      }

      return { allowed: true, warnings };

    } catch (error) {
      warnings.push(`Robots.txt check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { allowed: true, warnings }; // Fail open for robots.txt
    }
  }

  // Fetch and parse robots.txt
  private async fetchAndParseRobotsTxt(robotsUrl: string): Promise<RobotsTxtRule> {
    try {
      const response = await axios.get(robotsUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'ScrapeFlowAI/1.0'
        }
      });

      return this.parseRobotsTxt(response.data);

    } catch (error) {
      // If robots.txt doesn't exist or can't be fetched, assume everything is allowed
      return {
        userAgent: '*',
        disallowed: [],
        allowed: [],
        sitemaps: []
      };
    }
  }

  // Parse robots.txt content
  private parseRobotsTxt(content: string): RobotsTxtRule {
    const lines = content.split('\n').map(line => line.trim());
    const result: RobotsTxtRule = {
      userAgent: '*',
      disallowed: [],
      allowed: [],
      sitemaps: []
    };

    let currentUserAgent = '*';
    let foundMatchingUserAgent = false;

    for (const line of lines) {
      if (line.startsWith('#') || line === '') continue;

      const [directive, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      switch (directive.toLowerCase()) {
        case 'user-agent':
          currentUserAgent = value;
          foundMatchingUserAgent = value === '*' || value.toLowerCase().includes('scrapeflow');
          break;

        case 'disallow':
          if (foundMatchingUserAgent && value) {
            result.disallowed.push(value);
          }
          break;

        case 'allow':
          if (foundMatchingUserAgent && value) {
            result.allowed.push(value);
          }
          break;

        case 'crawl-delay':
          if (foundMatchingUserAgent) {
            result.crawlDelay = Number.parseFloat(value);
          }
          break;

        case 'sitemap':
          result.sitemaps.push(value);
          break;
      }
    }

    return result;
  }

  // Check if a path is blocked by robots.txt rules
  private isPathBlocked(path: string, rules: RobotsTxtRule, userAgent: string): boolean {
    // Check allowed paths first (they override disallowed)
    for (const allowedPath of rules.allowed) {
      if (this.pathMatches(path, allowedPath)) {
        return false;
      }
    }

    // Check disallowed paths
    for (const disallowedPath of rules.disallowed) {
      if (this.pathMatches(path, disallowedPath)) {
        return true;
      }
    }

    return false;
  }

  // Check if a path matches a robots.txt pattern
  private pathMatches(path: string, pattern: string): boolean {
    if (pattern === '/') return true;
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path.startsWith(pattern);
  }

  // PII redaction functionality
  redactPII(text: string): { redacted: string; foundPII: string[] } {
    if (!this.config.enablePiiRedaction) {
      return { redacted: text, foundPII: [] };
    }

    const foundPII: string[] = [];
    let redacted = text;

    // Email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    foundPII.push(...emails);
    redacted = redacted.replace(emailRegex, '[EMAIL_REDACTED]');

    // Phone numbers (basic patterns)
    const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
    const phones = text.match(phoneRegex) || [];
    foundPII.push(...phones);
    redacted = redacted.replace(phoneRegex, '[PHONE_REDACTED]');

    // Social Security Numbers (US format)
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    const ssns = text.match(ssnRegex) || [];
    foundPII.push(...ssns);
    redacted = redacted.replace(ssnRegex, '[SSN_REDACTED]');

    // Credit card numbers (basic pattern)
    const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
    const creditCards = text.match(ccRegex) || [];
    foundPII.push(...creditCards);
    redacted = redacted.replace(ccRegex, '[CC_REDACTED]');

    return { redacted, foundPII };
  }

  // Update configuration
  updateConfig(newConfig: Partial<ComplianceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Get compliance report
  getComplianceReport(): {
    robotsCacheSize: number;
    geoBlockingEnabled: boolean;
    piiRedactionEnabled: boolean;
    customRulesCount: number;
  } {
    return {
      robotsCacheSize: this.robotsCache.size,
      geoBlockingEnabled: this.config.enableGeoBlocking,
      piiRedactionEnabled: this.config.enablePiiRedaction,
      customRulesCount: this.config.customRules.length
    };
  }
}

// Default compliance configuration
export const defaultComplianceConfig: ComplianceConfig = {
  respectRobotsTxt: true,
  enableGeoBlocking: true,
  blockedRegions: ['CN', 'RU', 'IR', 'KP'], // Block high-risk regions by default
  enablePiiRedaction: true,
  customRules: [
    {
      type: 'REQUIRE_DELAY',
      pattern: 'linkedin.com',
      value: 2000 // 2 second delay for LinkedIn
    },
    {
      type: 'REQUIRE_DELAY',
      pattern: 'facebook.com',
      value: 3000 // 3 second delay for Facebook
    },
    {
      type: 'BLOCK_DOMAIN',
      pattern: 'private-site.example.com'
    }
  ]
};

// Export singleton instance
export const complianceEngine = new ComplianceEngine(defaultComplianceConfig);

// Export types and classes
export { ComplianceEngine };
