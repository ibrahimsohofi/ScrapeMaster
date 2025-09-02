'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Globe,
  LineChart,
  Play,
  Pause,
  Settings,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
  BarChart3,
  MapPin,
  Shield,
  Target
} from 'lucide-react';

interface ProxyProvider {
  name: string;
  type: 'residential' | 'datacenter' | 'mobile';
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  responseTime: number;
  successRate: number;
  costPerGB: number;
  countries: number;
  endpoints: number;
  features: string[];
  lastCheck: Date;
  isMonitoring: boolean;
}

interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface AlertItem {
  id: string;
  provider: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export default function ProxyManagement() {
  const [providers, setProviders] = useState<ProxyProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data - in production, fetch from API
  useEffect(() => {
    const mockProviders: ProxyProvider[] = [
      {
        name: 'BrightData Residential',
        type: 'residential',
        status: 'healthy',
        uptime: 99.8,
        responseTime: 800,
        successRate: 98.5,
        costPerGB: 15.0,
        countries: 195,
        endpoints: 500,
        features: ['Sticky Session', 'City Targeting', 'ASN Targeting'],
        lastCheck: new Date(),
        isMonitoring: true
      },
      {
        name: 'Oxylabs Enterprise',
        type: 'residential',
        status: 'healthy',
        uptime: 99.5,
        responseTime: 1200,
        successRate: 96.8,
        costPerGB: 12.0,
        countries: 100,
        endpoints: 300,
        features: ['Mobile IPs', 'Custom Headers', 'Session Control'],
        lastCheck: new Date(),
        isMonitoring: true
      },
      {
        name: 'Smartproxy Budget',
        type: 'residential',
        status: 'degraded',
        uptime: 97.2,
        responseTime: 1500,
        successRate: 94.2,
        costPerGB: 8.5,
        countries: 50,
        endpoints: 200,
        features: ['Basic Rotation', 'HTTP/HTTPS'],
        lastCheck: new Date(),
        isMonitoring: true
      },
      {
        name: 'IPRoyal Datacenter',
        type: 'datacenter',
        status: 'healthy',
        uptime: 99.9,
        responseTime: 300,
        successRate: 99.2,
        costPerGB: 2.0,
        countries: 15,
        endpoints: 100,
        features: ['High Speed', 'Unlimited Bandwidth'],
        lastCheck: new Date(),
        isMonitoring: false
      },
      {
        name: 'ProxyMesh High-Perf',
        type: 'datacenter',
        status: 'healthy',
        uptime: 99.95,
        responseTime: 200,
        successRate: 99.5,
        costPerGB: 1.0,
        countries: 10,
        endpoints: 50,
        features: ['Ultra Fast', 'Developer Friendly'],
        lastCheck: new Date(),
        isMonitoring: true
      }
    ];

    const mockMetrics: PerformanceMetric[] = [
      { label: 'Total Requests', value: 1250000, unit: '', trend: 'up', status: 'good' },
      { label: 'Average Response Time', value: 850, unit: 'ms', trend: 'down', status: 'good' },
      { label: 'Success Rate', value: 97.8, unit: '%', trend: 'stable', status: 'good' },
      { label: 'Monthly Cost', value: 2847, unit: '$', trend: 'up', status: 'warning' },
      { label: 'Data Transferred', value: 189.5, unit: 'GB', trend: 'up', status: 'good' },
      { label: 'Active Providers', value: 5, unit: '', trend: 'stable', status: 'good' }
    ];

    const mockAlerts: AlertItem[] = [
      {
        id: '1',
        provider: 'Smartproxy Budget',
        severity: 'medium',
        message: 'Response time increased by 25% in the last hour',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        resolved: false
      },
      {
        id: '2',
        provider: 'BrightData Residential',
        severity: 'low',
        message: 'SSL certificate expires in 30 days',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        resolved: false
      }
    ];

    setTimeout(() => {
      setProviders(mockProviders);
      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
      setSelectedProvider(mockProviders[0].name);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // In production, fetch updated data
      setProviders(prev => prev.map(p => ({
        ...p,
        lastCheck: new Date(),
        responseTime: p.responseTime + (Math.random() - 0.5) * 100,
        successRate: Math.max(90, Math.min(100, p.successRate + (Math.random() - 0.5) * 2))
      })));
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy': return <WifiOff className="h-4 w-4 text-red-500" />;
      default: return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      unhealthy: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const formatNumber = (num: number, unit: string) => {
    if (unit === '$') return `$${num.toLocaleString()}`;
    if (unit === '%') return `${num.toFixed(1)}%`;
    if (unit === 'ms') return `${num.toFixed(0)}ms`;
    if (unit === 'GB') return `${num.toFixed(1)}GB`;
    return num.toLocaleString();
  };

  const toggleMonitoring = (providerName: string) => {
    setProviders(prev => prev.map(p =>
      p.name === providerName ? { ...p, isMonitoring: !p.isMonitoring } : p
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proxy Management</h1>
          <p className="text-gray-600">Monitor and manage your proxy infrastructure</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh">Auto Refresh</Label>
          </div>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(metric.value, metric.unit)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(metric.trend)}
                  <div className={`w-3 h-3 rounded-full ${
                    metric.status === 'good' ? 'bg-green-500' :
                    metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts {alerts.filter(a => !a.resolved).length > 0 && (
              <Badge className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-800">
                {alerts.filter(a => !a.resolved).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Provider Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers.map((provider, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(provider.status)}
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-gray-500">
                            {provider.responseTime}ms • {provider.successRate.toFixed(1)}% success
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(provider.status)}
                        <Badge variant="outline">{provider.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Performance Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Healthy Providers</span>
                      <span>{providers.filter(p => p.status === 'healthy').length}/{providers.length}</span>
                    </div>
                    <Progress
                      value={(providers.filter(p => p.status === 'healthy').length / providers.length) * 100}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Response Time</span>
                      <span>{Math.round(providers.reduce((sum, p) => sum + p.responseTime, 0) / providers.length)}ms</span>
                    </div>
                    <Progress
                      value={75}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Success Rate</span>
                      <span>{(providers.reduce((sum, p) => sum + p.successRate, 0) / providers.length).toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={providers.reduce((sum, p) => sum + p.successRate, 0) / providers.length}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proxy Providers</CardTitle>
              <CardDescription>
                Manage your proxy providers and monitor their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Cost/GB</TableHead>
                    <TableHead>Countries</TableHead>
                    <TableHead>Monitoring</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(provider.status)}
                          <span className="font-medium">{provider.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{provider.type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(provider.status)}</TableCell>
                      <TableCell>{provider.responseTime}ms</TableCell>
                      <TableCell>{provider.successRate.toFixed(1)}%</TableCell>
                      <TableCell>${provider.costPerGB}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-1" />
                          {provider.countries}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMonitoring(provider.name)}
                        >
                          {provider.isMonitoring ? (
                            <Pause className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Play className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <LineChart className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.name} value={provider.name}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedProvider && (
                    <div className="space-y-4">
                      {providers
                        .filter(p => p.name === selectedProvider)
                        .map((provider) => (
                          <div key={provider.name} className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Response Time</Label>
                              <div className="text-2xl font-bold">{provider.responseTime}ms</div>
                              <Progress value={(5000 - provider.responseTime) / 50} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Success Rate</Label>
                              <div className="text-2xl font-bold">{provider.successRate.toFixed(1)}%</div>
                              <Progress value={provider.successRate} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Uptime</Label>
                              <div className="text-2xl font-bold">{provider.uptime.toFixed(1)}%</div>
                              <Progress value={provider.uptime} className="h-2" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Cost Efficiency</Label>
                              <div className="text-2xl font-bold">${provider.costPerGB}/GB</div>
                              <Progress value={(20 - provider.costPerGB) * 5} className="h-2" />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers.map((provider, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-gray-500">{provider.countries} countries</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{provider.endpoints} endpoints</p>
                        <p className="text-xs text-gray-500">{provider.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.filter(a => !a.resolved).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No active alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.filter(a => !a.resolved).map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{alert.provider}</p>
                          <p className="text-sm">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {alert.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Cost Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">$2,847</p>
                    <p className="text-sm text-gray-500">Monthly spend</p>
                  </div>
                  <div className="space-y-2">
                    {providers.map((provider, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{provider.name}</span>
                        <span>${(provider.costPerGB * 20).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Reliability Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">97.8%</p>
                    <p className="text-sm text-gray-500">Overall reliability</p>
                  </div>
                  <Progress value={97.8} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Uptime</p>
                      <p className="font-medium">99.2%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Success Rate</p>
                      <p className="font-medium">97.1%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Optimization Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">85/100</p>
                    <p className="text-sm text-gray-500">Optimization score</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cost Efficiency</span>
                      <span className="text-green-600">92%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Performance</span>
                      <span className="text-blue-600">88%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Coverage</span>
                      <span className="text-yellow-600">75%</span>
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
