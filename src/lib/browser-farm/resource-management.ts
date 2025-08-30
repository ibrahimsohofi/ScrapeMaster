import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

export interface ResourceQuota {
  id: string;
  organizationId: string;
  limits: {
    maxBrowsers: number;
    maxConcurrentSessions: number;
    maxMemoryMB: number;
    maxCPUCores: number;
    maxBandwidthMBps: number;
    maxStorageGB: number;
  };
  usage: {
    currentBrowsers: number;
    currentSessions: number;
    currentMemoryMB: number;
    currentCPUUsage: number;
    currentBandwidthMBps: number;
    currentStorageGB: number;
  };
  billing: {
    tier: 'free' | 'basic' | 'pro' | 'enterprise';
    costPerBrowser: number;
    costPerSession: number;
    costPerGB: number;
    monthlyBudget: number;
    currentCost: number;
  };
  policies: {
    autoScaling: AutoScalingPolicy;
    resourceAllocation: ResourceAllocationPolicy;
    costOptimization: CostOptimizationPolicy;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoScalingPolicy {
  enabled: boolean;
  minBrowsers: number;
  maxBrowsers: number;
  targetCPUUtilization: number;
  targetMemoryUtilization: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  scaleUpCooldown: number; // seconds
  scaleDownCooldown: number; // seconds
  predictiveScaling: {
    enabled: boolean;
    lookAheadWindow: number; // minutes
    confidenceThreshold: number;
  };
  timeBasedScaling: {
    enabled: boolean;
    schedules: Array<{
      days: string[]; // ['monday', 'tuesday', ...]
      startTime: string; // '09:00'
      endTime: string; // '17:00'
      minBrowsers: number;
      maxBrowsers: number;
    }>;
  };
}

export interface ResourceAllocationPolicy {
  strategy: 'balanced' | 'performance' | 'cost-optimized' | 'burst';
  prioritization: {
    cpuWeight: number;
    memoryWeight: number;
    networkWeight: number;
  };
  isolation: {
    dedicatedResources: boolean;
    sharedPoolAllowed: boolean;
    resourceLimits: {
      maxCPUPerBrowser: number;
      maxMemoryPerBrowser: number;
      maxNetworkPerBrowser: number;
    };
  };
  queueManagement: {
    maxQueueSize: number;
    queueTimeout: number; // seconds
    priorityLevels: number;
  };
}

export interface CostOptimizationPolicy {
  enabled: boolean;
  budgetAlerts: {
    thresholds: number[]; // [50, 75, 90, 100] - percentage of budget
    notificationChannels: string[];
  };
  costControl: {
    hardLimit: boolean;
    gracefulDegradation: boolean;
    suspendOnOverage: boolean;
  };
  optimization: {
    preemptibleInstances: boolean;
    spotInstances: boolean;
    rightSizing: boolean;
    idleResourceReclaim: boolean;
  };
  reporting: {
    detailedBilling: boolean;
    costBreakdown: boolean;
    optimizationSuggestions: boolean;
  };
}

export interface ScalingEvent {
  id: string;
  type: 'scale-up' | 'scale-down' | 'manual' | 'scheduled';
  trigger: string;
  fromCount: number;
  toCount: number;
  reason: string;
  timestamp: Date;
  duration: number; // milliseconds
  cost: number;
  success: boolean;
  metadata: Record<string, any>;
}

export interface ResourceMetrics {
  timestamp: Date;
  cpu: {
    utilization: number;
    cores: number;
    frequency: number;
  };
  memory: {
    used: number;
    available: number;
    utilization: number;
  };
  network: {
    inbound: number;
    outbound: number;
    latency: number;
  };
  storage: {
    used: number;
    available: number;
    iops: number;
  };
  browsers: {
    active: number;
    idle: number;
    creating: number;
    destroying: number;
  };
  cost: {
    hourly: number;
    daily: number;
    projected: number;
  };
}

export class ResourceManager extends EventEmitter {
  private quotas: Map<string, ResourceQuota> = new Map();
  private metrics: Map<string, ResourceMetrics[]> = new Map();
  private scalingEvents: Map<string, ScalingEvent[]> = new Map();
  private scalingCooldowns: Map<string, { scaleUp: Date; scaleDown: Date }> = new Map();
  private logger: winston.Logger;
  private metricsInterval?: NodeJS.Timeout;
  private scalingInterval?: NodeJS.Timeout;

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
        new winston.transports.File({ filename: 'resource-manager.log' })
      ]
    });

    this.startMetricsCollection();
    this.startAutoScaling();
  }

  // Quota Management
  async createQuota(organizationId: string, config: Partial<ResourceQuota>): Promise<string> {
    const quotaId = uuidv4();

    const defaultQuota: ResourceQuota = {
      id: quotaId,
      organizationId,
      limits: {
        maxBrowsers: 10,
        maxConcurrentSessions: 50,
        maxMemoryMB: 8192,
        maxCPUCores: 4,
        maxBandwidthMBps: 100,
        maxStorageGB: 50,
        ...config.limits
      },
      usage: {
        currentBrowsers: 0,
        currentSessions: 0,
        currentMemoryMB: 0,
        currentCPUUsage: 0,
        currentBandwidthMBps: 0,
        currentStorageGB: 0
      },
      billing: {
        tier: 'free',
        costPerBrowser: 0.10,
        costPerSession: 0.01,
        costPerGB: 0.05,
        monthlyBudget: 100,
        currentCost: 0,
        ...config.billing
      },
      policies: {
        autoScaling: this.getDefaultAutoScalingPolicy(),
        resourceAllocation: this.getDefaultResourceAllocationPolicy(),
        costOptimization: this.getDefaultCostOptimizationPolicy(),
        ...config.policies
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.quotas.set(quotaId, defaultQuota);
    this.metrics.set(quotaId, []);
    this.scalingEvents.set(quotaId, []);
    this.scalingCooldowns.set(quotaId, { scaleUp: new Date(0), scaleDown: new Date(0) });

    this.logger.info(`Created quota ${quotaId} for organization ${organizationId}`);
    this.emit('quotaCreated', defaultQuota);

    return quotaId;
  }

  async updateQuota(quotaId: string, updates: Partial<ResourceQuota>): Promise<void> {
    const quota = this.quotas.get(quotaId);
    if (!quota) throw new Error(`Quota ${quotaId} not found`);

    const updatedQuota = {
      ...quota,
      ...updates,
      updatedAt: new Date()
    };

    this.quotas.set(quotaId, updatedQuota);
    this.logger.info(`Updated quota ${quotaId}`);
    this.emit('quotaUpdated', updatedQuota);
  }

  async deleteQuota(quotaId: string): Promise<void> {
    this.quotas.delete(quotaId);
    this.metrics.delete(quotaId);
    this.scalingEvents.delete(quotaId);
    this.scalingCooldowns.delete(quotaId);

    this.logger.info(`Deleted quota ${quotaId}`);
    this.emit('quotaDeleted', quotaId);
  }

  // Resource Allocation
  async allocateResources(quotaId: string, requestedResources: {
    browsers: number;
    sessions: number;
    memoryMB: number;
    cpuCores: number;
  }): Promise<{ approved: boolean; allocated: typeof requestedResources; reason?: string }> {
    const quota = this.quotas.get(quotaId);
    if (!quota) throw new Error(`Quota ${quotaId} not found`);

    const canAllocate = this.checkResourceAvailability(quota, requestedResources);

    if (!canAllocate.approved) {
      this.logger.warn(`Resource allocation denied for quota ${quotaId}: ${canAllocate.reason}`);
      return { ...canAllocate, allocated: requestedResources };
    }

    // Update usage
    quota.usage.currentBrowsers += requestedResources.browsers;
    quota.usage.currentSessions += requestedResources.sessions;
    quota.usage.currentMemoryMB += requestedResources.memoryMB;
    quota.usage.currentCPUUsage += requestedResources.cpuCores;

    // Update cost
    const additionalCost = this.calculateCost(requestedResources, quota.billing);
    quota.billing.currentCost += additionalCost;

    this.quotas.set(quotaId, quota);
    this.logger.info(`Allocated resources for quota ${quotaId}: ${JSON.stringify(requestedResources)}`);
    this.emit('resourcesAllocated', { quotaId, resources: requestedResources, cost: additionalCost });

    return { approved: true, allocated: requestedResources };
  }

  async deallocateResources(quotaId: string, releasedResources: {
    browsers: number;
    sessions: number;
    memoryMB: number;
    cpuCores: number;
  }): Promise<void> {
    const quota = this.quotas.get(quotaId);
    if (!quota) throw new Error(`Quota ${quotaId} not found`);

    // Update usage
    quota.usage.currentBrowsers = Math.max(0, quota.usage.currentBrowsers - releasedResources.browsers);
    quota.usage.currentSessions = Math.max(0, quota.usage.currentSessions - releasedResources.sessions);
    quota.usage.currentMemoryMB = Math.max(0, quota.usage.currentMemoryMB - releasedResources.memoryMB);
    quota.usage.currentCPUUsage = Math.max(0, quota.usage.currentCPUUsage - releasedResources.cpuCores);

    this.quotas.set(quotaId, quota);
    this.logger.info(`Deallocated resources for quota ${quotaId}: ${JSON.stringify(releasedResources)}`);
    this.emit('resourcesDeallocated', { quotaId, resources: releasedResources });
  }

  // Auto-scaling
  private startAutoScaling(): void {
    this.scalingInterval = setInterval(async () => {
      for (const [quotaId, quota] of this.quotas) {
        if (quota.policies.autoScaling.enabled) {
          await this.evaluateScaling(quotaId);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private async evaluateScaling(quotaId: string): Promise<void> {
    const quota = this.quotas.get(quotaId);
    if (!quota) return;

    const metrics = this.getCurrentMetrics(quotaId);
    const cooldowns = this.scalingCooldowns.get(quotaId);
    if (!metrics || !cooldowns) return;

    const policy = quota.policies.autoScaling;
    const now = new Date();

    // Check cooldown periods
    const scaleUpReady = now.getTime() - cooldowns.scaleUp.getTime() > policy.scaleUpCooldown * 1000;
    const scaleDownReady = now.getTime() - cooldowns.scaleDown.getTime() > policy.scaleDownCooldown * 1000;

    // Evaluate scaling triggers
    const cpuUtilization = metrics.cpu.utilization;
    const memoryUtilization = metrics.memory.utilization;
    const currentBrowsers = quota.usage.currentBrowsers;

    // Time-based scaling
    if (policy.timeBasedScaling.enabled) {
      const timeBasedAction = this.evaluateTimeBasedScaling(policy);
      if (timeBasedAction) {
        await this.executeScaling(quotaId, timeBasedAction.type, timeBasedAction.targetCount, 'scheduled');
        return;
      }
    }

    // Predictive scaling
    if (policy.predictiveScaling.enabled) {
      const predictedLoad = await this.predictFutureLoad(quotaId);
      if (predictedLoad.confidence > policy.predictiveScaling.confidenceThreshold) {
        const predictiveAction = this.evaluatePredictiveScaling(predictedLoad, policy, currentBrowsers);
        if (predictiveAction) {
          await this.executeScaling(quotaId, predictiveAction.type, predictiveAction.targetCount, 'predictive');
          return;
        }
      }
    }

    // Performance-based scaling
    const avgUtilization = (cpuUtilization + memoryUtilization) / 2;

    if (avgUtilization > policy.scaleUpThreshold && scaleUpReady && currentBrowsers < policy.maxBrowsers) {
      const targetCount = Math.min(policy.maxBrowsers, Math.ceil(currentBrowsers * 1.5));
      await this.executeScaling(quotaId, 'scale-up', targetCount, `High utilization: ${avgUtilization.toFixed(1)}%`);
    } else if (avgUtilization < policy.scaleDownThreshold && scaleDownReady && currentBrowsers > policy.minBrowsers) {
      const targetCount = Math.max(policy.minBrowsers, Math.floor(currentBrowsers * 0.7));
      await this.executeScaling(quotaId, 'scale-down', targetCount, `Low utilization: ${avgUtilization.toFixed(1)}%`);
    }
  }

  private async executeScaling(quotaId: string, type: 'scale-up' | 'scale-down', targetCount: number, reason: string): Promise<void> {
    const quota = this.quotas.get(quotaId);
    if (!quota) return;

    const startTime = Date.now();
    const fromCount = quota.usage.currentBrowsers;
    const scalingEvent: ScalingEvent = {
      id: uuidv4(),
      type,
      trigger: reason,
      fromCount,
      toCount: targetCount,
      reason,
      timestamp: new Date(),
      duration: 0,
      cost: 0,
      success: false,
      metadata: {}
    };

    try {
      // Check cost constraints
      const costCheck = await this.checkCostConstraints(quotaId, targetCount - fromCount);
      if (!costCheck.approved) {
        scalingEvent.success = false;
        scalingEvent.reason = `Cost constraint: ${costCheck.reason}`;
        this.addScalingEvent(quotaId, scalingEvent);
        return;
      }

      // Execute the scaling
      if (type === 'scale-up') {
        await this.scaleUp(quotaId, targetCount - fromCount);
      } else {
        await this.scaleDown(quotaId, fromCount - targetCount);
      }

      scalingEvent.success = true;
      scalingEvent.duration = Date.now() - startTime;
      scalingEvent.cost = costCheck.estimatedCost;

      // Update cooldown
      const cooldowns = this.scalingCooldowns.get(quotaId);
      if (cooldowns) {
        if (type === 'scale-up') {
          cooldowns.scaleUp = new Date();
        } else {
          cooldowns.scaleDown = new Date();
        }
        this.scalingCooldowns.set(quotaId, cooldowns);
      }

      this.logger.info(`Scaling ${type} completed for quota ${quotaId}: ${fromCount} -> ${targetCount}`);
      this.emit('scalingCompleted', scalingEvent);
    } catch (error) {
      scalingEvent.success = false;
      scalingEvent.reason = `Error: ${error}`;
      scalingEvent.duration = Date.now() - startTime;

      this.logger.error(`Scaling ${type} failed for quota ${quotaId}: ${error}`);
      this.emit('scalingFailed', scalingEvent);
    }

    this.addScalingEvent(quotaId, scalingEvent);
  }

  // Cost Management
  private async checkCostConstraints(quotaId: string, browserDelta: number): Promise<{ approved: boolean; reason?: string; estimatedCost: number }> {
    const quota = this.quotas.get(quotaId);
    if (!quota) return { approved: false, reason: 'Quota not found', estimatedCost: 0 };

    const estimatedCost = browserDelta * quota.billing.costPerBrowser;
    const projectedCost = quota.billing.currentCost + estimatedCost;

    // Check budget limits
    if (quota.policies.costOptimization.costControl.hardLimit &&
        projectedCost > quota.billing.monthlyBudget) {
      return {
        approved: false,
        reason: `Would exceed monthly budget: $${projectedCost.toFixed(2)} > $${quota.billing.monthlyBudget}`,
        estimatedCost
      };
    }

    // Check budget alerts
    const budgetUtilization = (projectedCost / quota.billing.monthlyBudget) * 100;
    for (const threshold of quota.policies.costOptimization.budgetAlerts.thresholds) {
      if (budgetUtilization > threshold) {
        this.emit('budgetAlert', {
          quotaId,
          threshold,
          currentUtilization: budgetUtilization,
          projectedCost,
          budget: quota.billing.monthlyBudget
        });
      }
    }

    return { approved: true, estimatedCost };
  }

  // Metrics Collection
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      for (const quotaId of this.quotas.keys()) {
        this.collectMetrics(quotaId);
      }
    }, 60000); // Collect every minute
  }

  private collectMetrics(quotaId: string): void {
    const quota = this.quotas.get(quotaId);
    if (!quota) return;

    const metrics: ResourceMetrics = {
      timestamp: new Date(),
      cpu: {
        utilization: Math.random() * 100, // Simulated - replace with actual monitoring
        cores: quota.usage.currentCPUUsage,
        frequency: 2400 + Math.random() * 400
      },
      memory: {
        used: quota.usage.currentMemoryMB,
        available: quota.limits.maxMemoryMB - quota.usage.currentMemoryMB,
        utilization: (quota.usage.currentMemoryMB / quota.limits.maxMemoryMB) * 100
      },
      network: {
        inbound: Math.random() * 50,
        outbound: Math.random() * 30,
        latency: 10 + Math.random() * 40
      },
      storage: {
        used: quota.usage.currentStorageGB,
        available: quota.limits.maxStorageGB - quota.usage.currentStorageGB,
        iops: Math.floor(Math.random() * 1000)
      },
      browsers: {
        active: quota.usage.currentBrowsers,
        idle: Math.floor(quota.usage.currentBrowsers * 0.2),
        creating: 0,
        destroying: 0
      },
      cost: {
        hourly: quota.billing.currentCost / 24,
        daily: quota.billing.currentCost,
        projected: quota.billing.currentCost * 30
      }
    };

    const quotaMetrics = this.metrics.get(quotaId) || [];
    quotaMetrics.push(metrics);

    // Keep only last 24 hours of metrics
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentMetrics = quotaMetrics.filter(m => m.timestamp > oneDayAgo);

    this.metrics.set(quotaId, recentMetrics);
  }

  // Utility Methods
  private checkResourceAvailability(quota: ResourceQuota, requested: any): { approved: boolean; reason?: string } {
    if (quota.usage.currentBrowsers + requested.browsers > quota.limits.maxBrowsers) {
      return { approved: false, reason: 'Browser limit exceeded' };
    }
    if (quota.usage.currentSessions + requested.sessions > quota.limits.maxConcurrentSessions) {
      return { approved: false, reason: 'Session limit exceeded' };
    }
    if (quota.usage.currentMemoryMB + requested.memoryMB > quota.limits.maxMemoryMB) {
      return { approved: false, reason: 'Memory limit exceeded' };
    }
    if (quota.usage.currentCPUUsage + requested.cpuCores > quota.limits.maxCPUCores) {
      return { approved: false, reason: 'CPU limit exceeded' };
    }
    return { approved: true };
  }

  private calculateCost(resources: any, billing: ResourceQuota['billing']): number {
    return (resources.browsers * billing.costPerBrowser) +
           (resources.sessions * billing.costPerSession);
  }

  private getCurrentMetrics(quotaId: string): ResourceMetrics | null {
    const metrics = this.metrics.get(quotaId);
    return metrics && metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }

  private addScalingEvent(quotaId: string, event: ScalingEvent): void {
    const events = this.scalingEvents.get(quotaId) || [];
    events.push(event);

    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }

    this.scalingEvents.set(quotaId, events);
  }

  private async scaleUp(quotaId: string, count: number): Promise<void> {
    // Implementation would integrate with browser pool
    this.logger.info(`Scaling up ${count} browsers for quota ${quotaId}`);
  }

  private async scaleDown(quotaId: string, count: number): Promise<void> {
    // Implementation would integrate with browser pool
    this.logger.info(`Scaling down ${count} browsers for quota ${quotaId}`);
  }

  // Default Policies
  private getDefaultAutoScalingPolicy(): AutoScalingPolicy {
    return {
      enabled: true,
      minBrowsers: 1,
      maxBrowsers: 10,
      targetCPUUtilization: 70,
      targetMemoryUtilization: 80,
      scaleUpThreshold: 80,
      scaleDownThreshold: 30,
      scaleUpCooldown: 300,
      scaleDownCooldown: 600,
      predictiveScaling: {
        enabled: false,
        lookAheadWindow: 15,
        confidenceThreshold: 0.8
      },
      timeBasedScaling: {
        enabled: false,
        schedules: []
      }
    };
  }

  private getDefaultResourceAllocationPolicy(): ResourceAllocationPolicy {
    return {
      strategy: 'balanced',
      prioritization: {
        cpuWeight: 0.4,
        memoryWeight: 0.4,
        networkWeight: 0.2
      },
      isolation: {
        dedicatedResources: false,
        sharedPoolAllowed: true,
        resourceLimits: {
          maxCPUPerBrowser: 1,
          maxMemoryPerBrowser: 512,
          maxNetworkPerBrowser: 10
        }
      },
      queueManagement: {
        maxQueueSize: 100,
        queueTimeout: 300,
        priorityLevels: 3
      }
    };
  }

  private getDefaultCostOptimizationPolicy(): CostOptimizationPolicy {
    return {
      enabled: true,
      budgetAlerts: {
        thresholds: [50, 75, 90, 100],
        notificationChannels: []
      },
      costControl: {
        hardLimit: false,
        gracefulDegradation: true,
        suspendOnOverage: false
      },
      optimization: {
        preemptibleInstances: false,
        spotInstances: false,
        rightSizing: true,
        idleResourceReclaim: true
      },
      reporting: {
        detailedBilling: true,
        costBreakdown: true,
        optimizationSuggestions: true
      }
    };
  }

  private evaluateTimeBasedScaling(policy: AutoScalingPolicy): { type: 'scale-up' | 'scale-down'; targetCount: number } | null {
    // Implementation for time-based scaling
    return null;
  }

  private async predictFutureLoad(quotaId: string): Promise<{ confidence: number; predictedLoad: number }> {
    // Implementation for predictive scaling
    return { confidence: 0.5, predictedLoad: 50 };
  }

  private evaluatePredictiveScaling(prediction: any, policy: AutoScalingPolicy, currentBrowsers: number): { type: 'scale-up' | 'scale-down'; targetCount: number } | null {
    // Implementation for predictive scaling evaluation
    return null;
  }

  // Public API
  getQuota(quotaId: string): ResourceQuota | undefined {
    return this.quotas.get(quotaId);
  }

  getMetrics(quotaId: string, since?: Date): ResourceMetrics[] {
    const metrics = this.metrics.get(quotaId) || [];
    if (since) {
      return metrics.filter(m => m.timestamp >= since);
    }
    return metrics;
  }

  getScalingEvents(quotaId: string, limit = 10): ScalingEvent[] {
    const events = this.scalingEvents.get(quotaId) || [];
    return events.slice(-limit);
  }

  async shutdown(): Promise<void> {
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.scalingInterval) clearInterval(this.scalingInterval);
    this.logger.info('Resource manager shutdown complete');
  }
}
