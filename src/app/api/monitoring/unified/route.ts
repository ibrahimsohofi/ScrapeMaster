import { NextRequest, NextResponse } from 'next/server';
import { dataDogIntegration } from '@/lib/monitoring/datadog-integration';
import { newRelicIntegration } from '@/lib/monitoring/newrelic-integration';
import { logger } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    // Test connections
    const [dataDogConnected, newRelicConnected] = await Promise.all([
      dataDogIntegration.testConnection(),
      newRelicIntegration.testConnection(),
    ]);

    // Mock real-time data - in production, this would come from Redis or database
    const realtimeData = {
      activeScrapers: Math.floor(Math.random() * 50) + 10,
      queuedJobs: Math.floor(Math.random() * 100) + 5,
      proxiesOnline: Math.floor(Math.random() * 20) + 45,
      totalProxies: 50,
    };

    // Mock DataDog metrics - in production, fetch from DataDog API
    const dataDogMetrics = {
      scraperPerformance: Array.from({ length: 10 }, (_, i) => ({
        time: new Date(Date.now() - (9 - i) * 60000).toISOString(),
        value: Math.random() * 2000 + 500,
        status: Math.random() > 0.1 ? 'success' : 'failed',
      })),
      apiResponseTimes: [
        { endpoint: '/api/scrapers', avgTime: 245, p95: 890 },
        { endpoint: '/api/jobs', avgTime: 156, p95: 432 },
        { endpoint: '/api/data/export', avgTime: 1240, p95: 3200 },
        { endpoint: '/api/auth/login', avgTime: 89, p95: 234 },
        { endpoint: '/api/dashboard/stats', avgTime: 345, p95: 678 },
      ],
      systemHealth: {
        memoryUsage: Math.random() * 40 + 30, // 30-70%
        cpuUsage: Math.random() * 30 + 10,    // 10-40%
        diskUsage: Math.random() * 25 + 15,   // 15-40%
      },
      alerts: generateMockAlerts(),
    };

    // Mock New Relic APM data - in production, fetch from New Relic API
    const newRelicData = {
      apm: {
        throughput: Math.random() * 500 + 100, // requests per minute
        errorRate: Math.random() * 2,          // 0-2%
        responseTime: Math.random() * 300 + 150, // 150-450ms
        apdex: 0.85 + Math.random() * 0.1,     // 0.85-0.95
      },
      browser: {
        pageLoadTime: Math.random() * 1000 + 1500, // 1.5-2.5s
        ajaxResponseTime: Math.random() * 200 + 100, // 100-300ms
        jsErrors: Math.floor(Math.random() * 20),
      },
      infrastructure: {
        hosts: 3,
        containerHealth: Math.random() * 10 + 90, // 90-100%
      },
    };

    const response = {
      timestamp: new Date().toISOString(),
      datadog: {
        connected: dataDogConnected,
        metrics: dataDogMetrics,
      },
      newrelic: {
        connected: newRelicConnected,
        ...newRelicData,
      },
      realtime: realtimeData,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to fetch unified monitoring data', { error });
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}

function generateMockAlerts() {
  const alertTypes = [
    {
      severity: 'high' as const,
      message: 'High memory usage detected on production server',
      probability: 0.1,
    },
    {
      severity: 'medium' as const,
      message: 'Proxy response time above threshold',
      probability: 0.15,
    },
    {
      severity: 'low' as const,
      message: 'SSL certificate expires in 30 days',
      probability: 0.05,
    },
    {
      severity: 'critical' as const,
      message: 'Database connection pool exhausted',
      probability: 0.02,
    },
    {
      severity: 'medium' as const,
      message: 'Scraper error rate above 5%',
      probability: 0.08,
    },
  ];

  const alerts = [];

  for (const alertType of alertTypes) {
    if (Math.random() < alertType.probability) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        severity: alertType.severity,
        message: alertType.message,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      });
    }
  }

  return alerts;
}

// POST endpoint for sending custom metrics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, metrics, events } = body;

    if (source === 'datadog' && metrics) {
      await dataDogIntegration.sendMetrics(metrics);
    }

    if (source === 'newrelic' && events) {
      await newRelicIntegration.sendCustomEvents(events);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to send monitoring data', { error });
    return NextResponse.json(
      { error: 'Failed to send monitoring data' },
      { status: 500 }
    );
  }
}
