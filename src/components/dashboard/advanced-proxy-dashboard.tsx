"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Globe,
  Zap,
  TrendingUp,
  DollarSign,
  Activity,
  Shield,
  MapPin,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Wifi,
  Server
} from 'lucide-react';

interface ProxyProvider {
  id: string;
  name: string;
  type: 'residential' | 'datacenter' | 'mobile';
  status: 'active' | 'inactive' | 'maintenance';
  countries: number;
  successRate: number;
  avgLatency: number;
  cost: number;
  requests: number;
  dataUsage: number;
}

interface GeoStats {
  country: string;
  countryCode: string;
  requests: number;
  successRate: number;
  avgCost: number;
}

interface CostOptimization {
  currentCost: number;
  projectedCost: number;
  potentialSavings: number;
  recommendations: {
    type: string;
    description: string;
    savings: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export default function AdvancedProxyDashboard() {
  const [providers, setProviders] = useState<ProxyProvider[]>([]);
  const [geoStats, setGeoStats] = useState<GeoStats[]>([]);
  const [costOptimization, setCostOptimization] = useState<CostOptimization | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setProviders(mockProviders);
      setGeoStats(mockGeoStats);
      setCostOptimization(mockCostOptimization);
      setLoading(false);
    }, 1000);
  }, []);

  const totalRequests = providers.reduce((sum, p) => sum + p.requests, 0);
  const totalCost = providers.reduce((sum, p) => sum + (p.cost * p.requests), 0);
  const avgSuccessRate = providers.reduce((sum, p) => sum + p.successRate, 0) / providers.length;
  const avgLatency = providers.reduce((sum, p) => sum + p.avgLatency, 0) / providers.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Proxy Management</h1>
          <p className="text-muted-foreground">
            Intelligent proxy selection with ML-powered optimization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            Optimize Now
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
            <Progress value={avgSuccessRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLatency.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              -15ms from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              -8% optimized savings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="optimization">Cost Optimization</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proxy Provider Performance</CardTitle>
              <CardDescription>
                Real-time monitoring of all connected proxy providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Server className="h-5 w-5" />
                        <div>
                          <h3 className="font-semibold">{provider.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Badge variant={provider.type === 'residential' ? 'default' : 'secondary'}>
                              {provider.type}
                            </Badge>
                            <span>{provider.countries} countries</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                        <div className="font-semibold">{provider.successRate}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Latency</div>
                        <div className="font-semibold">{provider.avgLatency}ms</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Requests</div>
                        <div className="font-semibold">{provider.requests.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Cost/Req</div>
                        <div className="font-semibold">${provider.cost.toFixed(3)}</div>
                      </div>
                      <Badge
                        variant={provider.status === 'active' ? 'default' :
                                provider.status === 'maintenance' ? 'destructive' : 'secondary'}
                      >
                        {provider.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Global Request Distribution</CardTitle>
                <CardDescription>
                  Traffic distribution across 100+ countries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {geoStats.slice(0, 10).map((stat) => (
                    <div key={stat.countryCode} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-4 w-4" />
                        <span className="font-medium">{stat.country}</span>
                        <Badge variant="outline">{stat.countryCode}</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>{stat.requests.toLocaleString()} reqs</span>
                        <span>{stat.successRate}% success</span>
                        <span>${stat.avgCost.toFixed(3)}/req</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance by Region</CardTitle>
                <CardDescription>
                  Latency and success rates by geographic region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">North America</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>45ms avg</span>
                      <span>98.5% success</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Europe</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>38ms avg</span>
                      <span>97.8% success</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Asia Pacific</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>52ms avg</span>
                      <span>96.2% success</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cost Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          {costOptimization && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Current Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${costOptimization.currentCost.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Projected Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${costOptimization.projectedCost.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Potential Savings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ${costOptimization.potentialSavings.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Optimization Recommendations</CardTitle>
                  <CardDescription>
                    AI-powered suggestions to reduce costs and improve performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {costOptimization.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            rec.priority === 'high' ? 'bg-red-500' :
                            rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <h4 className="font-medium">{rec.type.replace('_', ' ').toUpperCase()}</h4>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">+${rec.savings.toFixed(2)}</div>
                          <Badge variant={rec.priority === 'high' ? 'destructive' :
                                        rec.priority === 'medium' ? 'default' : 'secondary'}>
                            {rec.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Request Volume Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mr-2" />
                  Chart visualization would go here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Uptime</span>
                    <span className="font-semibold">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Error Rate</span>
                    <span className="font-semibold">0.1%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg Response Time</span>
                    <span className="font-semibold">45ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Throughput</span>
                    <span className="font-semibold">1,250 req/min</span>
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

// Mock data for demonstration
const mockProviders: ProxyProvider[] = [
  {
    id: 'brightdata',
    name: 'BrightData',
    type: 'residential',
    status: 'active',
    countries: 195,
    successRate: 98.5,
    avgLatency: 45,
    cost: 0.15,
    requests: 125000,
    dataUsage: 450.5
  },
  {
    id: 'oxylabs',
    name: 'Oxylabs',
    type: 'residential',
    status: 'active',
    countries: 100,
    successRate: 97.8,
    avgLatency: 52,
    cost: 0.12,
    requests: 98000,
    dataUsage: 380.2
  },
  {
    id: 'smartproxy',
    name: 'SmartProxy',
    type: 'residential',
    status: 'active',
    countries: 85,
    successRate: 96.2,
    avgLatency: 38,
    cost: 0.085,
    requests: 67000,
    dataUsage: 250.8
  },
  {
    id: 'proxymesh',
    name: 'ProxyMesh',
    type: 'datacenter',
    status: 'maintenance',
    countries: 25,
    successRate: 94.5,
    avgLatency: 28,
    cost: 0.05,
    requests: 15000,
    dataUsage: 45.2
  }
];

const mockGeoStats: GeoStats[] = [
  { country: 'United States', countryCode: 'US', requests: 45000, successRate: 98.2, avgCost: 0.12 },
  { country: 'United Kingdom', countryCode: 'GB', requests: 35000, successRate: 97.8, avgCost: 0.14 },
  { country: 'Germany', countryCode: 'DE', requests: 28000, successRate: 96.5, avgCost: 0.13 },
  { country: 'Japan', countryCode: 'JP', requests: 22000, successRate: 95.8, avgCost: 0.16 },
  { country: 'Canada', countryCode: 'CA', requests: 18000, successRate: 98.1, avgCost: 0.11 },
  { country: 'Australia', countryCode: 'AU', requests: 15000, successRate: 96.9, avgCost: 0.15 },
  { country: 'France', countryCode: 'FR', requests: 12000, successRate: 97.2, avgCost: 0.13 },
  { country: 'Brazil', countryCode: 'BR', requests: 10000, successRate: 94.5, avgCost: 0.18 },
  { country: 'India', countryCode: 'IN', requests: 8500, successRate: 93.2, avgCost: 0.20 },
  { country: 'Netherlands', countryCode: 'NL', requests: 7500, successRate: 98.5, avgCost: 0.12 }
];

const mockCostOptimization: CostOptimization = {
  currentCost: 1250.50,
  projectedCost: 1380.25,
  potentialSavings: 285.75,
  recommendations: [
    {
      type: 'provider_switch',
      description: 'Switch 30% of traffic from BrightData to SmartProxy for similar performance at lower cost',
      savings: 125.50,
      priority: 'high'
    },
    {
      type: 'volume_optimization',
      description: 'Consolidate usage to reach volume discounts with top providers',
      savings: 85.25,
      priority: 'medium'
    },
    {
      type: 'timing_optimization',
      description: 'Schedule non-urgent scraping during off-peak hours for better rates',
      savings: 75.00,
      priority: 'low'
    }
  ]
};
