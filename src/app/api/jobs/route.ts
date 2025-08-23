import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const createJobSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  description: z.string().optional(),
  url: z.string().url('Valid URL is required'),
  selectors: z.record(z.string(), z.string()).refine(obj => Object.keys(obj).length > 0, 'At least one selector is required'),
  schedule: z.string().optional(),
  outputFormat: z.enum(['JSON', 'CSV', 'EXCEL', 'XML', 'PARQUET']).default('JSON'),
  customScript: z.string().optional(),
  waitConditions: z.any().optional(),
  proxySettings: z.any().optional(),
  headers: z.any().optional(),
  cookies: z.any().optional(),
  timeout: z.number().min(1000).max(300000).default(30000),
  maxRetries: z.number().min(0).max(10).default(3),
});

// GET /api/jobs - List all jobs for the organization
export async function GET(request: NextRequest) {
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

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    const where: any = {
      organizationId: user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      name: job.name,
      description: job.description,
      url: job.url,
      selectors: job.selectors,
      status: job.status,
      priority: job.priority,
      schedule: job.schedule,
      outputFormat: job.outputFormat,
      lastRunAt: job.lastRunAt,
      nextRunAt: job.nextRunAt,
      lastSuccessAt: job.lastSuccessAt,
      lastFailureAt: job.lastFailureAt,
      dataPointsCount: job.dataPointsCount,
      errorMessage: job.errorMessage,
      avgDuration: job.avgDuration,
      retryCount: job.retryCount,
      maxRetries: job.maxRetries,
      timeout: job.timeout,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      createdBy: job.createdBy,
      latestExecution: job.executions[0] || null,
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
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

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createJobSchema.parse(body);

    // Check organization limits
    const jobCount = await prisma.job.count({
      where: { organizationId: user.organizationId },
    });

    const maxJobs = user.organization.plan === 'FREE' ? 3 :
                   user.organization.plan === 'STARTER' ? 50 :
                   user.organization.plan === 'PRO' ? 200 : 999999;

    if (jobCount >= maxJobs) {
      return NextResponse.json(
        { error: `Job limit reached for ${user.organization.plan} plan` },
        { status: 403 }
      );
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        url: validatedData.url,
        engine: 'PLAYWRIGHT',
        selectors: validatedData.selectors,
        schedule: validatedData.schedule,
        outputFormat: validatedData.outputFormat,
        settings: {
          customScript: validatedData.customScript,
          waitConditions: validatedData.waitConditions,
          proxySettings: validatedData.proxySettings,
          headers: validatedData.headers,
          cookies: validatedData.cookies,
          timeout: validatedData.timeout,
          maxRetries: validatedData.maxRetries,
        },
        // We need to add a scraperId - for now create a temporary one
        scraperId: 'temp-scraper-' + Date.now(),
        organizationId: user.organizationId,
        createdById: user.id,
        status: 'PENDING',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        name: job.name,
        description: job.description,
        url: job.url,
        selectors: job.selectors,
        status: job.status,
        priority: job.priority,
        schedule: job.schedule,
        outputFormat: job.outputFormat,
        timeout: job.timeout,
        maxRetries: job.maxRetries,
        createdAt: job.createdAt,
        createdBy: job.createdById,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
