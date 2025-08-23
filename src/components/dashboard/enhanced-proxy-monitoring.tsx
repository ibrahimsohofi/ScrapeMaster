'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Activity,
  Globe,
  DollarSign,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Server,
  Wifi,
  WifiOff,
  Settings,
  RefreshCw
} from 'lucide-react';

interface ProxyProvider {
  id: string;
  name: string;
  type: 'residential' | 'datacenter' | 'mobile' | 'isp';
  status: 'online' | 'offline' | 'warning';
  healthScore: number;
  responseTime: number;
  successRate: number;
  uptime: number;
  requestsPerMinute: number;
  costPerRequest: number;
  totalCost: number;
  geoCoverage: string[];
  features: string[];
  lastUsed: Date;
  errors: number;
  concurrentSessions: number;
  maxSessions: number;
}

interface PerformanceMetrics {
  timestamp: Date;
  latency: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  cost: number;
}

interface GeographicStats {
  country: string;
  requests: number;
  successRate: number;
  avgLatency: number;
  cost: number;
}

const EnhancedProxyMonitoring: React.FC = () => {
  const [providers, setProviders] = useState<ProxyProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [performanceData, setPerformanceData] = useState<Map<string, PerformanceMetrics[]>>(new Map());
  const [geoStats, setGeoStats] = useState<GeographicStats[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Initialize mock data
  useEffect(() => {
    setProviders([
      {
        id: 'brightdata',
        name: 'BrightData',
        type: 'residential',
        status: 'online',
        healthScore: 95,
        responseTime: 1250,
        successRate: 98.5,
        uptime: 99.8,
        requestsPerMinute: 450,
        costPerRequest: 0.005,
        totalCost: 125.50,
        geoCoverage: ['US', 'UK', 'DE', 'FR', 'CA', 'AU', 'JP', 'BR'],
        features: ['Premium Residential', 'Geo-targeting', 'Session Control'],
        lastUsed: new Date(Date.now() - 120000),
        errors: 3,
        concurrentSessions: 45,
        maxSessions: 100
      },
      {
        id: 'oxylabs',
        name: 'Oxylabs',
        type: 'residential',
        status: 'online',
        healthScore: 92,
        responseTime: 1180,
        successRate: 97.8,
        uptime: 99.5,
        requestsPerMinute: 380,
        costPerRequest: 0.004,
        totalCost: 98.20,
        geoCoverage: ['US', 'UK', 'DE', 'FR', 'SG', 'HK'],
        features: ['Premium Residential', 'Real-time Dashboard', 'API Access'],
        lastUsed: new Date(Date.now() - 300000),
        errors: 5,
        concurrentSessions: 38,
        maxSessions: 80
      },
      {
        id: 'smartproxy',
        name: 'SmartProxy',
        type: 'residential',
        status: 'warning',
        healthScore: 88,
        responseTime: 1450,
        successRate: 96.2,
        uptime: 98.9,
        requestsPerMinute: 320,
        costPerRequest: 0.003,
        totalCost: 76.80,
        geoCoverage: ['US', 'UK', 'DE', 'PL', 'TR'],
        features: ['Sticky Sessions', 'City Targeting', 'Whitelist'],
        lastUsed: new Date(Date.now() - 180000),
        errors: 8,
        concurrentSessions: 32,
        maxSessions: 60
      },
      {
        id: 'proxymesh',
        name: 'ProxyMesh',
        type: 'datacenter',
        status: 'online',
        healthScore: 90,
        responseTime: 890,
        successRate: 95.5,
        uptime: 99.2,
        requestsPerMinute: 280,
        costPerRequest: 0.002,
        totalCost: 45.60,
        geoCoverage: ['US', 'JP', 'AU', 'DE', 'NL'],
        features: ['Datacenter IPs', 'High Speed', 'Shared Pool'],
        lastUsed: new Date(Date.now() - 60000),
        errors: 12,
        concurrentSessions: 28,
        maxSessions: 50
      },
      {
        id: 'iproyal',
        name: 'IPRoyal',
        type: 'residential',
        status: 'online',
        healthScore: 93,
        responseTime: 1320,
        successRate: 97.1,
        uptime: 99.4,
        requestsPerMinute: 350,
        costPerRequest: 0.0035,
        totalCost: 87.50,
        geoCoverage: ['US', 'UK', 'DE', 'PL', 'CZ'],
        features: ['Multi-type Support', 'Geo-targeting', 'Mobile IPs'],
        lastUsed: new Date(Date.now() - 240000),
        errors: 6,
        concurrentSessions: 35,
        maxSessions: 70
      },
      {
        id: 'rayobyte',
        name: 'Rayobyte',
        type: 'residential',
        status: 'online',
        healthScore: 91,
        responseTime: 1080,
        successRate: 96.8,
        uptime: 99.1,
        requestsPerMinute: 420,
        costPerRequest: 0.0025,
        totalCost: 63.25,
        geoCoverage: ['US', 'CA', 'UK', 'DE', 'AU'],
        features: ['ISP Proxies', 'Fast Rotation', 'High Volume'],
        lastUsed: new Date(Date.now() - 90000),
        errors: 7,
        concurrentSessions: 42,
        maxSessions: 90
      }
    ]);

    setGeoStats([
      { country: 'US', requests: 1250, successRate: 97.2, avgLatency: 1180, cost: 6.25 },
      { country: 'UK', requests: 850, successRate: 96.8, avgLatency: 1320, cost: 4.25 },
      { country: 'DE', requests: 720, successRate: 98.1, avgLatency: 890, cost: 3.60 },
      { country: 'FR', requests: 640, successRate: 95.9, avgLatency: 1450, cost: 3.20 },
      { country: 'CA', requests: 580, successRate: 97.5, avgLatency: 1220, cost: 2.90 }
    ]);
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshProviderData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const refreshProviderData = useCallback(async () => {
    setLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update provider metrics with some random variance
    setProviders(prev => prev.map(provider => ({
      ...provider,
      responseTime: provider.responseTime + (Math.random() - 0.5) * 200,
      successRate: Math.max(90, Math.min(100, provider.successRate + (Math.random() - 0.5) * 2)),
      requestsPerMinute: Math.max(0, provider.requestsPerMinute + (Math.random() - 0.5) * 50),
      errors: provider.errors + Math.floor(Math.random() * 3),
      lastUsed: new Date()
    })));

    setLoading(false);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatLatency = (ms: number) => `${Math.round(ms)}ms`;
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Proxy Provider Monitoring</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              id="auto-refresh"
            />
            <Label htmlFor="auto-refresh">Auto Refresh</Label>
          </div>

          <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(Number.parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10s</SelectItem>
              <SelectItem value="30">30s</SelectItem>
              <SelectItem value="60">1m</SelectItem>
              <SelectItem value="300">5m</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={refreshProviderData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.filter(p => p.status === 'online').length}</div>
            <p className="text-xs text-muted-foreground">
              of {providers.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatLatency(providers.reduce((sum, p) => sum + p.responseTime, 0) / providers.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              across all providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests/min</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providers.reduce((sum, p) => sum + p.requestsPerMinute, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              real-time throughput
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(providers.reduce((sum, p) => sum + p.totalCost, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>Provider Status & Performance</CardTitle>
              <CardDescription>
                Real-time monitoring of all proxy providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Requests/min</TableHead>
                    <TableHead>Cost/req</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {provider.type}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(provider.status)}
                          <span className="capitalize">{provider.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className={`font-medium ${getHealthColor(provider.healthScore)}`}>
                            {provider.healthScore}%
                          </div>
                          <Progress value={provider.healthScore} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span>{formatLatency(provider.responseTime)}</span>
                          {provider.responseTime < 1000 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={provider.successRate > 97 ? 'text-green-600' : 'text-yellow-600'}>
                          {formatPercentage(provider.successRate)}
                        </div>
                      </TableCell>
                      <TableCell>{provider.requestsPerMinute.toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(provider.costPerRequest)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {provider.concurrentSessions}/{provider.maxSessions}
                          <Progress
                            value={(provider.concurrentSessions / provider.maxSessions) * 100}
                            className="h-1 mt-1"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <RotateCcw className="h-3 w-3" />
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

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Performance Chart (Response Time over time)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{provider.name}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={provider.successRate} className="w-24 h-2" />
                        <span className="text-sm">{formatPercentage(provider.successRate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Performance</CardTitle>
              <CardDescription>
                Performance metrics by country/region
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Avg Latency</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geoStats.map((stat) => (
                    <TableRow key={stat.country}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{stat.country}</span>
                        </div>
                      </TableCell>
                      <TableCell>{stat.requests.toLocaleString()}</TableCell>
                      <TableCell>{formatPercentage(stat.successRate)}</TableCell>
                      <TableCell>{formatLatency(stat.avgLatency)}</TableCell>
                      <TableCell>{formatCurrency(stat.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{provider.name}</span>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(provider.totalCost)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(provider.costPerRequest)}/req
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Switch to ProxyMesh for datacenter traffic</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Potential savings: $15.30/month
                    </p>
                  </div>

                  <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Optimize session distribution</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Balance load across providers for better rates
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedProxyMonitoring;
