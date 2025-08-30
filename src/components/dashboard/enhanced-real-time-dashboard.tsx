"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  LucideActivity,
  LucideArrowUp,
  LucideArrowDown,
  LucideCheckCircle2,
  LucideAlertTriangle,
  LucideXCircle,
  LucideZap,
  LucideTimer,
  LucideDatabase,
  LucideGlobe,
  LucideTrendingUp,
  LucideRefreshCw,
  LucidePlay,
  LucidePause,
  LucideEye,
  LucideWifi,
  LucideServer,
  LucideClock,
  LucideLoader2,
  LucideBarChart3,
  LucideTarget,
  LucideShield,
  LucideCpu,
  LucideHardDrive,
  LucideMonitor,
} from 'lucide-react';

interface RealtimeMetrics {
  activeScrapers: number;
  completedToday: number;
  dataPointsExtracted: number;
  avgResponseTime: number;
  successRate: number;
  errorRate: number;
  queueSize: number;
  bandwidth: number;
  cpuUsage: number;
  memoryUsage: number;
  requestsPerMinute: number;
  lastUpdate: Date;
  proxyHealth: number;
  threatDetections: number;
  systemUptime: number;
}

interface LiveJob {
  id: string;
  name: string;
  status: 'running' | 'queued' | 'completed' | 'failed';
  progress: number;
  dataPoints: number;
  url: string;
  startTime: Date;
  estimatedCompletion?: Date;
}

interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  services: {
    database: 'healthy' | 'warning' | 'critical';
    redis: 'healthy' | 'warning' | 'critical';
    scraping: 'healthy' | 'warning' | 'critical';
    proxy: 'healthy' | 'warning' | 'critical';
  };
}

