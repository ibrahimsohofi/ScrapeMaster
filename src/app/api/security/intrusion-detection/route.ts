import { NextRequest, NextResponse } from 'next/server';
import { intrusionDetectionService } from '@/lib/security/intrusion-detection';
import { auditLogger } from '@/lib/compliance/audit-logger';
import { logger } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     '127.0.0.1';

    switch (action) {
      case 'threats':
        const threats = intrusionDetectionService.getActiveThreats();

        await auditLogger.logSecurityEvent({
          eventType: 'security_dashboard_access',
          action: 'view_threats',
          resource: '/api/security/intrusion-detection',
          outcome: 'success',
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || '',
          severity: 'low',
          details: { threatsCount: threats.length },
        });

        return NextResponse.json({
          success: true,
          data: threats,
          count: threats.length,
        });

      case 'metrics':
        const metrics = intrusionDetectionService.getSecurityMetrics();

        await auditLogger.logSecurityEvent({
          eventType: 'security_metrics_access',
          action: 'view_metrics',
          resource: '/api/security/intrusion-detection',
          outcome: 'success',
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || '',
          severity: 'low',
          details: metrics,
        });

        return NextResponse.json({
          success: true,
          data: metrics,
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter',
        }, { status: 400 });
    }
  } catch (error) {
    logger.error('Failed to process intrusion detection request', { error });
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, threatId, status, ipAddress, sessionId } = body;

    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     '127.0.0.1';

    switch (action) {
      case 'update_threat':
        if (!threatId || !status) {
          return NextResponse.json({
            success: false,
            error: 'Missing threatId or status',
          }, { status: 400 });
        }

        const updated = intrusionDetectionService.updateThreatStatus(threatId, status);

        await auditLogger.logSecurityEvent({
          eventType: 'threat_status_update',
          action: 'update',
          resource: `/api/security/intrusion-detection/threat/${threatId}`,
          outcome: updated ? 'success' : 'failure',
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || '',
          severity: 'medium',
          details: { threatId, newStatus: status },
        });

        return NextResponse.json({
          success: updated,
          message: updated ? 'Threat status updated' : 'Threat not found',
        });

      case 'unblock_ip':
        if (!ipAddress) {
          return NextResponse.json({
            success: false,
            error: 'Missing ipAddress',
          }, { status: 400 });
        }

        const unblocked = intrusionDetectionService.unblockIP(ipAddress);

        await auditLogger.logSecurityEvent({
          eventType: 'ip_unblock',
          action: 'unblock',
          resource: '/api/security/intrusion-detection',
          outcome: unblocked ? 'success' : 'failure',
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || '',
          severity: 'high',
          details: { unblockedIP: ipAddress },
        });

        return NextResponse.json({
          success: unblocked,
          message: unblocked ? 'IP address unblocked' : 'IP address not found in blocklist',
        });

      case 'unquarantine_session':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Missing sessionId',
          }, { status: 400 });
        }

        const unquarantined = intrusionDetectionService.unquarantineSession(sessionId);

        await auditLogger.logSecurityEvent({
          eventType: 'session_unquarantine',
          action: 'unquarantine',
          resource: '/api/security/intrusion-detection',
          outcome: unquarantined ? 'success' : 'failure',
          sessionId: sessionId,
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || '',
          severity: 'medium',
          details: { unquarantinedSession: sessionId },
        });

        return NextResponse.json({
          success: unquarantined,
          message: unquarantined ? 'Session unquarantined' : 'Session not found in quarantine',
        });

      case 'analyze_request':
        const { endpoint, method, headers, params, userId } = body;

        if (!endpoint || !method) {
          return NextResponse.json({
            success: false,
            error: 'Missing endpoint or method',
          }, { status: 400 });
        }

        const analysisResult = await intrusionDetectionService.analyzeRequest({
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || '',
          endpoint,
          method,
          timestamp: new Date(),
          userId,
          headers: headers || {},
          params: params || {},
        });

        return NextResponse.json({
          success: true,
          data: analysisResult,
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter',
        }, { status: 400 });
    }
  } catch (error) {
    logger.error('Failed to process intrusion detection POST request', { error });
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
