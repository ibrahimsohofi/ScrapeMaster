import { EventEmitter } from 'events';
import { metricsEngine } from '../monitoring/advanced-metrics';

// Core interfaces for browser farm management
export interface BrowserInstance {
  id: string;
  status: BrowserStatus;
  type: BrowserType;
  profile: BrowserProfile;
  nodeId: string;
  createdAt: Date;
  lastUsed: Date;
  usageCount: number;
  sessionDuration: number;
  currentJob?: JobContext;
  performance: BrowserPerformance;
  resources: ResourceUsage;
  capabilities: BrowserCapabilities;
  proxy?: ProxyConfig;
}

export interface BrowserNode {
  id: string;
  hostname: string;
  region: string;
  status: NodeStatus;
  capacity: NodeCapacity;
  currentLoad: number;
  resources: NodeResources;
  browser_instances: BrowserInstance[];
  healthMetrics: NodeHealthMetrics;
  lastHeartbeat: Date;
  version: string;
  features: string[];
}

export interface BrowserProfile {
  userAgent: string;
  viewport: Viewport;
  timezone: string;
  locale: string;
  platform: string;
  headless: boolean;
  stealth: boolean;
  mobile: boolean;
  fingerprint: DeviceFingerprint;
}

export interface DeviceFingerprint {
  screen: ScreenInfo;
  hardware: HardwareInfo;
  software: SoftwareInfo;
  network: NetworkInfo;
  behavioral: BehavioralProfile;
}

export interface JobContext {
  id: string;
  type: JobType;
  priority: JobPriority;
  requirements: JobRequirements;
  startTime: Date;
  estimatedDuration: number;
  metadata: { [key: string]: any };
}

export interface JobRequirements {
  browserType?: BrowserType;
  headless?: boolean;
  stealth?: boolean;
  mobile?: boolean;
  region?: string;
  proxy?: boolean;
  javascript?: boolean;
  images?: boolean;
  minMemory?: number;
  maxCpu?: number;
  timeout?: number;
}

export interface PoolConfiguration {
  minInstances: number;
  maxInstances: number;
  targetUtilization: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  warmupInstances: number;
  maxSessionDuration: number;
  maxSessionRequests: number;
  autoRotation: boolean;
  resourceLimits: ResourceLimits;
  antiDetection: AntiDetectionConfig;
}

export interface ResourceLimits {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxDiskMB: number;
  maxNetworkMbps: number;
}

export interface AntiDetectionConfig {
  enabled: boolean;
  profileRotation: boolean;
  requestRandomization: boolean;
  behaviorMimicking: boolean;
  headerSpoofing: boolean;
  canvasFingerprinting: boolean;
  webGLFingerprinting: boolean;
  audioFingerprinting: boolean;
}

export type BrowserStatus = 'starting' | 'ready' | 'busy' | 'idle' | 'stopping' | 'stopped' | 'error';
export type NodeStatus = 'online' | 'offline' | 'draining' | 'maintenance';
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge';
export type JobType = 'scraping' | 'testing' | 'monitoring' | 'automation';
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

export interface BrowserPerformance {
  averagePageLoadTime: number;
  requestsPerMinute: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  successRate: number;
}

export interface ResourceUsage {
  memoryMB: number;
  cpuPercent: number;
  diskMB: number;
  networkMbps: number;
  openTabs: number;
  activeConnections: number;
}

export interface BrowserCapabilities {
  javascript: boolean;
  images: boolean;
  css: boolean;
  webgl: boolean;
  webrtc: boolean;
  geolocation: boolean;
  notifications: boolean;
  microphone: boolean;
  camera: boolean;
  plugins: string[];
}

export interface NodeCapacity {
  maxInstances: number;
  maxMemoryMB: number;
  maxCpuCores: number;
  maxDiskMB: number;
  maxNetworkMbps: number;
}

export interface NodeResources {
  usedMemoryMB: number;
  usedCpuPercent: number;
  usedDiskMB: number;
  usedNetworkMbps: number;
  availableInstances: number;
}

export interface NodeHealthMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  lastError?: string;
  lastErrorTime?: Date;
}

export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  isLandscape: boolean;
}

