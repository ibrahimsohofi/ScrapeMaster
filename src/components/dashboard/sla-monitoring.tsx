"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LucideShield,
  LucideCheckCircle2,
  LucideAlertTriangle,
  LucideClock,
  LucideZap,
  LucideTrendingUp,
  LucideTrendingDown,
  LucideCalendar,
  LucideBarChart3,
  LucideTarget,
  LucideSettings,
  LucideDownload,
  LucideRefreshCw,
  LucideAlertCircle,
  LucideActivity,
  LucideServer,
  LucideGlobe,
  LucideDatabase
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface SLATarget {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'meeting' | 'at-risk' | 'breached';
  lastUpdated: Date;
  category: 'availability' | 'performance' | 'error-rate' | 'response-time';
}

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  impactedServices: string[];
  rootCause?: string;
  resolution?: string;
  slaImpact: {
    availability: number;
    performance: number;
  };
}

interface UptimeData {
  timestamp: Date;
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
}

interface SLAReport {
  period: string;
  metrics: {
    availability: { actual: number; target: number; status: 'pass' | 'fail' };
    responseTime: { actual: number; target: number; status: 'pass' | 'fail' };
    errorRate: { actual: number; target: number; status: 'pass' | 'fail' };
    throughput: { actual: number; target: number; status: 'pass' | 'fail' };
  };
  incidentCount: number;
  downtimeMinutes: number;
  credits: number;
}

