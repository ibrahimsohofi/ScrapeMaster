import { EventEmitter } from 'events';
import winston from 'winston';

// SLA Monitoring Interfaces
export interface SLATarget {
  id: string;
  name: string;
  description: string;
  type: 'uptime' | 'response_time' | 'throughput' | 'error_rate' | 'availability';
  target: number;
  unit: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeframe: 'monthly' | 'weekly' | 'daily' | 'hourly';
  createdAt: Date;
  updatedAt: Date;
}

export interface SLAMeasurement {
  id: string;
  targetId: string;
  timestamp: Date;
  value: number;
  status: 'meeting' | 'at-risk' | 'breached';
  trend: 'improving' | 'stable' | 'degrading';
  impact: string;
  metadata?: Record<string, any>;
}

export interface SLAIncident {
  id: string;
  targetId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'postmortem';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  impactDescription: string;
  rootCause?: string;
  resolution?: string;
  assignee?: string;
  tags: string[];
}

export interface SLAReport {
  period: { start: Date; end: Date };
  targets: {
    targetId: string;
    name: string;
    target: number;
    achieved: number;
    compliance: number;
    breaches: number;
    incidents: SLAIncident[];
    trend: 'improving' | 'stable' | 'degrading';
  }[];
  summary: {
    overallCompliance: number;
    totalIncidents: number;
    totalDowntime: number;
    averageResponseTime: number;
    businessImpact: string;
  };
}

export interface UptimeCalculation {
  totalTime: number;
  downtime: number;
  uptime: number;
  uptimePercentage: number;
  incidents: number;
  meanTimeToRecovery: number;
  meanTimeBetweenFailures: number;
}

export interface AlertingRule {
  id: string;
  targetId: string;
  condition: 'threshold' | 'trend' | 'anomaly';
  threshold?: number;
  lookbackPeriod: number;
  channels: string[];
  escalationPolicy?: string;
  enabled: boolean;
}