export interface ScreenInfo {
  width: number;
  height: number;
  colorDepth: number;
  pixelDepth: number;
  availWidth: number;
  availHeight: number;
}

export interface HardwareInfo {
  cores: number;
  memory: number;
  gpu: string;
  platform: string;
  architecture: string;
}

export interface SoftwareInfo {
  userAgent: string;
  browserVersion: string;
  osVersion: string;
  plugins: string[];
  mimeTypes: string[];
}

export interface NetworkInfo {
  connection: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface BehavioralProfile {
  typingSpeed: number;
  mouseMovementPattern: string;
  scrollBehavior: string;
  clickPattern: string;
  readingSpeed: number;
}

export interface ProxyConfig {
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
  country?: string;
  region?: string;
}

export interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'maintain';
  targetInstances: number;
  reason: string;
  confidence: number;
  metrics: ScalingMetrics;
}

export interface ScalingMetrics {
  currentInstances: number;
  utilization: number;
  queueDepth: number;
  avgWaitTime: number;
  errorRate: number;
  responseTime: number;
}

export class BrowserPoolManager extends EventEmitter {
  private nodes: Map<string, BrowserNode> = new Map();
  private instances: Map<string, BrowserInstance> = new Map();
  private jobQueue: JobContext[] = [];
  private config: PoolConfiguration;
  private isScaling = false;
  private lastScalingDecision = Date.now();
  private scalingCooldown = 60000; // 1 minute

  // Background task intervals
  private healthCheckInterval?: NodeJS.Timeout;
  private scalingInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  constructor(config: PoolConfiguration) {
    super();
    this.config = config;
    this.startBackgroundTasks();
  }

  // Node management
  async registerNode(node: Omit<BrowserNode, 'browser_instances' | 'lastHeartbeat'>): Promise<boolean> {
    const fullNode: BrowserNode = {
      ...node,
      browser_instances: [],
      lastHeartbeat: new Date()
    };

    this.nodes.set(node.id, fullNode);
    this.emit('nodeRegistered', fullNode);

    // Initialize warm instances if node is healthy
    if (node.status === 'online') {
      await this.initializeWarmInstances(node.id);
    }

    return true;
  }

  async unregisterNode(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Drain node gracefully
    await this.drainNode(nodeId);

    // Remove all instances from this node
    node.browser_instances.forEach(instance => {
      this.instances.delete(instance.id);
    });

    this.nodes.delete(nodeId);
    this.emit('nodeUnregistered', node);

    return true;
  }

  async drainNode(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    node.status = 'draining';

    // Wait for active jobs to complete
    const drainingInstances = node.browser_instances.filter(i => i.status === 'busy');

    await Promise.all(
      drainingInstances.map(instance => this.waitForInstanceCompletion(instance.id))
    );

    return true;
  }

  updateNodeHeartbeat(nodeId: string, resources: NodeResources, health: NodeHealthMetrics): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    node.lastHeartbeat = new Date();
    node.resources = resources;
    node.healthMetrics = health;
    node.currentLoad = (resources.usedCpuPercent +
                      (resources.usedMemoryMB / node.capacity.maxMemoryMB) * 100) / 2;

    // Update node status based on health
    if (health.errorRate > 50 || health.responseTime > 10000) {
      node.status = 'maintenance';
    } else if (node.status === 'maintenance' && health.errorRate < 10) {
      node.status = 'online';
    }