export function SLAMonitoringDashboard() {
  const [slaTargets, setSlaTargets] = useState<SLATarget[]>([
    {
      id: 'sla-1',
      name: 'System Availability',
      description: 'Overall system uptime and accessibility',
      target: 99.9,
      current: 99.94,
      unit: '%',
      trend: 'up',
      status: 'meeting',
      lastUpdated: new Date(),
      category: 'availability'
    },
    {
      id: 'sla-2',
      name: 'API Response Time',
      description: 'Average API response time for all endpoints',
      target: 200,
      current: 185,
      unit: 'ms',
      trend: 'down',
      status: 'meeting',
      lastUpdated: new Date(),
      category: 'response-time'
    },
    {
      id: 'sla-3',
      name: 'Error Rate',
      description: 'Percentage of failed requests',
      target: 1.0,
      current: 0.3,
      unit: '%',
      trend: 'down',
      status: 'meeting',
      lastUpdated: new Date(),
      category: 'error-rate'
    },
    {
      id: 'sla-4',
      name: 'Scraping Success Rate',
      description: 'Percentage of successful scraping jobs',
      target: 95.0,
      current: 97.2,
      unit: '%',
      trend: 'up',
      status: 'meeting',
      lastUpdated: new Date(),
      category: 'performance'
    }
  ]);

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: 'inc-001',
      title: 'Database Connection Pool Exhaustion',
      description: 'High traffic caused database connection pool to reach maximum capacity',
      severity: 'high',
      status: 'resolved',
      startTime: new Date(Date.now() - 7200000), // 2 hours ago
      endTime: new Date(Date.now() - 5400000), // 1.5 hours ago
      duration: 30, // minutes
      impactedServices: ['API Gateway', 'Data Processing', 'Dashboard'],
      rootCause: 'Unexpected traffic spike from new client onboarding',
      resolution: 'Increased connection pool size and implemented connection throttling',
      slaImpact: {
        availability: 0.02,
        performance: 0.1
      }
    },
    {
      id: 'inc-002',
      title: 'Proxy Provider Outage',
      description: 'Primary proxy provider experiencing service degradation',
      severity: 'medium',
      status: 'monitoring',
      startTime: new Date(Date.now() - 1800000), // 30 minutes ago
      impactedServices: ['Scraping Engine', 'Data Collection'],
      rootCause: 'Third-party provider infrastructure issues',
      slaImpact: {
        availability: 0.01,
        performance: 0.05
      }
    }
  ]);

  const [uptimeData, setUptimeData] = useState<UptimeData[]>([
    { timestamp: new Date(Date.now() - 3600000), uptime: 99.95, responseTime: 180, errorRate: 0.2, throughput: 1250 },
    { timestamp: new Date(Date.now() - 3000000), uptime: 99.92, responseTime: 195, errorRate: 0.4, throughput: 1180 },
    { timestamp: new Date(Date.now() - 2400000), uptime: 99.98, responseTime: 175, errorRate: 0.1, throughput: 1320 },
    { timestamp: new Date(Date.now() - 1800000), uptime: 99.89, responseTime: 220, errorRate: 0.6, throughput: 1100 },
    { timestamp: new Date(Date.now() - 1200000), uptime: 99.94, responseTime: 185, errorRate: 0.3, throughput: 1265 },
    { timestamp: new Date(Date.now() - 600000), uptime: 99.96, responseTime: 190, errorRate: 0.2, throughput: 1290 }
  ]);

  const [slaReports, setSlaReports] = useState<SLAReport[]>([
    {
      period: 'Current Month',
      metrics: {
        availability: { actual: 99.94, target: 99.9, status: 'pass' },
        responseTime: { actual: 185, target: 200, status: 'pass' },
        errorRate: { actual: 0.3, target: 1.0, status: 'pass' },
        throughput: { actual: 1265, target: 1000, status: 'pass' }
      },
      incidentCount: 2,
      downtimeMinutes: 45,
      credits: 0
    },
    {
      period: 'Last Month',
      metrics: {
        availability: { actual: 99.87, target: 99.9, status: 'fail' },
        responseTime: { actual: 205, target: 200, status: 'fail' },
        errorRate: { actual: 0.8, target: 1.0, status: 'pass' },
        throughput: { actual: 1150, target: 1000, status: 'pass' }
      },
      incidentCount: 5,
      downtimeMinutes: 120,
      credits: 85.50
    }
  ]);

  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Update SLA targets with slight variations
      setSlaTargets(prev => prev.map(target => {
        let newCurrent = target.current;

        switch (target.category) {
          case 'availability':
            newCurrent = Math.max(99.5, Math.min(100, target.current + (Math.random() - 0.5) * 0.05));
            break;
          case 'response-time':
            newCurrent = Math.max(150, Math.min(300, target.current + (Math.random() - 0.5) * 10));
            break;
          case 'error-rate':
            newCurrent = Math.max(0, Math.min(2, target.current + (Math.random() - 0.5) * 0.1));
            break;
          case 'performance':
            newCurrent = Math.max(90, Math.min(100, target.current + (Math.random() - 0.5) * 0.5));
            break;
        }

        const trend = newCurrent > target.current ? 'up' : newCurrent < target.current ? 'down' : 'stable';
        let status: 'meeting' | 'at-risk' | 'breached' = 'meeting';

        if (target.category === 'error-rate') {
          if (newCurrent > target.target) status = 'breached';
          else if (newCurrent > target.target * 0.8) status = 'at-risk';
        } else {
          if (newCurrent < target.target * (target.category === 'availability' ? 0.999 : 0.9)) status = 'breached';
          else if (newCurrent < target.target * (target.category === 'availability' ? 0.9995 : 0.95)) status = 'at-risk';
        }

        return {
          ...target,
          current: newCurrent,
          trend,
          status,
          lastUpdated: new Date()
        };
      }));

      // Add new uptime data point
      setUptimeData(prev => {
        const newPoint: UptimeData = {
          timestamp: new Date(),
          uptime: Math.max(99.5, Math.min(100, prev[prev.length - 1].uptime + (Math.random() - 0.5) * 0.1)),
          responseTime: Math.max(150, Math.min(300, prev[prev.length - 1].responseTime + (Math.random() - 0.5) * 15)),
          errorRate: Math.max(0, Math.min(2, prev[prev.length - 1].errorRate + (Math.random() - 0.5) * 0.1)),
          throughput: Math.max(1000, prev[prev.length - 1].throughput + (Math.random() - 0.5) * 100)
        };

        return [...prev.slice(1), newPoint];
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'meeting': return 'text-green-600 bg-green-50 border-green-200';
      case 'at-risk': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'breached': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case 'investigating': return 'bg-red-100 text-red-800';
      case 'identified': return 'bg-yellow-100 text-yellow-800';
      case 'monitoring': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentUptime = uptimeData[uptimeData.length - 1]?.uptime || 99.94;
  const totalIncidents = incidents.length;
  const activeIncidents = incidents.filter(inc => inc.status !== 'resolved').length;
  const slaCompliance = (slaTargets.filter(target => target.status === 'meeting').length / slaTargets.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SLA Monitoring & Uptime Tracking</h1>
          <p className="text-muted-foreground">Monitor service level agreements and track system availability</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <LucideRefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <LucideDownload className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <LucideSettings className="h-4 w-4 mr-2" />
            Configure SLAs
          </Button>
        </div>
      </div>

      {/* SLA Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Uptime</p>
                <p className="text-3xl font-bold text-green-600">{currentUptime.toFixed(2)}%</p>
              </div>
              <LucideShield className="h-12 w-12 text-green-600" />
            </div>
            <div className="mt-4">
              <Progress value={currentUptime} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">Target: 99.9%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SLA Compliance</p>
                <p className="text-3xl font-bold text-green-600">{slaCompliance.toFixed(0)}%</p>
              </div>
              <LucideTarget className="h-12 w-12 text-green-600" />
            </div>
            <div className="mt-4">
              <Progress value={slaCompliance} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {slaTargets.filter(t => t.status === 'meeting').length} of {slaTargets.length} SLAs met
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Incidents</p>
                <p className="text-3xl font-bold text-red-600">{activeIncidents}</p>
              </div>
              <LucideAlertTriangle className="h-12 w-12 text-red-600" />
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                {totalIncidents} total incidents (30 days)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">MTTR</p>
                <p className="text-3xl font-bold text-blue-600">23m</p>
              </div>
              <LucideClock className="h-12 w-12 text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-1">
                <LucideTrendingDown className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-600">-15% vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sla-targets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sla-targets">SLA Targets</TabsTrigger>
          <TabsTrigger value="uptime">Uptime History</TabsTrigger>
          <TabsTrigger value="incidents">Incident Management</TabsTrigger>
          <TabsTrigger value="reports">Compliance Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sla-targets" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {slaTargets.map((target) => (
              <Card key={target.id} className={`border-l-4 ${getStatusColor(target.status)}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{target.name}</CardTitle>
                    <Badge className={getStatusColor(target.status).replace('border-', 'border ')}>
                      {target.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>{target.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold">
                          {target.current.toFixed(target.unit === '%' ? 2 : 0)}{target.unit}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Target: {target.target.toFixed(target.unit === '%' ? 1 : 0)}{target.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {target.trend === 'up' && <LucideTrendingUp className="h-4 w-4 text-green-600" />}
                        {target.trend === 'down' && <LucideTrendingDown className="h-4 w-4 text-red-600" />}
                        {target.trend === 'stable' && <LucideActivity className="h-4 w-4 text-gray-600" />}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Performance</span>
                        <span>
                          {target.category === 'error-rate'
                            ? target.current <= target.target ? 'Meeting' : 'Below Target'
                            : target.current >= target.target ? 'Meeting' : 'Below Target'
                          }
                        </span>
                      </div>
                      <Progress
                        value={
                          target.category === 'error-rate'
                            ? Math.max(0, (target.target - target.current) / target.target * 100)
                            : Math.min(100, (target.current / target.target) * 100)
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Last updated: {target.lastUpdated.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="uptime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uptime History & Trends</CardTitle>
              <CardDescription>System availability and performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {uptimeData[uptimeData.length - 1]?.uptime.toFixed(2)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Current Uptime</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {uptimeData[uptimeData.length - 1]?.responseTime.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-muted-foreground">Response Time</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {uptimeData[uptimeData.length - 1]?.errorRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Error Rate</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {uptimeData[uptimeData.length - 1]?.throughput.toFixed(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Throughput (req/min)</div>
                  </div>
                </div>

                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center space-y-2">
                    <LucideBarChart3 className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-sm text-muted-foreground">
                      Interactive uptime chart visualization
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs mt-4">
                      <div>Avg Uptime: {(uptimeData.reduce((sum, d) => sum + d.uptime, 0) / uptimeData.length).toFixed(2)}%</div>
                      <div>Avg Response: {(uptimeData.reduce((sum, d) => sum + d.responseTime, 0) / uptimeData.length).toFixed(0)}ms</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Management</CardTitle>
              <CardDescription>Track and manage service incidents and their impact on SLAs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <Card key={incident.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getSeverityColor(incident.severity)}>
                                {incident.severity.toUpperCase()}
                              </Badge>
                              <Badge className={getIncidentStatusColor(incident.status)}>
                                {incident.status.toUpperCase()}
                              </Badge>
                              {incident.status === 'resolved' && (
                                <Badge variant="outline" className="text-green-600 border-green-200">
                                  <LucideCheckCircle2 className="h-3 w-3 mr-1" />
                                  RESOLVED
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold">{incident.title}</h3>
                            <p className="text-sm text-muted-foreground">{incident.description}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm font-medium">
                              {incident.duration ? `${incident.duration}m` : 'Ongoing'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {incident.status === 'resolved' ? 'Duration' : 'Elapsed'}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="font-medium">Impacted Services</div>
                            <div className="flex flex-wrap gap-1">
                              {incident.impactedServices.map((service) => (
                                <Badge key={service} variant="secondary" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="font-medium">SLA Impact</div>
                            <div className="text-muted-foreground">
                              Availability: -{incident.slaImpact.availability}%
                              <br />
                              Performance: -{incident.slaImpact.performance}%
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-1">
                            <LucideCalendar className="h-3 w-3" />
                            <span className="font-medium">Timeline:</span>
                          </div>
                          <div className="text-muted-foreground">
                            Started: {incident.startTime.toLocaleString()}
                            {incident.endTime && (
                              <br />
                              )}
                            {incident.endTime && `Resolved: ${incident.endTime.toLocaleString()}`}
                          </div>
                        </div>

                        {incident.rootCause && (
                          <div className="space-y-2 text-sm">
                            <div className="font-medium">Root Cause:</div>
                            <div className="text-muted-foreground">{incident.rootCause}</div>
                          </div>
                        )}

                        {incident.resolution && (
                          <div className="space-y-2 text-sm">
                            <div className="font-medium">Resolution:</div>
                            <div className="text-muted-foreground">{incident.resolution}</div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            {incident.status !== 'resolved' && (
                              <Button variant="outline" size="sm">
                                Update Status
                              </Button>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {incident.id}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {slaReports.map((report, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{report.period} SLA Report</CardTitle>
                  <CardDescription>
                    Compliance status and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(report.metrics).map(([metric, data]) => (
                        <div key={metric} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium capitalize">{metric.replace('-', ' ')}</div>
                            <div className="text-sm text-muted-foreground">
                              {data.actual.toFixed(metric.includes('time') ? 0 : 2)}
                              {metric.includes('rate') || metric.includes('availability') ? '%' :
                               metric.includes('time') ? 'ms' :
                               metric === 'throughput' ? ' req/min' : ''}
                              {' '} / {data.target.toFixed(metric.includes('time') ? 0 : 1)}
                              {metric.includes('rate') || metric.includes('availability') ? '%' :
                               metric.includes('time') ? 'ms' :
                               metric === 'throughput' ? ' req/min' : ''}
                            </div>
                          </div>
                          <Badge className={data.status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {data.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Incidents</div>
                          <div className="text-muted-foreground">{report.incidentCount}</div>
                        </div>
                        <div>
                          <div className="font-medium">Downtime</div>
                          <div className="text-muted-foreground">{report.downtimeMinutes} minutes</div>
                        </div>
                        <div>
                          <div className="font-medium">SLA Credits</div>
                          <div className="text-muted-foreground">${report.credits.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="font-medium">Overall Status</div>
                          <div className={`font-medium ${
                            Object.values(report.metrics).every(m => m.status === 'pass')
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {Object.values(report.metrics).every(m => m.status === 'pass') ? 'PASSED' : 'FAILED'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Service Status Overview</CardTitle>
              <CardDescription>Current operational status of all services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <LucideServer className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-medium">API Gateway</div>
                      <div className="text-sm text-muted-foreground">Operational</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <LucideCheckCircle2 className="h-3 w-3 mr-1" />
                    HEALTHY
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <LucideDatabase className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-medium">Database</div>
                      <div className="text-sm text-muted-foreground">Operational</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <LucideCheckCircle2 className="h-3 w-3 mr-1" />
                    HEALTHY
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <LucideGlobe className="h-8 w-8 text-yellow-600" />
                    <div>
                      <div className="font-medium">Scraping Engine</div>
                      <div className="text-sm text-muted-foreground">Degraded Performance</div>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <LucideAlertCircle className="h-3 w-3 mr-1" />
                    DEGRADED
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
