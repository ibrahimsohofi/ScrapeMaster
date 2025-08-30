"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LucideAlertTriangle,
  LucideCheckCircle2,
  LucideTrendingUp,
  LucideTrendingDown,
  LucideSearch,
  LucideFilter,
  LucideDownload,
  LucideExternalLink,
  LucideHash,
  LucideUser,
  LucideCalendar,
  LucideMapPin,
  LucideCode,
  LucideDatabase,
  LucideGlobe,
  LucideZap,
  LucideSettings,
  LucideRefreshCw,
  LucideBarChart3,
  LucidePieChart,
  LucideActivity
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface ErrorEvent {
  id: string;
  title: string;
  message: string;
  category: 'network' | 'timeout' | 'auth' | 'validation' | 'runtime' | 'database' | 'api' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  count: number;
  fingerprint: string;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  environment: 'development' | 'staging' | 'production';
  resolved: boolean;
  tags: string[];
  impact: {
    usersAffected: number;
    requestsAffected: number;
    estimatedCost: number;
  };
}

interface ErrorTrend {
  category: string;
  count: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface ErrorStats {
  total: number;
  new: number;
  resolved: number;
  critical: number;
  unique: number;
  errorRate: number;
}

export function ErrorTrackingDashboard() {
  const [errors, setErrors] = useState<ErrorEvent[]>([
    {
      id: 'err-001',
      title: 'Database Connection Timeout',
      message: 'Connection to PostgreSQL database timed out after 30 seconds',
      category: 'database',
      severity: 'high',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      count: 23,
      fingerprint: 'db-timeout-postgresql',
      stackTrace: 'Error: Connection timeout\n  at Database.connect(db.js:45)\n  at async scrapeJob(scraper.js:123)',
      userAgent: 'TechFlow-Scraper/1.0',
      url: '/api/scraper/test',
      environment: 'production',
      resolved: false,
      tags: ['database', 'timeout', 'postgresql'],
      impact: {
        usersAffected: 12,
        requestsAffected: 23,
        estimatedCost: 145.50
      }
    },
    {
      id: 'err-002',
      title: 'Proxy Authentication Failed',
      message: 'HTTP 407 Proxy Authentication Required',
      category: 'auth',
      severity: 'medium',
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      count: 8,
      fingerprint: 'proxy-auth-407',
      stackTrace: 'Error: Proxy authentication failed\n  at ProxyManager.authenticate(proxy.js:67)',
      environment: 'production',
      resolved: false,
      tags: ['proxy', 'authentication', '407'],
      impact: {
        usersAffected: 3,
        requestsAffected: 8,
        estimatedCost: 24.00
      }
    },
    {
      id: 'err-003',
      title: 'Rate Limit Exceeded',
      message: 'API rate limit exceeded: 1000 requests per hour',
      category: 'api',
      severity: 'medium',
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      count: 15,
      fingerprint: 'rate-limit-exceeded',
      environment: 'production',
      resolved: true,
      tags: ['rate-limit', 'api', 'throttling'],
      impact: {
        usersAffected: 5,
        requestsAffected: 15,
        estimatedCost: 32.75
      }
    },
    {
      id: 'err-004',
      title: 'Validation Error: Invalid URL',
      message: 'Invalid URL format provided for scraping target',
      category: 'validation',
      severity: 'low',
      timestamp: new Date(Date.now() - 1200000), // 20 minutes ago
      count: 4,
      fingerprint: 'validation-invalid-url',
      environment: 'production',
      resolved: false,
      tags: ['validation', 'url', 'input'],
      impact: {
        usersAffected: 2,
        requestsAffected: 4,
        estimatedCost: 5.20
      }
    }
  ]);

  const [errorStats, setErrorStats] = useState<ErrorStats>({
    total: 50,
    new: 12,
    resolved: 8,
    critical: 2,
    unique: 15,
    errorRate: 2.3
  });

  const [errorTrends, setErrorTrends] = useState<ErrorTrend[]>([
    { category: 'network', count: 18, change: 12, trend: 'up' },
    { category: 'timeout', count: 15, change: -5, trend: 'down' },
    { category: 'auth', count: 8, change: 3, trend: 'up' },
    { category: 'validation', count: 6, change: 0, trend: 'stable' },
    { category: 'database', count: 3, change: -2, trend: 'down' }
  ]);

  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add new errors or update existing ones
      if (Math.random() < 0.3) { // 30% chance of new error
        const categories: ErrorEvent['category'][] = ['network', 'timeout', 'auth', 'validation', 'runtime', 'database', 'api'];
        const severities: ErrorEvent['severity'][] = ['low', 'medium', 'high', 'critical'];
        const environments: ErrorEvent['environment'][] = ['production', 'staging'];

        const newError: ErrorEvent = {
          id: `err-${Date.now()}`,
          title: `${categories[Math.floor(Math.random() * categories.length)]} Error`,
          message: 'Simulated error for demo purposes',
          category: categories[Math.floor(Math.random() * categories.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          timestamp: new Date(),
          count: Math.floor(Math.random() * 10) + 1,
          fingerprint: `fingerprint-${Math.random().toString(36).substr(2, 9)}`,
          environment: environments[Math.floor(Math.random() * environments.length)],
          resolved: false,
          tags: ['demo', 'simulated'],
          impact: {
            usersAffected: Math.floor(Math.random() * 20),
            requestsAffected: Math.floor(Math.random() * 50),
            estimatedCost: Math.random() * 100
          }
        };

        setErrors(prev => [newError, ...prev.slice(0, 19)]);
        setErrorStats(prev => ({
          ...prev,
          total: prev.total + 1,
          new: prev.new + 1
        }));
      }

      // Update error trends
      setErrorTrends(prev => prev.map(trend => ({
        ...trend,
        count: Math.max(0, trend.count + Math.floor((Math.random() - 0.5) * 3)),
        change: Math.floor((Math.random() - 0.5) * 10)
      })));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      network: 'bg-blue-100 text-blue-800',
      timeout: 'bg-yellow-100 text-yellow-800',
      auth: 'bg-red-100 text-red-800',
      validation: 'bg-green-100 text-green-800',
      runtime: 'bg-purple-100 text-purple-800',
      database: 'bg-indigo-100 text-indigo-800',
      api: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  const filteredErrors = errors.filter(error => {
    if (selectedCategory !== 'all' && error.category !== selectedCategory) return false;
    if (selectedSeverity !== 'all' && error.severity !== selectedSeverity) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Tracking & Analysis</h1>
          <p className="text-muted-foreground">Monitor, analyze, and resolve application errors in real-time</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <LucideRefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <LucideDownload className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <LucideSettings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Error Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Errors</p>
                <p className="text-2xl font-bold">{errorStats.total}</p>
              </div>
              <LucideActivity className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New (24h)</p>
                <p className="text-2xl font-bold text-red-600">{errorStats.new}</p>
              </div>
              <LucideAlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{errorStats.resolved}</p>
              </div>
              <LucideCheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{errorStats.critical}</p>
              </div>
              <LucideZap className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique</p>
                <p className="text-2xl font-bold">{errorStats.unique}</p>
              </div>
              <LucideHash className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{errorStats.errorRate}%</p>
              </div>
              <LucideBarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">Error Events</TabsTrigger>
          <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
          <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
          <TabsTrigger value="resolution">Resolution Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label htmlFor="timeframe" className="text-sm font-medium">Timeframe:</label>
                  <select
                    id="timeframe"
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="category" className="text-sm font-medium">Category:</label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="network">Network</option>
                    <option value="timeout">Timeout</option>
                    <option value="auth">Authentication</option>
                    <option value="validation">Validation</option>
                    <option value="runtime">Runtime</option>
                    <option value="database">Database</option>
                    <option value="api">API</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="severity" className="text-sm font-medium">Severity:</label>
                  <select
                    id="severity"
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <Button variant="outline" size="sm">
                  <LucideSearch className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error List */}
          <div className="space-y-4">
            {filteredErrors.map((error) => (
              <Card key={error.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(error.severity)}>
                            {error.severity.toUpperCase()}
                          </Badge>
                          <Badge className={getCategoryColor(error.category)}>
                            {error.category}
                          </Badge>
                          <Badge variant="outline">
                            {error.environment}
                          </Badge>
                          {error.resolved && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              <LucideCheckCircle2 className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold">{error.title}</h3>
                        <p className="text-sm text-muted-foreground">{error.message}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-2xl font-bold text-red-600">{error.count}</div>
                        <div className="text-xs text-muted-foreground">occurrences</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <LucideCalendar className="h-3 w-3" />
                          <span className="font-medium">Last Seen:</span>
                        </div>
                        <div className="text-muted-foreground">
                          {error.timestamp.toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <LucideUser className="h-3 w-3" />
                          <span className="font-medium">Impact:</span>
                        </div>
                        <div className="text-muted-foreground">
                          {error.impact.usersAffected} users, {error.impact.requestsAffected} requests
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <LucideHash className="h-3 w-3" />
                          <span className="font-medium">Fingerprint:</span>
                        </div>
                        <div className="text-muted-foreground font-mono text-xs">
                          {error.fingerprint}
                        </div>
                      </div>
                    </div>

                    {error.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {error.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <LucideExternalLink className="h-3 w-3 mr-1" />
                          Stack Trace
                        </Button>
                        {!error.resolved && (
                          <Button variant="outline" size="sm">
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Est. Cost: ${error.impact.estimatedCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Error Trends by Category</CardTitle>
                <CardDescription>Error counts and trends over the selected timeframe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {errorTrends.map((trend) => (
                    <div key={trend.category} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getCategoryColor(trend.category)}>
                          {trend.category}
                        </Badge>
                        <span className="font-medium">{trend.count} errors</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {trend.trend === 'up' && (
                          <LucideTrendingUp className="h-4 w-4 text-red-600" />
                        )}
                        {trend.trend === 'down' && (
                          <LucideTrendingDown className="h-4 w-4 text-green-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          trend.change > 0 ? 'text-red-600' :
                          trend.change < 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {trend.change > 0 ? '+' : ''}{trend.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Distribution</CardTitle>
                <CardDescription>Breakdown of errors by severity and category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center space-y-2">
                    <LucidePieChart className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-sm text-muted-foreground">
                      Interactive pie chart showing error distribution
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs mt-4">
                      <div>Critical: {errorStats.critical}</div>
                      <div>High: {Math.floor(errorStats.total * 0.3)}</div>
                      <div>Medium: {Math.floor(errorStats.total * 0.4)}</div>
                      <div>Low: {Math.floor(errorStats.total * 0.2)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">$1,247</div>
                    <div className="text-sm text-muted-foreground">Estimated Cost Impact</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Users Affected</span>
                      <span className="font-medium">342</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Requests Failed</span>
                      <span className="font-medium">1,248</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Data Loss</span>
                      <span className="font-medium">0.02%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Time Impact</span>
                      <span className="font-medium text-orange-600">+245ms</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Throughput Impact</span>
                      <span className="font-medium text-red-600">-23%</span>
                    </div>
                    <Progress value={77} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate Impact</span>
                      <span className="font-medium text-red-600">-2.3%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">87.3</div>
                    <div className="text-sm text-muted-foreground">Health Score</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Database</span>
                      <span className="font-medium text-green-600">Healthy</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>API Gateway</span>
                      <span className="font-medium text-yellow-600">Degraded</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Proxy Pool</span>
                      <span className="font-medium text-green-600">Healthy</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resolution Tracking</CardTitle>
              <CardDescription>Track error resolution progress and team performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Resolution Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Mean Time to Resolution</span>
                      <span className="font-medium">2.4 hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Resolution Rate (24h)</span>
                      <span className="font-medium text-green-600">73%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Critical Errors Resolved</span>
                      <span className="font-medium">100%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. Team Response Time</span>
                      <span className="font-medium">12 minutes</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Recent Resolutions</h4>
                  <div className="space-y-2">
                    {errors.filter(e => e.resolved).slice(0, 3).map((error) => (
                      <div key={error.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{error.title}</span>
                          <LucideCheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Resolved {error.timestamp.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
