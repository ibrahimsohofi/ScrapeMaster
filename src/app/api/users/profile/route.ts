import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validation schema for profile updates
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  preferences: z.object({
    notifications: z.object({
      email: z.boolean().optional(),
      browser: z.boolean().optional(),
      mobile: z.boolean().optional(),
    }).optional(),
    dashboard: z.object({
      defaultView: z.enum(['grid', 'list']).optional(),
      itemsPerPage: z.number().min(10).max(100).optional(),
      autoRefresh: z.boolean().optional(),
    }).optional(),
    scraping: z.object({
      defaultEngine: z.enum(['PLAYWRIGHT', 'HTTRACK']).optional(),
      defaultRetries: z.number().min(0).max(10).optional(),
      defaultTimeout: z.number().min(1000).max(300000).optional(),
    }).optional(),
  }).optional(),
}).partial();

// Validation schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// GET - Get user profile
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

    // Get user with organization and usage stats
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: true,
        jobs: {
          select: {
            id: true,
            status: true,
            _count: {
              select: {
                executions: true,
              },
            },
          },
        },
        apiKeys: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            lastUsedAt: true,
            isActive: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    // Calculate user statistics
    const totalScrapers = user.jobs.length;
    const activeScrapers = user.jobs.filter(job => job.status === 'RUNNING').length;
    const totalExecutions = user.jobs.reduce((sum, job) => sum + job._count.executions, 0);

    // Format user profile response
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      timezone: user.timezone,
      language: user.language,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,

      // Organization info
      organization: {
        id: user.organization?.id,
        name: user.organization?.name,
        plan: user.organization?.plan,
        createdAt: user.organization?.createdAt,
      },

      // Usage statistics
      statistics: {
        totalScrapers,
        activeScrapers,
        totalExecutions,
        totalApiKeys: user.apiKeys.length,
        activeApiKeys: user.apiKeys.filter(key => key.isActive).length,
      },

      // API Keys (without sensitive data)
      apiKeys: user.apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        isActive: key.isActive,
      })),
    };

    return NextResponse.json({
      success: true,
      data: userProfile,
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
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
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = updateProfileSchema.safeParse(body);
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

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 409 }
        );
      }
    }

    // Merge preferences with existing preferences
    const mergedPreferences = updateData.preferences ? {
      ...user.preferences as any,
      ...updateData.preferences,
      notifications: {
        ...((user.preferences as any)?.notifications || {}),
        ...(updateData.preferences.notifications || {}),
      },
      dashboard: {
        ...((user.preferences as any)?.dashboard || {}),
        ...(updateData.preferences.dashboard || {}),
      },
      scraping: {
        ...((user.preferences as any)?.scraping || {}),
        ...(updateData.preferences.scraping || {}),
      },
    } : user.preferences;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        ...updateData,
        preferences: mergedPreferences,
        updatedAt: new Date(),
      },
      include: {
        organization: true,
      },
    });

    // Return updated profile (without sensitive data)
    const userProfile = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      timezone: updatedUser.timezone,
      language: updatedUser.language,
      preferences: updatedUser.preferences,
      updatedAt: updatedUser.updatedAt,
      organization: {
        id: updatedUser.organization?.id,
        name: updatedUser.organization?.name,
        plan: updatedUser.organization?.plan,
      },
    };

    return NextResponse.json({
      success: true,
      data: userProfile,
      message: 'Profile updated successfully',
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// POST - Change password (special endpoint)
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate password change request
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        hashedPassword: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
