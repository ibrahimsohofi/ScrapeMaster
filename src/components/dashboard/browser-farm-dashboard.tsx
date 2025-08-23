'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  Cpu,
  HardDrive as Memory,
  Wifi as Network,
  Zap,
  Shield,
  Globe,
  Smartphone,
  Code2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize
} from 'lucide-react';

interface BrowserPoolStats {
  totalBrowsers: number;
  activeBrowsers: number;
  idleBrowsers: number;
  healthyBrowsers: number;
  degradedBrowsers: number;
  offlineBrowsers: number;
  averageLoad: number;
  totalSessions: number;
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  regions: Array<{
    name: string;
    browsers: number;
    load: number;
    status: 'healthy' | 'degraded' | 'offline';
  }>;
}

interface AntiDetectionStats {
  activeProfiles: number;
  fingerprintRotations: number;
  behaviorPatterns: number;
  detectionRate: number;
  successRate: number;
  trafficObfuscation: boolean;
  headerRotation: boolean;
}

interface ResourceQuota {
  organizationId: string;
  limits: {
    maxBrowsers: number;
    maxSessions: number;
    maxMemoryMB: number;
    maxCPUCores: number;
  };
  usage: {
    browsers: number;
    sessions: number;
    memoryMB: number;
    cpuCores: number;
  };
  billing: {
    currentCost: number;
    monthlyBudget: number;
    tier: string;
  };
}

interface MobileDevice {
  id: string;
  name: string;
  category: 'phone' | 'tablet';
  brand: string;
  viewport: { width: number; height: number };
  active: boolean;
  sessions: number;
}

interface PerformanceMetrics {
  cacheHitRate: number;
  bandwidthUsage: number;
  compressionRatio: number;
  retryRate: number;
  timeoutAdjustments: number;
  optimizationLevel: 'conservative' | 'balanced' | 'aggressive';
}

