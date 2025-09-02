'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Bell, Mail, MessageSquare, Phone, Slack,
  AlertTriangle, CheckCircle, Clock, Settings,
  Zap, Shield, TrendingUp, Users, Activity
} from 'lucide-react';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  channels: NotificationChannel[];
  escalation: EscalationRule[];
  cooldown: number; // minutes
  lastTriggered?: Date;
  triggerCount: number;
  falsePositiveRate: number;
}

interface NotificationChannel {
  id: string;
  type: 'email' | 'sms' | 'slack' | 'webhook' | 'push';
  name: string;
  config: any;
  enabled: boolean;
  deliveryRate: number;
  avgDeliveryTime: number; // seconds
}

interface EscalationRule {
  level: number;
  delay: number; // minutes
  channels: string[];
  recipients: string[];
  autoResolve: boolean;
}

interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  message: string;
  context: Record<string, any>;
  acknowledgedBy?: string;
  resolvedBy?: string;
  escalationLevel: number;
  channels: string[];
  deliveryStatus: Record<string, 'pending' | 'delivered' | 'failed'>;
}

interface AlertStats {
  totalRules: number;
  activeAlerts: number;
  resolvedToday: number;
  avgResponseTime: number;
  deliverySuccessRate: number;
  falsePositiveRate: number;
}

