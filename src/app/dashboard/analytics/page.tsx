"use client";

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LucideActivity,
  LucideAlertTriangle,
  LucideBarChart3,
  LucideBrain,
  LucideCheckCircle2,
  LucideClock,
  LucideDollarSign,
  LucideGlobe,
  LucideShield,
  LucideTarget,
  LucideTrendingUp,
  LucideZap,
  LucideUsers,
  LucideServer,
  LucideDatabase,
  LucideWifi
} from 'lucide-react';

// Mock data for the advanced analytics dashboard
const analyticsData = {
  realTimeStats: {
    activeJobs: 47,
    jobsLastHour: 156,
    successRateLastHour: 97.3,
    avgExecutionTimeLastHour: 2340,
    dataPointsLastHour: 12847,
    errorsLastHour: 4,
    costLastHour: 23.45
  },
  performance: {
    successRate: 96.8,
    avgExecutionTime: 2145,
    totalJobsToday: 3247,
    dataPointsExtracted: 487392,
    costEfficiency: {
      costPerDataPoint: 0.0048,
      costPerSuccessfulJob: 0.73,
      monthlyBurn: 2847.50
    }
  },
  aiMetrics: {
    selectorsGenerated: 1847,
    aiAccuracy: 91.2,
    automationSavings: 87.5,
    tokensUsed: 2847392,
    modelsUsed: ['GPT-4 Turbo', 'Mistral-7B']
  },
  compliance: {
    robotsTxtRespected: 99.7,
    geoBlockingActive: true,
    piiRedacted: 3847,
    complianceViolations: 2,
    blockedRegions: ['CN', 'RU', 'IR', 'KP']
  },
  proxyPerformance: [
    { provider: 'Bright Data', successRate: 98.2, avgLatency: 850, cost: 1247.50, country: 'Global' },
    { provider: 'Oxylabs', successRate: 96.8, avgLatency: 1240, cost: 987.30, country: 'EU/US' },
    { provider: 'Free Proxies', successRate: 72.4, avgLatency: 3240, cost: 0, country: 'Mixed' }
  ],
  topErrors: [
    { type: 'CAPTCHA Detected', count: 23, percentage: 35.4 },
    { type: 'Rate Limited', count: 18, percentage: 27.7 },
    { type: 'Selector Not Found', count: 12, percentage: 18.5 },
    { type: 'Network Timeout', count: 8, percentage: 12.3 },
    { type: 'Page Not Found', count: 4, percentage: 6.1 }
  ],
  infrastructure: {
    totalServers: 247,
    activeRegions: 3,
    proxyPoolHealth: 94.7,
    queueDepth: 127,
    avgResponseTime: 1.2
  },
  recommendations: [
    "Success rate excellent - maintain current optimization strategies",
    "Consider upgrading to premium proxies for 15% cost reduction",
    "AI selector accuracy can be improved with more training data",
    "Schedule maintenance for proxy pool optimization"
  ]
};

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                ScrapeFlow AI Analytics
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Advanced monitoring and insights for your scraping infrastructure
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 self-start sm:self-center">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
              System Operational
            </Badge>
          </div>

          {/* Real-time Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <LucideActivity className="h-4 w-4 mr-2 text-green-600" />
                  Active Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData.realTimeStats.activeJobs}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.realTimeStats.jobsLastHour} completed last hour
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <LucideTarget className="h-4 w-4 mr-2 text-blue-600" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.realTimeStats.successRateLastHour}%
                </div>
                <Progress value={analyticsData.realTimeStats.successRateLastHour} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <LucideDatabase className="h-4 w-4 mr-2 text-purple-600" />
                  Data Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData.realTimeStats.dataPointsLastHour.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last hour
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <LucideDollarSign className="h-4 w-4 mr-2 text-amber-600" />
                  Hourly Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  ${analyticsData.realTimeStats.costLastHour}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${analyticsData.performance.costEfficiency.monthlyBurn.toFixed(2)} monthly burn
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Analytics Tabs */}
          <Tabs defaultValue="performance" className="space-y-4">
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-5 min-w-max sm:min-w-full">
                <TabsTrigger value="performance" className="whitespace-nowrap">Performance</TabsTrigger>
                <TabsTrigger value="ai-insights" className="whitespace-nowrap">AI Insights</TabsTrigger>
                <TabsTrigger value="compliance" className="whitespace-nowrap">Compliance</TabsTrigger>
                <TabsTrigger value="infrastructure" className="whitespace-nowrap">Infrastructure</TabsTrigger>
                <TabsTrigger value="costs" className="whitespace-nowrap">Cost Analysis</TabsTrigger>
              </TabsList>
            </div>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LucideBarChart3 className="h-5 w-5 mr-2" />
                      Execution Performance
                    </CardTitle>
                    <CardDescription>
                      Job execution metrics and success rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Overall Success Rate</span>
                      <span className="text-sm font-bold text-green-600">
                        {analyticsData.performance.successRate}%
                      </span>
                    </div>
                    <Progress value={analyticsData.performance.successRate} />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Avg Execution Time</span>
                      <span className="text-sm font-bold">
                        {analyticsData.performance.avgExecutionTime}ms
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Jobs Today</span>
                      <span className="text-sm font-bold">
                        {analyticsData.performance.totalJobsToday.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LucideAlertTriangle className="h-5 w-5 mr-2" />
                      Error Analysis
                    </CardTitle>
                    <CardDescription>
                      Most common failure reasons
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData.topErrors.map((error, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{error.type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {error.percentage.toFixed(1)}%
                            </span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-red-500 rounded-full"
                                style={{ width: `${error.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Proxy Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LucideGlobe className="h-5 w-5 mr-2" />
                    Proxy Performance Analysis
                  </CardTitle>
                  <CardDescription>
                    Comparative analysis of proxy providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.proxyPerformance.map((proxy, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{proxy.provider}</h4>
                            <p className="text-sm text-muted-foreground">{proxy.country}</p>
                          </div>
                          <Badge variant={proxy.successRate > 95 ? "default" : "secondary"}>
                            {proxy.successRate}% success
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Latency</span>
                            <p className="font-medium">{proxy.avgLatency}ms</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost</span>
                            <p className="font-medium">${proxy.cost.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status</span>
                            <p className="font-medium text-green-600">Healthy</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="ai-insights" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LucideBrain className="h-5 w-5 mr-2 text-blue-600" />
                      AI Selector Generation
                    </CardTitle>
                    <CardDescription>
                      Automated selector creation performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Selectors Generated</span>
                      <span className="text-sm font-bold text-blue-600">
                        {analyticsData.aiMetrics.selectorsGenerated.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">AI Accuracy</span>
                      <span className="text-sm font-bold text-green-600">
                        {analyticsData.aiMetrics.aiAccuracy}%
                      </span>
                    </div>
                    <Progress value={analyticsData.aiMetrics.aiAccuracy} />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Automation Savings</span>
                      <span className="text-sm font-bold text-purple-600">
                        {analyticsData.aiMetrics.automationSavings}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LucideZap className="h-5 w-5 mr-2" />
                      Model Usage
                    </CardTitle>
                    <CardDescription>
                      AI model performance and usage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tokens Used</span>
                      <span className="text-sm font-bold">
                        {analyticsData.aiMetrics.tokensUsed.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">Active Models</span>
                      <div className="space-y-1">
                        {analyticsData.aiMetrics.modelsUsed.map((model, index) => (
                          <Badge key={index} variant="outline" className="mr-2">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-700">
                      <LucideShield className="h-5 w-5 mr-2" />
                      Compliance Status
                    </CardTitle>
                    <CardDescription>
                      Legal and ethical compliance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Robots.txt Respected</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-green-600">
                          {analyticsData.compliance.robotsTxtRespected}%
                        </span>
                        <LucideCheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Geo-blocking Active</span>
                      <Badge variant={analyticsData.compliance.geoBlockingActive ? "default" : "destructive"}>
                        {analyticsData.compliance.geoBlockingActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">PII Data Redacted</span>
                      <span className="text-sm font-bold">
                        {analyticsData.compliance.piiRedacted.toLocaleString()} items
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Blocked Regions</CardTitle>
                    <CardDescription>
                      Regions with active geo-blocking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analyticsData.compliance.blockedRegions.map((region, index) => (
                        <Badge key={index} variant="outline" className="mr-2 text-red-600 border-red-200">
                          {region}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Total violations prevented: {analyticsData.compliance.complianceViolations}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Infrastructure Tab */}
            <TabsContent value="infrastructure" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LucideServer className="h-5 w-5 mr-2" />
                      Infrastructure
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Servers</span>
                      <span className="font-bold">{analyticsData.infrastructure.totalServers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Regions</span>
                      <span className="font-bold">{analyticsData.infrastructure.activeRegions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Queue Depth</span>
                      <span className="font-bold">{analyticsData.infrastructure.queueDepth}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LucideWifi className="h-5 w-5 mr-2" />
                      Network Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Proxy Pool Health</span>
                      <span className="font-bold text-green-600">
                        {analyticsData.infrastructure.proxyPoolHealth}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Response Time</span>
                      <span className="font-bold">
                        {analyticsData.infrastructure.avgResponseTime}s
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LucideTrendingUp className="h-5 w-5 mr-2" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analyticsData.recommendations.slice(0, 2).map((rec, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          • {rec}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Cost Analysis Tab */}
            <TabsContent value="costs" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LucideDollarSign className="h-5 w-5 mr-2" />
                      Cost Efficiency
                    </CardTitle>
                    <CardDescription>
                      Detailed cost breakdown and optimization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Cost per Data Point</span>
                      <span className="text-sm font-bold">
                        ${analyticsData.performance.costEfficiency.costPerDataPoint.toFixed(4)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Cost per Successful Job</span>
                      <span className="text-sm font-bold">
                        ${analyticsData.performance.costEfficiency.costPerSuccessfulJob.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Monthly Burn Rate</span>
                      <span className="text-sm font-bold text-amber-600">
                        ${analyticsData.performance.costEfficiency.monthlyBurn.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cost Optimization Tips</CardTitle>
                    <CardDescription>
                      AI-powered cost reduction recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="border-l-4 border-l-blue-500 pl-4">
                        <p className="text-sm font-medium">Switch to datacenter proxies</p>
                        <p className="text-xs text-muted-foreground">
                          Could save ~40% on proxy costs for simple sites
                        </p>
                      </div>
                      <div className="border-l-4 border-l-green-500 pl-4">
                        <p className="text-sm font-medium">Optimize retry logic</p>
                        <p className="text-xs text-muted-foreground">
                          Reduce failed job costs by 25%
                        </p>
                      </div>
                      <div className="border-l-4 border-l-purple-500 pl-4">
                        <p className="text-sm font-medium">Use AI scheduling</p>
                        <p className="text-xs text-muted-foreground">
                          Batch jobs during off-peak hours
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
