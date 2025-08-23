import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Prisma Client before importing anything that uses it
const mockPrisma = {
  $queryRaw: vi.fn(),
  $disconnect: vi.fn(),
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

// Dynamic import function to get the route handler
async function getRouteHandler() {
  const module = await import('@/app/api/health/route');
  return module.GET;
}

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.REDIS_URL;
    delete process.env.MEMORY_LIMIT;
  });

  it('should return healthy status when all checks pass', async () => {
    // Mock successful database query
    mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
    mockPrisma.$disconnect.mockResolvedValue(undefined);

    const GET = await getRouteHandler();
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('checks');
    expect(data).toHaveProperty('services');

    // Check database status
    expect(data.checks.database.status).toBe('pass');
    expect(data.checks.database).toHaveProperty('responseTime');

    // Check memory and disk status
    expect(data.checks.memory.status).toMatch(/pass|warn/);
    expect(data.checks.disk.status).toMatch(/pass|warn/);

    // Check services
    expect(Array.isArray(data.services)).toBe(true);
    expect(data.services.length).toBeGreaterThan(0);

    // Verify Prisma cleanup
    expect(mockPrisma.$disconnect).toHaveBeenCalled();
  });

  it('should return unhealthy status when database fails', async () => {
    // Mock database failure
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));
    mockPrisma.$disconnect.mockResolvedValue(undefined);

    const GET = await getRouteHandler();
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);

    expect(response.status).toBe(503);

    const data = await response.json();
    expect(data.status).toBe('unhealthy');
    expect(data.checks.database.status).toBe('fail');
    expect(data.checks.database.error).toContain('Database connection failed');
  });

  it('should include Redis check when REDIS_URL is configured', async () => {
    // Mock Redis configuration
    process.env.REDIS_URL = 'redis://localhost:6379';

    mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
    mockPrisma.$disconnect.mockResolvedValue(undefined);

    const GET = await getRouteHandler();
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);

    const data = await response.json();
    expect(data.checks).toHaveProperty('redis');
    expect(data.checks.redis.status).toBe('pass');
  });

  it('should include correct headers in response', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
    mockPrisma.$disconnect.mockResolvedValue(undefined);

    const GET = await getRouteHandler();
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toBe('no-store, must-revalidate');
    expect(response.headers.get('X-Health-Check')).toBe('true');
    expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/);
  });

  it('should handle memory limit configuration', async () => {
    process.env.MEMORY_LIMIT = '1024'; // 1GB

    mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
    mockPrisma.$disconnect.mockResolvedValue(undefined);

    const GET = await getRouteHandler();
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);

    const data = await response.json();
    expect(data.checks.memory).toHaveProperty('usage');
    expect(data.checks.memory).toHaveProperty('limit');
    expect(typeof data.checks.memory.usage).toBe('number');
    expect(typeof data.checks.memory.limit).toBe('number');
  });

  it('should handle unexpected errors gracefully', async () => {
    // Mock an unexpected error during health check
    mockPrisma.$queryRaw.mockImplementation(() => {
      throw new Error('Unexpected error');
    });
    mockPrisma.$disconnect.mockResolvedValue(undefined);

    const GET = await getRouteHandler();
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);

    expect(response.status).toBe(503);

    const data = await response.json();
    expect(data.status).toBe('unhealthy');
    expect(data.checks.database.status).toBe('fail');
    expect(data.checks.database.error).toBe('Health check failed');
  });

  it('should validate response structure', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
    mockPrisma.$disconnect.mockResolvedValue(undefined);

    const GET = await getRouteHandler();
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);

    const data = await response.json();

    // Validate required fields
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('checks');
    expect(data).toHaveProperty('services');

    // Validate checks structure
    expect(data.checks).toHaveProperty('database');
    expect(data.checks).toHaveProperty('memory');
    expect(data.checks).toHaveProperty('disk');

    // Validate services structure
    expect(Array.isArray(data.services)).toBe(true);
    data.services.forEach((service: any) => {
      expect(service).toHaveProperty('name');
      expect(service).toHaveProperty('status');
      expect(['operational', 'degraded', 'down']).toContain(service.status);
    });
  });
});
