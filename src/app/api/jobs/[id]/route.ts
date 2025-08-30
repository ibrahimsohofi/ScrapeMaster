import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const updateJobSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  selectors: z.record(z.string(), z.string()).optional(),
  schedule: z.string().optional(),
  outputFormat: z.enum(['JSON', 'CSV', 'EXCEL', 'XML', 'PARQUET']).optional(),
  status: z.enum(['PENDING', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED']).optional(),
  priority: z.number().min(1).max(10).optional(),
  customScript: z.string().optional(),
  waitConditions: z.any().optional(),
  proxySettings: z.any().optional(),
  headers: z.any().optional(),
  cookies: z.any().optional(),
  timeout: z.number().min(1000).max(300000).optional(),
  maxRetries: z.number().min(0).max(10).optional(),
});

// GET /api/jobs/[id] - Get a specific job
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

    const job = await prisma.job.findFirst({
      where: {
        id: resolvedParams.id,
        organizationId: user.organizationId,
      },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        webhooks: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

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
        timezone: (job.settings as any)?.timezone || 'UTC',
        outputFormat: job.outputFormat,
        customScript: (job.settings as any)?.customScript,
        waitConditions: (job.settings as any)?.waitConditions,
        proxySettings: (job.settings as any)?.proxySettings,
        headers: (job.settings as any)?.headers,
        cookies: (job.settings as any)?.cookies,
        timeout: job.timeout,
        maxRetries: job.maxRetries,
        retryCount: job.retryCount,
        lastRunAt: job.lastRunAt,
        nextRunAt: job.nextRunAt,
        lastSuccessAt: job.lastSuccessAt,
        lastFailureAt: job.lastFailureAt,
        dataPointsCount: job.dataPointsCount,
        resultsUrl: job.resultsUrl,
        errorMessage: job.errorMessage,
        avgDuration: job.avgDuration,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        createdBy: job.createdById,
        executions: job.executions,
        webhooks: job.webhooks,
      },
    });
  } catch (error) {
    console.error('Get job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[id] - Update a specific job
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

    // Check if job exists and belongs to organization
    const existingJob = await prisma.job.findFirst({
      where: {
        id: resolvedParams.id,
        organizationId: user.organizationId,
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateJobSchema.parse(body);

    // Process validated data to handle type conversions
    const updateData: any = { ...validatedData };
    if (typeof updateData.priority === 'number') {
      // Convert number to Priority enum
      const priorityMap: Record<number, string> = {
        0: 'LOW',
        1: 'NORMAL',
        2: 'HIGH',
        3: 'URGENT'
      };
      updateData.priority = priorityMap[updateData.priority] || 'NORMAL';
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id: resolvedParams.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
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
        id: updatedJob.id,
        name: updatedJob.name,
        description: updatedJob.description,
        url: updatedJob.url,
        selectors: updatedJob.selectors,
        status: updatedJob.status,
        priority: updatedJob.priority,
        schedule: updatedJob.schedule,
        outputFormat: updatedJob.outputFormat,
        timeout: updatedJob.timeout,
        maxRetries: updatedJob.maxRetries,
        updatedAt: updatedJob.updatedAt,
        createdBy: updatedJob.createdById,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete a specific job
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

    // Check if job exists and belongs to organization
    const existingJob = await prisma.job.findFirst({
      where: {
        id: resolvedParams.id,
        organizationId: user.organizationId,
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Delete the job (this will cascade to executions due to foreign key constraints)
    await prisma.job.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('Delete job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/jobs/[id]/run - Manually trigger a job run
export async function POST(
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

    // Check if job exists and belongs to organization
    const job = await prisma.job.findFirst({
      where: {
        id: resolvedParams.id,
        organizationId: user.organizationId,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if job is already running
    if (job.status === 'RUNNING') {
      return NextResponse.json(
        { error: 'Job is already running' },
        { status: 400 }
      );
    }

    // Update job status to running and create execution record
    const [updatedJob, execution] = await Promise.all([
      prisma.job.update({
        where: { id: resolvedParams.id },
        data: {
          status: 'RUNNING',
          lastRunAt: new Date(),
        },
      }),
      prisma.jobExecution.create({
        data: {
          jobId: resolvedParams.id,
          status: 'STARTED',
          startedAt: new Date(),
          workerId: 'manual-trigger',
          region: 'local',
        },
      }),
    ]);

    // TODO: Implement actual scraping logic here
    // For now, we'll simulate a quick completion

    return NextResponse.json({
      success: true,
      message: 'Job execution started',
      execution: {
        id: execution.id,
        status: execution.status,
        startedAt: execution.startedAt,
      },
    });
  } catch (error) {
    console.error('Run job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
