"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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
  LucideRefreshCw,
  LucideLineChart,
  LucideTrendingDown,
  LucideWifi,
  LucideCpu,
  LucideMemoryStick,
  LucideHardDrive,
  LucideUsers,
  LucideMonitor,
  LucideAlertCircle
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    inbound: number;
    outbound: number;
  };
  temperature: number;
}

interface PerformanceMetrics {
  responseTime: number[];
  throughput: number[];
  errorRate: number[];
  successRate: number[];
  timestamps: string[];
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  notifications: string[];
}

interface LiveAlert {
  id: string;
  rule: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  metric: string;
  value: number;
  threshold: number;
}

export function RealTimePerformanceDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 68,
    disk: 34,
    network: { inbound: 125, outbound: 89 },
    temperature: 72
  });

  const [performanceData, setPerformanceData] = useState<PerformanceMetrics>({
    responseTime: [245, 238, 251, 242, 239, 245, 248, 244, 241, 246],
    throughput: [1250, 1180, 1320, 1290, 1265, 1240, 1275, 1310, 1295, 1285],
    errorRate: [0.3, 0.4, 0.2, 0.3, 0.5, 0.3, 0.2, 0.4, 0.3, 0.2],
    successRate: [99.7, 99.6, 99.8, 99.7, 99.5, 99.7, 99.8, 99.6, 99.7, 99.8],
    timestamps: []
  });

  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: 'rule-1',
      name: 'High CPU Usage',
      metric: 'cpu',
      condition: 'greater_than',
      threshold: 80,
      enabled: true,
      severity: 'high',
      notifications: ['email', 'slack']
    },
    {
      id: 'rule-2',
      name: 'Low Success Rate',
      metric: 'success_rate',
      condition: 'less_than',
      threshold: 99,
      enabled: true,
      severity: 'critical',
      notifications: ['email', 'slack', 'webhook']
    },
    {
      id: 'rule-3',
      name: 'High Response Time',
      metric: 'response_time',
      condition: 'greater_than',
      threshold: 500,
      enabled: true,
      severity: 'medium',
      notifications: ['email']
    }
  ]);

  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');

  const chartRef = useRef<HTMLCanvasElement>(null);

  // Real-time data simulation
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      // Update system metrics
      setSystemMetrics(prev => ({
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
        disk: Math.max(0, Math.min(100, prev.disk + (Math.random() - 0.5) * 2)),
        network: {
          inbound: Math.max(0, prev.network.inbound + (Math.random() - 0.5) * 50),
          outbound: Math.max(0, prev.network.outbound + (Math.random() - 0.5) * 30)
        },
        temperature: Math.max(60, Math.min(90, prev.temperature + (Math.random() - 0.5) * 3))
      }));

      // Update performance data
      setPerformanceData(prev => {
        const newTimestamp = new Date().toLocaleTimeString();
        return {
          responseTime: [...prev.responseTime.slice(1), Math.max(180, prev.responseTime[prev.responseTime.length - 1] + (Math.random() - 0.5) * 20)],
          throughput: [...prev.throughput.slice(1), Math.max(1000, prev.throughput[prev.throughput.length - 1] + (Math.random() - 0.5) * 100)],
          errorRate: [...prev.errorRate.slice(1), Math.max(0, Math.min(2, prev.errorRate[prev.errorRate.length - 1] + (Math.random() - 0.5) * 0.2))],
          successRate: [...prev.successRate.slice(1), Math.min(100, Math.max(98, prev.successRate[prev.successRate.length - 1] + (Math.random() - 0.5) * 0.3))],
          timestamps: [...prev.timestamps.slice(1), newTimestamp]
        };
      });

      // Check alert conditions and generate alerts
      checkAlertConditions();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isRealTimeEnabled, refreshInterval, alertRules]);

  const checkAlertConditions = () => {
    alertRules.forEach(rule => {
      if (!rule.enabled) return;

      let currentValue = 0;
      switch (rule.metric) {
        case 'cpu':
          currentValue = systemMetrics.cpu;
          break;
        case 'memory':
          currentValue = systemMetrics.memory;
          break;
        case 'response_time':
          currentValue = performanceData.responseTime[performanceData.responseTime.length - 1];
          break;
        case 'success_rate':
          currentValue = performanceData.successRate[performanceData.successRate.length - 1];
          break;
      }

      let triggerAlert = false;
      switch (rule.condition) {
        case 'greater_than':
          triggerAlert = currentValue > rule.threshold;
          break;
        case 'less_than':
          triggerAlert = currentValue < rule.threshold;
          break;
        case 'equals':
          triggerAlert = Math.abs(currentValue - rule.threshold) < 0.1;
          break;
      }

      if (triggerAlert && !liveAlerts.some(alert => alert.rule === rule.name && !alert.resolved)) {
        const newAlert: LiveAlert = {
          id: `alert-${Date.now()}-${Math.random()}`,
          rule: rule.name,
          message: `${rule.name}: ${rule.metric} is ${currentValue.toFixed(1)} (threshold: ${rule.threshold})`,
          severity: rule.severity,
          timestamp: new Date(),
          acknowledged: false,
          resolved: false,
          metric: rule.metric,
          value: currentValue,
          threshold: rule.threshold
        };

        setLiveAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
      }
    });
  };

  const acknowledgeAlert = (alertId: string) => {
    setLiveAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const resolveAlert = (alertId: string) => {
    setLiveAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const getMetricStatus = (value: number, metric: string) => {
    switch (metric) {
      case 'cpu':
      case 'memory':
        if (value > 90) return 'critical';
        if (value > 80) return 'warning';
        return 'healthy';
      case 'temperature':
        if (value > 85) return 'critical';
        if (value > 80) return 'warning';
        return 'healthy';
      default:
        return 'healthy';
    }
  };

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

  const activeAlertsCount = liveAlerts.filter(alert => !alert.resolved).length;
  const criticalAlertsCount = liveAlerts.filter(alert => !alert.resolved && alert.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-time Performance Dashboard</h1>
          <p className="text-muted-foreground">Live system monitoring with intelligent alerting</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={isRealTimeEnabled}
              onCheckedChange={setIsRealTimeEnabled}
            />
            <span className="text-sm">Real-time Updates</span>
          </div>
          <Button variant="outline" size="sm">
            <LucideSettings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Alert Status Bar */}
      {activeAlertsCount > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LucideBell className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">
                  {activeAlertsCount} Active Alert{activeAlertsCount !== 1 ? 's' : ''}
                  {criticalAlertsCount > 0 && ` (${criticalAlertsCount} Critical)`}
                </span>
              </div>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                View All Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={`border-l-4 ${getStatusColor(getMetricStatus(systemMetrics.cpu, 'cpu'))}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              <LucideCpu className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{systemMetrics.cpu.toFixed(1)}%</div>
              <Progress value={systemMetrics.cpu} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {systemMetrics.temperature.toFixed(1)}°C • 8 cores
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${getStatusColor(getMetricStatus(systemMetrics.memory, 'memory'))}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <LucideMemoryStick className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{systemMetrics.memory.toFixed(1)}%</div>
              <Progress value={systemMetrics.memory} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {(systemMetrics.memory * 0.16).toFixed(1)}GB of 16GB
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${getStatusColor(getMetricStatus(systemMetrics.disk, 'disk'))}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
              <LucideHardDrive className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{systemMetrics.disk.toFixed(1)}%</div>
              <Progress value={systemMetrics.disk} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {(systemMetrics.disk * 5.12).toFixed(0)}GB of 512GB
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
              <LucideWifi className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">↓ {systemMetrics.network.inbound.toFixed(0)} KB/s</span>
                <span className="text-blue-600">↑ {systemMetrics.network.outbound.toFixed(0)} KB/s</span>
              </div>
              <div className="text-xs text-muted-foreground">
                342 active connections
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="alerts">
            Live Alerts
            {activeAlertsCount > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-800 text-xs">
                {activeAlertsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trend</CardTitle>
                <CardDescription>Average response time over the last hour</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center space-y-2">
                    <LucideLineChart className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-sm text-muted-foreground">
                      Live chart visualization of response time: {performanceData.responseTime[performanceData.responseTime.length - 1]?.toFixed(0)}ms
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs">
                      <span className="text-green-600">Min: {Math.min(...performanceData.responseTime).toFixed(0)}ms</span>
                      <span className="text-red-600">Max: {Math.max(...performanceData.responseTime).toFixed(0)}ms</span>
                      <span className="text-blue-600">Avg: {(performanceData.responseTime.reduce((a, b) => a + b, 0) / performanceData.responseTime.length).toFixed(0)}ms</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Throughput & Error Rate</CardTitle>
                <CardDescription>Requests per minute and error rate correlation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center space-y-2">
                    <LucideBarChart3 className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-sm text-muted-foreground">
                      Current: {performanceData.throughput[performanceData.throughput.length - 1]?.toFixed(0)} req/min
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Error Rate: {performanceData.errorRate[performanceData.errorRate.length - 1]?.toFixed(2)}%
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
              <CardTitle className="flex items-center gap-2">
                <LucideBell className="h-5 w-5" />
                Live Alert Feed
              </CardTitle>
              <CardDescription>
                Real-time alerts triggered by monitoring rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liveAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <LucideCheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p>No active alerts</p>
                    <p className="text-sm">All systems operating normally</p>
                  </div>
                ) : (
                  liveAlerts.slice(0, 10).map((alert) => (
                    <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{alert.rule}</span>
                          {alert.resolved && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              <LucideCheckCircle2 className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                          {alert.acknowledged && !alert.resolved && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!alert.acknowledged && !alert.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {!alert.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rule Configuration</CardTitle>
              <CardDescription>
                Configure automated alerting rules and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rule.name}</span>
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                        {rule.enabled ? (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 border-gray-200">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rule.metric} {rule.condition.replace('_', ' ')} {rule.threshold}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Notifications: {rule.notifications.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => {
                          setAlertRules(prev => prev.map(r =>
                            r.id === rule.id ? { ...r, enabled } : r
                          ));
                        }}
                      />
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                <Button className="w-full" variant="outline">
                  <LucideBell className="h-4 w-4 mr-2" />
                  Add New Alert Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Alerts (24h)</span>
                    <span className="font-medium">{liveAlerts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Critical</span>
                    <span className="font-medium text-red-600">
                      {liveAlerts.filter(a => a.severity === 'critical').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">High</span>
                    <span className="font-medium text-orange-600">
                      {liveAlerts.filter(a => a.severity === 'high').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Resolved</span>
                    <span className="font-medium text-green-600">
                      {liveAlerts.filter(a => a.resolved).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-green-600">94.2</div>
                  <div className="text-sm text-muted-foreground">Overall Health Score</div>
                  <Progress value={94.2} className="mt-4" />
                  <div className="text-xs text-muted-foreground">
                    Based on uptime, performance, and error rates
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Current Uptime</span>
                    <span className="font-medium text-green-600">99.95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">7-day Average</span>
                    <span className="font-medium">99.89%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">30-day Average</span>
                    <span className="font-medium">99.92%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">SLA Target</span>
                    <span className="font-medium">99.9%</span>
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
