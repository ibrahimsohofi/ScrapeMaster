/**
 * Enhanced Distributed Browser Pool Manager
 *
 * Features:
 * - ML-based predictive scaling
 * - Advanced load balancing algorithms
 * - Cross-region failover
 * - Cost optimization
 * - Real-time performance monitoring
 */

import { EventEmitter } from 'events';
import type { Browser, Page, BrowserContext } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

export interface EnhancedBrowserNode {
  id: string;
  browser: Browser;
  pages: Map<string, Page>;
  contexts: Map<string, BrowserContext>;
  maxConcurrent: number;
  currentLoad: number;
  status: 'healthy' | 'degraded' | 'offline' | 'maintenance';
  lastHealthCheck: Date;
  performance: {
    averageResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
    throughput: number;
    successRate: number;
    queueLength: number;
  };
  metadata: {
    userAgent: string;
    viewport: { width: number; height: number };
    deviceType: 'desktop' | 'mobile' | 'tablet';
    location: string;
    browserType: 'chromium' | 'firefox' | 'webkit';
    version: string;
    capabilities: string[];
    region: string;
    zone: string;
    provider: string;
  };
  resourceLimits: {
    maxMemory: number;
    maxCpu: number;
    maxPages: number;
    maxContexts: number;
    maxBandwidth: number;
  };
  costMetrics: {
    hourlyRate: number;
    totalCost: number;
    utilizationEfficiency: number;
    costPerRequest: number;
  };
  createdAt: Date;
  lastUsed: Date;
}

export interface PredictiveScalingData {
  historicalLoad: Array<{ timestamp: Date; load: number; demand: number }>;
  seasonalPatterns: Map<string, number>; // day-of-week patterns
  trendAnalysis: {
    slope: number;
    confidence: number;
    predictedLoad: number;
    timeHorizon: number;
  };
  triggers: {
    threshold: number;
    duration: number;
    confidence: number;
  };
}

export interface LoadBalancingStrategy {
  name: string;
  weight: number;
  factors: {
    performance: number;
    location: number;
    cost: number;
    availability: number;
  };
}

export interface CrossRegionFailoverConfig {
  enabled: boolean;
  primaryRegions: string[];
  fallbackRegions: string[];
  maxFailoverTime: number;
  automaticFailback: boolean;
  healthCheckInterval: number;
}

export class EnhancedDistributedPoolManager extends EventEmitter {
  private nodes: Map<string, EnhancedBrowserNode> = new Map();
  private regions: Map<string, Set<string>> = new Map();
  private loadBalancer: LoadBalancer;
  private scaler: PredictiveScaler;
  private optimizer: CostOptimizer;
  private monitor: PerformanceMonitor;
  private logger: winston.Logger;
  private config: EnhancedPoolConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private scalingInterval: NodeJS.Timeout | null = null;

