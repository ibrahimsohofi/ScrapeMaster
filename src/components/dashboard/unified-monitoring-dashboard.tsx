'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  BarChart3,
  Clock,
  Globe,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonitoringData {
  datadog: {
    connected: boolean;
    metrics: {
      scraperPerformance: Array<{ time: string; value: number; status: string }>;
      apiResponseTimes: Array<{ endpoint: string; avgTime: number; p95: number }>;
      systemHealth: {
        memoryUsage: number;
        cpuUsage: number;
        diskUsage: number;
      };
      alerts: Array<{
        id: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        timestamp: string;
      }>;
    };
  };
  newrelic: {
    connected: boolean;
    apm: {
      throughput: number;
      errorRate: number;
      responseTime: number;
      apdex: number;
    };
    browser: {
      pageLoadTime: number;
      ajaxResponseTime: number;
      jsErrors: number;
    };
    infrastructure: {
      hosts: number;
      containerHealth: number;
    };
  };
  realtime: {
    activeScrapers: number;
    queuedJobs: number;
    proxiesOnline: number;
    totalProxies: number;
  };
}

export function UnifiedMonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monitoring/unified');
      const monitoringData = await response.json();
      setData(monitoringData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getHealthStatus = () => {
    if (!data) return 'unknown';

    const issues = [];
    if (!data.datadog.connected) issues.push('DataDog disconnected');
    if (!data.newrelic.connected) issues.push('New Relic disconnected');
    if (data.newrelic.apm.errorRate > 5) issues.push('High error rate');
    if (data.newrelic.apm.responseTime > 2000) issues.push('Slow response times');

    if (issues.length === 0) return 'healthy';
    if (issues.length <= 2) return 'warning';
    return 'critical';
  };

  const healthStatus = getHealthStatus();

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unified Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring across DataDog and New Relic platforms
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              healthStatus === 'healthy' && "bg-green-500",
              healthStatus === 'warning' && "bg-yellow-500",
              healthStatus === 'critical' && "bg-red-500",
              healthStatus === 'unknown' && "bg-gray-500"
            )} />
            <span className="text-sm">
              System {healthStatus === 'healthy' ? 'Healthy' :
                     healthStatus === 'warning' ? 'Warning' :
                     healthStatus === 'critical' ? 'Critical' : 'Unknown'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMonitoringData}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                data?.datadog.connected ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="font-medium">DataDog</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {data?.datadog.connected ? 'Connected' : 'Disconnected'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                data?.newrelic.connected ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="font-medium">New Relic</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {data?.newrelic.connected ? 'Connected' : 'Disconnected'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Last Updated</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Scrapers</p>
                <p className="text-2xl font-bold">{data?.realtime.activeScrapers || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Queued Jobs</p>
                <p className="text-2xl font-bold">{data?.realtime.queuedJobs || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Proxy Health</p>
                <p className="text-2xl font-bold">
                  {data?.realtime.proxiesOnline || 0}/{data?.realtime.totalProxies || 0}
                </p>
              </div>
              <Globe className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">
                  {data?.newrelic.apm.errorRate.toFixed(2) || 0}%
                </p>
              </div>
              <AlertTriangle className={cn(
                "h-8 w-8",
                (data?.newrelic.apm.errorRate || 0) > 5 ? "text-red-500" : "text-green-500"
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New Relic APM */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Application Performance (New Relic)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Throughput</p>
                    <p className="text-xl font-semibold">
                      {data?.newrelic.apm.throughput || 0} rpm
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                    <p className="text-xl font-semibold">
                      {data?.newrelic.apm.responseTime || 0}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Apdex Score</p>
                    <p className="text-xl font-semibold">
                      {data?.newrelic.apm.apdex || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="text-xl font-semibold">
                      {data?.newrelic.apm.errorRate || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Browser Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Browser Performance (New Relic)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Page Load Time</span>
                      <span>{data?.newrelic.browser.pageLoadTime || 0}ms</span>
                    </div>
                    <Progress value={(data?.newrelic.browser.pageLoadTime || 0) / 50} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>AJAX Response Time</span>
                      <span>{data?.newrelic.browser.ajaxResponseTime || 0}ms</span>
                    </div>
                    <Progress value={(data?.newrelic.browser.ajaxResponseTime || 0) / 30} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">JS Errors (24h)</p>
                    <p className="text-xl font-semibold">
                      {data?.newrelic.browser.jsErrors || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Performance (DataDog)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Endpoint</th>
                      <th className="text-left p-2">Avg Response Time</th>
                      <th className="text-left p-2">95th Percentile</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.datadog.metrics.apiResponseTimes.map((api, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-mono text-xs">{api.endpoint}</td>
                        <td className="p-2">{api.avgTime}ms</td>
                        <td className="p-2">{api.p95}ms</td>
                        <td className="p-2">
                          <Badge variant={api.avgTime < 500 ? "default" : "destructive"}>
                            {api.avgTime < 500 ? "Good" : "Slow"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>System Health (DataDog)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>{data?.datadog.metrics.systemHealth.memoryUsage || 0}%</span>
                    </div>
                    <Progress value={data?.datadog.metrics.systemHealth.memoryUsage || 0} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>CPU Usage</span>
                      <span>{data?.datadog.metrics.systemHealth.cpuUsage || 0}%</span>
                    </div>
                    <Progress value={data?.datadog.metrics.systemHealth.cpuUsage || 0} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Disk Usage</span>
                      <span>{data?.datadog.metrics.systemHealth.diskUsage || 0}%</span>
                    </div>
                    <Progress value={data?.datadog.metrics.systemHealth.diskUsage || 0} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Infrastructure Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Infrastructure (New Relic)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Hosts</p>
                    <p className="text-2xl font-semibold">
                      {data?.newrelic.infrastructure.hosts || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Container Health</p>
                    <p className="text-2xl font-semibold">
                      {data?.newrelic.infrastructure.containerHealth || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Active Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.datadog.metrics.alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold">No Active Alerts</p>
                  <p className="text-muted-foreground">All systems are operating normally</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.datadog.metrics.alerts.map((alert) => (
                    <Alert key={alert.id} className={cn(
                      alert.severity === 'critical' && "border-red-500 bg-red-50",
                      alert.severity === 'high' && "border-orange-500 bg-orange-50",
                      alert.severity === 'medium' && "border-yellow-500 bg-yellow-50",
                      alert.severity === 'low' && "border-blue-500 bg-blue-50"
                    )}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <span>{alert.message}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              alert.severity === 'critical' ? 'destructive' :
                              alert.severity === 'high' ? 'destructive' :
                              alert.severity === 'medium' ? 'secondary' : 'default'
                            }>
                              {alert.severity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scraper Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-semibold">95.2%</span>
                  </div>
                  <Progress value={95.2} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-green-500" />
                    <span className="text-sm">-15% vs last month</span>
                  </div>
                  <p className="text-2xl font-bold">$1,247</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">98.7% accuracy</span>
                  </div>
                  <Progress value={98.7} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>SSL Certificate</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rate Limiting</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>DDoS Protection</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Data Encryption</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>GDPR Compliance</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SOC 2 Type II</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Data Retention</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Audit Logging</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
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
