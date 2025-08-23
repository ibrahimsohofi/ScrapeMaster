'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdvancedPerformanceMonitor from '@/components/dashboard/advanced-performance-monitor';
import { ErrorTrackingDashboard } from '@/components/dashboard/error-tracking-dashboard';
import AlertingSystem from '@/components/dashboard/alerting-system';
import { SLAMonitoringDashboard } from '@/components/dashboard/sla-monitoring';
import BrowserFarmOptimizer from '@/components/dashboard/browser-farm-optimizer';
import {
  Activity, AlertTriangle, Shield, Zap,
  TrendingUp, CheckCircle, Monitor, Globe,
  Cpu, MemoryStick, Database, Network
} from 'lucide-react';

interface SystemOverview {
  uptime: number;
  performance: number;
  security: number;
  efficiency: number;
  cost: number;
  alerts: number;
}

interface KPIMetric {
  name: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
  target?: string;
}

export default function EnterpriseDashboard() {
  const [selectedView, setSelectedView] = useState<'overview' | 'performance' | 'errors' | 'alerts' | 'sla' | 'browser-farm'>('overview');

  const systemOverview: SystemOverview = {
    uptime: 99.94,
    performance: 89.2,
    security: 94.7,
    efficiency: 87.3,
    cost: 2847,
    alerts: 3
  };

  const kpiMetrics: KPIMetric[] = [
    {
      name: 'System Uptime',
      value: '99.94%',
      change: 0.12,
      trend: 'up',
      status: 'healthy',
      target: '99.9%'
    },
    {
      name: 'Response Time',
      value: '245ms',
      change: -12.5,
      trend: 'down',
      status: 'healthy',
      target: '< 500ms'
    },
    {
      name: 'Error Rate',
      value: '0.8%',
      change: 0.3,
      trend: 'up',
      status: 'warning',
      target: '< 1%'
    },
    {
      name: 'Throughput',
      value: '1,247 req/min',
      change: 23.4,
      trend: 'up',
      status: 'healthy',
      target: '> 1,000'
    },
    {
      name: 'Data Quality',
      value: '97.3%',
      change: 1.1,
      trend: 'up',
      status: 'healthy',
      target: '> 95%'
    },
    {
      name: 'Cost Efficiency',
      value: '$0.0023/req',
      change: -8.2,
      trend: 'down',
      status: 'healthy',
      target: '< $0.003'
    },
    {
      name: 'Browser Pool',
      value: '15 instances',
      change: 7.1,
      trend: 'up',
      status: 'healthy',
      target: '10-20'
    },
    {
      name: 'SLA Compliance',
      value: '98.7%',
      change: 2.3,
      trend: 'up',
      status: 'healthy',
      target: '> 95%'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') return <TrendingUp className={`w-3 h-3 ${change > 0 ? 'text-green-600' : 'text-red-600'}`} />;
    if (trend === 'down') return <TrendingUp className={`w-3 h-3 ${change < 0 ? 'text-green-600' : 'text-red-600'} rotate-180`} />;
    return <Activity className="w-3 h-3 text-gray-600" />;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">Excellent</div>
            <div className="text-sm text-green-600">
              All systems operational • {systemOverview.uptime}% uptime
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Performance Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{systemOverview.performance}/100</div>
            <div className="text-sm text-blue-600">
              Above industry benchmark (+12%)
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Security Rating</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">A+</div>
            <div className="text-sm text-purple-600">
              {systemOverview.security}% anti-detection effectiveness
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Real-time System Metrics</CardTitle>
          <CardDescription>
            Live monitoring of critical system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Cpu className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">45%</div>
              <div className="text-sm text-muted-foreground">CPU Usage</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <MemoryStick className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold">67%</div>
              <div className="text-sm text-muted-foreground">Memory</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Database className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">92%</div>
              <div className="text-sm text-muted-foreground">Database</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Network className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-2xl font-bold">89%</div>
              <div className="text-sm text-muted-foreground">Network</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '89%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enterprise KPIs</CardTitle>
          <CardDescription>
            Critical business metrics and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiMetrics.map((metric, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold">{metric.value}</span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metric.trend, metric.change)}
                    <span className={`text-sm ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {metric.target && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Target: {metric.target}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Alerts & Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Active Alerts</span>
              <Badge variant="destructive">{systemOverview.alerts}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <div className="font-medium">Proxy Pool Low</div>
                  <div className="text-sm text-muted-foreground">Available proxies: 7 (threshold: 10)</div>
                </div>
                <Badge variant="secondary">Medium</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div>
                  <div className="font-medium">Error Rate Elevated</div>
                  <div className="text-sm text-muted-foreground">Current: 0.8% (baseline: 0.5%)</div>
                </div>
                <Badge variant="secondary">Low</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <div className="font-medium">Scheduled Maintenance</div>
                  <div className="text-sm text-muted-foreground">Database upgrade in 2 hours</div>
                </div>
                <Badge variant="outline">Info</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col space-y-1">
                <Monitor className="w-5 h-5" />
                <span className="text-sm">Scale Browser Pool</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col space-y-1">
                <Shield className="w-5 h-5" />
                <span className="text-sm">Update Proxies</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col space-y-1">
                <Zap className="w-5 h-5" />
                <span className="text-sm">Performance Tune</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col space-y-1">
                <Globe className="w-5 h-5" />
                <span className="text-sm">Deploy Update</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost & ROI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost & ROI Analysis</CardTitle>
          <CardDescription>
            Financial impact and optimization opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">$2,847</div>
              <div className="text-sm text-muted-foreground">Monthly Cost</div>
              <div className="text-xs text-green-600">-12% vs last month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">340%</div>
              <div className="text-sm text-muted-foreground">ROI</div>
              <div className="text-xs text-blue-600">+45% vs baseline</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">$537</div>
              <div className="text-sm text-muted-foreground">Potential Savings</div>
              <div className="text-xs text-purple-600">Optimization available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">94.2%</div>
              <div className="text-sm text-muted-foreground">Efficiency Score</div>
              <div className="text-xs text-orange-600">+2.1% vs last month</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Command Center</h1>
          <p className="text-muted-foreground">
            Advanced monitoring, analytics, and optimization for DataVault Pro
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="default" className="flex items-center space-x-1">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Live Monitoring</span>
          </Badge>
          <Button variant="outline">
            <Globe className="w-4 h-4 mr-2" />
            System Health Report
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="sla">SLA Monitor</TabsTrigger>
          <TabsTrigger value="browser-farm">Browser Farm</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <AdvancedPerformanceMonitor />
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <ErrorTrackingDashboard />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <AlertingSystem />
        </TabsContent>

        <TabsContent value="sla" className="mt-6">
          <SLAMonitoringDashboard />
        </TabsContent>

        <TabsContent value="browser-farm" className="mt-6">
          <BrowserFarmOptimizer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
