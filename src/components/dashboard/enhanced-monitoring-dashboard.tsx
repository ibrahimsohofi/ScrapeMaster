"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Server,
  Cpu,
  HardDrive,
  Network,
  DollarSign,
  Globe,
  Clock,
  Zap,
  Eye,
  Users,
  Database
} from 'lucide-react';

interface MonitoringMetrics {
  browserFarm: {
    totalNodes: number;
    healthyNodes: number;
    utilizationRate: number;
    averageResponseTime: number;
    totalCost: number;
    activeRequests: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
    uptime: number;
    successRate: number;
  };
  alerts: Alert[];
  costAnalytics: {
    hourlySpend: number;
    dailySpend: number;
    monthlyProjection: number;
    efficiency: number;
  };
  realTimeStats: {
    activeUsers: number;
    requestsPerSecond: number;
    dataProcessed: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  source: string;
}

export default function EnhancedMonitoringDashboard() {
  const [metrics, setMetrics] = useState<MonitoringMetrics>({
    browserFarm: {
      totalNodes: 12,
      healthyNodes: 11,
      utilizationRate: 67,
      averageResponseTime: 1250,
      totalCost: 45.67,
      activeRequests: 234,
    },
    performance: {
      avgResponseTime: 1250,
      errorRate: 0.8,
      throughput: 450,
      uptime: 99.7,
      successRate: 99.2,
    },
    alerts: [
      {
        id: '1',
        severity: 'medium',
        title: 'High Memory Usage Detected',
        description: 'Node farm-us-east-1-003 is using 89% memory',
        timestamp: new Date(Date.now() - 300000),
        status: 'active',
        source: 'Browser Farm',
      },
      {
        id: '2',
        severity: 'low',
        title: 'Increased Response Time',
        description: 'Average response time increased by 15% in the last hour',
        timestamp: new Date(Date.now() - 1800000),
        status: 'acknowledged',
        source: 'Performance Monitor',
      },
    ],
    costAnalytics: {
      hourlySpend: 4.72,
      dailySpend: 113.28,
      monthlyProjection: 3398.4,
      efficiency: 87.3,
    },
    realTimeStats: {
      activeUsers: 1247,
      requestsPerSecond: 23.4,
      dataProcessed: 2.4,
      cpuUsage: 34,
      memoryUsage: 62,
    },
  });

  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRealTimeEnabled) {
      interval = setInterval(() => {
        simulateRealTimeUpdates();
        setLastUpdate(new Date());
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRealTimeEnabled]);

  const simulateRealTimeUpdates = () => {
    setMetrics(prev => ({
      ...prev,
      browserFarm: {
        ...prev.browserFarm,
        utilizationRate: Math.max(20, Math.min(95, prev.browserFarm.utilizationRate + (Math.random() - 0.5) * 10)),
        averageResponseTime: Math.max(800, Math.min(2500, prev.browserFarm.averageResponseTime + (Math.random() - 0.5) * 200)),
        activeRequests: Math.max(100, Math.min(500, prev.browserFarm.activeRequests + Math.floor((Math.random() - 0.5) * 50))),
      },
      realTimeStats: {
        ...prev.realTimeStats,
        requestsPerSecond: Math.max(5, Math.min(50, prev.realTimeStats.requestsPerSecond + (Math.random() - 0.5) * 5)),
        cpuUsage: Math.max(10, Math.min(90, prev.realTimeStats.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(30, Math.min(85, prev.realTimeStats.memoryUsage + (Math.random() - 0.5) * 8)),
        activeUsers: Math.max(800, Math.min(2000, prev.realTimeStats.activeUsers + Math.floor((Math.random() - 0.5) * 100))),
      },
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'acknowledged': return 'default';
      case 'resolved': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enhanced Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights into your browser farm and scraping operations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-muted-foreground">
              {isRealTimeEnabled ? 'Live' : 'Paused'}
            </span>
          </div>
          <Button
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            variant={isRealTimeEnabled ? "default" : "outline"}
            size="sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            {isRealTimeEnabled ? 'Pause' : 'Enable'} Real-time
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Browser Farm Health</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.browserFarm.healthyNodes}/{metrics.browserFarm.totalNodes}
            </div>
            <p className="text-xs text-muted-foreground">
              {((metrics.browserFarm.healthyNodes / metrics.browserFarm.totalNodes) * 100).toFixed(1)}% healthy nodes
            </p>
            <Progress
              value={(metrics.browserFarm.healthyNodes / metrics.browserFarm.totalNodes) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.browserFarm.utilizationRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.browserFarm.activeRequests} active requests
            </p>
            <Progress value={metrics.browserFarm.utilizationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.browserFarm.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Average across all nodes
            </p>
            <div className="mt-2">
              <Badge variant={metrics.browserFarm.averageResponseTime < 1500 ? "default" : "destructive"}>
                {metrics.browserFarm.averageResponseTime < 1500 ? "Good" : "Needs Attention"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.costAnalytics.dailySpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${metrics.costAnalytics.hourlySpend.toFixed(2)}/hour current rate
            </p>
            <div className="mt-2">
              <Badge variant="outline">
                {metrics.costAnalytics.efficiency.toFixed(1)}% efficient
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="browser-farm">Browser Farm</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="cost">Cost Analytics</TabsTrigger>
          <TabsTrigger value="real-time">Real-time Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-sm">{metrics.performance.successRate}%</span>
                </div>
                <Progress value={metrics.performance.successRate} />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="text-sm">{metrics.performance.errorRate}%</span>
                </div>
                <Progress value={metrics.performance.errorRate} className="bg-red-100" />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm">{metrics.performance.uptime}%</span>
                </div>
                <Progress value={metrics.performance.uptime} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Throughput Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.performance.throughput}</div>
                <p className="text-sm text-muted-foreground">Requests per minute</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Peak (1h)</span>
                    <span className="font-medium">687 req/min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average (24h)</span>
                    <span className="font-medium">423 req/min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Time</span>
                    <Badge variant="destructive">+8.3%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Rate</span>
                    <Badge variant="default">+2.1%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Throughput</span>
                    <Badge variant="default">+12.5%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="browser-farm" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Node Distribution</CardTitle>
                <CardDescription>Browser nodes across regions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">US East (N. Virginia)</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">4 nodes</Badge>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">US West (Oregon)</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">3 nodes</Badge>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">EU (Ireland)</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">3 nodes</Badge>
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Asia Pacific (Tokyo)</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">2 nodes</Badge>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>Real-time resource consumption</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span>{metrics.realTimeStats.cpuUsage}%</span>
                  </div>
                  <Progress value={metrics.realTimeStats.cpuUsage} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>{metrics.realTimeStats.memoryUsage}%</span>
                  </div>
                  <Progress value={metrics.realTimeStats.memoryUsage} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Network I/O</span>
                    <span>{metrics.realTimeStats.dataProcessed.toFixed(1)} GB/h</span>
                  </div>
                  <Progress value={45} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Active Alerts & Notifications
              </CardTitle>
              <CardDescription>
                Current system alerts and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge variant={getStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                        </div>
                        <p className="text-sm">{alert.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{alert.source}</span>
                          <span>{alert.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Current spending analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Hourly Rate</span>
                  <span className="font-medium">${metrics.costAnalytics.hourlySpend.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Daily Spend</span>
                  <span className="font-medium">${metrics.costAnalytics.dailySpend.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Monthly Projection</span>
                  <span className="font-medium">${metrics.costAnalytics.monthlyProjection.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Efficiency Score</span>
                  <Badge variant="default">{metrics.costAnalytics.efficiency}%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
                <CardDescription>AI-powered cost optimization suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Scale down EU region</p>
                    <p className="text-xs text-blue-700">Save ~$1.20/hour during low-traffic periods</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Use spot instances</p>
                    <p className="text-xs text-green-700">Potential 60% cost reduction for batch jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="real-time" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.realTimeStats.activeUsers.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Currently active sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Requests/Second
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.realTimeStats.requestsPerSecond.toFixed(1)}</div>
                <p className="text-sm text-muted-foreground">Real-time throughput</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  Data Processed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.realTimeStats.dataProcessed.toFixed(1)}GB</div>
                <p className="text-sm text-muted-foreground">Last hour</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {lastUpdate.toLocaleString()} - {isRealTimeEnabled ? 'Auto-refreshing every 2 seconds' : 'Real-time monitoring paused'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
