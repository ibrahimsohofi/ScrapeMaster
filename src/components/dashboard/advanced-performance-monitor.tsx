'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity, AlertTriangle, CheckCircle, Clock,
  Database, Server, Wifi, Zap, TrendingUp, TrendingDown,
  Bell, Shield, Gauge, BarChart3
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: number;
  history: number[];
}

interface SystemHealth {
  uptime: number;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  database: number;
  scraping: number;
}

interface SLAMetric {
  name: string;
  target: number;
  current: number;
  status: 'met' | 'at-risk' | 'breached';
  trend: number[];
}

interface AlertConfig {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: string;
  enabled: boolean;
  triggered: boolean;
  lastTriggered?: Date;
}

export default function AdvancedPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    uptime: 99.95,
    cpu: 45,
    memory: 67,
    disk: 23,
    network: 89,
    database: 92,
    scraping: 78
  });
  const [slaMetrics, setSlaMetrics] = useState<SLAMetric[]>([]);
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [isRealTime, setIsRealTime] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize real-time monitoring
  useEffect(() => {
    initializeMetrics();
    initializeSLAMetrics();
    initializeAlerts();

    if (isRealTime) {
      startRealTimeMonitoring();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isRealTime]);

  const initializeMetrics = () => {
    const mockMetrics: PerformanceMetric[] = [
      {
        id: 'response_time',
        name: 'Average Response Time',
        value: 245,
        unit: 'ms',
        threshold: 500,
        status: 'healthy',
        trend: 'down',
        change: -12.5,
        history: [280, 265, 250, 245, 240, 235, 245]
      },
      {
        id: 'throughput',
        name: 'Requests/Minute',
        value: 1247,
        unit: 'req/min',
        threshold: 1000,
        status: 'healthy',
        trend: 'up',
        change: 23.4,
        history: [1100, 1150, 1200, 1180, 1220, 1235, 1247]
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        value: 2.1,
        unit: '%',
        threshold: 5,
        status: 'warning',
        trend: 'up',
        change: 0.8,
        history: [1.5, 1.8, 2.0, 1.9, 2.1, 2.3, 2.1]
      },
      {
        id: 'proxy_success',
        name: 'Proxy Success Rate',
        value: 94.7,
        unit: '%',
        threshold: 90,
        status: 'healthy',
        trend: 'stable',
        change: 0.2,
        history: [94.5, 94.6, 94.8, 94.5, 94.7, 94.6, 94.7]
      },
      {
        id: 'scraping_speed',
        name: 'Scraping Speed',
        value: 156,
        unit: 'pages/min',
        threshold: 100,
        status: 'healthy',
        trend: 'up',
        change: 15.2,
        history: [135, 142, 148, 151, 154, 158, 156]
      },
      {
        id: 'data_quality',
        name: 'Data Quality Score',
        value: 97.3,
        unit: '%',
        threshold: 95,
        status: 'healthy',
        trend: 'up',
        change: 1.1,
        history: [96.2, 96.8, 97.0, 96.9, 97.1, 97.2, 97.3]
      }
    ];
    setMetrics(mockMetrics);
  };

  const initializeSLAMetrics = () => {
    const mockSLA: SLAMetric[] = [
      {
        name: 'Uptime SLA',
        target: 99.9,
        current: 99.95,
        status: 'met',
        trend: [99.91, 99.93, 99.94, 99.95, 99.95, 99.96, 99.95]
      },
      {
        name: 'Response Time SLA',
        target: 500,
        current: 245,
        status: 'met',
        trend: [280, 265, 250, 245, 240, 235, 245]
      },
      {
        name: 'Success Rate SLA',
        target: 95,
        current: 97.8,
        status: 'met',
        trend: [97.2, 97.4, 97.6, 97.5, 97.7, 97.9, 97.8]
      }
    ];
    setSlaMetrics(mockSLA);
  };

  const initializeAlerts = () => {
    const mockAlerts: AlertConfig[] = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        severity: 'high',
        condition: 'error_rate > 5%',
        enabled: true,
        triggered: false
      },
      {
        id: 'low_proxy_success',
        name: 'Low Proxy Success Rate',
        severity: 'medium',
        condition: 'proxy_success < 90%',
        enabled: true,
        triggered: false
      },
      {
        id: 'response_time_spike',
        name: 'Response Time Spike',
        severity: 'critical',
        condition: 'response_time > 1000ms',
        enabled: true,
        triggered: false
      },
      {
        id: 'memory_usage_high',
        name: 'High Memory Usage',
        severity: 'medium',
        condition: 'memory > 80%',
        enabled: true,
        triggered: false
      }
    ];
    setAlerts(mockAlerts);
  };

  const startRealTimeMonitoring = () => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      updateMetrics();
      updateSystemHealth();
      checkAlerts();
    }, 5000);

    return () => clearInterval(interval);
  };

  const updateMetrics = () => {
    setMetrics(prev => prev.map(metric => ({
      ...metric,
      value: metric.value + (Math.random() - 0.5) * (metric.value * 0.1),
      history: [...metric.history.slice(1), metric.value]
    })));
  };

  const updateSystemHealth = () => {
    setSystemHealth(prev => ({
      uptime: Math.min(99.99, prev.uptime + (Math.random() - 0.5) * 0.01),
      cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
      disk: Math.max(0, Math.min(100, prev.disk + (Math.random() - 0.5) * 2)),
      network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 8)),
      database: Math.max(0, Math.min(100, prev.database + (Math.random() - 0.5) * 3)),
      scraping: Math.max(0, Math.min(100, prev.scraping + (Math.random() - 0.5) * 12))
    }));
  };

  const checkAlerts = () => {
    setAlerts(prev => prev.map(alert => {
      const shouldTrigger = Math.random() < 0.05; // 5% chance to trigger
      return {
        ...alert,
        triggered: shouldTrigger,
        lastTriggered: shouldTrigger ? new Date() : alert.lastTriggered
      };
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'met': return 'text-green-600';
      case 'warning': case 'at-risk': return 'text-yellow-600';
      case 'critical': case 'breached': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': case 'met': return 'default';
      case 'warning': case 'at-risk': return 'secondary';
      case 'critical': case 'breached': return 'destructive';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') return <TrendingUp className={`w-4 h-4 ${change > 0 ? 'text-green-600' : 'text-red-600'}`} />;
    if (trend === 'down') return <TrendingDown className={`w-4 h-4 ${change < 0 ? 'text-green-600' : 'text-red-600'}`} />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Monitor</h1>
          <p className="text-muted-foreground">
            Real-time system performance and SLA monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={isRealTime ? "default" : "secondary"} className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isRealTime ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span>{isRealTime ? 'Live' : 'Paused'}</span>
          </Badge>
          <Button
            variant="outline"
            onClick={() => setIsRealTime(!isRealTime)}
          >
            {isRealTime ? 'Pause' : 'Start'} Monitoring
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gauge className="w-5 h-5" />
            <span>System Health Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(systemHealth).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="flex justify-center mb-2">
                  {key === 'uptime' && <Clock className="w-6 h-6 text-blue-600" />}
                  {key === 'cpu' && <Zap className="w-6 h-6 text-orange-600" />}
                  {key === 'memory' && <Server className="w-6 h-6 text-purple-600" />}
                  {key === 'disk' && <Database className="w-6 h-6 text-green-600" />}
                  {key === 'network' && <Wifi className="w-6 h-6 text-blue-600" />}
                  {key === 'database' && <Database className="w-6 h-6 text-indigo-600" />}
                  {key === 'scraping' && <Activity className="w-6 h-6 text-teal-600" />}
                </div>
                <div className="text-2xl font-bold">
                  {key === 'uptime' ? `${value.toFixed(2)}%` : `${Math.round(value)}%`}
                </div>
                <div className="text-sm text-muted-foreground capitalize">{key}</div>
                <Progress
                  value={value}
                  className={`mt-2 h-2 ${value > 80 ? 'text-green-600' : value > 60 ? 'text-yellow-600' : 'text-red-600'}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="sla">SLA Monitoring</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
          <TabsTrigger value="insights">Cost Analytics</TabsTrigger>
        </TabsList>

        {/* Performance Metrics */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl font-bold">
                      {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}
                      <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(metric.trend, metric.change)}
                      <span className={`text-sm ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-xs text-muted-foreground mb-1">
                      Threshold: {metric.threshold}{metric.unit}
                    </div>
                    <Progress
                      value={(metric.value / metric.threshold) * 100}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SLA Monitoring */}
        <TabsContent value="sla" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {slaMetrics.map((sla, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">{sla.name}</CardTitle>
                  <CardDescription>
                    Target: {sla.target}{sla.name.includes('Uptime') ? '%' : 'ms'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold">
                      {sla.current.toFixed(sla.name.includes('Uptime') ? 2 : 0)}
                      {sla.name.includes('Uptime') ? '%' : 'ms'}
                    </div>
                    <Badge variant={getStatusBadgeVariant(sla.status)}>
                      {sla.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Performance</span>
                      <span className={getStatusColor(sla.status)}>
                        {sla.status === 'met' ? 'Meeting SLA' :
                         sla.status === 'at-risk' ? 'At Risk' : 'Breached'}
                      </span>
                    </div>
                    <Progress
                      value={sla.name.includes('Response') ?
                        Math.max(0, 100 - (sla.current / sla.target) * 100) :
                        (sla.current / sla.target) * 100
                      }
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts & Notifications */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alerts.map((alert) => (
              <Card key={alert.id} className={alert.triggered ? 'border-red-200 bg-red-50' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center space-x-2">
                      {alert.triggered ? (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      <span>{alert.name}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        alert.severity === 'critical' ? 'destructive' :
                        alert.severity === 'high' ? 'destructive' :
                        alert.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {alert.severity}
                      </Badge>
                      <Badge variant={alert.enabled ? 'default' : 'secondary'}>
                        {alert.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Condition: <code className="bg-gray-100 px-1 rounded">{alert.condition}</code>
                    </div>
                    {alert.lastTriggered && (
                      <div className="text-sm text-muted-foreground">
                        Last triggered: {alert.lastTriggered.toLocaleString()}
                      </div>
                    )}
                    <div className="flex items-center space-x-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Bell className="w-4 h-4 mr-1" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        Test Alert
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cost Analytics */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$2,847</div>
                <div className="text-sm text-green-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -12% vs last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cost per Request</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0.0023</div>
                <div className="text-sm text-green-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -8% vs last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Proxy Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1,245</div>
                <div className="text-sm text-red-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5% vs last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <div className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2.1% vs last month
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Cost Optimization Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium">Proxy Pool Optimization</div>
                    <div className="text-sm text-muted-foreground">
                      Switch to residential proxies for 23% cost reduction
                    </div>
                  </div>
                  <Badge>Save $287/mo</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium">Batch Processing</div>
                    <div className="text-sm text-muted-foreground">
                      Increase batch size to reduce per-request overhead
                    </div>
                  </div>
                  <Badge>Save $156/mo</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="font-medium">Off-Peak Scheduling</div>
                    <div className="text-sm text-muted-foreground">
                      Schedule non-urgent jobs during off-peak hours
                    </div>
                  </div>
                  <Badge>Save $94/mo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
