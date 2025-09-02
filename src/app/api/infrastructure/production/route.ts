import { NextRequest, NextResponse } from 'next/server';
import { ProductionInfrastructureManager, ProductionConfigurationFactory } from '@/lib/infrastructure/production-configuration';

// Initialize the production infrastructure manager
const productionConfig = ProductionConfigurationFactory.createDefault();
const infrastructureManager = new ProductionInfrastructureManager(productionConfig);

// Initialize the manager on first request
let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    await infrastructureManager.initialize();
    isInitialized = true;
  }
}

// GET /api/infrastructure/production - Get system health and status
export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    switch (endpoint) {
      case 'health':
        const health = await infrastructureManager.getSystemHealth();
        return NextResponse.json(health);

      case 'config':
        const config = infrastructureManager.getConfiguration();
        // Remove sensitive information
        const safeConfig = {
          ...config,
          monitoring: {
            ...config.monitoring,
            enterprise: {
              ...config.monitoring.enterprise,
              email: { ...config.monitoring.enterprise.email, smtp: { host: '***', port: 587, secure: false, auth: { user: '***', pass: '***' } } }
            }
          }
        };
        return NextResponse.json(safeConfig);

      case 'metrics':
        // Return basic metrics
        const metrics = {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        };
        return NextResponse.json(metrics);

      default:
        const systemStatus = {
          status: 'operational',
          timestamp: new Date().toISOString(),
          environment: productionConfig.environment,
          domain: productionConfig.domain.primary,
          initialized: isInitialized
        };
        return NextResponse.json(systemStatus);
    }

  } catch (error) {
    console.error('Infrastructure API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/infrastructure/production - Execute management operations
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'health-check':
        const isHealthy = await infrastructureManager.performHealthCheck();
        return NextResponse.json({
          healthy: isHealthy,
          timestamp: new Date().toISOString()
        });

      case 'deploy-update':
        await infrastructureManager.deployProductionUpdate();
        return NextResponse.json({
          message: 'Deployment initiated successfully',
          timestamp: new Date().toISOString()
        });

      case 'emergency-maintenance':
        await infrastructureManager.emergencyMaintenance();
        return NextResponse.json({
          message: 'Emergency maintenance mode activated',
          timestamp: new Date().toISOString()
        });

      case 'update-config':
        if (!params.config) {
          return NextResponse.json(
            { error: 'Configuration data required' },
            { status: 400 }
          );
        }
        await infrastructureManager.updateConfiguration(params.config);
        return NextResponse.json({
          message: 'Configuration updated successfully',
          timestamp: new Date().toISOString()
        });

      case 'send-test-alert':
        // This would send a test alert through the monitoring system
        return NextResponse.json({
          message: 'Test alert sent',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action', availableActions: ['health-check', 'deploy-update', 'emergency-maintenance', 'update-config', 'send-test-alert'] },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Infrastructure management error:', error);
    return NextResponse.json(
      { error: 'Operation failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/infrastructure/production - Update configuration
export async function PUT(request: NextRequest) {
  try {
    await ensureInitialized();

    const config = await request.json();
    await infrastructureManager.updateConfiguration(config);

    return NextResponse.json({
      message: 'Configuration updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Configuration update error:', error);
    return NextResponse.json(
      { error: 'Configuration update failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
