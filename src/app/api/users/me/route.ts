import { type NextRequest, NextResponse } from 'next/server';
import { findUserById, findSubscriptionByUserId, findJobsByUserId } from '@/lib/db';

// GET /api/users/me - Get the authenticated user's information
export async function GET(request: NextRequest) {
  const userId = 'demo-user'; // Temporary for demo
  try {
    // Return demo user information
    return NextResponse.json({
      user: {
        id: userId,
        email: 'demo@example.com',
        name: 'Demo User',
        apiKey: 'demo-api-key',
      },
      subscription: {
        planId: 'free',
        status: 'active',
        currentPeriodEnd: new Date('2024-12-31'),
      },
      usage: {
        totalJobs: 3,
        activeJobs: 1,
        completedJobs: 2,
      },
    });
  } catch (error) {
    console.error('Error getting user information:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
