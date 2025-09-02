'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Clock, Server, Shield, Database, Activity } from 'lucide-react';

interface SystemHealth {
  status: string;
  timestamp: string;
  environment: string;
  domain: string;
  components: {
    monitoring?: any;
    ssl?: any;
    backup?: any;
    external?: any;
  };
}

interface SSLCertificate {
  domain: string;
  status: 'valid' | 'expiring' | 'expired' | 'invalid';
  validTo: string;
  issuer: string;
  autoRenewal: boolean;
}

interface BackupJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  strategy: { type: string; schedule: string };
  size?: number;
  endTime?: string;
}

export default function EnterpriseProductionDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [sslCertificates, setSslCertificates] = useState<SSLCertificate[]>([]);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch system health
      const healthResponse = await fetch('/api/infrastructure/production?endpoint=health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setSystemHealth(healthData);
      }

      // Fetch SSL certificates
      const sslResponse = await fetch('/api/infrastructure/ssl');
      if (sslResponse.ok) {
        const sslData = await sslResponse.json();
        setSslCertificates(sslData.certificates || []);
      }

      // Fetch backup jobs
      const backupResponse = await fetch('/api/infrastructure/backup?endpoint=jobs');
      if (backupResponse.ok) {
        const backupData = await backupResponse.json();
        setBackupJobs(backupData.jobs || []);
      }

      // Fetch metrics
      const metricsResponse = await fetch('/api/infrastructure/production?endpoint=metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
      case 'valid':
      case 'completed':
        return 'text-green-600';
      case 'warning':
      case 'expiring':
        return 'text-yellow-600';
      case 'critical':
      case 'expired':
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
      case 'valid':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
      case 'expiring':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
      case 'expired':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const executeAction = async (action: string, data?: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/infrastructure/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });

      if (response.ok) {
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !systemHealth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Production Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your production infrastructure
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => fetchDashboardData()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            onClick={() => executeAction('health-check')}
          >
            Health Check
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(systemHealth?.status || 'unknown')}
              <div className="text-2xl font-bold capitalize">
                {systemHealth?.status || 'Unknown'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Environment: {systemHealth?.environment}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SSL Certificates</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sslCertificates.filter(cert => cert.status === 'valid').length}/{sslCertificates.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {sslCertificates.filter(cert => cert.status === 'expiring').length} expiring soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupJobs.filter(job => job.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful backups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${Math.floor(metrics.uptime / 3600)}h` : '0h'}
            </div>
            <p className="text-xs text-muted-foreground">
              Since last restart
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ssl">SSL Certificates</TabsTrigger>
          <TabsTrigger value="backup">Backup & DR</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall system component status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemHealth?.components && Object.entries(systemHealth.components).map(([component, status]) => (
                  <div key={component} className="flex items-center justify-between">
                    <span className="capitalize font-medium">{component}</span>
                    <div className="flex items-center space-x-2">
                      {status ? (
                        <Badge variant="secondary" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Healthy
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Issues
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>Real-time performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span>{(metrics.memory.rss / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Heap Usage</span>
                        <span>{(metrics.memory.heapUsed / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(metrics.timestamp).toLocaleString()}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ssl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SSL Certificates</CardTitle>
              <CardDescription>Manage and monitor SSL certificate status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sslCertificates.map((cert) => (
                  <div key={cert.domain} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{cert.domain}</div>
                      <div className="text-sm text-muted-foreground">
                        Expires: {new Date(cert.validTo).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Issuer: {cert.issuer}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={cert.status === 'valid' ? 'secondary' : cert.status === 'expiring' ? 'outline' : 'destructive'}
                        className={getStatusColor(cert.status)}
                      >
                        {cert.status}
                      </Badge>
                      {cert.autoRenewal && (
                        <Badge variant="outline" className="text-xs">
                          Auto-renew
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Backup Jobs</CardTitle>
                <CardDescription>Latest backup operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backupJobs.slice(-5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{job.id}</div>
                        <div className="text-xs text-muted-foreground">
                          {job.strategy.type} backup
                        </div>
                        {job.endTime && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(job.endTime).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(job.status)}
                        <Badge variant={job.status === 'completed' ? 'secondary' : job.status === 'running' ? 'outline' : 'destructive'}>
                          {job.status}
                        </Badge>
                        {job.size && (
                          <span className="text-xs text-muted-foreground">
                            {(job.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executeAction('create-backup', { strategy: 'manual' })}
                  >
                    Create Manual Backup
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disaster Recovery</CardTitle>
                <CardDescription>DR configuration and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>RPO (Recovery Point Objective)</span>
                    <span className="font-medium">1 hour</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>RTO (Recovery Time Objective)</span>
                    <span className="font-medium">4 hours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Auto Failover</span>
                    <Badge variant="outline">Disabled</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    Test Failover Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External Monitoring</CardTitle>
              <CardDescription>Integration status with external monitoring services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Grafana</span>
                    <Badge variant="outline">Configured</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dashboard and metrics visualization
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">DataDog</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    APM and infrastructure monitoring
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Prometheus</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Metrics collection and alerting
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeAction('send-test-alert')}
                >
                  Send Test Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Status</CardTitle>
              <CardDescription>Security configuration and compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Encryption</h4>
                    <div className="text-sm text-muted-foreground">
                      <div>Algorithm: AES-256-GCM</div>
                      <div>Key Rotation: Enabled (90 days)</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Authentication</h4>
                    <div className="text-sm text-muted-foreground">
                      <div>MFA: Required</div>
                      <div>Session Timeout: 8 hours</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Compliance</h4>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">GDPR</Badge>
                    <Badge variant="secondary">SOC2</Badge>
                    <Badge variant="outline">HIPAA (Available)</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastUpdate.toLocaleString()} •
        DataVault Pro Enterprise Production Dashboard v1.0
      </div>
    </div>
  );
}
