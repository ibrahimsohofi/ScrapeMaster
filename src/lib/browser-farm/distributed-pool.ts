import { EventEmitter } from 'events';
import { type Browser, type Page, LaunchOptions, type BrowserContext } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

export interface BrowserNode {
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
  };
  metadata: {
    userAgent: string;
    viewport: { width: number; height: number };
    deviceType: 'desktop' | 'mobile' | 'tablet';
    location?: string;
    browserType: 'chromium' | 'firefox' | 'webkit';
    version: string;
    capabilities: string[];
  };
  resourceLimits: {
    maxMemory: number;
    maxCpu: number;
    maxPages: number;
    maxContexts: number;
  };
  createdAt: Date;
  lastUsed: Date;
}

export interface ClusterNode {
  id: string;
  endpoint: string;
  capacity: number;
  currentLoad: number;
  browsers: Map<string, BrowserNode>;
  status: 'online' | 'offline' | 'maintenance' | 'scaling';
  lastPing: Date;
  region: string;
  zone: string;
  performance: {
    latency: number;
    throughput: number;
    reliability: number;
    costEfficiency: number;
  };
  resources: {
    totalMemory: number;
    usedMemory: number;
    totalCpu: number;
    usedCpu: number;
    totalStorage: number;
    usedStorage: number;
  };
  scaling: {
    minBrowsers: number;
    maxBrowsers: number;
    targetUtilization: number;
    cooldownPeriod: number;
    lastScaleAction: Date;
  };
}

export interface PoolConfiguration {
  minBrowsers: number;
  maxBrowsers: number;
  healthCheckInterval: number;
  idleTimeout: number;
  loadBalancingStrategy: 'round-robin' | 'least-connections' | 'weighted' | 'geographic' | 'performance-based' | 'ml-optimized';
  autoScaling: {
    enabled: boolean;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    cooldownPeriod: number;
    maxScalePerAction: number;
    predictiveScaling: boolean;
  };
  performance: {
    enableMonitoring: boolean;
    enableOptimization: boolean;
    performanceThresholds: {
      maxResponseTime: number;
      maxMemoryUsage: number;
      maxCpuUsage: number;
      maxErrorRate: number;
      minThroughput: number;
    };
  };
  failover: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
    healthCheckTimeout: number;
  };
  resourceManagement: {
    enableQuotas: boolean;
    enableResourceOptimization: boolean;
    memoryThreshold: number;
    cpuThreshold: number;
    cleanupInterval: number;
  };
}

export interface SessionRequest {
  id: string;
  requirements: {
    browserType?: 'chromium' | 'firefox' | 'webkit';
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    location?: string;
    capabilities?: string[];
    performance?: {
      maxResponseTime?: number;
      minReliability?: number;
    };
    resources?: {
      maxMemory?: number;
      maxCpu?: number;
    };
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  retries: number;
  metadata?: Record<string, any>;
}

export interface SessionAllocation {
  sessionId: string;
  nodeId: string;
  browserId: string;
  pageId?: string;
  contextId?: string;
  allocatedAt: Date;
  expiresAt: Date;
  status: 'allocated' | 'active' | 'idle' | 'expired' | 'failed';
  performance: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface LoadBalancingMetrics {
  nodeId: string;
  score: number;
  factors: {
    currentLoad: number;
    performance: number;
    reliability: number;
    geographic: number;
    cost: number;
  };
  penalty: number;
  available: boolean;
}

export interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'maintain';
  reason: string;
  targetCount: number;
  confidence: number;
  metadata: {
    currentLoad: number;
    predictedLoad: number;
    costImpact: number;
    performanceImpact: number;
  };
}

export class DistributedBrowserPool extends EventEmitter {
  private clusters: Map<string, ClusterNode> = new Map();
  private browsers: Map<string, BrowserNode> = new Map();
  private sessions: Map<string, SessionAllocation> = new Map();
  private loadBalancer: Map<string, number> = new Map(); // node load tracking
  private performanceHistory: Map<string, number[]> = new Map(); // performance tracking
  private scalingHistory: Array<{ timestamp: Date; action: string; nodeCount: number }> = [];
  private logger: winston.Logger;
  private config: PoolConfiguration;
  private healthCheckInterval?: NodeJS.Timeout;
  private scalingInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private performanceMonitorInterval?: NodeJS.Timeout;

