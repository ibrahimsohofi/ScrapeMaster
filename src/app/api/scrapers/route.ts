import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { handleError, createErrorResponse, ApplicationError } from '@/lib/error-handler';

// Validation schema for creating scrapers
const createScraperSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  url: z.string().url('Invalid URL format'),
  description: z.string().optional(),
  engine: z.enum(['PLAYWRIGHT', 'HTTRACK']).default('PLAYWRIGHT'),
  selectors: z.record(z.string()).optional().default({}),
  settings: z.object({
    userAgent: z.string().optional(),
    delay: z.number().min(0).max(60000).optional().default(1000),
    timeout: z.number().min(1000).max(300000).optional().default(30000),
    retries: z.number().min(0).max(10).optional().default(3),
    respectRobots: z.boolean().optional().default(true),
    followRedirects: z.boolean().optional().default(true),
    javascript: z.boolean().optional().default(true),
    cookies: z.boolean().optional().default(true),
  }).optional().default({}),
  schedule: z.object({
    type: z.enum(['manual', 'interval', 'cron']).default('manual'),
    interval: z.number().optional(),
    cronExpression: z.string().optional(),
    timezone: z.string().default('UTC'),
  }).optional().default({ type: 'manual', timezone: 'UTC' }),
  outputFormat: z.enum(['JSON', 'CSV', 'EXCEL']).optional().default('JSON'),
  isActive: z.boolean().optional().default(true),
});

// GET - List all scrapers for the authenticated user's organization
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApplicationError('AUTHENTICATION_ERROR', 'No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      throw new ApplicationError('AUTHENTICATION_ERROR', 'Invalid token');
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true },
    });

    if (!user || !user.isActive) {
      throw new ApplicationError('AUTHENTICATION_ERROR', 'User not found or inactive');
    }

  const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizationId: user.organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get scrapers with pagination
    const [scrapers, totalCount] = await Promise.all([
      prisma.scraper.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          jobs: {
            orderBy: { lastRunAt: 'desc' },
            take: 1,
          },
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              jobs: true,
              executions: true,
            },
          },
        },
      }),
      prisma.scraper.count({ where }),
    ]);

    // Format response
    const formattedScrapers = scrapers.map(scraper => ({
      id: scraper.id,
      name: scraper.name,
      url: scraper.url,
      description: scraper.description,
      status: scraper.status,
      engine: scraper.engine,
      createdAt: scraper.createdAt,
      updatedAt: scraper.updatedAt,
      lastRunAt: scraper.lastRunAt,
      lastSuccessAt: scraper.executions[0]?.status === 'COMPLETED' ? scraper.executions[0].completedAt : null,
      lastFailureAt: scraper.executions[0]?.status === 'FAILED' ? scraper.executions[0].completedAt : null,
      dataPointsCount: scraper.executions[0]?.dataPointsCount || 0,
      schedule: scraper.schedule,
      outputFormat: scraper.outputFormat,
      isActive: scraper.isActive,
      executionCount: scraper._count.executions,
      lastExecution: scraper.executions[0] ? {
        id: scraper.executions[0].id,
        status: scraper.executions[0].status,
        startedAt: scraper.executions[0].startedAt,
        completedAt: scraper.executions[0].completedAt,
        duration: scraper.executions[0].duration,
        dataPointsCount: scraper.executions[0].dataPointsCount,
        errorMessage: scraper.executions[0].errorMessage,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedScrapers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    const appError = handleError(error);
    return createErrorResponse(appError);
  }
}

// POST - Create a new scraper
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApplicationError('AUTHENTICATION_ERROR', 'No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      throw new ApplicationError('AUTHENTICATION_ERROR', 'Invalid token');
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true },
    });

    if (!user || !user.isActive) {
      throw new ApplicationError('AUTHENTICATION_ERROR', 'User not found or inactive');
    }

  const body = await request.json();

  // Validate request body using Zod - errors will be caught by our error handler
  const data = createScraperSchema.parse(body);

  try {
    // Check if scraper with same name already exists for this organization
    const existingScraper = await prisma.job.findFirst({
      where: {
        organizationId: user.organizationId,
        name: data.name,
      },
    });

    if (existingScraper) {
      return NextResponse.json(
        { error: 'A scraper with this name already exists' },
        { status: 409 }
      );
    }

    // Create the scraper
    const newScraper = await prisma.scraper.create({
      data: {
        name: data.name,
        url: data.url,
        description: data.description,
        engine: data.engine,
        selectors: data.selectors,
        settings: data.settings,
        schedule: data.schedule,
        outputFormat: data.outputFormat,
        isActive: data.isActive,
        status: 'ACTIVE',
        organizationId: user.organizationId,
      },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    // Format response
    const formattedScraper = {
      id: newScraper.id,
      name: newScraper.name,
      url: newScraper.url,
      description: newScraper.description,
      status: newScraper.status,
      engine: newScraper.engine,
      createdAt: newScraper.createdAt,
      updatedAt: newScraper.updatedAt,
      selectors: newScraper.selectors,
      settings: newScraper.settings,
      schedule: newScraper.schedule,
      outputFormat: newScraper.outputFormat,
      isActive: newScraper.isActive,
    };

    return NextResponse.json({
      success: true,
      data: formattedScraper,
      message: 'Scraper created successfully',
    }, { status: 201 });

    } catch (error) {
      console.error('Create scraper error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const appError = handleError(error);
    return createErrorResponse(appError);
  }
}