    this.emit('nodeHeartbeat', { nodeId, resources, health });
    return true;
  }

  // Browser instance management
  async createBrowserInstance(
    nodeId: string,
    profile?: Partial<BrowserProfile>,
    requirements?: JobRequirements
  ): Promise<BrowserInstance | null> {
    const node = this.nodes.get(nodeId);
    if (!node || node.status !== 'online') return null;

    // Check node capacity
    if (node.browser_instances.length >= node.capacity.maxInstances) {
      return null;
    }

    const instance: BrowserInstance = {
      id: this.generateInstanceId(),
      status: 'starting',
      type: requirements?.browserType || 'chrome',
      profile: this.generateBrowserProfile(profile, requirements),
      nodeId,
      createdAt: new Date(),
      lastUsed: new Date(),
      usageCount: 0,
      sessionDuration: 0,
      performance: this.initializePerformanceMetrics(),
      resources: this.initializeResourceUsage(),
      capabilities: this.generateCapabilities(requirements),
      proxy: await this.assignProxy(requirements)
    };

    // Apply anti-detection measures
    if (this.config.antiDetection.enabled) {
      await this.applyAntiDetection(instance);
    }

    this.instances.set(instance.id, instance);
    node.browser_instances.push(instance);

    // Simulate browser startup
    setTimeout(() => {
      instance.status = 'ready';
      this.emit('instanceCreated', instance);
    }, Math.random() * 5000 + 2000); // 2-7 seconds startup time

    return instance;
  }

  async destroyBrowserInstance(instanceId: string): Promise<boolean> {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    const node = this.nodes.get(instance.nodeId);
    if (node) {
      node.browser_instances = node.browser_instances.filter(i => i.id !== instanceId);
    }

    instance.status = 'stopping';

    // Cleanup resources
    await this.cleanupInstance(instance);

    this.instances.delete(instanceId);
    this.emit('instanceDestroyed', instance);

    return true;
  }

  // Job assignment and execution
  async requestBrowser(requirements: JobRequirements, priority: JobPriority = 'normal'): Promise<BrowserInstance | null> {
    // Try to find an available instance that matches requirements
    let suitableInstance = this.findSuitableInstance(requirements);

    if (!suitableInstance) {
      // No suitable instance available, try to create one
      const bestNode = this.findBestNode(requirements);
      if (bestNode) {
        suitableInstance = await this.createBrowserInstance(bestNode.id, {}, requirements);
      }
    }

    if (!suitableInstance) {
      // Queue the job if no instance is available
      const job: JobContext = {
        id: this.generateJobId(),
        type: 'scraping',
        priority,
        requirements,
        startTime: new Date(),
        estimatedDuration: requirements.timeout || 300000, // 5 minutes default
        metadata: {}
      };

      this.jobQueue.push(job);
      this.sortJobQueue();

      this.emit('jobQueued', job);
      return null;
    }

    // Assign instance to job
    suitableInstance.status = 'busy';
    suitableInstance.lastUsed = new Date();
    suitableInstance.usageCount++;

    this.emit('instanceAssigned', suitableInstance);
    return suitableInstance;
  }

  async releaseBrowser(instanceId: string): Promise<boolean> {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    instance.status = 'idle';
    instance.currentJob = undefined;
    instance.sessionDuration = Date.now() - instance.lastUsed.getTime();

    // Check if instance should be recycled
    if (this.shouldRecycleInstance(instance)) {
      await this.destroyBrowserInstance(instanceId);
      return true;
    }

    // Process queued jobs
    await this.processJobQueue();

    this.emit('instanceReleased', instance);
    return true;
  }

  // Pool scaling and optimization
  async evaluateScaling(): Promise<ScalingDecision> {
    const metrics = this.calculateScalingMetrics();
    const decision = this.makeScalingDecision(metrics);

    if (decision.action !== 'maintain') {
      this.emit('scalingDecision', decision);

      if (decision.action === 'scale_up') {
        await this.scaleUp(decision.targetInstances - metrics.currentInstances);
      } else if (decision.action === 'scale_down') {
        await this.scaleDown(metrics.currentInstances - decision.targetInstances);
      }
    }

    return decision;
  }

  private calculateScalingMetrics(): ScalingMetrics {
    const instances = Array.from(this.instances.values());
    const busyInstances = instances.filter(i => i.status === 'busy');
    const utilization = instances.length > 0 ? (busyInstances.length / instances.length) * 100 : 0;

    const queuedJobs = this.jobQueue.filter(j => !j.startTime || Date.now() - j.startTime.getTime() < 60000);
    const avgWaitTime = queuedJobs.length > 0
      ? queuedJobs.reduce((sum, job) => sum + (Date.now() - job.startTime.getTime()), 0) / queuedJobs.length
      : 0;

    const errorRate = this.calculateInstanceErrorRate();
    const responseTime = this.calculateAverageResponseTime();

    return {
      currentInstances: instances.length,
      utilization,
      queueDepth: queuedJobs.length,
      avgWaitTime,
      errorRate,
      responseTime
    };
  }

  private makeScalingDecision(metrics: ScalingMetrics): ScalingDecision {
    const { utilization, queueDepth, avgWaitTime, currentInstances } = metrics;

    let action: 'scale_up' | 'scale_down' | 'maintain' = 'maintain';
    let targetInstances = currentInstances;
    let reason = 'Metrics within normal range';
    let confidence = 0.5;

    // Scale up conditions
    if (utilization > this.config.scaleUpThreshold || queueDepth > 5 || avgWaitTime > 30000) {
      action = 'scale_up';
      const scaleUpFactor = Math.max(
        Math.ceil(utilization / this.config.targetUtilization),
        Math.ceil(queueDepth / 3),
        Math.ceil(avgWaitTime / 15000)
      );
      targetInstances = Math.min(currentInstances + scaleUpFactor, this.config.maxInstances);
      reason = `High utilization: ${utilization.toFixed(1)}%, Queue depth: ${queueDepth}, Wait time: ${avgWaitTime}ms`;
      confidence = 0.8;
    }
    // Scale down conditions
    else if (utilization < this.config.scaleDownThreshold && queueDepth === 0 && currentInstances > this.config.minInstances) {
      action = 'scale_down';
      const scaleDownFactor = Math.floor((this.config.targetUtilization - utilization) / 20);
      targetInstances = Math.max(currentInstances - scaleDownFactor, this.config.minInstances);
      reason = `Low utilization: ${utilization.toFixed(1)}%`;
      confidence = 0.7;
    }

    return {
      action,
      targetInstances,
      reason,
      confidence,
      metrics
    };
  }

  private async scaleUp(count: number): Promise<void> {
    if (this.isScaling || Date.now() - this.lastScalingDecision < this.scalingCooldown) {
      return;
    }

    this.isScaling = true;
    this.lastScalingDecision = Date.now();

    try {
      const promises: Promise<BrowserInstance | null>[] = [];

      for (let i = 0; i < count; i++) {
        const bestNode = this.findBestNodeForScaling();
        if (bestNode) {
          promises.push(this.createBrowserInstance(bestNode.id));
        }
      }

      const newInstances = await Promise.all(promises);
      const successCount = newInstances.filter(instance => instance !== null).length;

      this.emit('scaledUp', { requested: count, created: successCount });

    } finally {
      this.isScaling = false;
    }
  }

  private async scaleDown(count: number): Promise<void> {
    if (this.isScaling || Date.now() - this.lastScalingDecision < this.scalingCooldown) {
      return;
    }

    this.isScaling = true;
    this.lastScalingDecision = Date.now();

    try {
      // Select idle instances for removal, preferring oldest and least used
      const idleInstances = Array.from(this.instances.values())
        .filter(instance => instance.status === 'idle')
        .sort((a, b) => {
          // Prefer older instances
          const ageDiff = a.createdAt.getTime() - b.createdAt.getTime();
          // Prefer less used instances
          const usageDiff = a.usageCount - b.usageCount;
          return ageDiff + usageDiff;
        })
        .slice(0, count);

      const promises = idleInstances.map(instance => this.destroyBrowserInstance(instance.id));
      const results = await Promise.all(promises);
      const successCount = results.filter(result => result).length;

      this.emit('scaledDown', { requested: count, destroyed: successCount });

    } finally {
      this.isScaling = false;
    }
  }

  // Anti-detection and stealth features
  private async applyAntiDetection(instance: BrowserInstance): Promise<void> {
    const config = this.config.antiDetection;

    if (config.profileRotation) {
      instance.profile = this.generateRandomProfile();
    }

    if (config.headerSpoofing) {
      instance.profile.userAgent = this.generateRealisticUserAgent();
    }

    if (config.canvasFingerprinting) {
      // Apply canvas fingerprinting protection
      instance.capabilities = { ...instance.capabilities };
    }

    if (config.behaviorMimicking) {
      instance.profile.fingerprint.behavioral = this.generateBehavioralProfile();
    }
  }

  private generateRandomProfile(): BrowserProfile {
    const profiles = this.getDeviceProfileDatabase();
    const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];

    return {
      ...randomProfile,
      timezone: this.getRandomTimezone(),
      locale: this.getRandomLocale()
    };
  }

  private generateRealisticUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  private generateBehavioralProfile(): BehavioralProfile {
    return {
      typingSpeed: 150 + Math.random() * 100, // 150-250 WPM
      mouseMovementPattern: Math.random() > 0.5 ? 'smooth' : 'jerky',
      scrollBehavior: Math.random() > 0.5 ? 'continuous' : 'discrete',
      clickPattern: Math.random() > 0.5 ? 'precise' : 'approximate',
      readingSpeed: 200 + Math.random() * 100 // 200-300 WPM
    };
  }

  // Resource optimization
  private async optimizeResources(): Promise<void> {
    const instances = Array.from(this.instances.values());

    // Identify resource-heavy instances
    const heavyInstances = instances.filter(instance =>
      instance.resources.memoryMB > this.config.resourceLimits.maxMemoryMB * 0.8 ||
      instance.resources.cpuPercent > this.config.resourceLimits.maxCpuPercent * 0.8
    );

    // Optimize heavy instances
    for (const instance of heavyInstances) {
      await this.optimizeInstance(instance);
    }

    // Garbage collect idle instances
    const staleInstances = instances.filter(instance =>
      instance.status === 'idle' &&
      Date.now() - instance.lastUsed.getTime() > 10 * 60 * 1000 && // 10 minutes idle
      instance.usageCount === 0
    );

    for (const instance of staleInstances) {
      await this.destroyBrowserInstance(instance.id);
    }
  }

  private async optimizeInstance(instance: BrowserInstance): Promise<void> {
    // Clear cache and cookies
    if (instance.resources.memoryMB > this.config.resourceLimits.maxMemoryMB * 0.7) {
      // Simulate cache clearing
      instance.resources.memoryMB *= 0.6;
    }

    // Reduce concurrent connections
    if (instance.resources.activeConnections > 50) {
      instance.resources.activeConnections = Math.floor(instance.resources.activeConnections * 0.5);
    }

    // Close excess tabs
    if (instance.resources.openTabs > 5) {
      instance.resources.openTabs = Math.min(instance.resources.openTabs, 3);
    }
  }

  // Helper methods
  private findSuitableInstance(requirements: JobRequirements): BrowserInstance | null {
    const instances = Array.from(this.instances.values())
      .filter(instance =>
        instance.status === 'ready' || instance.status === 'idle'
      );

    // Score instances based on requirements match
    const scoredInstances = instances.map(instance => ({
      instance,
      score: this.calculateInstanceScore(instance, requirements)
    }));

    // Sort by score (highest first)
    scoredInstances.sort((a, b) => b.score - a.score);

    return scoredInstances.length > 0 ? scoredInstances[0].instance : null;
  }

  private calculateInstanceScore(instance: BrowserInstance, requirements: JobRequirements): number {
    let score = 100;

    // Browser type match
    if (requirements.browserType && instance.type !== requirements.browserType) {
      score -= 50;
    }

    // Mobile requirement
    if (requirements.mobile !== undefined && instance.profile.mobile !== requirements.mobile) {
      score -= 30;
    }

    // Stealth requirement
    if (requirements.stealth && !instance.profile.stealth) {
      score -= 20;
    }

    // Resource availability
    if (requirements.minMemory && instance.resources.memoryMB < requirements.minMemory) {
      score -= 40;
    }

    // Performance bonus for recently used instances (warmed up)
    const timeSinceLastUse = Date.now() - instance.lastUsed.getTime();
    if (timeSinceLastUse < 5 * 60 * 1000) { // 5 minutes
      score += 10;
    }

    // Penalize overused instances
    if (instance.usageCount > 100) {
      score -= instance.usageCount / 10;
    }

    return Math.max(0, score);
  }

  private findBestNode(requirements?: JobRequirements): BrowserNode | null {
    const availableNodes = Array.from(this.nodes.values())
      .filter(node =>
        node.status === 'online' &&
        node.browser_instances.length < node.capacity.maxInstances
      );

    if (availableNodes.length === 0) return null;

    // Score nodes based on load, capacity, and requirements
    const scoredNodes = availableNodes.map(node => ({
      node,
      score: this.calculateNodeScore(node, requirements)
    }));

    scoredNodes.sort((a, b) => b.score - a.score);
    return scoredNodes[0].node;
  }

  private calculateNodeScore(node: BrowserNode, requirements?: JobRequirements): number {
    let score = 100;

    // Load factor (prefer less loaded nodes)
    score -= node.currentLoad;

    // Capacity factor (prefer nodes with more available capacity)
    const availableCapacity = (node.capacity.maxInstances - node.browser_instances.length) / node.capacity.maxInstances;
    score += availableCapacity * 20;

    // Health factor
    score += node.healthMetrics.uptime / 100 * 10;
    score -= node.healthMetrics.errorRate;

    // Region preference
    if (requirements?.region && node.region === requirements.region) {
      score += 15;
    }

    return Math.max(0, score);
  }

  private findBestNodeForScaling(): BrowserNode | null {
    return this.findBestNode();
  }

  private shouldRecycleInstance(instance: BrowserInstance): boolean {
    // Recycle based on usage count
    if (instance.usageCount > this.config.maxSessionRequests) {
      return true;
    }

    // Recycle based on session duration
    if (instance.sessionDuration > this.config.maxSessionDuration) {
      return true;
    }

    // Recycle based on resource usage
    if (instance.resources.memoryMB > this.config.resourceLimits.maxMemoryMB) {
      return true;
    }

    // Recycle based on error rate
    if (instance.performance.errorRate > 20) {
      return true;
    }

    return false;
  }

  private async processJobQueue(): Promise<void> {
    if (this.jobQueue.length === 0) return;

    const availableInstances = Array.from(this.instances.values())
      .filter(instance => instance.status === 'ready' || instance.status === 'idle');

    for (let i = 0; i < Math.min(this.jobQueue.length, availableInstances.length); i++) {
      const job = this.jobQueue.shift()!;
      const instance = this.findSuitableInstance(job.requirements);

      if (instance) {
        instance.status = 'busy';
        instance.currentJob = job;
        instance.lastUsed = new Date();
        instance.usageCount++;

        this.emit('jobAssigned', { job, instance });
      } else {
        // Put job back in queue
        this.jobQueue.unshift(job);
        break;
      }
    }
  }

  private sortJobQueue(): void {
    this.jobQueue.sort((a, b) => {
      // Priority first
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) return priorityDiff;

      // Then by wait time
      return a.startTime.getTime() - b.startTime.getTime();
    });
  }

  private async waitForInstanceCompletion(instanceId: string): Promise<void> {
    return new Promise((resolve) => {
      const checkInstance = () => {
        const instance = this.instances.get(instanceId);
        if (!instance || instance.status !== 'busy') {
          resolve();
        } else {
          setTimeout(checkInstance, 1000);
        }
      };
      checkInstance();
    });
  }

  private async initializeWarmInstances(nodeId: string): Promise<void> {
    const warmupCount = Math.min(this.config.warmupInstances, this.config.maxInstances);

    for (let i = 0; i < warmupCount; i++) {
      await this.createBrowserInstance(nodeId);
    }
  }

  private async cleanupInstance(instance: BrowserInstance): Promise<void> {
    // Simulate cleanup tasks
    instance.resources = this.initializeResourceUsage();
    instance.performance = this.initializePerformanceMetrics();
  }

  private async assignProxy(requirements?: JobRequirements): Promise<ProxyConfig | undefined> {
    if (!requirements?.proxy) return undefined;

    // This would integrate with the proxy manager
    return {
      type: 'http',
      host: 'proxy.example.com',
      port: 8080,
      country: requirements.region || 'US'
    };
  }

  // Data generation helpers
  private generateInstanceId(): string {
    return `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBrowserProfile(
    profile?: Partial<BrowserProfile>,
    requirements?: JobRequirements
  ): BrowserProfile {
    const defaultProfile: BrowserProfile = {
      userAgent: this.generateRealisticUserAgent(),
      viewport: {
        width: requirements?.mobile ? 375 : 1920,
        height: requirements?.mobile ? 667 : 1080,
        deviceScaleFactor: requirements?.mobile ? 2 : 1,
        isMobile: requirements?.mobile || false,
        hasTouch: requirements?.mobile || false,
        isLandscape: false
      },
      timezone: 'America/New_York',
      locale: 'en-US',
      platform: 'Win32',
      headless: requirements?.headless !== false,
      stealth: requirements?.stealth || false,
      mobile: requirements?.mobile || false,
      fingerprint: this.generateDeviceFingerprint()
    };

    return { ...defaultProfile, ...profile };
  }

  private generateDeviceFingerprint(): DeviceFingerprint {
    return {
      screen: {
        width: 1920,
        height: 1080,
        colorDepth: 24,
        pixelDepth: 24,
        availWidth: 1920,
        availHeight: 1040
      },
      hardware: {
        cores: 8,
        memory: 16384,
        gpu: 'NVIDIA GeForce RTX 3080',
        platform: 'Win32',
        architecture: 'x64'
      },
      software: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        browserVersion: '120.0.0.0',
        osVersion: '10.0',
        plugins: ['Chrome PDF Plugin', 'Chrome PDF Viewer'],
        mimeTypes: ['application/pdf', 'text/html']
      },
      network: {
        connection: 'ethernet',
        downlink: 100,
        rtt: 50,
        saveData: false
      },
      behavioral: this.generateBehavioralProfile()
    };
  }

  private generateCapabilities(requirements?: JobRequirements): BrowserCapabilities {
    return {
      javascript: requirements?.javascript !== false,
      images: requirements?.images !== false,
      css: true,
      webgl: true,
      webrtc: true,
      geolocation: false,
      notifications: false,
      microphone: false,
      camera: false,
      plugins: ['PDF']
    };
  }

  private initializePerformanceMetrics(): BrowserPerformance {
    return {
      averagePageLoadTime: 2000,
      requestsPerMinute: 0,
      errorRate: 0,
      memoryUsage: 100,
      cpuUsage: 5,
      networkLatency: 50,
      successRate: 100
    };
  }

  private initializeResourceUsage(): ResourceUsage {
    return {
      memoryMB: 150,
      cpuPercent: 5,
      diskMB: 10,
      networkMbps: 0.1,
      openTabs: 1,
      activeConnections: 0
    };
  }

  private calculateInstanceErrorRate(): number {
    const instances = Array.from(this.instances.values());
    if (instances.length === 0) return 0;

    const totalErrorRate = instances.reduce((sum, instance) => sum + instance.performance.errorRate, 0);
    return totalErrorRate / instances.length;
  }

  private calculateAverageResponseTime(): number {
    const instances = Array.from(this.instances.values());
    if (instances.length === 0) return 0;

    const totalResponseTime = instances.reduce((sum, instance) => sum + instance.performance.averagePageLoadTime, 0);
    return totalResponseTime / instances.length;
  }

  private getDeviceProfileDatabase(): BrowserProfile[] {
    // Mock device profile database
    return [
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        viewport: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false, isLandscape: true },
        timezone: 'America/New_York',
        locale: 'en-US',
        platform: 'Win32',
        headless: false,
        stealth: true,
        mobile: false,
        fingerprint: this.generateDeviceFingerprint()
      }
    ];
  }

  private getRandomTimezone(): string {
    const timezones = [
      'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin',
      'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney', 'America/Chicago'
    ];
    return timezones[Math.floor(Math.random() * timezones.length)];
  }

  private getRandomLocale(): string {
    const locales = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'ja-JP', 'zh-CN', 'es-ES', 'it-IT'];
    return locales[Math.floor(Math.random() * locales.length)];
  }

  // Background tasks
  private startBackgroundTasks(): void {
    // Health checks every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    // Scaling evaluation every 60 seconds
    this.scalingInterval = setInterval(() => {
      this.evaluateScaling();
    }, 60000);

    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.optimizeResources();
    }, 5 * 60 * 1000);

    // Metrics collection every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);
  }

  private async performHealthChecks(): Promise<void> {
    const now = new Date();
    const staleThreshold = 2 * 60 * 1000; // 2 minutes

    // Check for stale nodes
    for (const [nodeId, node] of this.nodes.entries()) {
      if (now.getTime() - node.lastHeartbeat.getTime() > staleThreshold) {
        node.status = 'offline';
        this.emit('nodeUnhealthy', { nodeId, reason: 'Heartbeat timeout' });
      }
    }

    // Check instance health
    for (const [instanceId, instance] of this.instances.entries()) {
      if (instance.status === 'busy' && instance.currentJob) {
        const jobDuration = now.getTime() - instance.currentJob.startTime.getTime();
        if (jobDuration > (instance.currentJob.estimatedDuration * 2)) {
          // Job is taking too long, mark as error
          instance.status = 'error';
          this.emit('instanceTimeout', { instanceId, jobDuration });
        }
      }
    }
  }

  private collectMetrics(): void {
    const instances = Array.from(this.instances.values());
    const nodes = Array.from(this.nodes.values());

    // Pool metrics
    metricsEngine.recordMetric('browser_pool.total_instances', instances.length);
    metricsEngine.recordMetric('browser_pool.busy_instances', instances.filter(i => i.status === 'busy').length);
    metricsEngine.recordMetric('browser_pool.idle_instances', instances.filter(i => i.status === 'idle').length);
    metricsEngine.recordMetric('browser_pool.queue_depth', this.jobQueue.length);

    // Node metrics
    metricsEngine.recordMetric('browser_farm.total_nodes', nodes.length);
    metricsEngine.recordMetric('browser_farm.online_nodes', nodes.filter(n => n.status === 'online').length);

    // Resource metrics
    const totalMemory = instances.reduce((sum, i) => sum + i.resources.memoryMB, 0);
    const totalCpu = instances.reduce((sum, i) => sum + i.resources.cpuPercent, 0);

    metricsEngine.recordMetric('browser_pool.memory_usage_mb', totalMemory);
    metricsEngine.recordMetric('browser_pool.cpu_usage_percent', totalCpu / Math.max(instances.length, 1));

    // Performance metrics
    const avgResponseTime = this.calculateAverageResponseTime();
    const errorRate = this.calculateInstanceErrorRate();

    metricsEngine.recordMetric('browser_pool.avg_response_time', avgResponseTime);
    metricsEngine.recordMetric('browser_pool.error_rate', errorRate);
  }

  // Cleanup
  destroy(): void {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.scalingInterval) clearInterval(this.scalingInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);

    this.removeAllListeners();
  }

  // Public getters
  get poolStats() {
    const instances = Array.from(this.instances.values());
    const nodes = Array.from(this.nodes.values());

    return {
      totalInstances: instances.length,
      busyInstances: instances.filter(i => i.status === 'busy').length,
      idleInstances: instances.filter(i => i.status === 'idle').length,
      readyInstances: instances.filter(i => i.status === 'ready').length,
      totalNodes: nodes.length,
      onlineNodes: nodes.filter(n => n.status === 'online').length,
      queueDepth: this.jobQueue.length,
      utilization: instances.length > 0 ? (instances.filter(i => i.status === 'busy').length / instances.length) * 100 : 0
    };
  }

  get configuration() {
    return { ...this.config };
  }
}

// Export singleton manager
export const browserPoolManager = new BrowserPoolManager({
  minInstances: 5,
  maxInstances: 100,
  targetUtilization: 70,
  scaleUpThreshold: 80,
  scaleDownThreshold: 30,
  warmupInstances: 3,
  maxSessionDuration: 30 * 60 * 1000, // 30 minutes
  maxSessionRequests: 500,
  autoRotation: true,
  resourceLimits: {
    maxMemoryMB: 2048,
    maxCpuPercent: 80,
    maxDiskMB: 1024,
    maxNetworkMbps: 100
  },
  antiDetection: {
    enabled: true,
    profileRotation: true,
    requestRandomization: true,
    behaviorMimicking: true,
    headerSpoofing: true,
    canvasFingerprinting: true,
    webGLFingerprinting: true,
    audioFingerprinting: true
  }
});

export default browserPoolManager;
