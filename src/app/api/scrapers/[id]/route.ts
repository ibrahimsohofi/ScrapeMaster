import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schema for updating scrapers
const updateScraperSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  url: z.string().url('Invalid URL format').optional(),
  description: z.string().optional(),
  engine: z.enum(['PLAYWRIGHT', 'HTTRACK']).optional(),
  selectors: z.record(z.string()).optional(),
  settings: z.object({
    userAgent: z.string().optional(),
    delay: z.number().min(0).max(60000).optional(),
    timeout: z.number().min(1000).max(300000).optional(),
    retries: z.number().min(0).max(10).optional(),
    respectRobots: z.boolean().optional(),
    followRedirects: z.boolean().optional(),
    javascript: z.boolean().optional(),
    cookies: z.boolean().optional(),
  }).optional(),
  schedule: z.object({
    type: z.enum(['manual', 'interval', 'cron']).optional(),
    interval: z.number().optional(),
    cronExpression: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
  outputFormat: z.enum(['JSON', 'CSV', 'EXCEL']).optional(),
  isActive: z.boolean().optional(),
}).partial();

// Helper function to verify scraper ownership
async function verifyScraperAccess(scraperId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });

  if (!user || !user.isActive) {
    return { error: 'User not found or inactive', status: 401 };
  }

  const scraper = await prisma.job.findFirst({
    where: {
      id: scraperId,
      organizationId: user.organizationId,
    },
    include: {
      executions: {
        orderBy: { startedAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          executions: true,
        },
      },
    },
  });

  if (!scraper) {
    return { error: 'Scraper not found or access denied', status: 404 };
  }

  return { scraper, user };
}

// GET - Get a specific scraper
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const result = await verifyScraperAccess(resolvedParams.id, decoded.userId);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { scraper } = result;

    // Format detailed scraper response
    const formattedScraper = {
      id: scraper.id,
      name: scraper.name,
      url: scraper.url,
      description: scraper.description,
      status: scraper.status,
      engine: scraper.engine,
      createdAt: scraper.createdAt,
      updatedAt: scraper.updatedAt,
      lastRunAt: scraper.lastRunAt,
      lastSuccessAt: scraper.lastSuccessAt,
      lastFailureAt: scraper.lastFailureAt,
      dataPointsCount: scraper.dataPointsCount || 0,
      selectors: scraper.selectors,
      settings: scraper.settings,
      schedule: scraper.schedule,
      outputFormat: scraper.outputFormat,
      isActive: scraper.isActive,
      errorMessage: scraper.errorMessage,

      // Execution statistics
      executionStats: {
        totalExecutions: scraper._count.executions,
        recentExecutions: scraper.executions.map(exec => ({
          id: exec.id,
          status: exec.status,
          startedAt: exec.startedAt,
          completedAt: exec.completedAt,
          duration: exec.duration,
          dataPointsCount: exec.dataPointsCount,
          errorMessage: exec.errorMessage,
        })),
      },
    };

    return NextResponse.json({
      success: true,
      data: formattedScraper,
    });

  } catch (error) {
    console.error('Get scraper error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// PUT - Update a specific scraper
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const result = await verifyScraperAccess(resolvedParams.id, decoded.userId);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { scraper, user } = result;

    // Check if scraper is currently running
    if (scraper.status === 'RUNNING') {
      return NextResponse.json(
        { error: 'Cannot update scraper while it is running' },
        { status: 409 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = updateScraperSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Check if name is being changed and if it conflicts
    if (updateData.name && updateData.name !== scraper.name) {
      const existingScraper = await prisma.job.findFirst({
        where: {
          organizationId: user.organizationId,
          name: updateData.name,
          id: { not: resolvedParams.id },
        },
      });

      if (existingScraper) {
        return NextResponse.json(
          { error: 'A scraper with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Merge settings and schedule data with existing data
    const mergedSettings = updateData.settings ? {
      ...scraper.settings as any,
      ...updateData.settings,
    } : scraper.settings;

    const mergedSchedule = updateData.schedule ? {
      ...scraper.schedule as any,
      ...updateData.schedule,
    } : scraper.schedule;

    // Update the scraper
    const updatedScraper = await prisma.job.update({
      where: { id: resolvedParams.id },
      data: {
        ...updateData,
        settings: mergedSettings,
        schedule: mergedSchedule,
        updatedAt: new Date(),
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
      id: updatedScraper.id,
      name: updatedScraper.name,
      url: updatedScraper.url,
      description: updatedScraper.description,
      status: updatedScraper.status,
      engine: updatedScraper.engine,
      createdAt: updatedScraper.createdAt,
      updatedAt: updatedScraper.updatedAt,
      selectors: updatedScraper.selectors,
      settings: updatedScraper.settings,
      schedule: updatedScraper.schedule,
      outputFormat: updatedScraper.outputFormat,
      isActive: updatedScraper.isActive,
    };

    return NextResponse.json({
      success: true,
      data: formattedScraper,
      message: 'Scraper updated successfully',
    });

  } catch (error) {
    console.error('Update scraper error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific scraper
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const result = await verifyScraperAccess(resolvedParams.id, decoded.userId);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { scraper } = result;

    // Check if scraper is currently running
    if (scraper.status === 'RUNNING') {
      return NextResponse.json(
        { error: 'Cannot delete scraper while it is running' },
        { status: 409 }
      );
    }

    // Delete associated data first (executions, results, etc.)
    await prisma.$transaction(async (prisma) => {
      // Delete scraping results
      await prisma.scrapingResult.deleteMany({
        where: { jobExecution: { jobId: resolvedParams.id } },
      });

      // Delete executions
      await prisma.jobExecution.deleteMany({
        where: { jobId: resolvedParams.id },
      });

      // Delete the scraper
      await prisma.job.delete({
        where: { id: resolvedParams.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Scraper deleted successfully',
    });

  } catch (error) {
    console.error('Delete scraper error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
