import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import prisma from '@/lib/db/prisma';
import { EventEmitter } from 'events';

// Real-time metrics interface
export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  jobs: {
    running: number;
    queued: number;
    completed: number;
    failed: number;
  };
  network: {
    requestsPerSecond: number;
    responseTime: number;
    errorRate: number;
  };
  storage: {
    used: number;
    available: number;
  };
  uptime: number;
}

export interface JobMetrics {
  id: string;
  name: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING';
  progress: number;
  dataPoints: number;
  executionTime: number;
  errorMessage?: string;
}

export interface AlertEvent {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  metadata?: Record<string, any>;
}

class RealTimeMonitoringSystem extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private clients = new Set<WebSocket>();
  private currentMetrics: SystemMetrics | null = null;
  private alertHistory: AlertEvent[] = [];
  private jobMetrics = new Map<string, JobMetrics>();

  constructor() {
    super();
    this.startMetricsCollection();
  }

  async initialize(port = 3001): Promise<void> {
    if (this.wss) {
      return; // Already initialized
    }

    try {
      const server = createServer();
      this.wss = new WebSocketServer({ server, path: '/ws/monitoring' });

      this.wss.on('connection', (ws, request) => {
        console.log('WebSocket client connected from:', request.socket.remoteAddress);
        this.handleClientConnection(ws);
      });

      this.wss.on('error', (error) => {
        console.error('WebSocket server error:', error);
      });

      server.listen(port, () => {
        console.log(`Real-time monitoring server started on port ${port}`);
      });

      // Start metrics broadcasting
      this.startMetricsBroadcast();

    } catch (error) {
      console.error('Failed to initialize monitoring system:', error);
    }
  }

  private handleClientConnection(ws: WebSocket): void {
    this.clients.add(ws);

    // Send current metrics immediately
    if (this.currentMetrics) {
      this.sendToClient(ws, 'metrics', this.currentMetrics);
    }

    // Send recent alerts
    this.sendToClient(ws, 'alerts', this.alertHistory.slice(-10));

    // Send current job metrics
    this.sendToClient(ws, 'jobs', Array.from(this.jobMetrics.values()));

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      this.clients.delete(ws);
    });
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, 'pong', { timestamp: Date.now() });
        break;

      case 'subscribe':
        // Client can subscribe to specific metric types
        this.sendToClient(ws, 'subscribed', { events: message.events });
        break;

      case 'get_history':
        // Send historical metrics
        this.sendMetricsHistory(ws, message.timeRange);
        break;

      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private sendToClient(ws: WebSocket, type: string, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
      } catch (error) {
        console.error('Failed to send message to client:', error);
      }
    }
  }

  private broadcast(type: string, data: any): void {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('Failed to broadcast message:', error);
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    }
  }

  private startMetricsCollection(): void {
    // Collect system metrics every 5 seconds
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        this.currentMetrics = metrics;
        this.emit('metrics', metrics);
      } catch (error) {
        console.error('Failed to collect metrics:', error);
      }
    }, 5000);
  }

  private startMetricsBroadcast(): void {
    // Broadcast metrics to all connected clients
    this.on('metrics', (metrics) => {
      this.broadcast('metrics', metrics);
    });

    this.on('alert', (alert) => {
      this.broadcast('alert', alert);
      this.alertHistory.push(alert);

      // Keep only last 100 alerts
      if (this.alertHistory.length > 100) {
        this.alertHistory = this.alertHistory.slice(-100);
      }
    });

    this.on('job_update', (jobMetrics) => {
      this.jobMetrics.set(jobMetrics.id, jobMetrics);
      this.broadcast('job_update', jobMetrics);
    });
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    // Get database statistics
    const [
      runningJobs,
      queuedJobs,
      completedJobs,
      failedJobs,
      recentExecutions
    ] = await Promise.all([
      prisma.job.count({ where: { status: 'RUNNING' } }),
      prisma.job.count({ where: { status: 'PENDING' } }),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.job.count({ where: { status: 'FAILED' } }),
      prisma.jobExecution.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60000) // Last minute
          }
        },
        select: { duration: true, status: true }
      })
    ]);

    // Calculate performance metrics
    const avgResponseTime = recentExecutions.length > 0
      ? recentExecutions.reduce((sum, exec) => sum + (exec.duration || 0), 0) / recentExecutions.length
      : 0;

    const errorRate = recentExecutions.length > 0
      ? (recentExecutions.filter(exec => exec.status === 'FAILED').length / recentExecutions.length) * 100
      : 0;

    // Simulate system metrics (in production, use actual system monitoring)
    const systemMetrics: SystemMetrics = {
      timestamp: Date.now(),
      cpu: {
        usage: this.getSimulatedCpuUsage(),
        cores: 4
      },
      memory: {
        used: this.getSimulatedMemoryUsage(),
        total: 16 * 1024 * 1024 * 1024, // 16GB
        percentage: 0
      },
      jobs: {
        running: runningJobs,
        queued: queuedJobs,
        completed: completedJobs,
        failed: failedJobs
      },
      network: {
        requestsPerSecond: recentExecutions.length,
        responseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100
      },
      storage: {
        used: this.getSimulatedStorageUsage(),
        available: 500 * 1024 * 1024 * 1024 // 500GB
      },
      uptime: process.uptime()
    };

    systemMetrics.memory.percentage = (systemMetrics.memory.used / systemMetrics.memory.total) * 100;

    // Check for alerts
    this.checkForAlerts(systemMetrics);

    return systemMetrics;
  }

  private getSimulatedCpuUsage(): number {
    // Simulate realistic CPU usage based on job load
    const baseUsage = 15; // Base system usage
    const jobLoad = this.currentMetrics?.jobs.running || 0;
    const jobMultiplier = jobLoad * 5; // Each job adds ~5% CPU
    const randomVariation = (Math.random() - 0.5) * 10; // ±5% random variation

    return Math.max(0, Math.min(100, baseUsage + jobMultiplier + randomVariation));
  }

  private getSimulatedMemoryUsage(): number {
    // Simulate memory usage growth over time
    const baseMemory = 2 * 1024 * 1024 * 1024; // 2GB base
    const timeBasedGrowth = (Date.now() % (24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000) * 1024 * 1024 * 1024; // Daily cycle
    const jobMemory = (this.currentMetrics?.jobs.running || 0) * 100 * 1024 * 1024; // 100MB per job

    return baseMemory + timeBasedGrowth + jobMemory;
  }

  private getSimulatedStorageUsage(): number {
    // Simulate storage growth based on data points
    const baseStorage = 50 * 1024 * 1024 * 1024; // 50GB base
    const dataGrowth = Math.floor(Date.now() / 1000) * 1024; // 1KB per second

    return baseStorage + dataGrowth;
  }

  private checkForAlerts(metrics: SystemMetrics): void {
    const alerts: AlertEvent[] = [];

    // CPU usage alert
    if (metrics.cpu.usage > 90) {
      alerts.push({
        id: `cpu-high-${Date.now()}`,
        type: 'error',
        title: 'High CPU Usage',
        message: `CPU usage is at ${metrics.cpu.usage.toFixed(1)}%`,
        timestamp: Date.now(),
        severity: 'critical',
        source: 'system_monitor',
        metadata: { cpu_usage: metrics.cpu.usage }
      });
    } else if (metrics.cpu.usage > 70) {
      alerts.push({
        id: `cpu-warning-${Date.now()}`,
        type: 'warning',
        title: 'Elevated CPU Usage',
        message: `CPU usage is at ${metrics.cpu.usage.toFixed(1)}%`,
        timestamp: Date.now(),
        severity: 'medium',
        source: 'system_monitor',
        metadata: { cpu_usage: metrics.cpu.usage }
      });
    }

    // Memory usage alert
    if (metrics.memory.percentage > 85) {
      alerts.push({
        id: `memory-high-${Date.now()}`,
        type: 'error',
        title: 'High Memory Usage',
        message: `Memory usage is at ${metrics.memory.percentage.toFixed(1)}%`,
        timestamp: Date.now(),
        severity: 'high',
        source: 'system_monitor',
        metadata: { memory_percentage: metrics.memory.percentage }
      });
    }

    // Error rate alert
    if (metrics.network.errorRate > 10) {
      alerts.push({
        id: `error-rate-high-${Date.now()}`,
        type: 'error',
        title: 'High Error Rate',
        message: `Error rate is at ${metrics.network.errorRate.toFixed(1)}%`,
        timestamp: Date.now(),
        severity: 'high',
        source: 'job_monitor',
        metadata: { error_rate: metrics.network.errorRate }
      });
    }

    // Emit alerts
    for (const alert of alerts) {
      this.emit('alert', alert);
    }
  }

  private async sendMetricsHistory(ws: WebSocket, timeRange: number): Promise<void> {
    try {
      // In a production system, this would query a time-series database
      // For now, send simulated historical data
      const history = [];
      const now = Date.now();
      const interval = 60000; // 1 minute intervals

      for (let i = timeRange; i > 0; i--) {
        const timestamp = now - (i * interval);
        history.push({
          timestamp,
          cpu: { usage: Math.random() * 100 },
          memory: { percentage: Math.random() * 100 },
          jobs: { running: Math.floor(Math.random() * 10) },
          network: {
            responseTime: 500 + Math.random() * 1000,
            errorRate: Math.random() * 5
          }
        });
      }

      this.sendToClient(ws, 'metrics_history', history);
    } catch (error) {
      console.error('Failed to send metrics history:', error);
    }
  }

  // Public methods for job monitoring
  updateJobMetrics(jobId: string, metrics: Partial<JobMetrics>): void {
    const existing = this.jobMetrics.get(jobId);
    const updated = { ...existing, ...metrics } as JobMetrics;
    this.emit('job_update', updated);
  }

  createAlert(alert: Omit<AlertEvent, 'id' | 'timestamp'>): void {
    const fullAlert: AlertEvent = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.emit('alert', fullAlert);
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  getCurrentMetrics(): SystemMetrics | null {
    return this.currentMetrics;
  }

  getRecentAlerts(limit = 10): AlertEvent[] {
    return this.alertHistory.slice(-limit);
  }

  stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.clients.clear();
    console.log('Real-time monitoring system stopped');
  }
}

// Export singleton instance
export const monitoringSystem = new RealTimeMonitoringSystem();

// Utility functions for performance monitoring
export class PerformanceTracker {
  private metrics = new Map<string, number[]>();

  track(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }

    const values = this.metrics.get(metric)!;
    values.push(value);

    // Keep only last 100 values
    if (values.length > 100) {
      values.splice(0, values.length - 100);
    }
  }

  getAverage(metric: string): number {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) return 0;

    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getP95(metric: string): number {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] || 0;
  }

  reset(metric?: string): void {
    if (metric) {
      this.metrics.delete(metric);
    } else {
      this.metrics.clear();
    }
  }
}

export const performanceTracker = new PerformanceTracker();

// Initialize monitoring system
if (typeof window === 'undefined') { // Server-side only
  monitoringSystem.initialize().catch(console.error);
}
