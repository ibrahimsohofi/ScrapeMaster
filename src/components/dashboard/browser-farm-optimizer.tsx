'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Monitor, Smartphone, Tablet, Chrome,
  Shield, Zap, Activity, Server, Globe,
  TrendingUp, TrendingDown, Settings, Play,
  Pause, RotateCcw, Cpu, MemoryStick, HardDrive
} from 'lucide-react';

interface BrowserInstance {
  id: string;
  status: 'idle' | 'busy' | 'starting' | 'stopping' | 'error';
  browser: 'chrome' | 'firefox' | 'safari' | 'edge';
  deviceType: 'desktop' | 'mobile' | 'tablet';
  region: string;
  ip: string;
  userAgent: string;
  screenResolution: string;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number; // hours
  totalSessions: number;
  successRate: number;
  avgSessionTime: number; // seconds
  antiDetectionScore: number;
  lastActivity: Date;
  assignedProxy?: string;
  fingerprint: BrowserFingerprint;
}

interface BrowserFingerprint {
  canvas: string;
  webgl: string;
  fonts: string[];
  timezone: string;
  language: string;
  platform: string;
  vendor: string;
  cookiesEnabled: boolean;
  doNotTrack: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  colorDepth: number;
  pixelRatio: number;
}

interface PoolConfiguration {
  id: string;
  name: string;
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetCpuUsage: number;
  autoScaling: boolean;
  antiDetection: {
    enabled: boolean;
    level: 'basic' | 'advanced' | 'stealth';
    randomizeFingerprints: boolean;
    rotateUserAgents: boolean;
    mimicHumanBehavior: boolean;
    useResidentialProxies: boolean;
  };
  deviceDistribution: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  browserDistribution: {
    chrome: number;
    firefox: number;
    safari: number;
    edge: number;
  };
  regionDistribution: Record<string, number>;
}

interface ScalingMetric {
  timestamp: Date;
  metric: 'cpu' | 'memory' | 'queue_length' | 'response_time' | 'error_rate';
  value: number;
  threshold: number;
  action: 'scale_up' | 'scale_down' | 'none';
  instancesChanged: number;
}

interface AntiDetectionTechnique {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  effectiveness: number; // percentage
  detectionRate: number; // percentage
  performanceImpact: 'low' | 'medium' | 'high';
  category: 'fingerprinting' | 'behavior' | 'network' | 'timing';
}

interface PerformanceOptimization {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  impact: 'speed' | 'resource' | 'detection' | 'stability';
  improvement: number; // percentage
  tradeoff?: string;
}

