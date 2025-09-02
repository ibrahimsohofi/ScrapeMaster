"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  TrendingUp,
  Globe,
  Zap,
  Settings,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

interface BrowserNode {
  id: string;
  region: string;
  zone: string;
  status: 'healthy' | 'degraded' | 'offline' | 'maintenance';
  load: number;
  maxCapacity: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  cost: number;
  uptime: number;
  lastHealthCheck: Date;
}

export default function AdvancedBrowserFarmPage() {
  const [nodes, setNodes] = useState<BrowserNode[]>([
    {
      id: 'farm-us-east-1-001',
      region: 'us-east-1',
      zone: 'a',
      status: 'healthy',
      load: 7,
      maxCapacity: 10,
      responseTime: 1234,
      memoryUsage: 67,
      cpuUsage: 45,
      cost: 3.84,
      uptime: 99.8,
      lastHealthCheck: new Date(Date.now() - 30000),
    },
    {
      id: 'farm-us-east-1-002',
      region: 'us-east-1',
      zone: 'b',
      status: 'healthy',
      load: 9,
      maxCapacity: 10,
      responseTime: 1456,
      memoryUsage: 78,
      cpuUsage: 62,
      cost: 3.84,
      uptime: 99.9,
      lastHealthCheck: new Date(Date.now() - 45000),
    },
    {
      id: 'farm-us-east-1-003',
      region: 'us-east-1',
      zone: 'c',
      status: 'degraded',
      load: 5,
      maxCapacity: 10,
      responseTime: 2100,
      memoryUsage: 89,
      cpuUsage: 76,
      cost: 3.84,
      uptime: 97.2,
      lastHealthCheck: new Date(Date.now() - 120000),
    },
    {
      id: 'farm-us-west-2-001',
      region: 'us-west-2',
      zone: 'a',
      status: 'healthy',
      load: 6,
      maxCapacity: 10,
      responseTime: 1189,
      memoryUsage: 54,
      cpuUsage: 38,
      cost: 3.72,
      uptime: 99.6,
      lastHealthCheck: new Date(Date.now() - 25000),
    },
    {
      id: 'farm-eu-west-1-001',
      region: 'eu-west-1',
      zone: 'a',
      status: 'maintenance',
      load: 0,
      maxCapacity: 10,
      responseTime: 0,
      memoryUsage: 12,
      cpuUsage: 5,
      cost: 0,
      uptime: 0,
      lastHealthCheck: new Date(Date.now() - 600000),
    },
  ]);

  const [poolStats, setPoolStats] = useState({
    totalNodes: 5,
    healthyNodes: 3,
    totalCapacity: 50,
    currentLoad: 27,
    averageResponseTime: 1399,
    totalHourlyCost: 15.24,
    efficiency: 84.2,
  });

  const [autoScaling, setAutoScaling] = useState({
    enabled: true,
    targetUtilization: 70,
    minNodes: 3,
    maxNodes: 20,
    lastScaleAction: new Date(Date.now() - 1800000),
  });

  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'offline':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'maintenance':
        return <Settings className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'degraded': return 'secondary';
      case 'offline': return 'destructive';
      case 'maintenance': return 'outline';
      default: return 'outline';
    }
  };

  const handleOptimizePool = async () => {
    setIsOptimizing(true);

    // Simulate optimization process
    setTimeout(() => {
      setNodes(prev => prev.map(node => ({
        ...node,
        load: Math.max(0, node.load - Math.floor(Math.random() * 3)),
        memoryUsage: Math.max(30, node.memoryUsage - Math.floor(Math.random() * 15)),
        cpuUsage: Math.max(20, node.cpuUsage - Math.floor(Math.random() * 10)),
        responseTime: Math.max(800, node.responseTime - Math.floor(Math.random() * 300)),
      })));

      setPoolStats(prev => ({
        ...prev,
        efficiency: Math.min(100, prev.efficiency + Math.random() * 10),
        averageResponseTime: Math.max(800, prev.averageResponseTime - Math.floor(Math.random() * 200)),
      }));

      setIsOptimizing(false);
    }, 3000);
  };

  const handleScaleNode = (nodeId: string, action: 'up' | 'down') => {
    console.log(`Scaling ${action} node ${nodeId}`);
    // Implementation would trigger actual scaling
  };

  const handleRestartNode = (nodeId: string) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId
        ? { ...node, status: 'maintenance', lastHealthCheck: new Date() }
        : node
    ));

    // Simulate restart
    setTimeout(() => {
      setNodes(prev => prev.map(node =>
        node.id === nodeId
          ? {
              ...node,
              status: 'healthy',
              load: 0,
              memoryUsage: 30,
              cpuUsage: 15,
              responseTime: 1000,
              lastHealthCheck: new Date()
            }
          : node
      ));
    }, 5000);
  };

  const filteredNodes = selectedRegion === 'all'
    ? nodes
    : nodes.filter(node => node.region === selectedRegion);

  const regions = [...new Set(nodes.map(node => node.region))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Browser Farm Management</h1>
          <p className="text-muted-foreground">
            Intelligent browser pool optimization with predictive scaling
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleOptimizePool}
            disabled={isOptimizing}
            className="flex items-center space-x-2"
          >
            {isOptimizing ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{isOptimizing ? 'Optimizing...' : 'Optimize Pool'}</span>
          </Button>
        </div>
      </div>

      {/* Pool Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{poolStats.healthyNodes}/{poolStats.totalNodes}</div>
            <p className="text-xs text-muted-foreground">
              {((poolStats.healthyNodes / poolStats.totalNodes) * 100).toFixed(1)}% healthy
            </p>
            <Progress
              value={(poolStats.healthyNodes / poolStats.totalNodes) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pool Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((poolStats.currentLoad / poolStats.totalCapacity) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {poolStats.currentLoad}/{poolStats.totalCapacity} sessions
            </p>
            <Progress
              value={(poolStats.currentLoad / poolStats.totalCapacity) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{poolStats.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Across all healthy nodes
            </p>
            <Badge variant={poolStats.averageResponseTime < 1500 ? "default" : "destructive"} className="mt-2">
              {poolStats.averageResponseTime < 1500 ? "Optimal" : "Needs Attention"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hourly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${poolStats.totalHourlyCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {poolStats.efficiency.toFixed(1)}% efficiency
            </p>
            <Badge variant="outline" className="mt-2">
              Cost Optimized
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Auto-scaling Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Predictive Auto-scaling
          </CardTitle>
          <CardDescription>
            ML-powered scaling based on demand prediction and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex items-center space-x-2">
                <Badge variant={autoScaling.enabled ? "default" : "secondary"}>
                  {autoScaling.enabled ? "Enabled" : "Disabled"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAutoScaling(prev => ({ ...prev, enabled: !prev.enabled }))}
                >
                  {autoScaling.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Utilization</label>
              <div className="text-2xl font-bold">{autoScaling.targetUtilization}%</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Node Range</label>
              <div className="text-lg">{autoScaling.minNodes} - {autoScaling.maxNodes}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Action</label>
              <div className="text-sm text-muted-foreground">
                {autoScaling.lastScaleAction.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Node Management */}
      <Tabs value={selectedRegion} onValueChange={setSelectedRegion} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Regions</TabsTrigger>
            {regions.map(region => (
              <TabsTrigger key={region} value={region}>
                {region.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredNodes.map((node) => (
            <Card key={node.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{node.id}</CardTitle>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(node.status)}
                    <Badge variant={getStatusColor(node.status)}>
                      {node.status}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {node.region}-{node.zone} • Uptime: {node.uptime}%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Load</span>
                      <span>{node.load}/{node.maxCapacity}</span>
                    </div>
                    <Progress value={(node.load / node.maxCapacity) * 100} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory</span>
                      <span>{node.memoryUsage}%</span>
                    </div>
                    <Progress value={node.memoryUsage} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU</span>
                      <span>{node.cpuUsage}%</span>
                    </div>
                    <Progress value={node.cpuUsage} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Response Time</span>
                    <div className="font-medium">{node.responseTime}ms</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost/Hour</span>
                    <div className="font-medium">${node.cost.toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestartNode(node.id)}
                    disabled={node.status === 'maintenance'}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Restart
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScaleNode(node.id, 'up')}
                    disabled={node.status !== 'healthy'}
                  >
                    Scale Up
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Last check: {node.lastHealthCheck.toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