export default function AlertingSystem() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);
  const [stats, setStats] = useState<AlertStats>({
    totalRules: 0,
    activeAlerts: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    deliverySuccessRate: 0,
    falsePositiveRate: 0
  });
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    initializeAlertingData();

    if (realTimeEnabled) {
      const interval = setInterval(simulateRealTimeAlerts, 15000);
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const initializeAlertingData = () => {
    // Initialize notification channels
    const mockChannels: NotificationChannel[] = [
      {
        id: 'email-primary',
        type: 'email',
        name: 'Primary Email',
        config: { recipients: ['admin@acme.com', 'ops@acme.com'] },
        enabled: true,
        deliveryRate: 98.5,
        avgDeliveryTime: 3.2
      },
      {
        id: 'slack-ops',
        type: 'slack',
        name: 'Ops Team Slack',
        config: { webhook: 'https://hooks.slack.com/...', channel: '#ops-alerts' },
        enabled: true,
        deliveryRate: 99.1,
        avgDeliveryTime: 1.8
      },
      {
        id: 'sms-oncall',
        type: 'sms',
        name: 'On-call SMS',
        config: { numbers: ['+1234567890', '+1987654321'] },
        enabled: true,
        deliveryRate: 97.8,
        avgDeliveryTime: 2.5
      },
      {
        id: 'webhook-pagerduty',
        type: 'webhook',
        name: 'PagerDuty Integration',
        config: { url: 'https://events.pagerduty.com/v2/enqueue', apiKey: 'xxx' },
        enabled: true,
        deliveryRate: 99.9,
        avgDeliveryTime: 0.8
      },
      {
        id: 'push-mobile',
        type: 'push',
        name: 'Mobile Push',
        config: { appId: 'datavault-pro' },
        enabled: false,
        deliveryRate: 94.2,
        avgDeliveryTime: 1.2
      }
    ];
    setChannels(mockChannels);

    // Initialize alert rules
    const mockRules: AlertRule[] = [
      {
        id: 'cpu-high',
        name: 'High CPU Usage',
        description: 'Alert when CPU usage exceeds 80% for more than 5 minutes',
        condition: 'cpu_usage > 80',
        threshold: 80,
        severity: 'high',
        enabled: true,
        channels: mockChannels.filter(c => ['email-primary', 'slack-ops'].includes(c.id)),
        escalation: [
          {
            level: 1,
            delay: 5,
            channels: ['email-primary', 'slack-ops'],
            recipients: ['ops-team'],
            autoResolve: false
          },
          {
            level: 2,
            delay: 15,
            channels: ['sms-oncall', 'webhook-pagerduty'],
            recipients: ['on-call-engineer'],
            autoResolve: false
          }
        ],
        cooldown: 30,
        triggerCount: 23,
        falsePositiveRate: 8.7
      },
      {
        id: 'error-rate-spike',
        name: 'Error Rate Spike',
        description: 'Alert when error rate increases by 50% compared to baseline',
        condition: 'error_rate > baseline * 1.5',
        threshold: 5,
        severity: 'critical',
        enabled: true,
        channels: mockChannels.filter(c => c.enabled),
        escalation: [
          {
            level: 1,
            delay: 2,
            channels: ['slack-ops', 'email-primary'],
            recipients: ['dev-team', 'ops-team'],
            autoResolve: false
          },
          {
            level: 2,
            delay: 5,
            channels: ['sms-oncall', 'webhook-pagerduty'],
            recipients: ['team-lead', 'on-call-engineer'],
            autoResolve: false
          }
        ],
        cooldown: 15,
        lastTriggered: new Date(Date.now() - 1000 * 60 * 45),
        triggerCount: 12,
        falsePositiveRate: 3.2
      },
      {
        id: 'proxy-pool-depleted',
        name: 'Proxy Pool Depleted',
        description: 'Alert when available proxy count drops below 10',
        condition: 'available_proxies < 10',
        threshold: 10,
        severity: 'high',
        enabled: true,
        channels: mockChannels.filter(c => ['email-primary', 'slack-ops', 'sms-oncall'].includes(c.id)),
        escalation: [
          {
            level: 1,
            delay: 1,
            channels: ['slack-ops'],
            recipients: ['proxy-team'],
            autoResolve: true
          },
          {
            level: 2,
            delay: 10,
            channels: ['email-primary', 'sms-oncall'],
            recipients: ['ops-team', 'on-call-engineer'],
            autoResolve: false
          }
        ],
        cooldown: 60,
        triggerCount: 8,
        falsePositiveRate: 12.5
      },
      {
        id: 'database-slow-query',
        name: 'Slow Database Queries',
        description: 'Alert when average query time exceeds 2 seconds',
        condition: 'avg_query_time > 2000',
        threshold: 2000,
        severity: 'medium',
        enabled: true,
        channels: mockChannels.filter(c => ['email-primary', 'slack-ops'].includes(c.id)),
        escalation: [
          {
            level: 1,
            delay: 10,
            channels: ['slack-ops'],
            recipients: ['db-team'],
            autoResolve: true
          }
        ],
        cooldown: 45,
        triggerCount: 15,
        falsePositiveRate: 15.3
      },
      {
        id: 'scraping-success-rate',
        name: 'Low Scraping Success Rate',
        description: 'Alert when scraping success rate drops below 90%',
        condition: 'scraping_success_rate < 90',
        threshold: 90,
        severity: 'medium',
        enabled: true,
        channels: mockChannels.filter(c => ['email-primary', 'slack-ops'].includes(c.id)),
        escalation: [
          {
            level: 1,
            delay: 15,
            channels: ['slack-ops'],
            recipients: ['scraping-team'],
            autoResolve: false
          },
          {
            level: 2,
            delay: 30,
            channels: ['email-primary'],
            recipients: ['ops-team'],
            autoResolve: false
          }
        ],
        cooldown: 60,
        triggerCount: 6,
        falsePositiveRate: 20.0
      }
    ];
    setAlertRules(mockRules);

    // Initialize recent alert events
    const mockEvents: AlertEvent[] = [
      {
        id: 'event-1',
        ruleId: 'error-rate-spike',
        ruleName: 'Error Rate Spike',
        timestamp: new Date(Date.now() - 1000 * 60 * 12),
        severity: 'critical',
        status: 'resolved',
        message: 'Error rate increased to 8.2% (baseline: 2.1%)',
        context: { errorRate: 8.2, baseline: 2.1, duration: '15 minutes' },
        acknowledgedBy: 'john.doe',
        resolvedBy: 'john.doe',
        escalationLevel: 1,
        channels: ['slack-ops', 'email-primary'],
        deliveryStatus: { 'slack-ops': 'delivered', 'email-primary': 'delivered' }
      },
      {
        id: 'event-2',
        ruleId: 'proxy-pool-depleted',
        ruleName: 'Proxy Pool Depleted',
        timestamp: new Date(Date.now() - 1000 * 60 * 8),
        severity: 'high',
        status: 'active',
        message: 'Available proxy count: 7 (threshold: 10)',
        context: { availableProxies: 7, threshold: 10 },
        escalationLevel: 1,
        channels: ['slack-ops'],
        deliveryStatus: { 'slack-ops': 'delivered' }
      },
      {
        id: 'event-3',
        ruleId: 'database-slow-query',
        ruleName: 'Slow Database Queries',
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
        severity: 'medium',
        status: 'acknowledged',
        message: 'Average query time: 2.4s (threshold: 2.0s)',
        context: { avgQueryTime: 2400, threshold: 2000 },
        acknowledgedBy: 'jane.smith',
        escalationLevel: 1,
        channels: ['slack-ops'],
        deliveryStatus: { 'slack-ops': 'delivered' }
      }
    ];
    setAlertEvents(mockEvents);

    // Calculate stats
    setStats({
      totalRules: mockRules.length,
      activeAlerts: mockEvents.filter(e => e.status === 'active').length,
      resolvedToday: mockEvents.filter(e => e.status === 'resolved' &&
        e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
      avgResponseTime: 4.2,
      deliverySuccessRate: 98.7,
      falsePositiveRate: 11.2
    });
  };

  const simulateRealTimeAlerts = () => {
    // Simulate new alert events
    if (Math.random() < 0.3) { // 30% chance of new alert
      const rules = alertRules.filter(r => r.enabled);
      if (rules.length > 0) {
        const randomRule = rules[Math.floor(Math.random() * rules.length)];
        const newEvent: AlertEvent = {
          id: `event-${Date.now()}`,
          ruleId: randomRule.id,
          ruleName: randomRule.name,
          timestamp: new Date(),
          severity: randomRule.severity,
          status: 'active',
          message: `${randomRule.name} triggered - threshold exceeded`,
          context: { threshold: randomRule.threshold },
          escalationLevel: 1,
          channels: randomRule.channels.map(c => c.id),
          deliveryStatus: randomRule.channels.reduce((acc, c) => {
            acc[c.id] = Math.random() > 0.05 ? 'delivered' : 'failed';
            return acc;
          }, {} as Record<string, 'pending' | 'delivered' | 'failed'>)
        };

        setAlertEvents(prev => [newEvent, ...prev.slice(0, 9)]);
        setStats(prev => ({ ...prev, activeAlerts: prev.activeAlerts + 1 }));
      }
    }

    // Simulate alert resolutions
    setAlertEvents(prev => prev.map(event => {
      if (event.status === 'active' && Math.random() < 0.1) { // 10% chance to resolve
        return {
          ...event,
          status: 'resolved',
          resolvedBy: 'auto-resolver'
        };
      }
      return event;
    }));
  };

  const toggleRule = (ruleId: string) => {
    setAlertRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const toggleChannel = (channelId: string) => {
    setChannels(prev => prev.map(channel =>
      channel.id === channelId ? { ...channel, enabled: !channel.enabled } : channel
    ));
  };

  const acknowledgeAlert = (eventId: string) => {
    setAlertEvents(prev => prev.map(event =>
      event.id === eventId ? { ...event, status: 'acknowledged', acknowledgedBy: 'current-user' } : event
    ));
  };

  const resolveAlert = (eventId: string) => {
    setAlertEvents(prev => prev.map(event =>
      event.id === eventId ? { ...event, status: 'resolved', resolvedBy: 'current-user' } : event
    ));
    setStats(prev => ({ ...prev, activeAlerts: Math.max(0, prev.activeAlerts - 1) }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-50';
      case 'acknowledged': return 'text-yellow-600 bg-yellow-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'escalated': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <Phone className="w-4 h-4" />;
      case 'slack': return <MessageSquare className="w-4 h-4" />;
      case 'webhook': return <Zap className="w-4 h-4" />;
      case 'push': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerting & Notifications</h1>
          <p className="text-muted-foreground">
            Real-time monitoring with intelligent escalation and multi-channel delivery
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={realTimeEnabled ? "default" : "secondary"} className="flex items-center space-x-1">
            <Activity className={`w-3 h-3 ${realTimeEnabled ? 'animate-pulse' : ''}`} />
            <span>{realTimeEnabled ? 'Real-time' : 'Paused'}</span>
          </Badge>
          <Button
            variant="outline"
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            {realTimeEnabled ? 'Pause' : 'Start'} Monitoring
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRules}</div>
            <div className="text-sm text-muted-foreground">
              {alertRules.filter(r => r.enabled).length} enabled
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.activeAlerts}</div>
            <div className="text-sm text-muted-foreground">Requiring attention</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolvedToday}</div>
            <div className="text-sm text-muted-foreground">Successfully handled</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}m</div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              -18% this week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliverySuccessRate}%</div>
            <div className="text-sm text-muted-foreground">Across all channels</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">False Positive Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.falsePositiveRate}%</div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              -5% this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Active Alerts</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="escalation">Escalation</TabsTrigger>
        </TabsList>

        {/* Active Alerts */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Alert Events</CardTitle>
              <CardDescription>
                Real-time alert monitoring and management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                        <span className="font-medium">{event.ruleName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {event.timestamp.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          L{event.escalationLevel}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm">{event.message}</div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-muted-foreground">Channels:</span>
                          {event.channels.map(channelId => {
                            const channel = channels.find(c => c.id === channelId);
                            if (!channel) return null;
                            return (
                              <div key={channelId} className="flex items-center space-x-1">
                                {getChannelIcon(channel.type)}
                                <Badge
                                  variant={event.deliveryStatus[channelId] === 'delivered' ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {event.deliveryStatus[channelId]}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                        {event.acknowledgedBy && (
                          <div className="text-xs text-muted-foreground">
                            Acked by: {event.acknowledgedBy}
                          </div>
                        )}
                        {event.resolvedBy && (
                          <div className="text-xs text-muted-foreground">
                            Resolved by: {event.resolvedBy}
                          </div>
                        )}
                      </div>

                      {event.status === 'active' && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(event.id)}
                          >
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => resolveAlert(event.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Rules */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alert Rules Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-sm text-muted-foreground">{rule.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-1 rounded">{rule.condition}</code>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {rule.channels.map(channel => (
                              <div key={channel.id} className="flex items-center">
                                {getChannelIcon(channel.type)}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs">Triggered: {rule.triggerCount}x</div>
                            <div className="text-xs">False +: {rule.falsePositiveRate}%</div>
                            {rule.lastTriggered && (
                              <div className="text-xs text-muted-foreground">
                                Last: {rule.lastTriggered.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={() => toggleRule(rule.id)}
                            />
                            <span className="text-sm">
                              {rule.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm">
                              <Settings className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              Test
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Channels */}
        <TabsContent value="channels" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel) => (
              <Card key={channel.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center space-x-2">
                      {getChannelIcon(channel.type)}
                      <span>{channel.name}</span>
                    </CardTitle>
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={() => toggleChannel(channel.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Delivery Rate</span>
                      <span className="font-medium">{channel.deliveryRate}%</span>
                    </div>
                    <Progress value={channel.deliveryRate} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg Delivery Time</span>
                      <span className="font-medium">{channel.avgDeliveryTime}s</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Type: {channel.type.toUpperCase()}
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3 mr-1" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Escalation Management */}
        <TabsContent value="escalation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Escalation Rules</CardTitle>
              <CardDescription>
                Configure automatic escalation paths for unresolved alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {alertRules.filter(rule => rule.escalation.length > 0).map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="mb-4">
                      <h3 className="font-medium">{rule.name}</h3>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </div>

                    <div className="space-y-3">
                      {rule.escalation.map((escalation, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <Badge>Level {escalation.level}</Badge>
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{escalation.delay}m delay</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{escalation.recipients.join(', ')}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            {escalation.channels.map(channelId => {
                              const channel = channels.find(c => c.id === channelId);
                              return channel ? getChannelIcon(channel.type) : null;
                            })}
                          </div>

                          {escalation.autoResolve && (
                            <Badge variant="secondary">Auto-resolve</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