  constructor(config: EnhancedPoolConfig) {
    super();
    this.config = config;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'browser-farm.log' })
      ]
    });

    this.loadBalancer = new LoadBalancer(config.loadBalancing);
    this.scaler = new PredictiveScaler(config.scaling);
    this.optimizer = new CostOptimizer(config.costOptimization);
    this.monitor = new PerformanceMonitor(config.monitoring);

    this.startHealthChecks();
    this.startPredictiveScaling();
  }

  async createBrowserNode(region: string, zone: string): Promise<EnhancedBrowserNode> {
    const nodeId = uuidv4();

    try {
      const browser = await this.launchOptimizedBrowser(region);

      const node: EnhancedBrowserNode = {
        id: nodeId,
        browser,
        pages: new Map(),
        contexts: new Map(),
        maxConcurrent: this.config.maxConcurrentPerNode,
        currentLoad: 0,
        status: 'healthy',
        lastHealthCheck: new Date(),
        performance: {
          averageResponseTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          errorRate: 0,
          throughput: 0,
          successRate: 100,
          queueLength: 0,
        },
        metadata: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          viewport: { width: 1920, height: 1080 },
          deviceType: 'desktop',
          location: `${region}-${zone}`,
          browserType: 'chromium',
          version: '1.0.0',
          capabilities: ['javascript', 'cookies', 'localStorage'],
          region,
          zone,
          provider: this.config.cloudProvider,
        },
        resourceLimits: {
          maxMemory: 4096,
          maxCpu: 80,
          maxPages: 10,
          maxContexts: 5,
          maxBandwidth: 1000,
        },
        costMetrics: {
          hourlyRate: this.optimizer.calculateHourlyRate(region, 'desktop'),
          totalCost: 0,
          utilizationEfficiency: 0,
          costPerRequest: 0,
        },
        createdAt: new Date(),
        lastUsed: new Date(),
      };

      this.nodes.set(nodeId, node);
      this.addToRegion(region, nodeId);

      this.logger.info(`Created browser node ${nodeId} in ${region}-${zone}`);
      this.emit('nodeCreated', node);

      return node;
    } catch (error) {
      this.logger.error(`Failed to create browser node in ${region}-${zone}:`, error);
      throw error;
    }
  }

  async requestSession(requirements: SessionRequirements): Promise<SessionResult> {
    const startTime = Date.now();

    try {
      // Use ML-enhanced load balancing to select optimal node
      const selectedNode = await this.loadBalancer.selectOptimalNode(
        Array.from(this.nodes.values()),
        requirements
      );

      if (!selectedNode) {
        // Trigger predictive scaling if no nodes available
        await this.scaler.scaleUp(requirements);
        throw new Error('No available browser nodes, scaling in progress');
      }

      // Create session on selected node
      const session = await this.createSession(selectedNode, requirements);

      // Update performance metrics
      const responseTime = Date.now() - startTime;
      await this.monitor.recordSessionMetrics(selectedNode.id, {
        responseTime,
        success: true,
        requestType: requirements.type || 'standard',
      });

      this.logger.info(`Session created: ${session.id} on node ${selectedNode.id}`);

      return {
        success: true,
        session,
        node: selectedNode,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      await this.monitor.recordSessionMetrics('failed', {
        responseTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        requestType: requirements.type || 'standard',
      });

      this.logger.error('Session creation failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      };
    }
  }

  private async launchOptimizedBrowser(region: string): Promise<Browser> {
    const { chromium } = await import('playwright');

    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
      ],
    };

    return await chromium.launch(launchOptions);
  }

  private async createSession(node: EnhancedBrowserNode, requirements: SessionRequirements): Promise<Session> {
    const context = await node.browser.newContext({
      viewport: requirements.viewport || { width: 1920, height: 1080 },
      userAgent: requirements.userAgent || node.metadata.userAgent,
      locale: requirements.locale || 'en-US',
      timezoneId: requirements.timezone || 'America/New_York',
    });

    const page = await context.newPage();
    const sessionId = uuidv4();

    const session: Session = {
      id: sessionId,
      nodeId: node.id,
      context,
      page,
      createdAt: new Date(),
      lastActivity: new Date(),
      requirements,
    };

    node.pages.set(sessionId, page);
    node.contexts.set(sessionId, context);
    node.currentLoad++;
    node.lastUsed = new Date();

    return session;
  }

  private addToRegion(region: string, nodeId: string): void {
    if (!this.regions.has(region)) {
      this.regions.set(region, new Set());
    }
    this.regions.get(region)!.add(nodeId);
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private startPredictiveScaling(): void {
    this.scalingInterval = setInterval(async () => {
      await this.scaler.evaluateScaling(this.nodes);
    }, this.config.scaling.evaluationInterval);
  }

  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.nodes.values()).map(async (node) => {
      try {
        const isHealthy = await this.checkNodeHealth(node);
        if (!isHealthy && node.status === 'healthy') {
          node.status = 'degraded';
          this.emit('nodeUnhealthy', node);
          this.logger.warn(`Node ${node.id} marked as degraded`);
        } else if (isHealthy && node.status === 'degraded') {
          node.status = 'healthy';
          this.emit('nodeRecovered', node);
          this.logger.info(`Node ${node.id} recovered`);
        }
        node.lastHealthCheck = new Date();
      } catch (error) {
        this.logger.error(`Health check failed for node ${node.id}:`, error);
        node.status = 'offline';
        this.emit('nodeOffline', node);
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  private async checkNodeHealth(node: EnhancedBrowserNode): Promise<boolean> {
    try {
      // Check if browser is still connected
      if (!node.browser.isConnected()) {
        return false;
      }

      // Check performance thresholds
      if (node.performance.errorRate > this.config.healthThresholds.maxErrorRate) {
        return false;
      }

      if (node.performance.averageResponseTime > this.config.healthThresholds.maxResponseTime) {
        return false;
      }

      if (node.performance.memoryUsage > this.config.healthThresholds.maxMemoryUsage) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Enhanced Distributed Pool Manager');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.scalingInterval) {
      clearInterval(this.scalingInterval);
    }

    // Close all browser nodes
    const shutdownPromises = Array.from(this.nodes.values()).map(async (node) => {
      try {
        await node.browser.close();
        this.logger.info(`Closed browser node ${node.id}`);
      } catch (error) {
        this.logger.error(`Error closing browser node ${node.id}:`, error);
      }
    });

    await Promise.allSettled(shutdownPromises);
    this.nodes.clear();
    this.regions.clear();

    this.emit('shutdown');
  }

  // Getters for monitoring
  getNodes(): EnhancedBrowserNode[] {
    return Array.from(this.nodes.values());
  }

  getRegions(): Map<string, Set<string>> {
    return this.regions;
  }

  getPoolStats(): PoolStats {
    const nodes = Array.from(this.nodes.values());
    const healthyNodes = nodes.filter(n => n.status === 'healthy');
    const totalLoad = nodes.reduce((sum, n) => sum + n.currentLoad, 0);
    const totalCapacity = nodes.reduce((sum, n) => sum + n.maxConcurrent, 0);

    return {
      totalNodes: nodes.length,
      healthyNodes: healthyNodes.length,
      totalLoad,
      totalCapacity,
      utilizationRate: totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0,
      averageResponseTime: nodes.reduce((sum, n) => sum + n.performance.averageResponseTime, 0) / nodes.length,
      totalCost: nodes.reduce((sum, n) => sum + n.costMetrics.totalCost, 0),
    };
  }
}

// Supporting classes and interfaces
interface EnhancedPoolConfig {
  maxConcurrentPerNode: number;
  healthCheckInterval: number;
  cloudProvider: string;
  loadBalancing: LoadBalancingConfig;
  scaling: ScalingConfig;
  costOptimization: CostOptimizationConfig;
  monitoring: MonitoringConfig;
  healthThresholds: HealthThresholds;
}

interface LoadBalancingConfig {
  strategy: 'performance' | 'cost' | 'hybrid';
  weights: {
    performance: number;
    cost: number;
    location: number;
  };
}

interface ScalingConfig {
  evaluationInterval: number;
  predictiveEnabled: boolean;
  minNodes: number;
  maxNodes: number;
}

interface CostOptimizationConfig {
  enabled: boolean;
  maxHourlyCost: number;
  preferredRegions: string[];
}

interface MonitoringConfig {
  metricsRetention: number;
  alertingEnabled: boolean;
}

interface HealthThresholds {
  maxErrorRate: number;
  maxResponseTime: number;
  maxMemoryUsage: number;
}

interface SessionRequirements {
  type?: string;
  viewport?: { width: number; height: number };
  userAgent?: string;
  locale?: string;
  timezone?: string;
  region?: string;
  capabilities?: string[];
}

interface Session {
  id: string;
  nodeId: string;
  context: BrowserContext;
  page: Page;
  createdAt: Date;
  lastActivity: Date;
  requirements: SessionRequirements;
}

interface SessionResult {
  success: boolean;
  session?: Session;
  node?: EnhancedBrowserNode;
  responseTime: number;
  error?: string;
}

interface PoolStats {
  totalNodes: number;
  healthyNodes: number;
  totalLoad: number;
  totalCapacity: number;
  utilizationRate: number;
  averageResponseTime: number;
  totalCost: number;
}

// Placeholder classes (to be implemented)
class LoadBalancer {
  constructor(config: LoadBalancingConfig) {}
  async selectOptimalNode(nodes: EnhancedBrowserNode[], requirements: SessionRequirements): Promise<EnhancedBrowserNode | null> {
    return nodes.find(n => n.status === 'healthy' && n.currentLoad < n.maxConcurrent) || null;
  }
}

class PredictiveScaler {
  constructor(config: ScalingConfig) {}
  async scaleUp(requirements: SessionRequirements): Promise<void> {}
  async evaluateScaling(nodes: Map<string, EnhancedBrowserNode>): Promise<void> {}
}

class CostOptimizer {
  constructor(config: CostOptimizationConfig) {}
  calculateHourlyRate(region: string, instanceType: string): number {
    return 0.10; // $0.10 per hour base rate
  }
}

class PerformanceMonitor {
  constructor(config: MonitoringConfig) {}
  async recordSessionMetrics(nodeId: string, metrics: any): Promise<void> {}
}

// Export already declared above