  constructor(config: PoolConfiguration) {
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
        new winston.transports.File({ filename: 'browser-pool.log' })
      ]
    });

    this.startHealthChecks();
    this.startAutoScaling();
    this.startCleanupTasks();
    this.startPerformanceMonitoring();
  }

  // Request a browser session
  async requestSession(request: SessionRequest): Promise<SessionAllocation | null> {
    try {
      // Find the best node for this request
      const selectedNode = await this.selectOptimalNode(request);
      if (!selectedNode) {
        this.logger.warn('No suitable node found for session request', { request });
        return null;
      }

      // Allocate a browser on the selected node
      const allocation = await this.allocateBrowserSession(selectedNode, request);
      if (!allocation) {
        this.logger.warn('Failed to allocate browser session', { nodeId: selectedNode.id, request });
        return null;
      }

      this.sessions.set(allocation.sessionId, allocation);

      // Update load tracking
      this.updateNodeLoad(selectedNode.id, 1);

      this.logger.info('Browser session allocated', {
        sessionId: allocation.sessionId,
        nodeId: selectedNode.id,
        browserId: allocation.browserId
      });

      this.emit('session:allocated', allocation);
      return allocation;

    } catch (error) {
      this.logger.error('Error requesting browser session:', error);
      return null;
    }
  }

  // Release a browser session
  async releaseSession(sessionId: string): Promise<boolean> {
    try {
      const allocation = this.sessions.get(sessionId);
      if (!allocation) {
        this.logger.warn('Session not found for release', { sessionId });
        return false;
      }

      const browser = this.browsers.get(allocation.browserId);
      if (!browser) {
        this.logger.warn('Browser not found for session release', { browserId: allocation.browserId });
        this.sessions.delete(sessionId);
        return false;
      }

      // Release resources
      if (allocation.pageId && browser.pages.has(allocation.pageId)) {
        const page = browser.pages.get(allocation.pageId)!;
        await page.close();
        browser.pages.delete(allocation.pageId);
      }

      if (allocation.contextId && browser.contexts.has(allocation.contextId)) {
        const context = browser.contexts.get(allocation.contextId)!;
        await context.close();
        browser.contexts.delete(allocation.contextId);
      }

      // Update browser load
      browser.currentLoad = Math.max(0, browser.currentLoad - 1);
      browser.lastUsed = new Date();

      // Update node load tracking
      const cluster = this.findClusterByBrowser(allocation.browserId);
      if (cluster) {
        this.updateNodeLoad(cluster.id, -1);
      }

      // Update performance metrics
      this.updatePerformanceMetrics(allocation);

      this.sessions.delete(sessionId);

      this.logger.info('Browser session released', {
        sessionId,
        browserId: allocation.browserId,
        duration: Date.now() - allocation.allocatedAt.getTime()
      });

      this.emit('session:released', allocation);
      return true;

    } catch (error) {
      this.logger.error('Error releasing browser session:', error);
      return false;
    }
  }

  // Add a cluster node
  async addCluster(cluster: Omit<ClusterNode, 'id' | 'browsers' | 'lastPing'>): Promise<string> {
    const clusterId = uuidv4();

    const clusterNode: ClusterNode = {
      ...cluster,
      id: clusterId,
      browsers: new Map(),
      lastPing: new Date()
    };

    this.clusters.set(clusterId, clusterNode);
    this.loadBalancer.set(clusterId, 0);

    this.logger.info('Cluster added', { clusterId, endpoint: cluster.endpoint, region: cluster.region });
    this.emit('cluster:added', clusterNode);

    // Start browsers on the cluster if auto-scaling is enabled
    if (this.config.autoScaling.enabled) {
      await this.scaleBrowsersOnCluster(clusterId, clusterNode.scaling.minBrowsers);
    }

    return clusterId;
  }

  // Remove a cluster node
  async removeCluster(clusterId: string): Promise<boolean> {
    try {
      const cluster = this.clusters.get(clusterId);
      if (!cluster) {
        return false;
      }

      // Close all browsers in the cluster
      for (const browser of cluster.browsers.values()) {
        await this.removeBrowser(browser.id);
      }

      this.clusters.delete(clusterId);
      this.loadBalancer.delete(clusterId);

      this.logger.info('Cluster removed', { clusterId });
      this.emit('cluster:removed', cluster);

      return true;
    } catch (error) {
      this.logger.error('Error removing cluster:', error);
      return false;
    }
  }

  // Select optimal node for a session request
  private async selectOptimalNode(request: SessionRequest): Promise<ClusterNode | null> {
    const availableClusters = Array.from(this.clusters.values())
      .filter(cluster => cluster.status === 'online' && this.hasCapacity(cluster));

    if (availableClusters.length === 0) {
      return null;
    }

    switch (this.config.loadBalancingStrategy) {
      case 'round-robin':
        return this.selectRoundRobin(availableClusters);

      case 'least-connections':
        return this.selectLeastConnections(availableClusters);

      case 'weighted':
        return this.selectWeighted(availableClusters);

      case 'geographic':
        return this.selectGeographic(availableClusters, request);

      case 'performance-based':
        return this.selectPerformanceBased(availableClusters, request);

      case 'ml-optimized':
        return await this.selectMLOptimized(availableClusters, request);

      default:
        return this.selectLeastConnections(availableClusters);
    }
  }

  // Round robin selection
  private selectRoundRobin(clusters: ClusterNode[]): ClusterNode {
    // Simple round-robin implementation
    const sortedClusters = clusters.sort((a, b) => a.id.localeCompare(b.id));
    const totalRequests = Array.from(this.loadBalancer.values()).reduce((sum, load) => sum + load, 0);
    const index = totalRequests % sortedClusters.length;
    return sortedClusters[index];
  }

  // Least connections selection
  private selectLeastConnections(clusters: ClusterNode[]): ClusterNode {
    return clusters.reduce((best, current) => {
      const currentLoad = this.loadBalancer.get(current.id) || 0;
      const bestLoad = this.loadBalancer.get(best.id) || 0;
      return currentLoad < bestLoad ? current : best;
    });
  }

  // Weighted selection based on capacity
  private selectWeighted(clusters: ClusterNode[]): ClusterNode {
    const weights = clusters.map(cluster => {
      const load = this.loadBalancer.get(cluster.id) || 0;
      const utilization = load / cluster.capacity;
      return { cluster, weight: Math.max(0, 1 - utilization) };
    });

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight === 0) {
      return this.selectLeastConnections(clusters);
    }

    const random = Math.random() * totalWeight;
    let accumulator = 0;

    for (const { cluster, weight } of weights) {
      accumulator += weight;
      if (random <= accumulator) {
        return cluster;
      }
    }

    return clusters[0];
  }

  // Geographic selection based on location requirements
  private selectGeographic(clusters: ClusterNode[], request: SessionRequest): ClusterNode {
    if (!request.requirements.location) {
      return this.selectLeastConnections(clusters);
    }

    // Find clusters in the preferred region
    const localClusters = clusters.filter(cluster =>
      cluster.region === request.requirements.location
    );

    if (localClusters.length > 0) {
      return this.selectLeastConnections(localClusters);
    }

    // Fallback to any available cluster
    return this.selectLeastConnections(clusters);
  }

  // Performance-based selection
  private selectPerformanceBased(clusters: ClusterNode[], request: SessionRequest): ClusterNode {
    const scored = clusters.map(cluster => {
      let score = 0;

      // Performance factors
      score += cluster.performance.throughput * 0.3;
      score += cluster.performance.reliability * 0.25;
      score += (1 - cluster.performance.latency / 1000) * 0.2; // Lower latency is better
      score += cluster.performance.costEfficiency * 0.15;

      // Load factor
      const load = this.loadBalancer.get(cluster.id) || 0;
      const utilization = load / cluster.capacity;
      score += (1 - utilization) * 0.1;

      return { cluster, score };
    });

    return scored.reduce((best, current) =>
      current.score > best.score ? current : best
    ).cluster;
  }

  // ML-optimized selection (simplified prediction model)
  private async selectMLOptimized(clusters: ClusterNode[], request: SessionRequest): Promise<ClusterNode> {
    // This would integrate with a real ML model in production
    // For now, using a simplified scoring algorithm

    const predictions = clusters.map(cluster => {
      const historyKey = `${cluster.id}_performance`;
      const history = this.performanceHistory.get(historyKey) || [];

      // Predict performance based on recent history
      const recentPerformance = history.slice(-10);
      const avgPerformance = recentPerformance.length > 0
        ? recentPerformance.reduce((sum, p) => sum + p, 0) / recentPerformance.length
        : cluster.performance.throughput;

      // Factor in current load
      const currentLoad = this.loadBalancer.get(cluster.id) || 0;
      const predictedLoad = currentLoad + 1; // Assuming this request
      const utilizationPenalty = Math.max(0, (predictedLoad / cluster.capacity) - 0.8) * 0.5;

      const predictedScore = avgPerformance * (1 - utilizationPenalty);

      return { cluster, predictedScore };
    });

    return predictions.reduce((best, current) =>
      current.predictedScore > best.predictedScore ? current : best
    ).cluster;
  }

  // Check if cluster has capacity
  private hasCapacity(cluster: ClusterNode): boolean {
    const currentLoad = this.loadBalancer.get(cluster.id) || 0;
    return currentLoad < cluster.capacity && cluster.browsers.size > 0;
  }

  // Allocate browser session on selected node
  private async allocateBrowserSession(cluster: ClusterNode, request: SessionRequest): Promise<SessionAllocation | null> {
    try {
      // Find a suitable browser in the cluster
      const browser = await this.findSuitableBrowser(cluster, request);
      if (!browser) {
        // Try to create a new browser if possible
        const newBrowser = await this.createBrowserOnCluster(cluster.id, request);
        if (!newBrowser) {
          return null;
        }
        return this.allocateOnBrowser(newBrowser, request);
      }

      return this.allocateOnBrowser(browser, request);
    } catch (error) {
      this.logger.error('Error allocating browser session:', error);
      return null;
    }
  }

  // Find suitable browser in cluster
  private async findSuitableBrowser(cluster: ClusterNode, request: SessionRequest): Promise<BrowserNode | null> {
    const suitableBrowsers = Array.from(cluster.browsers.values()).filter(browser => {
      // Check browser status
      if (browser.status !== 'healthy') return false;

      // Check capacity
      if (browser.currentLoad >= browser.maxConcurrent) return false;

      // Check requirements
      if (request.requirements.browserType && browser.metadata.browserType !== request.requirements.browserType) {
        return false;
      }

      if (request.requirements.deviceType && browser.metadata.deviceType !== request.requirements.deviceType) {
        return false;
      }

      // Check capabilities
      if (request.requirements.capabilities) {
        const hasAllCapabilities = request.requirements.capabilities.every(cap =>
          browser.metadata.capabilities.includes(cap)
        );
        if (!hasAllCapabilities) return false;
      }

      // Check resource limits
      if (request.requirements.resources) {
        if (request.requirements.resources.maxMemory && browser.performance.memoryUsage > request.requirements.resources.maxMemory) {
          return false;
        }
        if (request.requirements.resources.maxCpu && browser.performance.cpuUsage > request.requirements.resources.maxCpu) {
          return false;
        }
      }

      return true;
    });

    if (suitableBrowsers.length === 0) {
      return null;
    }

    // Select the browser with the lowest load
    return suitableBrowsers.reduce((best, current) =>
      current.currentLoad < best.currentLoad ? current : best
    );
  }

  // Create a new browser on cluster
  private async createBrowserOnCluster(clusterId: string, request: SessionRequest): Promise<BrowserNode | null> {
    try {
      const cluster = this.clusters.get(clusterId);
      if (!cluster) return null;

      // Check if we can create more browsers
      if (cluster.browsers.size >= cluster.scaling.maxBrowsers) {
        return null;
      }

      const browserId = uuidv4();
      const browserType = request.requirements.browserType || 'chromium';

      // This would launch a browser on the actual cluster node
      // For now, simulating browser creation
      const browser: BrowserNode = {
        id: browserId,
        browser: null as any, // Would be actual browser instance
        pages: new Map(),
        contexts: new Map(),
        maxConcurrent: 10,
        currentLoad: 0,
        status: 'healthy',
        lastHealthCheck: new Date(),
        performance: {
          averageResponseTime: 100,
          memoryUsage: 50,
          cpuUsage: 10,
          errorRate: 0,
          throughput: 0
        },
        metadata: {
          userAgent: 'Mozilla/5.0 (compatible; DataVault Pro)',
          viewport: { width: 1920, height: 1080 },
          deviceType: request.requirements.deviceType || 'desktop',
          location: cluster.region,
          browserType,
          version: '1.0.0',
          capabilities: ['javascript', 'cookies', 'local-storage']
        },
        resourceLimits: {
          maxMemory: 512,
          maxCpu: 50,
          maxPages: 20,
          maxContexts: 10
        },
        createdAt: new Date(),
        lastUsed: new Date()
      };

      cluster.browsers.set(browserId, browser);
      this.browsers.set(browserId, browser);

      this.logger.info('Browser created on cluster', {
        clusterId,
        browserId,
        browserType
      });

      this.emit('browser:created', browser);
      return browser;

    } catch (error) {
      this.logger.error('Error creating browser on cluster:', error);
      return null;
    }
  }

  // Allocate session on specific browser
  private async allocateOnBrowser(browser: BrowserNode, request: SessionRequest): Promise<SessionAllocation> {
    const sessionId = request.id;
    const pageId = uuidv4();
    const contextId = uuidv4();

    // Create context and page (simulated)
    // In real implementation, would create actual Playwright context/page

    browser.currentLoad++;
    browser.lastUsed = new Date();

    const allocation: SessionAllocation = {
      sessionId,
      nodeId: browser.id,
      browserId: browser.id,
      pageId,
      contextId,
      allocatedAt: new Date(),
      expiresAt: new Date(Date.now() + request.timeout),
      status: 'allocated',
      performance: {
        responseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0
      }
    };

    return allocation;
  }

  // Update node load tracking
  private updateNodeLoad(nodeId: string, delta: number): void {
    const currentLoad = this.loadBalancer.get(nodeId) || 0;
    this.loadBalancer.set(nodeId, Math.max(0, currentLoad + delta));
  }

  // Update performance metrics
  private updatePerformanceMetrics(allocation: SessionAllocation): void {
    const historyKey = `${allocation.nodeId}_performance`;
    const history = this.performanceHistory.get(historyKey) || [];

    // Calculate session performance score
    const duration = Date.now() - allocation.allocatedAt.getTime();
    const performanceScore = Math.max(0, 100 - duration / 1000); // Simple scoring

    history.push(performanceScore);

    // Keep only recent history
    if (history.length > 100) {
      history.shift();
    }

    this.performanceHistory.set(historyKey, history);
  }

  // Find cluster containing browser
  private findClusterByBrowser(browserId: string): ClusterNode | null {
    for (const cluster of this.clusters.values()) {
      if (cluster.browsers.has(browserId)) {
        return cluster;
      }
    }
    return null;
  }

  // Remove browser
  private async removeBrowser(browserId: string): Promise<boolean> {
    try {
      const browser = this.browsers.get(browserId);
      if (!browser) return false;

      // Close all pages and contexts
      for (const page of browser.pages.values()) {
        await page.close();
      }
      for (const context of browser.contexts.values()) {
        await context.close();
      }

      // Close browser
      if (browser.browser) {
        await browser.browser.close();
      }

      // Remove from data structures
      this.browsers.delete(browserId);

      // Remove from cluster
      const cluster = this.findClusterByBrowser(browserId);
      if (cluster) {
        cluster.browsers.delete(browserId);
      }

      this.logger.info('Browser removed', { browserId });
      this.emit('browser:removed', browser);

      return true;
    } catch (error) {
      this.logger.error('Error removing browser:', error);
      return false;
    }
  }

  // Start health checks
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  // Perform health checks
  private async performHealthChecks(): Promise<void> {
    for (const cluster of this.clusters.values()) {
      try {
        // Check cluster health
        cluster.lastPing = new Date();

        // Check browser health
        for (const browser of cluster.browsers.values()) {
          await this.checkBrowserHealth(browser);
        }
      } catch (error) {
        this.logger.error('Error during health check:', error);
        cluster.status = 'offline';
      }
    }
  }

  // Check individual browser health
  private async checkBrowserHealth(browser: BrowserNode): Promise<void> {
    try {
      // Simulate health check (in real implementation, would ping browser)
      const isHealthy = Math.random() > 0.01; // 99% healthy

      if (!isHealthy) {
        browser.status = 'degraded';
        this.logger.warn('Browser health degraded', { browserId: browser.id });
      } else {
        browser.status = 'healthy';
      }

      browser.lastHealthCheck = new Date();
    } catch (error) {
      browser.status = 'offline';
      this.logger.error('Browser health check failed:', error);
    }
  }

  // Start auto-scaling
  private startAutoScaling(): void {
    if (!this.config.autoScaling.enabled) return;

    this.scalingInterval = setInterval(async () => {
      await this.evaluateScaling();
    }, 30000); // Every 30 seconds
  }

  // Evaluate scaling decisions
  private async evaluateScaling(): Promise<void> {
    for (const cluster of this.clusters.values()) {
      if (cluster.status !== 'online') continue;

      const decision = this.makeScalingDecision(cluster);
      if (decision.action !== 'maintain') {
        await this.executeScalingDecision(cluster, decision);
      }
    }
  }

  // Make scaling decision for cluster
  private makeScalingDecision(cluster: ClusterNode): ScalingDecision {
    const currentLoad = this.loadBalancer.get(cluster.id) || 0;
    const utilization = currentLoad / cluster.capacity;
    const browserCount = cluster.browsers.size;

    // Check cooldown period
    const timeSinceLastScale = Date.now() - cluster.scaling.lastScaleAction.getTime();
    if (timeSinceLastScale < cluster.scaling.cooldownPeriod * 1000) {
      return {
        action: 'maintain',
        reason: 'In cooldown period',
        targetCount: browserCount,
        confidence: 1.0,
        metadata: {
          currentLoad,
          predictedLoad: currentLoad,
          costImpact: 0,
          performanceImpact: 0
        }
      };
    }

    // Scale up decision
    if (utilization > this.config.autoScaling.scaleUpThreshold) {
      const targetCount = Math.min(
        browserCount + this.config.autoScaling.maxScalePerAction,
        cluster.scaling.maxBrowsers
      );

      return {
        action: 'scale_up',
        reason: `High utilization: ${(utilization * 100).toFixed(1)}%`,
        targetCount,
        confidence: Math.min(1.0, utilization - this.config.autoScaling.scaleUpThreshold),
        metadata: {
          currentLoad,
          predictedLoad: currentLoad * 1.2,
          costImpact: (targetCount - browserCount) * 10, // Simplified cost
          performanceImpact: 0.2
        }
      };
    }

    // Scale down decision
    if (utilization < this.config.autoScaling.scaleDownThreshold && browserCount > cluster.scaling.minBrowsers) {
      const targetCount = Math.max(
        browserCount - this.config.autoScaling.maxScalePerAction,
        cluster.scaling.minBrowsers
      );

      return {
        action: 'scale_down',
        reason: `Low utilization: ${(utilization * 100).toFixed(1)}%`,
        targetCount,
        confidence: Math.min(1.0, this.config.autoScaling.scaleDownThreshold - utilization),
        metadata: {
          currentLoad,
          predictedLoad: currentLoad * 0.8,
          costImpact: -(browserCount - targetCount) * 10,
          performanceImpact: -0.1
        }
      };
    }

    return {
      action: 'maintain',
      reason: 'Utilization within target range',
      targetCount: browserCount,
      confidence: 1.0,
      metadata: {
        currentLoad,
        predictedLoad: currentLoad,
        costImpact: 0,
        performanceImpact: 0
      }
    };
  }

  // Execute scaling decision
  private async executeScalingDecision(cluster: ClusterNode, decision: ScalingDecision): Promise<void> {
    try {
      cluster.scaling.lastScaleAction = new Date();
      cluster.status = 'scaling';

      const currentCount = cluster.browsers.size;
      const targetCount = decision.targetCount;

      if (decision.action === 'scale_up') {
        await this.scaleBrowsersOnCluster(cluster.id, targetCount - currentCount);
      } else if (decision.action === 'scale_down') {
        await this.scaleBrowsersDownOnCluster(cluster.id, currentCount - targetCount);
      }

      cluster.status = 'online';

      // Record scaling history
      this.scalingHistory.push({
        timestamp: new Date(),
        action: decision.action,
        nodeCount: targetCount
      });

      // Keep only recent history
      if (this.scalingHistory.length > 1000) {
        this.scalingHistory.shift();
      }

      this.logger.info('Scaling decision executed', {
        clusterId: cluster.id,
        action: decision.action,
        from: currentCount,
        to: targetCount,
        reason: decision.reason
      });

      this.emit('scaling:executed', { cluster, decision });

    } catch (error) {
      cluster.status = 'online';
      this.logger.error('Error executing scaling decision:', error);
    }
  }

  // Scale browsers up on cluster
  private async scaleBrowsersOnCluster(clusterId: string, count: number): Promise<void> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return;

    for (let i = 0; i < count; i++) {
      const browser = await this.createBrowserOnCluster(clusterId, {
        id: uuidv4(),
        requirements: {},
        priority: 'medium',
        timeout: 30000,
        retries: 3
      });

      if (!browser) {
        this.logger.warn('Failed to create browser during scale up', { clusterId });
        break;
      }
    }
  }

  // Scale browsers down on cluster
  private async scaleBrowsersDownOnCluster(clusterId: string, count: number): Promise<void> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return;

    // Select least used browsers for removal
    const browsers = Array.from(cluster.browsers.values())
      .filter(browser => browser.currentLoad === 0)
      .sort((a, b) => a.lastUsed.getTime() - b.lastUsed.getTime());

    for (let i = 0; i < Math.min(count, browsers.length); i++) {
      await this.removeBrowser(browsers[i].id);
    }
  }

  // Start cleanup tasks
  private startCleanupTasks(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.performCleanup();
    }, this.config.resourceManagement.cleanupInterval);
  }

  // Perform cleanup tasks
  private async performCleanup(): Promise<void> {
    // Clean up expired sessions
    const now = Date.now();
    for (const [sessionId, allocation] of this.sessions.entries()) {
      if (allocation.expiresAt.getTime() < now) {
        await this.releaseSession(sessionId);
      }
    }

    // Clean up idle browsers
    for (const browser of this.browsers.values()) {
      const idleTime = now - browser.lastUsed.getTime();
      if (browser.currentLoad === 0 && idleTime > this.config.idleTimeout) {
        const cluster = this.findClusterByBrowser(browser.id);
        if (cluster && cluster.browsers.size > cluster.scaling.minBrowsers) {
          await this.removeBrowser(browser.id);
        }
      }
    }
  }

  // Start performance monitoring
  private startPerformanceMonitoring(): void {
    if (!this.config.performance.enableMonitoring) return;

    this.performanceMonitorInterval = setInterval(async () => {
      await this.monitorPerformance();
    }, 60000); // Every minute
  }

  // Monitor performance
  private async monitorPerformance(): Promise<void> {
    for (const browser of this.browsers.values()) {
      // Update performance metrics (simulated)
      browser.performance.memoryUsage = Math.random() * 100;
      browser.performance.cpuUsage = Math.random() * 50;
      browser.performance.averageResponseTime = 50 + Math.random() * 200;
      browser.performance.throughput = browser.currentLoad * 10;

      // Check thresholds
      if (this.config.performance.enableOptimization) {
        await this.optimizeBrowserPerformance(browser);
      }
    }
  }

  // Optimize browser performance
  private async optimizeBrowserPerformance(browser: BrowserNode): Promise<void> {
    const thresholds = this.config.performance.performanceThresholds;

    // Check if browser exceeds performance thresholds
    if (browser.performance.memoryUsage > thresholds.maxMemoryUsage ||
        browser.performance.cpuUsage > thresholds.maxCpuUsage ||
        browser.performance.averageResponseTime > thresholds.maxResponseTime) {

      this.logger.warn('Browser performance degraded, considering restart', {
        browserId: browser.id,
        metrics: browser.performance
      });

      // In production, would implement actual optimization strategies
      // For now, just marking as degraded
      browser.status = 'degraded';
      this.emit('browser:performance_degraded', browser);
    }
  }

  // Get pool statistics
  getPoolStats(): any {
    const totalClusters = this.clusters.size;
    const onlineClusters = Array.from(this.clusters.values()).filter(c => c.status === 'online').length;
    const totalBrowsers = this.browsers.size;
    const healthyBrowsers = Array.from(this.browsers.values()).filter(b => b.status === 'healthy').length;
    const activeSessions = this.sessions.size;
    const totalCapacity = Array.from(this.clusters.values()).reduce((sum, c) => sum + c.capacity, 0);
    const totalLoad = Array.from(this.loadBalancer.values()).reduce((sum, load) => sum + load, 0);

    return {
      clusters: {
        total: totalClusters,
        online: onlineClusters,
        offline: totalClusters - onlineClusters
      },
      browsers: {
        total: totalBrowsers,
        healthy: healthyBrowsers,
        degraded: totalBrowsers - healthyBrowsers
      },
      sessions: {
        active: activeSessions,
        capacity: totalCapacity,
        utilization: totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0
      },
      performance: {
        averageResponseTime: this.calculateAverageResponseTime(),
        averageMemoryUsage: this.calculateAverageMemoryUsage(),
        averageCpuUsage: this.calculateAverageCpuUsage()
      }
    };
  }

  // Calculate average response time
  private calculateAverageResponseTime(): number {
    const browsers = Array.from(this.browsers.values());
    if (browsers.length === 0) return 0;

    const totalResponseTime = browsers.reduce((sum, b) => sum + b.performance.averageResponseTime, 0);
    return totalResponseTime / browsers.length;
  }

  // Calculate average memory usage
  private calculateAverageMemoryUsage(): number {
    const browsers = Array.from(this.browsers.values());
    if (browsers.length === 0) return 0;

    const totalMemoryUsage = browsers.reduce((sum, b) => sum + b.performance.memoryUsage, 0);
    return totalMemoryUsage / browsers.length;
  }

  // Calculate average CPU usage
  private calculateAverageCpuUsage(): number {
    const browsers = Array.from(this.browsers.values());
    if (browsers.length === 0) return 0;

    const totalCpuUsage = browsers.reduce((sum, b) => sum + b.performance.cpuUsage, 0);
    return totalCpuUsage / browsers.length;
  }

  // Cleanup and shutdown
  async cleanup(): Promise<void> {
    // Clear intervals
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.scalingInterval) clearInterval(this.scalingInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    if (this.performanceMonitorInterval) clearInterval(this.performanceMonitorInterval);

    // Close all browsers
    for (const browser of this.browsers.values()) {
      await this.removeBrowser(browser.id);
    }

    // Clear data structures
    this.clusters.clear();
    this.browsers.clear();
    this.sessions.clear();
    this.loadBalancer.clear();
    this.performanceHistory.clear();

    this.logger.info('Distributed browser pool cleaned up');
  }
}

// Export default configuration
export const defaultPoolConfig: PoolConfiguration = {
  minBrowsers: 2,
  maxBrowsers: 10,
  healthCheckInterval: 30000,
  idleTimeout: 300000,
  loadBalancingStrategy: 'performance-based',
  autoScaling: {
    enabled: true,
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.3,
    cooldownPeriod: 60,
    maxScalePerAction: 2,
    predictiveScaling: false
  },
  performance: {
    enableMonitoring: true,
    enableOptimization: true,
    performanceThresholds: {
      maxResponseTime: 5000,
      maxMemoryUsage: 80,
      maxCpuUsage: 70,
      maxErrorRate: 5,
      minThroughput: 10
    }
  },
  failover: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
    healthCheckTimeout: 10000
  },
  resourceManagement: {
    enableQuotas: true,
    enableResourceOptimization: true,
    memoryThreshold: 85,
    cpuThreshold: 80,
    cleanupInterval: 60000
  }
};
