"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LucideActivity,
  LucideAlertTriangle,
  LucideCheckCircle2,
  LucideDatabase,
  LucideDollarSign,
  LucideGlobe,
  LucideServer,
  LucideTrendingUp,
  LucideZap,
  LucideShield,
  LucideClock,
  LucideTarget,
  LucideBarChart3,
  LucideSettings,
  LucideBell,
  LucideRefreshCw
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ReactNode;
}

interface AlertItem {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
  description: string;
}

interface ErrorMetrics {
  total: number;
  rate: number;
  categories: {
    network: number;
    timeout: number;
    auth: number;
    validation: number;
    other: number;
  };
}

interface PerformanceData {
  responseTime: number;
  throughput: number;
  successRate: number;
  errorRate: number;
  uptime: number;
  activeJobs: number;
}

export function EnterpriseMonitoringDashboard() {
  const [realTimeData, setRealTimeData] = useState<PerformanceData>({
    responseTime: 245,
    throughput: 1250,
    successRate: 99.7,
    errorRate: 0.3,
    uptime: 99.95,
    activeJobs: 42
  });

  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'alert-1',
      title: 'High Error Rate Detected',
      severity: 'high',
      timestamp: '2 minutes ago',
      resolved: false,
      description: 'Scraping job "Product Prices" experiencing 15% error rate'
    },
    {
      id: 'alert-2',
      title: 'Proxy Pool Degraded',
      severity: 'medium',
      timestamp: '5 minutes ago',
      resolved: false,
      description: '3 proxy servers in EU region showing degraded performance'
    },
    {
      id: 'alert-3',
      title: 'Database Connection Spike',
      severity: 'low',
      timestamp: '12 minutes ago',
      resolved: true,
      description: 'Connection pool utilization reached 85%'
    }
  ]);

  const [errorMetrics, setErrorMetrics] = useState<ErrorMetrics>({
    total: 127,
    rate: 0.3,
    categories: {
      network: 45,
      timeout: 32,
      auth: 18,
      validation: 24,
      other: 8
    }
  });

  const metrics: MetricCard[] = [
    {
      title: 'System Uptime',
      value: `${realTimeData.uptime}%`,
      change: '+0.02%',
      trend: 'up',
      status: realTimeData.uptime > 99.9 ? 'healthy' : realTimeData.uptime > 99.5 ? 'warning' : 'critical',
      icon: <LucideShield className="h-4 w-4" />
    },
    {
      title: 'Response Time',
      value: `${realTimeData.responseTime}ms`,
      change: '-12ms',
      trend: 'down',
      status: realTimeData.responseTime < 300 ? 'healthy' : realTimeData.responseTime < 500 ? 'warning' : 'critical',
      icon: <LucideClock className="h-4 w-4" />
    },
    {
      title: 'Throughput',
      value: `${realTimeData.throughput.toLocaleString()}/min`,
      change: '+8.2%',
      trend: 'up',
      status: 'healthy',
      icon: <LucideTrendingUp className="h-4 w-4" />
    },
    {
      title: 'Success Rate',
      value: `${realTimeData.successRate}%`,
      change: '+0.1%',
      trend: 'up',
      status: realTimeData.successRate > 99.5 ? 'healthy' : realTimeData.successRate > 98 ? 'warning' : 'critical',
      icon: <LucideTarget className="h-4 w-4" />
    },
    {
      title: 'Active Jobs',
      value: realTimeData.activeJobs.toString(),
      change: '+3',
      trend: 'up',
      status: 'healthy',
      icon: <LucideActivity className="h-4 w-4" />
    },
    {
      title: 'Error Rate',
      value: `${realTimeData.errorRate}%`,
      change: '-0.1%',
      trend: 'down',
      status: realTimeData.errorRate < 1 ? 'healthy' : realTimeData.errorRate < 5 ? 'warning' : 'critical',
      icon: <LucideAlertTriangle className="h-4 w-4" />
    }
  ];

  const costMetrics = [
    { label: 'Compute Costs', value: '$1,247', budget: '$1,500', utilization: 83 },
    { label: 'Storage Costs', value: '$324', budget: '$400', utilization: 81 },
    { label: 'Network Costs', value: '$156', budget: '$200', utilization: 78 },
    { label: 'Third-party APIs', value: '$89', budget: '$150', utilization: 59 }
  ];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        responseTime: Math.max(180, prev.responseTime + (Math.random() - 0.5) * 20),
        throughput: Math.max(1000, prev.throughput + (Math.random() - 0.5) * 100),
        successRate: Math.min(100, Math.max(98, prev.successRate + (Math.random() - 0.5) * 0.2)),
        errorRate: Math.max(0, Math.min(2, prev.errorRate + (Math.random() - 0.5) * 0.1)),
        activeJobs: Math.max(0, prev.activeJobs + Math.floor((Math.random() - 0.5) * 3))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Monitoring</h1>
          <p className="text-muted-foreground">Real-time system performance and health monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <LucideRefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <LucideSettings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className={`border-l-4 ${getStatusColor(metric.status)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                {metric.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className={`text-sm flex items-center gap-1 ${
                  metric.trend === 'up' ? 'text-green-600' :
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <span>{metric.change}</span>
                  <span className="text-xs text-muted-foreground">vs last hour</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="costs">Cost Analytics</TabsTrigger>
          <TabsTrigger value="sla">SLA Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LucideBell className="h-5 w-5" />
                Active Alerts & Notifications
              </CardTitle>
              <CardDescription>
                Real-time alerts and system notifications requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{alert.title}</span>
                        {alert.resolved && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            <LucideCheckCircle2 className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Acknowledge</Button>
                      <Button variant="outline" size="sm">Resolve</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Error Distribution</CardTitle>
                <CardDescription>Breakdown of error types in the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Errors</span>
                    <span className="text-2xl font-bold text-red-600">{errorMetrics.total}</span>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(errorMetrics.categories).map(([category, count]) => (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{category} Errors</span>
                          <span>{count}</span>
                        </div>
                        <Progress value={(count / errorMetrics.total) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Impact Analysis</CardTitle>
                <CardDescription>Business impact assessment of recent errors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{errorMetrics.rate}%</div>
                      <div className="text-sm text-muted-foreground">Error Rate</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">$1,247</div>
                      <div className="text-sm text-muted-foreground">Est. Cost Impact</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Jobs Affected</span>
                      <span className="font-medium">23 of 42</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Data Loss</span>
                      <span className="font-medium">0.02%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Customer Impact</span>
                      <span className="font-medium">Low</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Key performance indicators over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <LucideZap className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{realTimeData.responseTime}ms</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <LucideBarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{realTimeData.throughput.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Requests/min</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <LucideDatabase className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">2.1TB</div>
                  <div className="text-sm text-muted-foreground">Data Processed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <LucideGlobe className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-sm text-muted-foreground">Active Proxies</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LucideDollarSign className="h-5 w-5" />
                Cost Analytics & Optimization
              </CardTitle>
              <CardDescription>Resource utilization and cost breakdown analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {costMetrics.map((cost, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{cost.label}</span>
                      <div className="text-right">
                        <div className="font-bold">{cost.value}</div>
                        <div className="text-sm text-muted-foreground">of {cost.budget}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={cost.utilization} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{cost.utilization}% utilized</span>
                        <span>{100 - cost.utilization}% remaining</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total Monthly Cost</span>
                    <span className="text-xl">$1,816</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Budget: $2,250 (81% utilized)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LucideShield className="h-5 w-5" />
                SLA Monitoring & Uptime Tracking
              </CardTitle>
              <CardDescription>Service level agreement compliance and availability metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{realTimeData.uptime}%</div>
                  <div className="text-sm text-muted-foreground mt-1">Current Uptime</div>
                  <div className="text-xs text-muted-foreground mt-2">Target: 99.9%</div>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">23h 42m</div>
                  <div className="text-sm text-muted-foreground mt-1">Current Streak</div>
                  <div className="text-xs text-muted-foreground mt-2">Last incident: 2 days ago</div>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">99.95%</div>
                  <div className="text-sm text-muted-foreground mt-1">30-day Average</div>
                  <div className="text-xs text-muted-foreground mt-2">Above SLA target</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
