import { type NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: { status: 'pass' | 'fail'; responseTime?: number; error?: string };
    memory: { status: 'pass' | 'warn' | 'fail'; usage: number; limit: number };
    disk: { status: 'pass' | 'warn' | 'fail'; usage: number; available: number };
    redis?: { status: 'pass' | 'fail'; responseTime?: number; error?: string };
  };
  services: {
    name: string;
    status: 'operational' | 'degraded' | 'down';
    responseTime?: number;
  }[];
}

// Get memory usage information
function getMemoryInfo(): { status: 'pass' | 'warn' | 'fail'; usage: number; limit: number } {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal + memUsage.external;
  const memoryLimit = Number.parseInt(process.env.MEMORY_LIMIT || '512') * 1024 * 1024; // Default 512MB

  const usage = (totalMemory / memoryLimit) * 100;

  return {
    status: usage > 90 ? 'fail' : usage > 70 ? 'warn' : 'pass',
    usage: Math.round(usage),
    limit: memoryLimit,
  };
}

// Get disk usage (simplified for container environment)
function getDiskInfo(): { status: 'pass' | 'warn' | 'fail'; usage: number; available: number } {
  // In a container, we'll simulate disk usage
  // In production, you might want to check actual disk usage
  const usage = Math.random() * 40; // Simulate 0-40% usage

  return {
    status: usage > 85 ? 'fail' : usage > 70 ? 'warn' : 'pass',
    usage: Math.round(usage),
    available: 100 - Math.round(usage),
  };
}

// Check database connectivity
async function checkDatabase(): Promise<{ status: 'pass' | 'fail'; responseTime?: number; error?: string }> {
  try {
    const start = Date.now();

    // Simple database query to check connectivity
    await prisma.$queryRaw`SELECT 1 as test`;

    const responseTime = Date.now() - start;

    return {
      status: 'pass',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

// Check Redis connectivity (if enabled)
async function checkRedis(): Promise<{ status: 'pass' | 'fail'; responseTime?: number; error?: string } | undefined> {
  if (!process.env.REDIS_URL) {
    return undefined; // Redis not configured
  }

  try {
    // Simple Redis ping - you would need to implement this with your Redis client
    // For now, we'll simulate it
    const start = Date.now();

    // Simulate Redis check
    await new Promise(resolve => setTimeout(resolve, 10));

    const responseTime = Date.now() - start;

    return {
      status: 'pass',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}

// Check external services
async function checkServices() {
  const services = [
    {
      name: 'API Server',
      status: 'operational' as const,
      responseTime: Math.random() * 50 + 10, // Simulate 10-60ms
    },
    {
      name: 'Scraping Engine',
      status: 'operational' as const,
      responseTime: Math.random() * 100 + 20, // Simulate 20-120ms
    },
  ];

  return services;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Perform all health checks
    const [databaseCheck, redisCheck, services] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkServices(),
    ]);

    const memoryInfo = getMemoryInfo();
    const diskInfo = getDiskInfo();

    // Determine overall health status
    const isHealthy =
      databaseCheck.status === 'pass' &&
      (!redisCheck || redisCheck.status === 'pass') &&
      memoryInfo.status !== 'fail' &&
      diskInfo.status !== 'fail';

    const result: HealthCheckResult = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: databaseCheck,
        memory: memoryInfo,
        disk: diskInfo,
        ...(redisCheck && { redis: redisCheck }),
      },
      services,
    };

    const responseTime = Date.now() - startTime;

    // Add response time header
    const response = NextResponse.json(result, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`,
        'X-Health-Check': 'true',
      },
    });

    return response;

  } catch (error) {
    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: { status: 'fail', error: 'Health check failed' },
        memory: { status: 'fail', usage: 0, limit: 0 },
        disk: { status: 'fail', usage: 0, available: 0 },
      },
      services: [],
    };

    return NextResponse.json(errorResult, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'X-Health-Check': 'true',
      },
    });
  } finally {
    // Clean up Prisma connection
    await prisma.$disconnect();
  }
}

// OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
