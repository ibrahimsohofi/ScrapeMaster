import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { getUpdates, addUpdate } from '@/lib/realtime/updates';

interface RealtimeUpdate {
  type: 'job_status' | 'notification' | 'analytics';
  data: any;
  timestamp: number;
  id: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const sinceTimestamp = since ? Number.parseInt(since) : Date.now() - 30000; // Last 30 seconds

    // Get updates for this organization since the timestamp
    const orgUpdates = payload.organizationId ? getUpdates(payload.organizationId) : [];
    const newUpdates = orgUpdates.filter(update => update.timestamp > sinceTimestamp);

    // Also fetch recent job updates from database
    const recentJobs = payload.organizationId ? await prisma.job.findMany({
      where: {
        organizationId: payload.organizationId,
        updatedAt: {
          gte: new Date(sinceTimestamp)
        }
      },
      include: {
        scraper: {
          select: {
            id: true,
            name: true,
            url: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    }) : [];

    // Convert job updates to realtime format
    const jobUpdates: RealtimeUpdate[] = recentJobs.map((job: any) => ({
      type: 'job_status' as const,
      data: {
        jobId: job.id,
        scraperId: job.scraperId,
        scraperName: job.scraper.name,
        scraperUrl: job.scraper.url,
        status: job.status,
        progress: job.progress,
        result: job.result,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        updatedAt: job.updatedAt
      },
      timestamp: job.updatedAt.getTime(),
      id: job.id
    }));

    // Combine all updates
    const allUpdates = [...newUpdates, ...jobUpdates]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20); // Limit to 20 most recent

    return NextResponse.json({
      updates: allUpdates,
      timestamp: Date.now(),
      hasMore: allUpdates.length === 20
    });

  } catch (error) {
    console.error('Realtime API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Type and data are required' }, { status: 400 });
    }

    // Create update
    const update: RealtimeUpdate = {
      type,
      data,
      timestamp: Date.now(),
      id: Math.random().toString(36).slice(2)
    };

    // Add to organization's updates
    if (payload.organizationId) {
      addUpdate(payload.organizationId, update);
    }

    return NextResponse.json({ success: true, updateId: update.id });

  } catch (error) {
    console.error('Realtime POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