// Enhanced SLA Uptime Monitor
export class EnhancedSLAUptimeMonitor extends EventEmitter {
  private targets: Map<string, SLATarget> = new Map();
  private measurements: Map<string, SLAMeasurement[]> = new Map();
  private incidents: Map<string, SLAIncident[]> = new Map();
  private alertingRules: Map<string, AlertingRule[]> = new Map();
  private logger: winston.Logger;
  private isMonitoring = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private reportInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/sla-monitoring.log' })
      ]
    });

    this.initializeDefaultTargets();
  }

  // Initialize default enterprise SLA targets
  private initializeDefaultTargets(): void {
    const defaultTargets: SLATarget[] = [
      {
        id: 'uptime-target',
        name: 'System Uptime',
        description: 'Overall system availability target',
        type: 'uptime',
        target: 99.9,
        unit: '%',
        priority: 'critical',
        timeframe: 'monthly',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'response-time-target',
        name: 'API Response Time',
        description: 'Average API response time under load',
        type: 'response_time',
        target: 200,
        unit: 'ms',
        priority: 'high',
        timeframe: 'hourly',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'throughput-target',
        name: 'Scraping Throughput',
        description: 'Minimum requests processed per minute',
        type: 'throughput',
        target: 100,
        unit: 'req/min',
        priority: 'medium',
        timeframe: 'hourly',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'error-rate-target',
        name: 'Error Rate',
        description: 'Maximum acceptable error rate',
        type: 'error_rate',
        target: 2.0,
        unit: '%',
        priority: 'high',
        timeframe: 'hourly',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultTargets.forEach(target => {
      this.addSLATarget(target);
    });
  }

  // Add SLA target
  addSLATarget(target: SLATarget): void {
    this.targets.set(target.id, target);
    this.measurements.set(target.id, []);
    this.incidents.set(target.id, []);
    this.alertingRules.set(target.id, []);

    this.logger.info(`Added SLA target: ${target.name}`, { targetId: target.id });
    this.emit('targetAdded', target);
  }

  // Record SLA measurement
  recordMeasurement(targetId: string, value: number, metadata?: Record<string, any>): void {
    const target = this.targets.get(targetId);
    if (!target) {
      this.logger.warn(`Target not found: ${targetId}`);
      return;
    }

    const measurement: SLAMeasurement = {
      id: `measurement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      targetId,
      timestamp: new Date(),
      value,
      status: this.calculateStatus(target, value),
      trend: this.calculateTrend(targetId, value),
      impact: this.calculateImpact(target, value),
      metadata
    };

    const measurements = this.measurements.get(targetId) || [];
    measurements.push(measurement);

    // Keep only last 10000 measurements per target
    if (measurements.length > 10000) {
      measurements.shift();
    }

    this.measurements.set(targetId, measurements);

    // Check for SLA breaches
    if (measurement.status === 'breached') {
      this.handleSLABreach(target, measurement);
    }

    this.emit('measurementRecorded', measurement);
  }

  // Calculate uptime metrics for a given period
  calculateUptimeMetrics(targetId: string, startTime: Date, endTime: Date): UptimeCalculation {
    const incidents = this.getIncidentsInPeriod(targetId, startTime, endTime);
    const totalTime = endTime.getTime() - startTime.getTime();

    let totalDowntime = 0;
    incidents.forEach(incident => {
      if (incident.duration) {
        totalDowntime += incident.duration;
      } else if (incident.endTime) {
        totalDowntime += incident.endTime.getTime() - incident.startTime.getTime();
      }
    });

    const uptime = totalTime - totalDowntime;
    const uptimePercentage = (uptime / totalTime) * 100;

    const meanTimeToRecovery = incidents.length > 0
      ? totalDowntime / incidents.length
      : 0;

    const meanTimeBetweenFailures = incidents.length > 1
      ? totalTime / (incidents.length - 1)
      : totalTime;

    return {
      totalTime,
      downtime: totalDowntime,
      uptime,
      uptimePercentage,
      incidents: incidents.length,
      meanTimeToRecovery,
      meanTimeBetweenFailures
    };
  }

  // Generate comprehensive SLA report
  generateSLAReport(startTime: Date, endTime: Date): SLAReport {
    const targets: SLAReport['targets'] = [];
    let totalIncidents = 0;
    let totalDowntime = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    this.targets.forEach((target, targetId) => {
      const uptimeMetrics = this.calculateUptimeMetrics(targetId, startTime, endTime);
      const incidents = this.getIncidentsInPeriod(targetId, startTime, endTime);
      const measurements = this.getMeasurementsInPeriod(targetId, startTime, endTime);

      let achieved = 0;
      if (target.type === 'uptime' || target.type === 'availability') {
        achieved = uptimeMetrics.uptimePercentage;
      } else if (measurements.length > 0) {
        const sum = measurements.reduce((acc, m) => acc + m.value, 0);
        achieved = sum / measurements.length;
      }

      const compliance = target.type === 'error_rate'
        ? achieved <= target.target ? 100 : (target.target / achieved) * 100
        : (achieved / target.target) * 100;

      targets.push({
        targetId,
        name: target.name,
        target: target.target,
        achieved,
        compliance: Math.min(100, Math.max(0, compliance)),
        breaches: incidents.filter(i => i.severity === 'high' || i.severity === 'critical').length,
        incidents,
        trend: this.calculateTrend(targetId, achieved)
      });

      totalIncidents += incidents.length;
      totalDowntime += uptimeMetrics.downtime;

      if (target.type === 'response_time') {
        totalResponseTime += achieved;
        responseTimeCount++;
      }
    });

    const overallCompliance = targets.length > 0
      ? targets.reduce((sum, t) => sum + t.compliance, 0) / targets.length
      : 100;

    const averageResponseTime = responseTimeCount > 0
      ? totalResponseTime / responseTimeCount
      : 0;

    return {
      period: { start: startTime, end: endTime },
      targets,
      summary: {
        overallCompliance,
        totalIncidents,
        totalDowntime,
        averageResponseTime,
        businessImpact: this.calculateBusinessImpact(overallCompliance, totalIncidents)
      }
    };
  }

  // Start monitoring
  startMonitoring(checkIntervalMs = 60000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.checkInterval = setInterval(() => {
      this.performHealthChecks();
    }, checkIntervalMs);

    // Generate reports every hour
    this.reportInterval = setInterval(() => {
      this.generateHourlyReport();
    }, 3600000);

    this.logger.info('SLA monitoring started');
    this.emit('monitoringStarted');
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }

    this.logger.info('SLA monitoring stopped');
    this.emit('monitoringStopped');
  }

  // Perform health checks for all targets
  private async performHealthChecks(): Promise<void> {
    try {
      for (const [targetId, target] of this.targets) {
        let value = 0;

        switch (target.type) {
          case 'uptime':
          case 'availability':
            value = await this.checkSystemAvailability();
            break;
          case 'response_time':
            value = await this.checkResponseTime();
            break;
          case 'throughput':
            value = await this.checkThroughput();
            break;
          case 'error_rate':
            value = await this.checkErrorRate();
            break;
        }

        this.recordMeasurement(targetId, value, {
          source: 'health_check',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      this.logger.error('Health check failed:', error);
    }
  }

  // Check system availability
  private async checkSystemAvailability(): Promise<number> {
    try {
      // In a real implementation, this would check various system endpoints
      // For now, simulate based on current system status
      const cpuUsage = await this.getCPUUsage();
      const memoryUsage = await this.getMemoryUsage();

      // Simple availability calculation based on resource usage
      if (cpuUsage > 90 || memoryUsage > 95) {
        return 95; // Degraded performance
      } else if (cpuUsage > 80 || memoryUsage > 90) {
        return 98; // Warning state
      }

      return 99.95; // Healthy state
    } catch (error) {
      this.logger.error('Failed to check system availability:', error);
      return 0; // System down
    }
  }

  // Check response time
  private async checkResponseTime(): Promise<number> {
    try {
      const start = Date.now();
      // Simulate API call (in production, make actual calls to endpoints)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      return Date.now() - start;
    } catch (error) {
      this.logger.error('Failed to check response time:', error);
      return 5000; // Timeout
    }
  }

  // Check throughput
  private async checkThroughput(): Promise<number> {
    try {
      // In production, this would query actual metrics from the scraping system
      return 120 + Math.random() * 50; // Simulate 120-170 req/min
    } catch (error) {
      this.logger.error('Failed to check throughput:', error);
      return 0;
    }
  }

  // Check error rate
  private async checkErrorRate(): Promise<number> {
    try {
      // In production, this would calculate from actual error logs
      return Math.random() * 3; // Simulate 0-3% error rate
    } catch (error) {
      this.logger.error('Failed to check error rate:', error);
      return 100; // All requests failing
    }
  }

  // Calculate status based on target and value
  private calculateStatus(target: SLATarget, value: number): 'meeting' | 'at-risk' | 'breached' {
    const threshold = target.target;
    const warningThreshold = target.type === 'error_rate'
      ? threshold * 0.8  // 80% of error rate target
      : threshold * 0.95; // 95% of other targets

    if (target.type === 'error_rate') {
      if (value <= warningThreshold) return 'meeting';
      if (value <= threshold) return 'at-risk';
      return 'breached';
    } else {
      if (value >= threshold) return 'meeting';
      if (value >= warningThreshold) return 'at-risk';
      return 'breached';
    }
  }

  // Calculate trend based on recent measurements
  private calculateTrend(targetId: string, currentValue: number): 'improving' | 'stable' | 'degrading' {
    const measurements = this.measurements.get(targetId) || [];
    if (measurements.length < 3) return 'stable';

    const recent = measurements.slice(-3);
    const trend = recent.reduce((acc, m, i) => {
      if (i === 0) return acc;
      return acc + (m.value - recent[i-1].value);
    }, 0);

    const target = this.targets.get(targetId);
    if (!target) return 'stable';

    if (target.type === 'error_rate') {
      if (trend < -0.5) return 'improving';
      if (trend > 0.5) return 'degrading';
    } else {
      if (trend > 0.5) return 'improving';
      if (trend < -0.5) return 'degrading';
    }

    return 'stable';
  }

  // Calculate impact description
  private calculateImpact(target: SLATarget, value: number): string {
    const status = this.calculateStatus(target, value);

    switch (status) {
      case 'meeting':
        return 'No impact - target is being met';
      case 'at-risk':
        return `Warning - ${target.name} approaching threshold`;
      case 'breached':
        return `Critical - ${target.name} SLA breached, immediate attention required`;
      default:
        return 'Unknown impact';
    }
  }

  // Handle SLA breach
  private handleSLABreach(target: SLATarget, measurement: SLAMeasurement): void {
    const incident: SLAIncident = {
      id: `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      targetId: target.id,
      title: `SLA Breach: ${target.name}`,
      description: `${target.name} has breached its SLA target of ${target.target}${target.unit}. Current value: ${measurement.value}${target.unit}`,
      severity: target.priority === 'critical' ? 'critical' : 'high',
      status: 'open',
      startTime: measurement.timestamp,
      impactDescription: measurement.impact,
      assignee: undefined,
      tags: ['sla-breach', target.type, target.priority]
    };

    const incidents = this.incidents.get(target.id) || [];
    incidents.push(incident);
    this.incidents.set(target.id, incidents);

    this.logger.error(`SLA breach detected: ${target.name}`, {
      targetId: target.id,
      value: measurement.value,
      target: target.target,
      incidentId: incident.id
    });

    this.emit('slaBreach', { target, measurement, incident });
  }

  // Get incidents in a time period
  private getIncidentsInPeriod(targetId: string, startTime: Date, endTime: Date): SLAIncident[] {
    const incidents = this.incidents.get(targetId) || [];
    return incidents.filter(incident =>
      incident.startTime >= startTime && incident.startTime <= endTime
    );
  }

  // Get measurements in a time period
  private getMeasurementsInPeriod(targetId: string, startTime: Date, endTime: Date): SLAMeasurement[] {
    const measurements = this.measurements.get(targetId) || [];
    return measurements.filter(measurement =>
      measurement.timestamp >= startTime && measurement.timestamp <= endTime
    );
  }

  // Calculate business impact
  private calculateBusinessImpact(compliance: number, incidents: number): string {
    if (compliance >= 99.5 && incidents <= 2) {
      return 'Minimal business impact - SLAs consistently met';
    } else if (compliance >= 98.0 && incidents <= 5) {
      return 'Low business impact - Minor service degradation';
    } else if (compliance >= 95.0 && incidents <= 10) {
      return 'Moderate business impact - Service quality affected';
    } else {
      return 'High business impact - Significant service disruption';
    }
  }

  // Generate hourly report
  private generateHourlyReport(): void {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 3600000); // 1 hour ago

    const report = this.generateSLAReport(startTime, endTime);

    this.logger.info('Generated hourly SLA report', {
      period: report.period,
      compliance: report.summary.overallCompliance,
      incidents: report.summary.totalIncidents
    });

    this.emit('hourlyReport', report);
  }

  // Utility methods for system metrics (mock implementations)
  private async getCPUUsage(): Promise<number> {
    // Mock CPU usage - in production, get from system metrics
    return 45 + Math.random() * 20;
  }

  private async getMemoryUsage(): Promise<number> {
    // Mock memory usage - in production, get from system metrics
    return 60 + Math.random() * 15;
  }

  // Public API methods
  getAllTargets(): SLATarget[] {
    return Array.from(this.targets.values());
  }

  getTarget(targetId: string): SLATarget | undefined {
    return this.targets.get(targetId);
  }

  getRecentMeasurements(targetId: string, limit = 100): SLAMeasurement[] {
    const measurements = this.measurements.get(targetId) || [];
    return measurements.slice(-limit);
  }

  getCurrentStatus(): { [targetId: string]: { status: string; value: number; target: number } } {
    const status: { [targetId: string]: { status: string; value: number; target: number } } = {};

    this.targets.forEach((target, targetId) => {
      const measurements = this.measurements.get(targetId) || [];
      const latest = measurements[measurements.length - 1];

      status[targetId] = {
        status: latest?.status || 'unknown',
        value: latest?.value || 0,
        target: target.target
      };
    });

    return status;
  }
}

// Create singleton instance
export const slaMonitor = new EnhancedSLAUptimeMonitor();