export function EnhancedRealTimeDashboard() {
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    activeScrapers: 8,
    completedToday: 142,
    dataPointsExtracted: 89432,
    avgResponseTime: 1.2,
    successRate: 98.7,
    errorRate: 1.3,
    queueSize: 24,
    bandwidth: 145.7,
    cpuUsage: 34,
    memoryUsage: 67,
    requestsPerMinute: 89,
    lastUpdate: new Date(),
    proxyHealth: 95,
    threatDetections: 3,
    systemUptime: 99.9,
  });

  const [liveJobs, setLiveJobs] = useState<LiveJob[]>([
    {
      id: '1',
      name: 'E-commerce Product Monitoring',
      status: 'running',
      progress: 68,
      dataPoints: 15420,
      url: 'shop.example.com',
      startTime: new Date(Date.now() - 25 * 60 * 1000),
      estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000),
    },
    {
      id: '2',
      name: 'News Headlines Collection',
      status: 'running',
      progress: 85,
      dataPoints: 2340,
      url: 'news.example.com',
      startTime: new Date(Date.now() - 45 * 60 * 1000),
      estimatedCompletion: new Date(Date.now() + 8 * 60 * 1000),
    },
    {
      id: '3',
      name: 'Real Estate Listings',
      status: 'queued',
      progress: 0,
      dataPoints: 0,
      url: 'realestate.example.com',
      startTime: new Date(),
    },
  ]);

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'healthy',
    message: 'All systems operational',
    services: {
      database: 'healthy',
      redis: 'healthy',
      scraping: 'healthy',
      proxy: 'healthy',
    },
  });

  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Simulate real-time updates
  const updateMetrics = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      activeScrapers: prev.activeScrapers + (Math.random() - 0.5) * 2,
      completedToday: prev.completedToday + Math.floor(Math.random() * 3),
      dataPointsExtracted: prev.dataPointsExtracted + Math.floor(Math.random() * 100),
      avgResponseTime: Math.max(0.5, prev.avgResponseTime + (Math.random() - 0.5) * 0.3),
      requestsPerMinute: Math.max(0, prev.requestsPerMinute + (Math.random() - 0.5) * 10),
      cpuUsage: Math.max(0, Math.min(100, prev.cpuUsage + (Math.random() - 0.5) * 5)),
      memoryUsage: Math.max(0, Math.min(100, prev.memoryUsage + (Math.random() - 0.5) * 3)),
      bandwidth: Math.max(0, prev.bandwidth + (Math.random() - 0.5) * 20),
      lastUpdate: new Date(),
    }));

    setLiveJobs(prev => prev.map(job => {
      if (job.status === 'running') {
        const newProgress = Math.min(100, job.progress + Math.random() * 5);
        const newDataPoints = job.dataPoints + Math.floor(Math.random() * 50);
        return {
          ...job,
          progress: newProgress,
          dataPoints: newDataPoints,
          status: newProgress >= 100 ? 'completed' : 'running',
        };
      }
      return job;
    }));

    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRealTimeEnabled) {
      interval = setInterval(updateMetrics, 3000); // Update every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRealTimeEnabled, updateMetrics]);

  const formatDuration = (date: Date) => {
    const diffInMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'running': case 'completed':
        return 'text-green-600';
      case 'warning': case 'queued':
        return 'text-yellow-600';
      case 'critical': case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': case 'completed':
        return <LucideCheckCircle2 className="h-4 w-4" />;
      case 'warning': case 'queued':
        return <LucideAlertTriangle className="h-4 w-4" />;
      case 'critical': case 'failed':
        return <LucideXCircle className="h-4 w-4" />;
      case 'running':
        return <LucidePlay className="h-4 w-4" />;
      default:
        return <LucideClock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Real-time Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Real-time Dashboard</h2>
          <p className="text-muted-foreground">
            Live monitoring of your scraping operations and system performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LucideRefreshCw className="h-4 w-4" />
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button
            variant={isRealTimeEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            className="gap-2"
          >
            {isRealTimeEnabled ? <LucidePause className="h-4 w-4" /> : <LucidePlay className="h-4 w-4" />}
            {isRealTimeEnabled ? 'Pause' : 'Resume'} Live Updates
          </Button>
        </div>
      </div>

      {/* System Status Bar */}
      <Card variant="elevated" className="border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                <LucideShield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold">System Status</div>
                <div className="text-sm text-muted-foreground">{systemStatus.message}</div>
              </div>
              <Badge variant={systemStatus.status === 'healthy' ? 'success' : 'destructive'}>
                {systemStatus.status === 'healthy' ? 'Operational' : 'Issues Detected'}
              </Badge>
            </div>
            <div className="flex items-center gap-6">
              {Object.entries(systemStatus.services).map(([service, status]) => (
                <div key={service} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${status === 'healthy' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className="text-sm capitalize">{service}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Scrapers */}
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Scrapers</p>
                <p className="text-3xl font-bold">{Math.round(metrics.activeScrapers)}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <LucideArrowUp className="h-3 w-3" />
                  +12% from yesterday
                </p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10">
                <LucideActivity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Points Today */}
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Points Today</p>
                <p className="text-3xl font-bold">{metrics.dataPointsExtracted.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <LucideArrowUp className="h-3 w-3" />
                  +{Math.round(metrics.requestsPerMinute)}/min
                </p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-green-500/10 to-green-600/10">
                <LucideDatabase className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold">{metrics.successRate.toFixed(1)}%</p>
                <div className="mt-2">
                  <Progress value={metrics.successRate} className="h-2" />
                </div>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-emerald-600/10">
                <LucideTarget className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card variant="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-3xl font-bold">{metrics.avgResponseTime.toFixed(1)}s</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <LucideZap className="h-3 w-3" />
                  Excellent performance
                </p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-orange-500/10 to-orange-600/10">
                <LucideTimer className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CPU Usage */}
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LucideCpu className="h-5 w-5 text-blue-600" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{Math.round(metrics.cpuUsage)}%</span>
                <Badge variant={metrics.cpuUsage > 80 ? 'destructive' : metrics.cpuUsage > 60 ? 'secondary' : 'success'}>
                  {metrics.cpuUsage > 80 ? 'High' : metrics.cpuUsage > 60 ? 'Moderate' : 'Low'}
                </Badge>
              </div>
              <Progress value={metrics.cpuUsage} className="h-3" />
              <p className="text-xs text-muted-foreground">Optimal range: 0-70%</p>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LucideHardDrive className="h-5 w-5 text-green-600" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{Math.round(metrics.memoryUsage)}%</span>
                <Badge variant={metrics.memoryUsage > 85 ? 'destructive' : metrics.memoryUsage > 70 ? 'secondary' : 'success'}>
                  {metrics.memoryUsage > 85 ? 'High' : metrics.memoryUsage > 70 ? 'Moderate' : 'Normal'}
                </Badge>
              </div>
              <Progress value={metrics.memoryUsage} className="h-3" />
              <p className="text-xs text-muted-foreground">Available: {(100 - metrics.memoryUsage).toFixed(0)}%</p>
            </div>
          </CardContent>
        </Card>

        {/* Network Performance */}
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LucideWifi className="h-5 w-5 text-purple-600" />
              Network Traffic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{metrics.bandwidth.toFixed(1)} MB/s</span>
                <Badge variant="success">
                  Stable
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Queue Size</span>
                  <span>{metrics.queueSize} jobs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Proxy Health</span>
                  <span className="text-green-600">{metrics.proxyHealth}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Jobs Monitor */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LucideMonitor className="h-5 w-5" />
                Live Jobs Monitor
              </CardTitle>
              <CardDescription>Real-time tracking of active scraping operations</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {liveJobs.filter(job => job.status === 'running').length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {liveJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-2 rounded-md ${getStatusColor(job.status)}`}>
                    {getStatusIcon(job.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{job.name}</div>
                    <div className="text-sm text-muted-foreground">{job.url}</div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Started: {formatDuration(job.startTime)} ago</span>
                      <span>Data points: {job.dataPoints.toLocaleString()}</span>
                      {job.estimatedCompletion && job.status === 'running' && (
                        <span>ETA: {formatDuration(new Date(Date.now() - (job.estimatedCompletion.getTime() - Date.now())))}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="text-right min-w-[100px]">
                    <div className="text-sm font-medium">{job.progress}%</div>
                    <Progress value={job.progress} className="h-2 w-20" />
                  </div>
                  <Badge variant={job.status === 'running' ? 'default' : job.status === 'completed' ? 'success' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
