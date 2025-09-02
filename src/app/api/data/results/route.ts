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

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const url = searchParams.get('url');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: decoded.userId,
    };

    if (status) {
      where.status = status;
    }

    if (url) {
      where.url = {
        contains: url,
      };
    }

    // Get results with pagination
    const [results, total] = await Promise.all([
      prisma.scrapingResult.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          url: true,
          // Remove status field as it doesn't exist
          dataPointsCount: true,
          engine: true,
          createdAt: true,
          // Don't include the full data field for performance
        },
      }),
      prisma.scrapingResult.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Results listing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get('id');

    if (!resultId) {
      return NextResponse.json(
        { error: 'Result ID is required' },
        { status: 400 }
      );
    }

    // Delete the result if it belongs to the user
    const deletedResult = await prisma.scrapingResult.deleteMany({
      where: {
        id: resultId,
        userId: decoded.userId,
      },
    });

    if (deletedResult.count === 0) {
      return NextResponse.json(
        { error: 'Result not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Result deleted successfully',
    });

  } catch (error) {
    console.error('Result deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete result' },
      { status: 500 }
    );
  }
}
