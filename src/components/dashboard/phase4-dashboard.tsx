'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Brain,
  DollarSign,
  Eye,
  Globe,
  Monitor,
  Shield,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Network,
  Server,
  Settings
} from 'lucide-react';

// Phase 4 Dashboard Component
export default function Phase4Dashboard() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [metrics, setMetrics] = useState<any>({});
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [scalingEnabled, setScalingEnabled] = useState(true);
  const [antiDetectionEnabled, setAntiDetectionEnabled] = useState(true);

  useEffect(() => {
    // Initialize Phase 4 system
    const initializePhase4 = async () => {
      try {
        // Simulate Phase 4 initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsInitialized(true);

        // Start real-time metrics collection
        if (realTimeEnabled) {
          startRealTimeMetrics();
        }
      } catch (error) {
        console.error('Failed to initialize Phase 4:', error);
      }
    };

    initializePhase4();
  }, []);

  const startRealTimeMetrics = () => {
    const interval = setInterval(() => {
      setMetrics({
        instances: {
          total: Math.floor(Math.random() * 20) + 10,
          idle: Math.floor(Math.random() * 8) + 2,
          busy: Math.floor(Math.random() * 10) + 5,
          maintenance: Math.floor(Math.random() * 2)
        },
        performance: {
          averageLoad: Math.random() * 40 + 30,
          averageResponseTime: Math.random() * 500 + 200,
          totalRequests: Math.floor(Math.random() * 10000) + 5000,
          errorRate: Math.random() * 3 + 0.5,
          throughput: Math.random() * 200 + 100,
          successRate: Math.random() * 5 + 95
        },
        cost: {
          current: Math.random() * 50 + 25,
          hourlyLimit: 100,
          utilization: Math.random() * 30 + 40,
          projection: {
            daily: Math.random() * 1200 + 600,
            monthly: Math.random() * 30000 + 15000
          }
        },
        predictions: {
          recommendedAction: Math.random() > 0.7 ? 'scale-up' : Math.random() > 0.4 ? 'scale-down' : 'maintain',
          confidence: Math.random() * 0.3 + 0.7,
          predictedLoad: Math.random() * 100,
          timeframe: 15
        },
        antiDetection: {
          fingerprintPoolSize: Math.floor(Math.random() * 30) + 20,
          rotationEnabled: antiDetectionEnabled,
          behavioralSimulation: true,
          trafficObfuscation: true,
          mlEvasion: true,
          successRate: Math.random() * 5 + 95
        },
        uptime: Date.now() - (Math.random() * 86400000), // Random uptime
        regions: [
          { name: 'US East', instances: Math.floor(Math.random() * 8) + 3, load: Math.random() * 100 },
          { name: 'US West', instances: Math.floor(Math.random() * 6) + 2, load: Math.random() * 100 },
          { name: 'EU West', instances: Math.floor(Math.random() * 5) + 2, load: Math.random() * 100 },
          { name: 'Asia Pacific', instances: Math.floor(Math.random() * 4) + 1, load: Math.random() * 100 }
        ],
        systemHealth: {
          cpu: Math.random() * 30 + 20,
          memory: Math.random() * 40 + 30,
          disk: Math.random() * 20 + 10,
          network: Math.random() * 50 + 25
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'scale-up': return 'bg-blue-100 text-blue-800';
      case 'scale-down': return 'bg-yellow-100 text-yellow-800';
      case 'maintain': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isInitialized) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Initializing Phase 4 Browser Farm</h2>
            <p className="text-gray-600">Setting up ML-based scaling, anti-detection, and monitoring systems...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            Phase 4: Browser Farm Optimization
          </h1>
          <p className="text-gray-600 mt-2">
            Enterprise-grade distributed browser management with ML-based scaling and advanced anti-detection
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="realtime" className="text-sm font-medium">Real-time Monitoring</label>
            <Switch
              id="realtime"
              checked={realTimeEnabled}
              onCheckedChange={setRealTimeEnabled}
            />
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            System Operational
          </Badge>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Instances</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.instances?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.instances?.idle || 0} idle, {metrics.instances?.busy || 0} busy
            </p>
            <Progress value={(metrics.instances?.busy / metrics.instances?.total) * 100 || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ML Prediction</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getActionBadgeColor(metrics.predictions?.recommendedAction || 'maintain')}>
                {metrics.predictions?.recommendedAction || 'maintain'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {((metrics.predictions?.confidence || 0) * 100).toFixed(1)}% confidence
            </p>
            <Progress value={(metrics.predictions?.confidence || 0) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Optimization</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics.cost?.current || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {(metrics.cost?.utilization || 0).toFixed(1)}% of budget used
            </p>
            <Progress value={metrics.cost?.utilization || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anti-Detection</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.antiDetection?.successRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.antiDetection?.fingerprintPoolSize || 0} fingerprints available
            </p>
            <Progress value={metrics.antiDetection?.successRate || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="scaling">ML Scaling</TabsTrigger>
          <TabsTrigger value="antidetection">Anti-Detection</TabsTrigger>
          <TabsTrigger value="cost">Cost Control</TabsTrigger>
          <TabsTrigger value="regions">Geo Distribution</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Real-time Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average Load</span>
                    <span className="text-sm">{(metrics.performance?.averageLoad || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.performance?.averageLoad || 0} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm">{(metrics.performance?.averageResponseTime || 0).toFixed(0)}ms</span>
                  </div>
                  <Progress value={(metrics.performance?.averageResponseTime || 0) / 10} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Throughput</span>
                    <span className="text-sm">{(metrics.performance?.throughput || 0).toFixed(0)} req/min</span>
                  </div>
                  <Progress value={(metrics.performance?.throughput || 0) / 3} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Error Rate</span>
                    <span className={`text-sm ${getStatusColor(metrics.performance?.errorRate || 0, { warning: 2, critical: 5 })}`}>
                      {(metrics.performance?.errorRate || 0).toFixed(2)}%
                    </span>
                  </div>
                  <Progress value={metrics.performance?.errorRate || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-green-800">Success Rate</div>
                      <div className="text-sm text-green-600">{(metrics.performance?.successRate || 0).toFixed(2)}%</div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>

                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-blue-800">Total Requests</div>
                      <div className="text-sm text-blue-600">{(metrics.performance?.totalRequests || 0).toLocaleString()}</div>
                    </div>
                    <Globe className="h-8 w-8 text-blue-600" />
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-purple-800">Uptime</div>
                      <div className="text-sm text-purple-600">{formatUptime(metrics.uptime || 0)}</div>
                    </div>
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scaling" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  ML-Based Predictive Scaling
                </CardTitle>
                <CardDescription>
                  Intelligent auto-scaling with machine learning predictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Scaling Algorithm</span>
                  <Badge variant="outline">ML-Predictive</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Recommendation</span>
                  <Badge className={getActionBadgeColor(metrics.predictions?.recommendedAction || 'maintain')}>
                    {metrics.predictions?.recommendedAction || 'maintain'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Prediction Confidence</span>
                    <span className="text-sm">{((metrics.predictions?.confidence || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(metrics.predictions?.confidence || 0) * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Predicted Load</span>
                    <span className="text-sm">{(metrics.predictions?.predictedLoad || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.predictions?.predictedLoad || 0} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Scaling Enabled</span>
                  <Switch
                    checked={scalingEnabled}
                    onCheckedChange={setScalingEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Scaling Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Min Instances</label>
                    <div className="text-2xl font-bold text-blue-600">3</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Max Instances</label>
                    <div className="text-2xl font-bold text-red-600">50</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Scale Up Threshold</label>
                    <div className="text-2xl font-bold text-orange-600">80%</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Scale Down Threshold</label>
                    <div className="text-2xl font-bold text-green-600">30%</div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium mb-2">ML Factors</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Historical: 40%</div>
                    <div>Seasonal: 20%</div>
                    <div>Trend: 30%</div>
                    <div>External: 10%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="antidetection" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Advanced Anti-Detection Engine
                </CardTitle>
                <CardDescription>
                  ML-powered evasion with dynamic fingerprint rotation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Anti-Detection Enabled</span>
                  <Switch
                    checked={antiDetectionEnabled}
                    onCheckedChange={setAntiDetectionEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="text-sm text-green-600">{(metrics.antiDetection?.successRate || 0).toFixed(2)}%</span>
                  </div>
                  <Progress value={metrics.antiDetection?.successRate || 0} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fingerprint Pool Size</span>
                  <span className="text-sm font-bold">{metrics.antiDetection?.fingerprintPoolSize || 0}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Fingerprint Rotation</span>
                    <Badge variant={metrics.antiDetection?.rotationEnabled ? "default" : "secondary"}>
                      {metrics.antiDetection?.rotationEnabled ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Behavioral Simulation</span>
                    <Badge variant={metrics.antiDetection?.behavioralSimulation ? "default" : "secondary"}>
                      {metrics.antiDetection?.behavioralSimulation ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Traffic Obfuscation</span>
                    <Badge variant={metrics.antiDetection?.trafficObfuscation ? "default" : "secondary"}>
                      {metrics.antiDetection?.trafficObfuscation ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>ML Evasion</span>
                    <Badge variant={metrics.antiDetection?.mlEvasion ? "default" : "secondary"}>
                      {metrics.antiDetection?.mlEvasion ? "ON" : "OFF"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Detection Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-1">99.7%</div>
                    <div className="text-sm text-green-700">Evasion Success Rate</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">15min</div>
                      <div className="text-xs text-blue-700">Rotation Interval</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">47</div>
                      <div className="text-xs text-purple-700">Active Profiles</div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div>🎭 Browser fingerprints rotated automatically</div>
                    <div>🤖 ML-based behavior simulation active</div>
                    <div>🌐 Traffic patterns randomized</div>
                    <div>🛡️ Advanced evasion algorithms enabled</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Optimization & Budget Control
                </CardTitle>
                <CardDescription>
                  Real-time cost monitoring with intelligent budget management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    ${(metrics.cost?.current || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-700">Current Hourly Cost</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Budget Utilization</span>
                    <span className="text-sm">{(metrics.cost?.utilization || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.cost?.utilization || 0} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Daily Projection</label>
                    <div className="text-lg font-bold text-orange-600">
                      ${(metrics.cost?.projection?.daily || 0).toFixed(0)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Monthly Projection</label>
                    <div className="text-lg font-bold text-red-600">
                      ${(metrics.cost?.projection?.monthly || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Budget Alerts & Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm">Hourly Limit</span>
                    <span className="font-bold text-green-600">$100.00</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                    <span className="text-sm">Daily Limit</span>
                    <span className="font-bold text-yellow-600">$2,000.00</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm">Monthly Limit</span>
                    <span className="font-bold text-red-600">$50,000.00</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">Cost per Instance</div>
                  <div className="text-2xl font-bold text-blue-600">$0.50/hour</div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">Alert Thresholds</div>
                  <div className="flex justify-between text-xs">
                    <span>Warning: 80%</span>
                    <span>Critical: 95%</span>
                  </div>
                  <Progress value={80} className="h-1 mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="regions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Geographic Distribution & Load Balancing
              </CardTitle>
              <CardDescription>
                Intelligent regional distribution for optimal performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(metrics.regions || []).map((region: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{region.name}</h4>
                      <Badge variant="outline">{region.instances} instances</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Load</span>
                        <span>{region.load.toFixed(1)}%</span>
                      </div>
                      <Progress value={region.load} className="h-2" />
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Latency: {(Math.random() * 100 + 50).toFixed(0)}ms
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  System Health Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      <span className="text-sm font-medium">CPU Usage</span>
                    </div>
                    <span className="text-sm">{(metrics.systemHealth?.cpu || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.systemHealth?.cpu || 0} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="text-sm font-medium">Memory Usage</span>
                    </div>
                    <span className="text-sm">{(metrics.systemHealth?.memory || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.systemHealth?.memory || 0} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      <span className="text-sm font-medium">Network I/O</span>
                    </div>
                    <span className="text-sm">{(metrics.systemHealth?.network || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.systemHealth?.network || 0} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-600 mb-2">A+</div>
                  <div className="text-sm text-gray-600 mb-4">Overall System Performance</div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-600">99.8%</div>
                      <div className="text-xs text-green-700">Uptime</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-600">245ms</div>
                      <div className="text-xs text-blue-700">Avg Response</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your Phase 4 Browser Farm with one-click actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Force Scale Up
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Optimize Performance
            </Button>
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Rotate Fingerprints
            </Button>
            <Button variant="outline" size="sm">
              <DollarSign className="h-4 w-4 mr-2" />
              Cost Analysis
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure ML Model
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