export default function BrowserFarmOptimizer() {
  const [instances, setInstances] = useState<BrowserInstance[]>([]);
  const [poolConfigs, setPoolConfigs] = useState<PoolConfiguration[]>([]);
  const [scalingHistory, setScalingHistory] = useState<ScalingMetric[]>([]);
  const [antiDetectionTechniques, setAntiDetectionTechniques] = useState<AntiDetectionTechnique[]>([]);
  const [optimizations, setOptimizations] = useState<PerformanceOptimization[]>([]);
  const [farmStats, setFarmStats] = useState({
    totalInstances: 0,
    activeInstances: 0,
    totalCpuUsage: 0,
    totalMemoryUsage: 0,
    avgDetectionRate: 0,
    avgResponseTime: 0,
    costPerHour: 0,
    efficiency: 0
  });

  useEffect(() => {
    initializeBrowserFarm();
    const interval = setInterval(updateRealTimeData, 5000);
    return () => clearInterval(interval);
  }, []);

  const initializeBrowserFarm = () => {
    // Initialize browser instances
    const mockInstances: BrowserInstance[] = Array.from({ length: 15 }, (_, i) => ({
      id: `browser-${i + 1}`,
      status: ['idle', 'busy', 'starting'][Math.floor(Math.random() * 3)] as any,
      browser: ['chrome', 'firefox', 'safari', 'edge'][Math.floor(Math.random() * 4)] as any,
      deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
      region: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'][Math.floor(Math.random() * 4)],
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      screenResolution: '1920x1080',
      cpuUsage: Math.random() * 80,
      memoryUsage: Math.random() * 90,
      uptime: Math.random() * 24,
      totalSessions: Math.floor(Math.random() * 1000),
      successRate: 85 + Math.random() * 15,
      avgSessionTime: 30 + Math.random() * 120,
      antiDetectionScore: 75 + Math.random() * 25,
      lastActivity: new Date(Date.now() - Math.random() * 1000 * 60 * 30),
      assignedProxy: Math.random() > 0.3 ? `proxy-${Math.floor(Math.random() * 10)}` : undefined,
      fingerprint: {
        canvas: `canvas-${Math.random().toString(36).substr(2, 9)}`,
        webgl: `webgl-${Math.random().toString(36).substr(2, 9)}`,
        fonts: ['Arial', 'Times New Roman', 'Helvetica'],
        timezone: 'America/New_York',
        language: 'en-US',
        platform: 'Win32',
        vendor: 'Google Inc.',
        cookiesEnabled: true,
        doNotTrack: '1',
        hardwareConcurrency: 8,
        deviceMemory: 8,
        colorDepth: 24,
        pixelRatio: 1
      }
    }));
    setInstances(mockInstances);

    // Initialize pool configurations
    const mockPools: PoolConfiguration[] = [
      {
        id: 'main-pool',
        name: 'Main Production Pool',
        enabled: true,
        minInstances: 5,
        maxInstances: 20,
        targetCpuUsage: 70,
        autoScaling: true,
        antiDetection: {
          enabled: true,
          level: 'advanced',
          randomizeFingerprints: true,
          rotateUserAgents: true,
          mimicHumanBehavior: true,
          useResidentialProxies: true
        },
        deviceDistribution: { desktop: 60, mobile: 30, tablet: 10 },
        browserDistribution: { chrome: 50, firefox: 25, safari: 15, edge: 10 },
        regionDistribution: { 'us-east-1': 40, 'us-west-2': 25, 'eu-west-1': 25, 'ap-southeast-1': 10 }
      },
      {
        id: 'stealth-pool',
        name: 'High Stealth Pool',
        enabled: true,
        minInstances: 2,
        maxInstances: 8,
        targetCpuUsage: 60,
        autoScaling: false,
        antiDetection: {
          enabled: true,
          level: 'stealth',
          randomizeFingerprints: true,
          rotateUserAgents: true,
          mimicHumanBehavior: true,
          useResidentialProxies: true
        },
        deviceDistribution: { desktop: 70, mobile: 20, tablet: 10 },
        browserDistribution: { chrome: 40, firefox: 30, safari: 20, edge: 10 },
        regionDistribution: { 'us-east-1': 30, 'us-west-2': 30, 'eu-west-1': 30, 'ap-southeast-1': 10 }
      },
      {
        id: 'mobile-pool',
        name: 'Mobile Device Pool',
        enabled: true,
        minInstances: 3,
        maxInstances: 12,
        targetCpuUsage: 75,
        autoScaling: true,
        antiDetection: {
          enabled: true,
          level: 'basic',
          randomizeFingerprints: true,
          rotateUserAgents: true,
          mimicHumanBehavior: false,
          useResidentialProxies: false
        },
        deviceDistribution: { desktop: 10, mobile: 80, tablet: 10 },
        browserDistribution: { chrome: 60, firefox: 20, safari: 15, edge: 5 },
        regionDistribution: { 'us-east-1': 35, 'us-west-2': 25, 'eu-west-1': 25, 'ap-southeast-1': 15 }
      }
    ];
    setPoolConfigs(mockPools);

    // Initialize anti-detection techniques
    const mockTechniques: AntiDetectionTechnique[] = [
      {
        id: 'canvas-fingerprint',
        name: 'Canvas Fingerprint Randomization',
        description: 'Randomizes HTML5 canvas rendering to avoid fingerprinting',
        enabled: true,
        effectiveness: 92,
        detectionRate: 8,
        performanceImpact: 'low',
        category: 'fingerprinting'
      },
      {
        id: 'webgl-spoofing',
        name: 'WebGL Renderer Spoofing',
        description: 'Modifies WebGL renderer and vendor information',
        enabled: true,
        effectiveness: 88,
        detectionRate: 12,
        performanceImpact: 'medium',
        category: 'fingerprinting'
      },
      {
        id: 'user-agent-rotation',
        name: 'User Agent Rotation',
        description: 'Rotates user agents based on real browser statistics',
        enabled: true,
        effectiveness: 95,
        detectionRate: 5,
        performanceImpact: 'low',
        category: 'fingerprinting'
      },
      {
        id: 'mouse-movement',
        name: 'Human Mouse Movement',
        description: 'Simulates natural mouse movement patterns',
        enabled: true,
        effectiveness: 85,
        detectionRate: 15,
        performanceImpact: 'high',
        category: 'behavior'
      },
      {
        id: 'typing-patterns',
        name: 'Natural Typing Patterns',
        description: 'Mimics human typing speed and patterns',
        enabled: true,
        effectiveness: 78,
        detectionRate: 22,
        performanceImpact: 'medium',
        category: 'behavior'
      },
      {
        id: 'request-timing',
        name: 'Request Timing Variation',
        description: 'Adds random delays between requests',
        enabled: true,
        effectiveness: 82,
        detectionRate: 18,
        performanceImpact: 'low',
        category: 'timing'
      },
      {
        id: 'header-randomization',
        name: 'HTTP Header Randomization',
        description: 'Randomizes non-critical HTTP headers',
        enabled: false,
        effectiveness: 70,
        detectionRate: 30,
        performanceImpact: 'low',
        category: 'network'
      },
      {
        id: 'viewport-sizing',
        name: 'Dynamic Viewport Sizing',
        description: 'Changes viewport size to match real devices',
        enabled: true,
        effectiveness: 90,
        detectionRate: 10,
        performanceImpact: 'low',
        category: 'fingerprinting'
      }
    ];
    setAntiDetectionTechniques(mockTechniques);

    // Initialize performance optimizations
    const mockOptimizations: PerformanceOptimization[] = [
      {
        id: 'resource-blocking',
        name: 'Resource Blocking',
        description: 'Block unnecessary resources (images, CSS, fonts)',
        enabled: true,
        impact: 'speed',
        improvement: 45,
        tradeoff: 'May affect visual scraping accuracy'
      },
      {
        id: 'javascript-execution',
        name: 'Selective JavaScript Execution',
        description: 'Only execute essential JavaScript',
        enabled: true,
        impact: 'speed',
        improvement: 35
      },
      {
        id: 'connection-pooling',
        name: 'Connection Pooling',
        description: 'Reuse browser connections when possible',
        enabled: true,
        impact: 'resource',
        improvement: 25
      },
      {
        id: 'memory-optimization',
        name: 'Memory Optimization',
        description: 'Aggressive garbage collection and memory management',
        enabled: true,
        impact: 'resource',
        improvement: 30
      },
      {
        id: 'cache-management',
        name: 'Intelligent Cache Management',
        description: 'Smart caching to reduce redundant requests',
        enabled: false,
        impact: 'speed',
        improvement: 20,
        tradeoff: 'May serve stale content'
      },
      {
        id: 'parallel-processing',
        name: 'Parallel Processing',
        description: 'Process multiple tabs in parallel',
        enabled: true,
        impact: 'speed',
        improvement: 40
      },
      {
        id: 'preemptive-scaling',
        name: 'Preemptive Auto-scaling',
        description: 'Scale up before hitting resource limits',
        enabled: true,
        impact: 'stability',
        improvement: 60
      },
      {
        id: 'health-monitoring',
        name: 'Instance Health Monitoring',
        description: 'Continuously monitor and restart unhealthy instances',
        enabled: true,
        impact: 'stability',
        improvement: 55
      }
    ];
    setOptimizations(mockOptimizations);

    // Calculate farm statistics
    calculateFarmStats(mockInstances);
  };

  const updateRealTimeData = () => {
    setInstances(prev => prev.map(instance => ({
      ...instance,
      cpuUsage: Math.max(0, Math.min(100, instance.cpuUsage + (Math.random() - 0.5) * 10)),
      memoryUsage: Math.max(0, Math.min(100, instance.memoryUsage + (Math.random() - 0.5) * 5)),
      lastActivity: Math.random() > 0.8 ? new Date() : instance.lastActivity
    })));
  };

  const calculateFarmStats = (instanceList: BrowserInstance[]) => {
    const totalInstances = instanceList.length;
    const activeInstances = instanceList.filter(i => i.status === 'busy').length;
    const totalCpuUsage = instanceList.reduce((sum, i) => sum + i.cpuUsage, 0) / totalInstances;
    const totalMemoryUsage = instanceList.reduce((sum, i) => sum + i.memoryUsage, 0) / totalInstances;
    const avgDetectionRate = 100 - (instanceList.reduce((sum, i) => sum + i.antiDetectionScore, 0) / totalInstances);
    const avgResponseTime = instanceList.reduce((sum, i) => sum + i.avgSessionTime, 0) / totalInstances;
    const costPerHour = totalInstances * 0.15; // $0.15 per instance per hour
    const efficiency = (activeInstances / totalInstances) * 100;

    setFarmStats({
      totalInstances,
      activeInstances,
      totalCpuUsage,
      totalMemoryUsage,
      avgDetectionRate,
      avgResponseTime,
      costPerHour,
      efficiency
    });
  };

  const toggleInstance = (instanceId: string, action: 'start' | 'stop' | 'restart') => {
    setInstances(prev => prev.map(instance =>
      instance.id === instanceId
        ? { ...instance, status: action === 'stop' ? 'stopping' : 'starting' }
        : instance
    ));
  };

  const toggleTechnique = (techniqueId: string) => {
    setAntiDetectionTechniques(prev => prev.map(technique =>
      technique.id === techniqueId
        ? { ...technique, enabled: !technique.enabled }
        : technique
    ));
  };

  const toggleOptimization = (optimizationId: string) => {
    setOptimizations(prev => prev.map(optimization =>
      optimization.id === optimizationId
        ? { ...optimization, enabled: !optimization.enabled }
        : optimization
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-blue-600 bg-blue-100';
      case 'starting': return 'text-yellow-600 bg-yellow-100';
      case 'stopping': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getBrowserIcon = (browser: string) => {
    switch (browser) {
      case 'chrome': return <Chrome className="w-4 h-4 text-blue-600" />;
      case 'firefox': return <Chrome className="w-4 h-4 text-orange-600" />;
      case 'safari': return <Globe className="w-4 h-4 text-blue-500" />;
      case 'edge': return <Monitor className="w-4 h-4 text-blue-700" />;
      default: return <Monitor className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getPerformanceImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browser Farm Optimizer</h1>
          <p className="text-muted-foreground">
            Distributed browser pool management with anti-detection and auto-scaling
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="default" className="flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>{farmStats.activeInstances}/{farmStats.totalInstances} Active</span>
          </Badge>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configure Farm
          </Button>
        </div>
      </div>

      {/* Farm Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Server className="w-4 h-4" />
              <span>Total Instances</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmStats.totalInstances}</div>
            <div className="text-sm text-muted-foreground">
              {farmStats.activeInstances} active • {farmStats.efficiency.toFixed(1)}% efficiency
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Cpu className="w-4 h-4" />
              <span>Resource Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU</span>
                <span>{farmStats.totalCpuUsage.toFixed(1)}%</span>
              </div>
              <Progress value={farmStats.totalCpuUsage} className="h-2" />
              <div className="flex justify-between text-sm">
                <span>Memory</span>
                <span>{farmStats.totalMemoryUsage.toFixed(1)}%</span>
              </div>
              <Progress value={farmStats.totalMemoryUsage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Anti-Detection</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(100 - farmStats.avgDetectionRate).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Stealth effectiveness
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmStats.avgResponseTime.toFixed(0)}s</div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingDown className="w-3 h-3 mr-1" />
              -23% vs last week
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="instances" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="instances">Browser Instances</TabsTrigger>
          <TabsTrigger value="pools">Pool Management</TabsTrigger>
          <TabsTrigger value="anti-detection">Anti-Detection</TabsTrigger>
          <TabsTrigger value="optimization">Performance</TabsTrigger>
          <TabsTrigger value="scaling">Auto-Scaling</TabsTrigger>
        </TabsList>

        {/* Browser Instances */}
        <TabsContent value="instances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Browser Instances</CardTitle>
              <CardDescription>
                Real-time monitoring of browser farm instances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instance</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Resources</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Anti-Detection</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instances.map((instance) => (
                      <TableRow key={instance.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{instance.id}</div>
                            <div className="text-xs text-muted-foreground">{instance.ip}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getBrowserIcon(instance.browser)}
                            <span className="capitalize">{instance.browser}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getDeviceIcon(instance.deviceType)}
                            <span className="capitalize">{instance.deviceType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(instance.status)}>
                            {instance.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{instance.region}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Cpu className="w-3 h-3" />
                              <span className="text-xs">{instance.cpuUsage.toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MemoryStick className="w-3 h-3" />
                              <span className="text-xs">{instance.memoryUsage.toFixed(0)}%</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs">
                              {instance.successRate.toFixed(1)}% success
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {instance.avgSessionTime.toFixed(0)}s avg
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="text-sm font-medium">
                              {instance.antiDetectionScore.toFixed(0)}%
                            </div>
                            <Progress
                              value={instance.antiDetectionScore}
                              className="h-1 w-16"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {instance.status === 'idle' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleInstance(instance.id, 'start')}
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}
                            {instance.status === 'busy' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleInstance(instance.id, 'stop')}
                              >
                                <Pause className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleInstance(instance.id, 'restart')}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pool Management */}
        <TabsContent value="pools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {poolConfigs.map((pool) => (
              <Card key={pool.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{pool.name}</CardTitle>
                    <Switch checked={pool.enabled} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Min Instances</span>
                        <div className="font-medium">{pool.minInstances}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max Instances</span>
                        <div className="font-medium">{pool.maxInstances}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target CPU</span>
                        <div className="font-medium">{pool.targetCpuUsage}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Auto-scaling</span>
                        <div className="font-medium">{pool.autoScaling ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Anti-Detection Level</div>
                      <Badge variant={
                        pool.antiDetection.level === 'stealth' ? 'default' :
                        pool.antiDetection.level === 'advanced' ? 'secondary' : 'outline'
                      }>
                        {pool.antiDetection.level}
                      </Badge>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Device Distribution</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Desktop</span>
                          <span>{pool.deviceDistribution.desktop}%</span>
                        </div>
                        <Progress value={pool.deviceDistribution.desktop} className="h-1" />
                        <div className="flex justify-between text-xs">
                          <span>Mobile</span>
                          <span>{pool.deviceDistribution.mobile}%</span>
                        </div>
                        <Progress value={pool.deviceDistribution.mobile} className="h-1" />
                        <div className="flex justify-between text-xs">
                          <span>Tablet</span>
                          <span>{pool.deviceDistribution.tablet}%</span>
                        </div>
                        <Progress value={pool.deviceDistribution.tablet} className="h-1" />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3 mr-1" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        Scale
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Anti-Detection */}
        <TabsContent value="anti-detection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Anti-Detection Techniques</CardTitle>
              <CardDescription>
                Advanced techniques to avoid detection and blocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {antiDetectionTechniques.map((technique) => (
                  <div key={technique.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">{technique.name}</span>
                      </div>
                      <Switch
                        checked={technique.enabled}
                        onCheckedChange={() => toggleTechnique(technique.id)}
                      />
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {technique.description}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Effectiveness</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-green-600">{technique.effectiveness}%</span>
                          <Progress value={technique.effectiveness} className="h-1 flex-1" />
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Detection Rate</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-red-600">{technique.detectionRate}%</span>
                          <Progress value={technique.detectionRate} className="h-1 flex-1" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{technique.category}</Badge>
                      <span className={`text-sm ${getPerformanceImpactColor(technique.performanceImpact)}`}>
                        {technique.performanceImpact} impact
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Optimization */}
        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Optimizations</CardTitle>
              <CardDescription>
                Speed and resource optimizations for maximum efficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {optimizations.map((optimization) => (
                  <div key={optimization.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span className="font-medium">{optimization.name}</span>
                      </div>
                      <Switch
                        checked={optimization.enabled}
                        onCheckedChange={() => toggleOptimization(optimization.id)}
                      />
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {optimization.description}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-muted-foreground">Improvement</span>
                        <div className="font-medium text-green-600">+{optimization.improvement}%</div>
                      </div>
                      <Badge variant="outline">{optimization.impact}</Badge>
                    </div>

                    {optimization.tradeoff && (
                      <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                        ⚠️ {optimization.tradeoff}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Scaling */}
        <TabsContent value="scaling" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scaling Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium">CPU Usage</div>
                      <div className="text-sm text-muted-foreground">
                        Current: {farmStats.totalCpuUsage.toFixed(1)}% • Target: 70%
                      </div>
                    </div>
                    <TrendingDown className="w-5 h-5 text-green-600" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium">Queue Length</div>
                      <div className="text-sm text-muted-foreground">
                        Current: 12 • Threshold: 20
                      </div>
                    </div>
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="font-medium">Response Time</div>
                      <div className="text-sm text-muted-foreground">
                        Current: {farmStats.avgResponseTime.toFixed(0)}s • Target: 30s
                      </div>
                    </div>
                    <TrendingUp className="w-5 h-5 text-yellow-600" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium">Error Rate</div>
                      <div className="text-sm text-muted-foreground">
                        Current: 2.1% • Threshold: 5%
                      </div>
                    </div>
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scaling Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-3">
                    <div className="font-medium">Scale Up Triggers</div>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• CPU usage &gt; 80% for 5 minutes</li>
                      <li>• Queue length &gt; 20 requests</li>
                      <li>• Response time &gt; 45 seconds</li>
                      <li>• Error rate &gt; 5%</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="font-medium">Scale Down Triggers</div>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• CPU usage &lt; 30% for 15 minutes</li>
                      <li>• Queue length &lt; 5 requests</li>
                      <li>• Low activity for 20 minutes</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="font-medium">Scaling Limits</div>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Max scale up: 5 instances per event</li>
                      <li>• Max scale down: 2 instances per event</li>
                      <li>• Cooldown period: 10 minutes</li>
                      <li>• Global max: 50 instances</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Scaling Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: '2 minutes ago', action: 'Scale Up', reason: 'High CPU usage (85%)', instances: '+3' },
                  { time: '15 minutes ago', action: 'Scale Down', reason: 'Low activity period', instances: '-2' },
                  { time: '1 hour ago', action: 'Scale Up', reason: 'Queue length exceeded (25)', instances: '+4' },
                  { time: '3 hours ago', action: 'Scale Down', reason: 'CPU usage below threshold', instances: '-1' }
                ].map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {event.action === 'Scale Up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-blue-600" />
                      )}
                      <div>
                        <div className="font-medium">{event.action}</div>
                        <div className="text-sm text-muted-foreground">{event.reason}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{event.instances}</div>
                      <div className="text-sm text-muted-foreground">{event.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
