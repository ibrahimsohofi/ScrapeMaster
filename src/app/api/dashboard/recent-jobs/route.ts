import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';

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

    const organizationId = user.organizationId;

    // Get recent jobs with their latest execution
    const recentJobs = await prisma.job.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    // Format the response
    const formattedJobs = recentJobs.map((job) => {
      const latestExecution = job.executions[0];

      // Calculate time ago for last run
      let lastRun = 'Never';
      if (job.lastRunAt) {
        const diff = Date.now() - job.lastRunAt.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) {
          lastRun = `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
          lastRun = `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
          lastRun = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
          lastRun = 'Just now';
        }
      }

      return {
        id: job.id,
        name: job.name,
        description: job.description,
        status: job.status,
        lastRun,
        lastRunAt: job.lastRunAt,
        lastSuccessAt: job.lastSuccessAt,
        lastFailureAt: job.lastFailureAt,
        dataPoints: job.dataPointsCount || 0,
        schedule: job.schedule,
        url: job.url,
        errorMessage: job.errorMessage,
        executionDetails: latestExecution ? {
          status: latestExecution.status,
          duration: latestExecution.duration,
          dataPointsCount: latestExecution.dataPointsCount,
          errorMessage: latestExecution.errorMessage,
          startedAt: latestExecution.startedAt,
          completedAt: latestExecution.completedAt,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (error) {
    console.error('Recent jobs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
