import { NextRequest, NextResponse } from 'next/server';
import { BackupDisasterRecoverySystem } from '@/lib/infrastructure/backup-disaster-recovery';

// Initialize with default configuration
const drConfig = {
  rpo: 60, // 1 hour
  rto: 240, // 4 hours
  primaryRegion: 'us-east-1',
  failoverRegions: ['us-west-2'],
  monitoring: {
    healthCheckInterval: 60,
    failureThreshold: 3,
    autoFailover: false
  },
  notifications: {
    channels: ['email', 'slack'],
    escalation: true
  }
};

const backupSystem = new BackupDisasterRecoverySystem(drConfig);

// Initialize the backup system
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await backupSystem.initializeSystem();
    isInitialized = true;
  }
}

// GET /api/infrastructure/backup - Get backup status and jobs
export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    switch (endpoint) {
      case 'jobs':
        const jobs = backupSystem.getBackupJobs();
        return NextResponse.json({
          jobs: jobs.map(job => ({
            ...job,
            // Don't expose internal details
            strategy: {
              type: job.strategy.type,
              schedule: job.strategy.schedule,
              retention: job.strategy.retention
            }
          })),
          total: jobs.length,
          active: jobs.filter(j => j.status === 'running').length,
          completed: jobs.filter(j => j.status === 'completed').length,
          failed: jobs.filter(j => j.status === 'failed').length
        });

      case 'health':
        const health = backupSystem.getSystemHealth();
        return NextResponse.json(health);

      default:
        const status = {
          status: 'operational',
          timestamp: new Date().toISOString(),
          configuration: {
            rpo: drConfig.rpo,
            rto: drConfig.rto,
            primaryRegion: drConfig.primaryRegion,
            failoverRegions: drConfig.failoverRegions,
            autoFailover: drConfig.monitoring.autoFailover
          }
        };
        return NextResponse.json(status);
    }

  } catch (error) {
    console.error('Backup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/infrastructure/backup - Execute backup operations
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'create-backup':
        const { strategy = 'manual' } = params;
        const jobId = await backupSystem.executeBackup(strategy);

        return NextResponse.json({
          message: 'Backup initiated successfully',
          jobId,
          timestamp: new Date().toISOString()
        });

      case 'restore-backup':
        const { backupId, options = {} } = params;
        if (!backupId) {
          return NextResponse.json(
            { error: 'Backup ID required' },
            { status: 400 }
          );
        }

        await backupSystem.restoreBackup({
          backupId,
          verifyIntegrity: true,
          ...options
        });

        return NextResponse.json({
          message: 'Restore initiated successfully',
          backupId,
          timestamp: new Date().toISOString()
        });

      case 'add-backup-strategy':
        const { name, strategy: strategyConfig } = params;
        if (!name || !strategy) {
          return NextResponse.json(
            { error: 'Strategy name and configuration required' },
            { status: 400 }
          );
        }

        await backupSystem.addBackupStrategy(name, strategy);

        return NextResponse.json({
          message: `Backup strategy '${name}' added successfully`,
          timestamp: new Date().toISOString()
        });

      case 'test-failover':
        const { planId } = params;
        if (!planId) {
          return NextResponse.json(
            { error: 'Failover plan ID required' },
            { status: 400 }
          );
        }

        await backupSystem.testFailoverPlan(planId);

        return NextResponse.json({
          message: `Failover plan '${planId}' test completed`,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action', availableActions: ['create-backup', 'restore-backup', 'add-backup-strategy', 'test-failover'] },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Backup operation error:', error);
    return NextResponse.json(
      { error: 'Backup operation failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
