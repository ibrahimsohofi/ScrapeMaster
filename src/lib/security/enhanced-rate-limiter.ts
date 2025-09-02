import { Redis } from 'ioredis';
import { getEnvNumber, getEnvBoolean } from '../env-validation';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export class EnhancedRateLimiter {
  private redis?: Redis;
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor(redisClient?: Redis) {
    this.redis = redisClient;
    this.setupDefaultConfigs();
  }

  private setupDefaultConfigs() {
    // API rate limiting
    this.configs.set('api', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: getEnvNumber('RATE_LIMIT_REQUESTS_PER_MINUTE', 100) * 15,
      message: 'Too many API requests, please try again later.',
      keyGenerator: (req) => `api:${req.ip}`,
    });

    // Authentication rate limiting
    this.configs.set('auth', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per 15 minutes
      message: 'Too many authentication attempts, please try again later.',
      keyGenerator: (req) => `auth:${req.ip}`,
    });

    // Scraper creation rate limiting
    this.configs.set('scraper-create', {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 scrapers per hour
      message: 'Too many scraper creation requests, please try again later.',
      keyGenerator: (req) => `scraper:${req.user?.id || req.ip}`,
    });

    // Data export rate limiting
    this.configs.set('export', {
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 3, // 3 exports per 10 minutes
      message: 'Too many export requests, please try again later.',
      keyGenerator: (req) => `export:${req.user?.id || req.ip}`,
    });

    // Password reset rate limiting
    this.configs.set('password-reset', {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 password reset attempts per hour
      message: 'Too many password reset requests, please try again later.',
      keyGenerator: (req) => `reset:${req.body?.email || req.ip}`,
    });
  }

  /**
   * Check if request should be rate limited
   */
  async checkRateLimit(
    type: string,
    req: any,
    customConfig?: Partial<RateLimitConfig>
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const config = { ...this.configs.get(type), ...customConfig };

    if (!config) {
      throw new Error(`Rate limit configuration not found for type: ${type}`);
    }

    const key = config.keyGenerator?.(req) || `${type}:${req.ip}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (this.redis) {
      return this.checkRateLimitRedis(key, config, now, windowStart);
    } else {
      return this.checkRateLimitMemory(key, config, now, windowStart);
    }
  }

  /**
   * Redis-based rate limiting (distributed)
   */
  private async checkRateLimitRedis(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    if (!this.redis) {
      throw new Error('Redis client not available');
    }

    const multi = this.redis.multi();

    // Remove old entries
    multi.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    multi.zcard(key);

    // Add current request
    multi.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiration
    multi.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await multi.exec();

    if (!results) {
      throw new Error('Redis rate limit check failed');
    }

    const currentCount = (results[1][1] as number) || 0;
    const allowed = currentCount < config.max;

    // If not allowed, remove the request we just added
    if (!allowed) {
      await this.redis.zremrangebyrank(key, -1, -1);
    }

    const resetTime = new Date(now + config.windowMs);

    return {
      allowed,
      info: {
        limit: config.max,
        remaining: Math.max(0, config.max - currentCount - (allowed ? 1 : 0)),
        reset: resetTime,
        retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000),
      },
    };
  }

  /**
   * Memory-based rate limiting (single instance)
   */
  private memoryStore: Map<string, Array<{ timestamp: number; id: string }>> = new Map();

  private async checkRateLimitMemory(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    let requests = this.memoryStore.get(key) || [];

    // Remove old requests
    requests = requests.filter(req => req.timestamp > windowStart);

    const allowed = requests.length < config.max;

    if (allowed) {
      requests.push({ timestamp: now, id: `${now}-${Math.random()}` });
    }

    this.memoryStore.set(key, requests);

    const resetTime = new Date(now + config.windowMs);

    return {
      allowed,
      info: {
        limit: config.max,
        remaining: Math.max(0, config.max - requests.length),
        reset: resetTime,
        retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000),
      },
    };
  }

  /**
   * Middleware factory for Express/Next.js
   */
  createMiddleware(type: string, customConfig?: Partial<RateLimitConfig>) {
    return async (req: any, res: any, next: any) => {
      try {
        const { allowed, info } = await this.checkRateLimit(type, req, customConfig);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', info.limit);
        res.setHeader('X-RateLimit-Remaining', info.remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil(info.reset.getTime() / 1000));

        if (!allowed) {
          const config = { ...this.configs.get(type), ...customConfig };

          if (info.retryAfter) {
            res.setHeader('Retry-After', info.retryAfter);
          }

          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: config?.message || 'Too many requests',
            retryAfter: info.retryAfter,
            limit: info.limit,
            reset: info.reset,
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        // In case of error, allow the request to continue
        next();
      }
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetRateLimit(type: string, req: any): Promise<void> {
    const config = this.configs.get(type);
    if (!config) return;

    const key = config.keyGenerator?.(req) || `${type}:${req.ip}`;

    if (this.redis) {
      await this.redis.del(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(type: string, req: any): Promise<RateLimitInfo | null> {
    const config = this.configs.get(type);
    if (!config) return null;

    const key = config.keyGenerator?.(req) || `${type}:${req.ip}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (this.redis) {
      const count = await this.redis.zcount(key, windowStart, now);
      return {
        limit: config.max,
        remaining: Math.max(0, config.max - count),
        reset: new Date(now + config.windowMs),
      };
    } else {
      const requests = this.memoryStore.get(key) || [];
      const validRequests = requests.filter(req => req.timestamp > windowStart);
      return {
        limit: config.max,
        remaining: Math.max(0, config.max - validRequests.length),
        reset: new Date(now + config.windowMs),
      };
    }
  }

  /**
   * Configure rate limit for a specific type
   */
  setConfig(type: string, config: RateLimitConfig): void {
    this.configs.set(type, config);
  }

  /**
   * Get all configured rate limit types
   */
  getConfiguredTypes(): string[] {
    return Array.from(this.configs.keys());
  }
}

// Singleton instance
let rateLimiterInstance: EnhancedRateLimiter | null = null;

export function getRateLimiter(redisClient?: Redis): EnhancedRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new EnhancedRateLimiter(redisClient);
  }
  return rateLimiterInstance;
}

// Utility function for API routes
export function withRateLimit(
  type: string,
  customConfig?: Partial<RateLimitConfig>
) {
  return (handler: any) => {
    return async (req: any, res: any) => {
      const rateLimiter = getRateLimiter();
      const middleware = rateLimiter.createMiddleware(type, customConfig);

      return new Promise((resolve, reject) => {
        middleware(req, res, (error: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(handler(req, res));
          }
        });
      });
    };
  };
}

export default EnhancedRateLimiter;