export default function BrowserFarmDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isOptimizationEnabled, setIsOptimizationEnabled] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Mock data - in real app, this would come from APIs
  const [poolStats] = useState<BrowserPoolStats>({
    totalBrowsers: 125,
    activeBrowsers: 89,
    idleBrowsers: 31,
    healthyBrowsers: 112,
    degradedBrowsers: 8,
    offlineBrowsers: 5,
    averageLoad: 68,
    totalSessions: 324,
    averageResponseTime: 1250,
    throughput: 45.7,
    errorRate: 2.3,
    regions: [
      { name: 'US-East', browsers: 45, load: 72, status: 'healthy' },
      { name: 'US-West', browsers: 38, load: 65, status: 'healthy' },
      { name: 'EU-West', browsers: 25, load: 58, status: 'healthy' },
      { name: 'Asia-Pacific', browsers: 17, load: 81, status: 'degraded' }
    ]
  });

  const [antiDetectionStats] = useState<AntiDetectionStats>({
    activeProfiles: 89,
    fingerprintRotations: 1247,
    behaviorPatterns: 23,
    detectionRate: 0.8,
    successRate: 97.2,
    trafficObfuscation: true,
    headerRotation: true
  });

  const [resourceQuota] = useState<ResourceQuota>({
    organizationId: 'org-123',
    limits: {
      maxBrowsers: 200,
      maxSessions: 1000,
      maxMemoryMB: 32768,
      maxCPUCores: 64
    },
    usage: {
      browsers: 125,
      sessions: 324,
      memoryMB: 18450,
      cpuCores: 42
    },
    billing: {
      currentCost: 1247.50,
      monthlyBudget: 2000,
      tier: 'Enterprise'
    }
  });

  const [mobileDevices] = useState<MobileDevice[]>([
    { id: '1', name: 'iPhone 15 Pro', category: 'phone', brand: 'Apple', viewport: { width: 393, height: 852 }, active: true, sessions: 12 },
    { id: '2', name: 'Samsung Galaxy S24', category: 'phone', brand: 'Samsung', viewport: { width: 360, height: 780 }, active: true, sessions: 8 },
    { id: '3', name: 'Google Pixel 8', category: 'phone', brand: 'Google', viewport: { width: 412, height: 915 }, active: true, sessions: 5 },
    { id: '4', name: 'iPad Pro 12.9"', category: 'tablet', brand: 'Apple', viewport: { width: 1024, height: 1366 }, active: false, sessions: 0 }
  ]);

  const [performanceMetrics] = useState<PerformanceMetrics>({
    cacheHitRate: 84.2,
    bandwidthUsage: 156.7,
    compressionRatio: 3.4,
    retryRate: 8.1,
    timeoutAdjustments: 23,
    optimizationLevel: 'balanced'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Browser Farm Control Center</h1>
          <p className="text-muted-foreground">
            Manage distributed browser pools, anti-detection, and performance optimization
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isOptimizationEnabled}
              onCheckedChange={setIsOptimizationEnabled}
            />
            <span className="text-sm">Global Optimization</span>
          </div>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="us-east">US East</SelectItem>
              <SelectItem value="us-west">US West</SelectItem>
              <SelectItem value="eu-west">EU West</SelectItem>
              <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Browsers</p>
                <p className="text-2xl font-bold">{poolStats.activeBrowsers}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Progress value={(poolStats.activeBrowsers / poolStats.totalBrowsers) * 100} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">
                {poolStats.totalBrowsers} total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{poolStats.totalSessions}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={poolStats.averageLoad} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">
                {poolStats.averageLoad}% avg load
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold">{poolStats.averageResponseTime}ms</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <Badge variant={poolStats.averageResponseTime < 2000 ? "default" : "destructive"}>
                {poolStats.averageResponseTime < 2000 ? "Fast" : "Slow"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{antiDetectionStats.successRate}%</p>
              </div>
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="mt-2">
              <Progress value={antiDetectionStats.successRate} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">
                Anti-detection
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost Usage</p>
                <p className="text-2xl font-bold">
                  ${resourceQuota.billing.currentCost.toFixed(0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <Progress
                value={(resourceQuota.billing.currentCost / resourceQuota.billing.monthlyBudget) * 100}
                className="h-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                of ${resourceQuota.billing.monthlyBudget} budget
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pool">Browser Pool</TabsTrigger>
          <TabsTrigger value="anti-detection">Anti-Detection</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regional Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Regional Distribution</span>
                </CardTitle>
                <CardDescription>Browser allocation across regions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {poolStats.regions.map((region) => (
                    <div key={region.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center space-x-1 ${getStatusColor(region.status)}`}>
                          {getStatusIcon(region.status)}
                          <span className="font-medium">{region.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{region.browsers} browsers</p>
                          <p className="text-xs text-muted-foreground">{region.load}% load</p>
                        </div>
                        <div className="w-20">
                          <Progress value={region.load} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>System Health</span>
                </CardTitle>
                <CardDescription>Real-time health monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Healthy Browsers</span>
                    <div className="flex items-center space-x-2">
                      <Progress
                        value={(poolStats.healthyBrowsers / poolStats.totalBrowsers) * 100}
                        className="w-24 h-2"
                      />
                      <span className="text-sm font-medium">{poolStats.healthyBrowsers}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <div className="flex items-center space-x-2">
                      <Progress
                        value={poolStats.errorRate}
                        className="w-24 h-2"
                      />
                      <span className="text-sm font-medium">{poolStats.errorRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Throughput</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{poolStats.throughput} req/s</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Detection Rate</span>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{antiDetectionStats.detectionRate}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common browser farm operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Play className="h-6 w-6" />
                  <span>Scale Up</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Pause className="h-6 w-6" />
                  <span>Scale Down</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <RotateCcw className="h-6 w-6" />
                  <span>Restart Pool</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Settings className="h-6 w-6" />
                  <span>Configure</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pool" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pool Statistics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Browser Pool Management</CardTitle>
                <CardDescription>Distributed browser pool status and control</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{poolStats.healthyBrowsers}</p>
                    <p className="text-sm text-muted-foreground">Healthy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{poolStats.degradedBrowsers}</p>
                    <p className="text-sm text-muted-foreground">Degraded</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{poolStats.offlineBrowsers}</p>
                    <p className="text-sm text-muted-foreground">Offline</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Load Balancing</span>
                    <Badge variant="outline">Round Robin</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auto-scaling</span>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Health Monitoring</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scaling Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Auto-scaling Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Min Browsers</label>
                  <div className="mt-1">
                    <span className="text-2xl font-bold">10</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Max Browsers</label>
                  <div className="mt-1">
                    <span className="text-2xl font-bold">200</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Target CPU</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Progress value={70} className="flex-1" />
                    <span className="text-sm">70%</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Scale Up Threshold</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Progress value={80} className="flex-1" />
                    <span className="text-sm">80%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="anti-detection" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Anti-Detection Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Anti-Detection Status</span>
                </CardTitle>
                <CardDescription>Advanced evasion techniques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{antiDetectionStats.activeProfiles}</p>
                    <p className="text-sm text-muted-foreground">Active Profiles</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{antiDetectionStats.successRate}%</p>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fingerprint Randomization</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Behavioral Simulation</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Traffic Obfuscation</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Header Rotation</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detection Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Detection Metrics</CardTitle>
                <CardDescription>Real-time evasion performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Fingerprint Rotations</span>
                      <span className="text-sm font-medium">{antiDetectionStats.fingerprintRotations}</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Behavior Patterns</span>
                      <span className="text-sm font-medium">{antiDetectionStats.behaviorPatterns}</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Detection Rate</span>
                      <span className="text-sm font-medium">{antiDetectionStats.detectionRate}%</span>
                    </div>
                    <Progress value={antiDetectionStats.detectionRate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5" />
                  <span>Resource Usage</span>
                </CardTitle>
                <CardDescription>Current resource allocation and limits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Browsers</span>
                      <span className="text-sm">
                        {resourceQuota.usage.browsers} / {resourceQuota.limits.maxBrowsers}
                      </span>
                    </div>
                    <Progress
                      value={(resourceQuota.usage.browsers / resourceQuota.limits.maxBrowsers) * 100}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Sessions</span>
                      <span className="text-sm">
                        {resourceQuota.usage.sessions} / {resourceQuota.limits.maxSessions}
                      </span>
                    </div>
                    <Progress
                      value={(resourceQuota.usage.sessions / resourceQuota.limits.maxSessions) * 100}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Memory</span>
                      <span className="text-sm">
                        {(resourceQuota.usage.memoryMB / 1024).toFixed(1)}GB / {(resourceQuota.limits.maxMemoryMB / 1024).toFixed(0)}GB
                      </span>
                    </div>
                    <Progress
                      value={(resourceQuota.usage.memoryMB / resourceQuota.limits.maxMemoryMB) * 100}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">CPU Cores</span>
                      <span className="text-sm">
                        {resourceQuota.usage.cpuCores} / {resourceQuota.limits.maxCPUCores}
                      </span>
                    </div>
                    <Progress
                      value={(resourceQuota.usage.cpuCores / resourceQuota.limits.maxCPUCores) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing & Cost */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Cost Management</span>
                </CardTitle>
                <CardDescription>Budget utilization and billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">${resourceQuota.billing.currentCost.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Current month usage</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Budget Usage</span>
                      <span className="text-sm">
                        {((resourceQuota.billing.currentCost / resourceQuota.billing.monthlyBudget) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={(resourceQuota.billing.currentCost / resourceQuota.billing.monthlyBudget) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold">{resourceQuota.billing.tier}</p>
                      <p className="text-xs text-muted-foreground">Plan</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">${resourceQuota.billing.monthlyBudget}</p>
                      <p className="text-xs text-muted-foreground">Budget</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Mobile Device Emulation</span>
              </CardTitle>
              <CardDescription>Mobile and tablet device profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mobileDevices.map((device) => (
                  <Card key={device.id} className={`relative ${device.active ? 'ring-2 ring-blue-500' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {device.category === 'phone' ?
                            <Smartphone className="h-4 w-4" /> :
                            <Maximize className="h-4 w-4" />
                          }
                          <span className="font-medium">{device.name}</span>
                        </div>
                        <Badge variant={device.active ? "default" : "secondary"}>
                          {device.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{device.brand}</p>
                      <p className="text-xs text-muted-foreground">
                        {device.viewport.width} × {device.viewport.height}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm">Sessions: {device.sessions}</span>
                        <Button size="sm" variant={device.active ? "outline" : "default"}>
                          {device.active ? "Stop" : "Start"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Performance Optimization</span>
                </CardTitle>
                <CardDescription>Intelligent optimization algorithms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Cache Hit Rate</span>
                      <span className="text-sm font-medium">{performanceMetrics.cacheHitRate}%</span>
                    </div>
                    <Progress value={performanceMetrics.cacheHitRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Compression Ratio</span>
                      <span className="text-sm font-medium">{performanceMetrics.compressionRatio}:1</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Retry Rate</span>
                      <span className="text-sm font-medium">{performanceMetrics.retryRate}%</span>
                    </div>
                    <Progress value={performanceMetrics.retryRate} className="h-2" />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <span className="text-sm">Optimization Level</span>
                  <Badge variant="outline" className="capitalize">
                    {performanceMetrics.optimizationLevel}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Bandwidth & Network */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Network className="h-5 w-5" />
                  <span>Network Optimization</span>
                </CardTitle>
                <CardDescription>Bandwidth and network performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{performanceMetrics.bandwidthUsage} MB/s</p>
                    <p className="text-sm text-muted-foreground">Current bandwidth usage</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Compression</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Request Batching</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Resource Blocking</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Adaptive Timeouts</span>
                      <Badge variant="outline">{performanceMetrics.timeoutAdjustments} adjustments</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
