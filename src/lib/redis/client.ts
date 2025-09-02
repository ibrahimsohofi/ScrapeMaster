import Redis from 'ioredis';

// Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number.parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number.parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  // Connection timeouts
  connectTimeout: 10000,
  commandTimeout: 5000,
  // Retry configuration
  retryDelayOnClusterDown: 300,
  retryDelayOnClusterFail: 100,
};

// Create Redis client instance
let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  // Skip Redis in test environment or if Redis URL is not provided
  if (process.env.NODE_ENV === 'test' || !process.env.REDIS_URL) {
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL!, redisConfig);

      redis.on('connect', () => {
        console.log('✅ Connected to Redis');
      });

      redis.on('error', (error) => {
        console.error('❌ Redis connection error:', error);
      });

      redis.on('reconnecting', () => {
        console.log('🔄 Reconnecting to Redis...');
      });

    } catch (error) {
      console.error('❌ Failed to create Redis client:', error);
      return null;
    }
  }

  return redis;
}

// Cache utilities
export class CacheManager {
  private redis: Redis | null;

  constructor() {
    this.redis = getRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.redis || keys.length === 0) return [];

    try {
      const values = await this.redis.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return [];
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const serializedPairs: string[] = [];
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs.push(key, JSON.stringify(value));
      }

      await this.redis.mset(...serializedPairs);

      if (ttlSeconds) {
        // Set TTL for each key
        const pipeline = this.redis.pipeline();
        Object.keys(keyValuePairs).forEach(key => {
          pipeline.expire(key, ttlSeconds);
        });
        await pipeline.exec();
      }

      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  async incr(key: string): Promise<number | null> {
    if (!this.redis) return null;

    try {
      return await this.redis.incr(key);
    } catch (error) {
      console.error('Cache incr error:', error);
      return null;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.redis) return false;

    try {
      await this.redis.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.redis) return [];

    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }

  async flushdb(): Promise<boolean> {
    if (!this.redis) return false;

    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      console.error('Cache flushdb error:', error);
      return false;
    }
  }
}

// Create singleton cache manager instance
export const cache = new CacheManager();

// Rate limiting utilities
export class RateLimiter {
  private redis: Redis | null;

  constructor() {
    this.redis = getRedisClient();
  }

  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    if (!this.redis) {
      // Fallback to allowing all requests if Redis is not available
      return { allowed: true, remaining: limit - 1, resetTime: Date.now() + windowSeconds * 1000 };
    }

    try {
      const pipeline = this.redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, windowSeconds);

      const results = await pipeline.exec();
      const count = results?.[0]?.[1] as number || 0;

      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);
      const resetTime = Date.now() + windowSeconds * 1000;

      return { allowed, remaining, resetTime };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fallback to allowing the request
      return { allowed: true, remaining: limit - 1, resetTime: Date.now() + windowSeconds * 1000 };
    }
  }

  async getRemainingRequests(key: string, limit: number): Promise<number> {
    if (!this.redis) return limit;

    try {
      const count = await this.redis.get(key);
      const used = count ? Number.parseInt(count) : 0;
      return Math.max(0, limit - used);
    } catch (error) {
      console.error('Get remaining requests error:', error);
      return limit;
    }
  }
}

// Create singleton rate limiter instance
export const rateLimiter = new RateLimiter();

// Distributed locks
export class DistributedLock {
  private redis: Redis | null;

  constructor() {
    this.redis = getRedisClient();
  }

  async acquireLock(
    key: string,
    ttlSeconds = 60,
    identifier: string = Math.random().toString(36)
  ): Promise<string | null> {
    if (!this.redis) return null;

    try {
      const result = await this.redis.set(
        `lock:${key}`,
        identifier,
        'EX',
        ttlSeconds,
        'NX'
      );
      return result === 'OK' ? identifier : null;
    } catch (error) {
      console.error('Acquire lock error:', error);
      return null;
    }
  }

  async releaseLock(key: string, identifier: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redis.eval(script, 1, `lock:${key}`, identifier);
      return result === 1;
    } catch (error) {
      console.error('Release lock error:', error);
      return false;
    }
  }

  async extendLock(key: string, identifier: string, ttlSeconds: number): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("expire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;

      const result = await this.redis.eval(script, 1, `lock:${key}`, identifier, ttlSeconds);
      return result === 1;
    } catch (error) {
      console.error('Extend lock error:', error);
      return false;
    }
  }
}

// Create singleton distributed lock instance
export const distributedLock = new DistributedLock();

// Session management
export class SessionManager {
  private redis: Redis | null;
  private defaultTTL: number = 24 * 60 * 60; // 24 hours

  constructor() {
    this.redis = getRedisClient();
  }

  async createSession(sessionId: string, userId: string, data?: any): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const sessionData = {
        userId,
        createdAt: Date.now(),
        ...data
      };

      await this.redis.setex(
        `session:${sessionId}`,
        this.defaultTTL,
        JSON.stringify(sessionData)
      );
      return true;
    } catch (error) {
      console.error('Create session error:', error);
      return false;
    }
  }

  async getSession(sessionId: string): Promise<any | null> {
    if (!this.redis) return null;

    try {
      const data = await this.redis.get(`session:${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  async updateSession(sessionId: string, data: any): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const existing = await this.getSession(sessionId);
      if (!existing) return false;

      const updatedData = { ...existing, ...data };
      await this.redis.setex(
        `session:${sessionId}`,
        this.defaultTTL,
        JSON.stringify(updatedData)
      );
      return true;
    } catch (error) {
      console.error('Update session error:', error);
      return false;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      await this.redis.del(`session:${sessionId}`);
      return true;
    } catch (error) {
      console.error('Delete session error:', error);
      return false;
    }
  }

  async extendSession(sessionId: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.redis) return false;

    try {
      await this.redis.expire(`session:${sessionId}`, ttlSeconds || this.defaultTTL);
      return true;
    } catch (error) {
      console.error('Extend session error:', error);
      return false;
    }
  }
}

// Create singleton session manager instance
export const sessionManager = new SessionManager();

export default redis;
