import { NextRequest, NextResponse } from 'next/server';

interface AlertManagerAlert {
  status: 'firing' | 'resolved';
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: string;
  endsAt?: string;
  generatorURL: string;
}

interface AlertManagerPayload {
  receiver: string;
  status: string;
  alerts: AlertManagerAlert[];
  groupLabels: Record<string, string>;
  commonLabels: Record<string, string>;
  commonAnnotations: Record<string, string>;
  externalURL: string;
  version: string;
  groupKey: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: AlertManagerPayload = await request.json();

    console.log('📊 AlertManager Webhook Received:', {
      receiver: payload.receiver,
      status: payload.status,
      alertCount: payload.alerts.length,
      groupKey: payload.groupKey
    });

    // Process each alert
    for (const alert of payload.alerts) {
      const alertInfo = {
        status: alert.status,
        alertname: alert.labels.alertname,
        severity: alert.labels.severity,
        service: alert.labels.service,
        instance: alert.labels.instance,
        summary: alert.annotations.summary,
        description: alert.annotations.description,
        startsAt: alert.startsAt,
        endsAt: alert.endsAt
      };

      if (alert.status === 'firing') {
        console.log('🚨 FIRING ALERT:', alertInfo);

        // Here you could:
        // 1. Store alert in database
        // 2. Send to external monitoring systems
        // 3. Trigger additional notifications
        // 4. Update application metrics

        // Example: Log critical alerts with more detail
        if (alert.labels.severity === 'critical') {
          console.error('🔥 CRITICAL ALERT FIRING:', {
            alert: alertInfo,
            timestamp: new Date().toISOString(),
            needsImmediateAttention: true
          });
        }

      } else if (alert.status === 'resolved') {
        console.log('✅ RESOLVED ALERT:', alertInfo);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Processed ${payload.alerts.length} alerts`,
      receiver: payload.receiver,
      alertsProcessed: payload.alerts.map(alert => ({
        alertname: alert.labels.alertname,
        status: alert.status,
        severity: alert.labels.severity
      }))
    });

  } catch (error) {
    console.error('❌ Error processing AlertManager webhook:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    service: 'DataVault Pro AlertManager Webhook',
    timestamp: new Date().toISOString(),
    description: 'This endpoint receives alerts from AlertManager'
  });
}
