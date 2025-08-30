'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Activity, Server, Database, Globe } from 'lucide-react';

interface MetricData {
  name: string;
  value: number;
  unit?: string;
  status?: 'healthy' | 'warning' | 'critical';
  timestamp: number;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface ApplicationMetrics {
  requestsPerSecond: number;
  errorRate: number;
  responseTime: number;
  activeUsers: number;
}

interface ScraperMetrics {
  activeScrapers: number;
  jobsPerMinute: number;
  successRate: number;
  queueSize: number;
}

export default function LiveMonitoringDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0
  });

  const [appMetrics, setAppMetrics] = useState<ApplicationMetrics>({
    requestsPerSecond: 0,
    errorRate: 0,
    responseTime: 0,
    activeUsers: 0
  });

  const [scraperMetrics, setScraperMetrics] = useState<ScraperMetrics>({
    activeScrapers: 0,
    jobsPerMinute: 0,
    successRate: 0,
    queueSize: 0
  });

  const [alerts, setAlerts] = useState<Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: Date;
  }>>([]);

  const [isConnected, setIsConnected] = useState(false);

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate system metrics
      setSystemMetrics({
        cpu: Math.random() * 80 + 10,
        memory: Math.random() * 70 + 20,
        disk: Math.random() * 50 + 30,
        network: Math.random() * 60 + 20
      });

      // Simulate application metrics
      setAppMetrics({
        requestsPerSecond: Math.random() * 100 + 50,
        errorRate: Math.random() * 5,
        responseTime: Math.random() * 500 + 100,
        activeUsers: Math.floor(Math.random() * 500) + 100
      });

      // Simulate scraper metrics
      setScraperMetrics({
        activeScrapers: Math.floor(Math.random() * 20) + 5,
        jobsPerMinute: Math.random() * 50 + 10,
        successRate: Math.random() * 10 + 90,
        queueSize: Math.floor(Math.random() * 200) + 50
      });

      setIsConnected(true);

      // Simulate occasional alerts
      if (Math.random() < 0.1) {
        const severityValue = Math.random();
        const severity: 'critical' | 'warning' | 'info' =
          severityValue < 0.3 ? 'critical' : severityValue < 0.6 ? 'warning' : 'info';

        const newAlert = {
          id: Date.now().toString(),
          severity,
          message: [
            'High CPU usage detected',
            'Scraper queue growing',
            'New user registration',
            'Proxy provider switching',
            'Database query optimization needed'
          ][Math.floor(Math.random() * 5)],
          timestamp: new Date()
        };

        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getMetricStatus = (value: number, warning: number, critical: number): 'healthy' | 'warning' | 'critical' => {
    if (value >= critical) return 'critical';
    if (value >= warning) return 'warning';
    return 'healthy';
  };

  const MetricCard = ({ title, value, unit, status, icon }: {
    title: string;
    value: number;
    unit?: string;
    status: 'healthy' | 'warning' | 'critical';
    icon: React.ReactNode;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toFixed(1)}{unit}
        </div>
        <Badge variant={status === 'healthy' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}>
          {status}
        </Badge>
      </CardContent>
    </Card>
  );

  const AlertItem = ({ alert }: { alert: typeof alerts[0] }) => (
    <div className={`p-3 rounded-lg border-l-4 ${
      alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
      alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
      'border-blue-500 bg-blue-50'
    }`}>
      <div className="flex items-center gap-2">
        {alert.severity === 'critical' ? (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        ) : alert.severity === 'warning' ? (
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        ) : (
          <CheckCircle className="h-4 w-4 text-blue-500" />
        )}
        <span className="font-medium">{alert.message}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {alert.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Live Monitoring Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="scrapers">Scrapers</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="System Health"
              value={Math.max(systemMetrics.cpu, systemMetrics.memory)}
              unit="%"
              status={getMetricStatus(Math.max(systemMetrics.cpu, systemMetrics.memory), 70, 85)}
              icon={<Server className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Requests/sec"
              value={appMetrics.requestsPerSecond}
              status="healthy"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Error Rate"
              value={appMetrics.errorRate}
              unit="%"
              status={getMetricStatus(appMetrics.errorRate, 1, 5)}
              icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Active Scrapers"
              value={scraperMetrics.activeScrapers}
              status="healthy"
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>{systemMetrics.cpu.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics.cpu} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>{systemMetrics.memory.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics.memory} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Disk Usage</span>
                    <span>{systemMetrics.disk.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics.disk} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.slice(0, 5).map(alert => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
                {alerts.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No recent alerts
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="CPU Usage"
              value={systemMetrics.cpu}
              unit="%"
              status={getMetricStatus(systemMetrics.cpu, 70, 85)}
              icon={<Server className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Memory Usage"
              value={systemMetrics.memory}
              unit="%"
              status={getMetricStatus(systemMetrics.memory, 70, 85)}
              icon={<Database className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Disk Usage"
              value={systemMetrics.disk}
              unit="%"
              status={getMetricStatus(systemMetrics.disk, 80, 90)}
              icon={<Server className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Network I/O"
              value={systemMetrics.network}
              unit="%"
              status="healthy"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="application" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Requests/sec"
              value={appMetrics.requestsPerSecond}
              status="healthy"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Error Rate"
              value={appMetrics.errorRate}
              unit="%"
              status={getMetricStatus(appMetrics.errorRate, 1, 5)}
              icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Response Time"
              value={appMetrics.responseTime}
              unit="ms"
              status={getMetricStatus(appMetrics.responseTime, 500, 1000)}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Active Users"
              value={appMetrics.activeUsers}
              status="healthy"
              icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="scrapers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Active Scrapers"
              value={scraperMetrics.activeScrapers}
              status="healthy"
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Jobs/min"
              value={scraperMetrics.jobsPerMinute}
              status="healthy"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Success Rate"
              value={scraperMetrics.successRate}
              unit="%"
              status={getMetricStatus(100 - scraperMetrics.successRate, 5, 10)}
              icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Queue Size"
              value={scraperMetrics.queueSize}
              status={getMetricStatus(scraperMetrics.queueSize, 150, 300)}
              icon={<Database className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>Recent system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
              {alerts.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No alerts to display
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
