import { type NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/notifications/email-service';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { z } from 'zod';

// Enhanced notification types
const EmailNotificationSchema = z.object({
  type: z.enum([
    'job_completed',
    'job_failed',
    'usage_alert',
    'maintenance',
    'welcome',
    'webhook_trigger',
    'data_export_ready',
    'scraper_status_change',
    'quota_exceeded'
  ]),
  recipients: z.array(z.string().email()),
  data: z.record(z.any()).optional(),
});

type EmailNotificationType = z.infer<typeof EmailNotificationSchema>;

export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting (simplified)
    const origin = request.headers.get('origin') || 'unknown';

    // Get authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = EmailNotificationSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid notification data',
          details: validatedData.error.issues
        },
        { status: 400 }
      );
    }

    // Process notification based on type
    let result;
    const { type, recipients, data } = validatedData.data;

    switch (type) {
      case 'welcome':
        // Simple welcome email
        result = await emailService.sendWelcomeEmail({
          name: data?.userName || 'User',
          email: recipients[0]
        });
        break;

      case 'job_completed':
      case 'job_failed':
      case 'usage_alert':
      case 'maintenance':
      case 'webhook_trigger':
      case 'data_export_ready':
      case 'scraper_status_change':
      case 'quota_exceeded':
        // Send alert notification for all other types
        result = await emailService.sendAlertNotification({
          userEmail: recipients[0],
          alertType: 'info' as const,
          title: `${type.replace('_', ' ').toUpperCase()} Notification`,
          message: `Notification of type: ${type}`
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      type,
      recipients: recipients.length,
      result
    });

  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send notification',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authorization.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Return available notification types and status
    return NextResponse.json({
      available_types: [
        'job_completed',
        'job_failed',
        'usage_alert',
        'maintenance',
        'welcome',
        'webhook_trigger',
        'data_export_ready',
        'scraper_status_change',
        'quota_exceeded'
      ],
      service_status: 'operational',
      user: payload.userId
    });

  } catch (error) {
    console.error('Email service status error:', error);
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 }
    );
  }
}
