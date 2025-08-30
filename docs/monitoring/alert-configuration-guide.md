# Alert Configuration Guide

## Overview

This guide provides detailed instructions for configuring intelligent alerts in the TechFlow monitoring system. Learn how to set up effective alerting rules, manage notification channels, and implement escalation policies.

## Table of Contents

1. [Alert Types](#alert-types)
2. [Configuration Examples](#configuration-examples)
3. [Notification Channels](#notification-channels)
4. [Escalation Policies](#escalation-policies)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Alert Types

### 1. Performance Alerts

Monitor system performance and user experience metrics.

#### Response Time Alerts
```typescript
const responseTimeAlert = {
  id: 'high-response-time',
  name: 'High Response Time Detected',
  description: 'Browser response time exceeds acceptable limits',
  metric: 'browser_farm.response_time.p95',
  conditions: [
    {
      operator: 'greater_than',
      threshold: 2000,  // 2 seconds
      duration: '5m',   // sustained for 5 minutes
      severity: 'warning'
    },
    {
      operator: 'greater_than',
      threshold: 3000,  // 3 seconds
      duration: '2m',   // sustained for 2 minutes
      severity: 'critical'
    }
  ],
  actions: {
    warning: ['email:devops', 'slack:alerts'],
    critical: ['email:oncall', 'slack:critical', 'webhook:pagerduty']
  },
  suppressionWindow: '15m',
  autoResolve: true
};
```

#### Error Rate Alerts
```typescript
const errorRateAlert = {
  id: 'high-error-rate',
  name: 'Elevated Error Rate',
  description: 'Scraping error rate is above normal thresholds',
  metric: 'scraping.error_rate',
  conditions: [
    {
      operator: 'greater_than',
      threshold: 2,     // 2%
      duration: '3m',
      severity: 'warning'
    },
    {
      operator: 'greater_than',
      threshold: 5,     // 5%
      duration: '1m',
      severity: 'critical'
    }
  ],
  actions: {
    warning: ['email:team', 'slack:alerts'],
    critical: ['email:oncall', 'sms:oncall', 'webhook:incident']
  },
  metadata: {
    runbook: 'https://docs.company.com/runbooks/high-error-rate',
    dashboard: '/dashboard/performance'
  }
};
```

### 2. Infrastructure Alerts

Monitor hardware and system resources.

#### Node Health Alerts
```typescript
const nodeHealthAlert = {
  id: 'node-unhealthy',
  name: 'Browser Node Unhealthy',
  description: 'Browser farm node is experiencing health issues',
  metric: 'browser_farm.node.health_score',
  conditions: [
    {
      operator: 'less_than',
      threshold: 0.8,   // 80% health score
      duration: '2m',
      severity: 'warning'
    },
    {
      operator: 'less_than',
      threshold: 0.5,   // 50% health score
      duration: '1m',
      severity: 'critical'
    }
  ],
  groupBy: ['node_id', 'region'],
  actions: {
    warning: ['email:sre', 'slack:infrastructure'],
    critical: ['email:oncall', 'webhook:auto-remediation']
  },
  autoActions: {
    critical: ['restart_node', 'redistribute_load']
  }
};
```

#### Resource Utilization Alerts
```typescript
const resourceAlert = {
  id: 'high-resource-usage',
  name: 'High Resource Utilization',
  description: 'System resources are approaching limits',
  conditions: [
    // CPU Alert
    {
      metric: 'system.cpu.usage',
      operator: 'greater_than',
      threshold: 80,
      duration: '10m',
      severity: 'warning',
      actions: ['email:devops']
    },
    // Memory Alert
    {
      metric: 'system.memory.usage',
      operator: 'greater_than',
      threshold: 85,
      duration: '5m',
      severity: 'warning',
      actions: ['email:devops', 'slack:alerts']
    },
    // Critical Combined Alert
    {
      metric: 'system.cpu.usage',
      operator: 'greater_than',
      threshold: 90,
      duration: '5m',
      severity: 'critical',
      condition: 'AND',
      additionalMetrics: [
        {
          metric: 'system.memory.usage',
          operator: 'greater_than',
          threshold: 90
        }
      ],
      actions: ['email:oncall', 'webhook:auto-scale']
    }
  ]
};
```

### 3. Business Alerts

Monitor business-critical metrics and SLA compliance.

#### SLA Violation Alert
```typescript
const slaAlert = {
  id: 'sla-violation',
  name: 'SLA Threshold Breach',
  description: 'Service level agreement metrics below required levels',
  metric: 'sla.availability',
  conditions: [
    {
      operator: 'less_than',
      threshold: 99.5,  // 99.5% availability
      duration: '5m',
      severity: 'critical'
    }
  ],
  actions: {
    critical: [
      'email:management',
      'slack:executives',
      'webhook:incident-bridge'
    ]
  },
  escalation: {
    after: '15m',
    to: 'management-team',
    actions: ['email:ceo', 'sms:cto']
  }
};
```

#### Cost Alert
```typescript
const costAlert = {
  id: 'budget-exceeded',
  name: 'Budget Threshold Exceeded',
  description: 'Infrastructure costs are exceeding budget limits',
  metric: 'cost.daily_spend',
  conditions: [
    {
      operator: 'greater_than',
      threshold: 500,   // $500 daily
      duration: '1m',
      severity: 'warning'
    },
    {
      operator: 'greater_than',
      threshold: 1000,  // $1000 daily
      duration: '1m',
      severity: 'critical'
    }
  ],
  actions: {
    warning: ['email:finance', 'slack:cost-alerts'],
    critical: ['email:cfo', 'webhook:cost-optimization']
  },
  autoActions: {
    warning: ['send_cost_report'],
    critical: ['pause_non_critical_tasks', 'scale_down_dev_env']
  }
};
```

### 4. Predictive Alerts

AI-powered alerts based on trends and anomaly detection.

#### Anomaly Detection Alert
```typescript
const anomalyAlert = {
  id: 'anomaly-detected',
  name: 'Performance Anomaly Detected',
  description: 'ML model detected unusual performance patterns',
  type: 'ml_anomaly',
  model: 'isolation_forest',
  metric: 'browser_farm.response_time',
  conditions: [
    {
      anomalyScore: 0.8,  // 80% anomaly confidence
      duration: '3m',
      severity: 'warning'
    },
    {
      anomalyScore: 0.95, // 95% anomaly confidence
      duration: '1m',
      severity: 'critical'
    }
  ],
  actions: {
    warning: ['email:ml-team', 'slack:anomaly-detection'],
    critical: ['email:oncall', 'webhook:investigation']
  },
  metadata: {
    modelVersion: '1.2.3',
    trainingPeriod: '30d',
    features: ['response_time', 'error_rate', 'throughput']
  }
};
```

## Configuration Examples

### Environment-based Configuration

#### Production Environment
```yaml
# config/alerts/production.yml
alerts:
  response_time:
    warning_threshold: 1500ms
    critical_threshold: 2500ms
    duration: 5m

  error_rate:
    warning_threshold: 1%
    critical_threshold: 3%
    duration: 3m

  availability:
    warning_threshold: 99.8%
    critical_threshold: 99.5%
    duration: 5m

channels:
  email:
    primary: alerts@company.com
    oncall: oncall@company.com

  slack:
    alerts: "#alerts"
    critical: "#critical-alerts"

  pagerduty:
    service_key: "your-service-key"
```

#### Development Environment
```yaml
# config/alerts/development.yml
alerts:
  response_time:
    warning_threshold: 3000ms
    critical_threshold: 5000ms
    duration: 10m

  error_rate:
    warning_threshold: 5%
    critical_threshold: 10%
    duration: 5m

channels:
  email:
    primary: dev-team@company.com

  slack:
    alerts: "#dev-alerts"
```

### Team-based Alert Routing

```typescript
const teamRouting = {
  teams: {
    frontend: {
      alerts: ['ui_errors', 'client_performance'],
      channels: ['email:frontend-team', 'slack:frontend']
    },
    backend: {
      alerts: ['api_errors', 'database_issues'],
      channels: ['email:backend-team', 'slack:backend']
    },
    infrastructure: {
      alerts: ['node_health', 'resource_usage'],
      channels: ['email:sre-team', 'slack:infrastructure']
    },
    oncall: {
      alerts: ['critical_*'],
      channels: ['email:oncall', 'sms:oncall', 'webhook:pagerduty']
    }
  }
};
```

## Notification Channels

### Email Configuration

```typescript
const emailChannel = {
  type: 'email',
  provider: 'sendgrid',
  config: {
    apiKey: process.env.SENDGRID_API_KEY,
    from: 'alerts@datavault.pro',
    templates: {
      warning: {
        subject: '⚠️  Warning: {{alert.name}}',
        template: 'warning-alert-template'
      },
      critical: {
        subject: '🚨 Critical: {{alert.name}}',
        template: 'critical-alert-template'
      }
    }
  },
  recipients: {
    'devops': ['devops@company.com'],
    'oncall': ['oncall@company.com'],
    'management': ['cto@company.com', 'manager@company.com']
  }
};
```

### Slack Configuration

```typescript
const slackChannel = {
  type: 'slack',
  config: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    botToken: process.env.SLACK_BOT_TOKEN
  },
  channels: {
    'alerts': '#general-alerts',
    'critical': '#critical-alerts',
    'infrastructure': '#infrastructure'
  },
  formatting: {
    warning: {
      color: 'warning',
      icon: ':warning:',
      mentions: []
    },
    critical: {
      color: 'danger',
      icon: ':rotating_light:',
      mentions: ['@channel', '@oncall-team']
    }
  }
};
```

### Webhook Configuration

```typescript
const webhookChannel = {
  type: 'webhook',
  endpoints: [
    {
      name: 'pagerduty',
      url: 'https://events.pagerduty.com/v2/enqueue',
      headers: {
        'Authorization': 'Token token={{PAGERDUTY_TOKEN}}',
        'Content-Type': 'application/json'
      },
      payload: {
        routing_key: '{{ROUTING_KEY}}',
        event_action: 'trigger',
        dedup_key: '{{alert.id}}',
        payload: {
          summary: '{{alert.name}}',
          severity: '{{alert.severity}}',
          source: 'DataVault Pro',
          custom_details: '{{alert.metadata}}'
        }
      }
    }
  ]
};
```

## Escalation Policies

### Time-based Escalation

```typescript
const escalationPolicy = {
  id: 'standard-escalation',
  name: 'Standard Escalation Policy',
  rules: [
    {
      level: 1,
      delay: '0m',
      targets: ['oncall-primary'],
      channels: ['email', 'slack']
    },
    {
      level: 2,
      delay: '15m',
      targets: ['oncall-secondary'],
      channels: ['email', 'sms', 'slack'],
      condition: 'not_acknowledged'
    },
    {
      level: 3,
      delay: '30m',
      targets: ['manager'],
      channels: ['email', 'phone'],
      condition: 'not_resolved'
    },
    {
      level: 4,
      delay: '45m',
      targets: ['executive'],
      channels: ['email', 'phone'],
      condition: 'still_critical'
    }
  ]
};
```

### Severity-based Escalation

```typescript
const severityEscalation = {
  critical: {
    immediate: ['oncall-primary', 'oncall-secondary'],
    after_5m: ['team-lead'],
    after_15m: ['manager'],
    after_30m: ['director']
  },
  warning: {
    immediate: ['team-primary'],
    after_30m: ['team-lead'],
    after_2h: ['manager']
  },
  info: {
    immediate: ['team-primary']
  }
};
```

## Best Practices

### 1. Alert Design Principles

#### Actionable Alerts
- Every alert should have a clear action
- Include runbook links in alert metadata
- Provide context about the problem

```typescript
const actionableAlert = {
  name: 'High Memory Usage',
  description: 'Node memory usage exceeds 85%',
  severity: 'warning',
  actions: ['email:devops'],
  metadata: {
    runbook: 'https://docs.company.com/runbooks/memory-issues',
    possibleCauses: [
      'Memory leak in scraping processes',
      'Increased scraping load',
      'Browser instances not being cleaned up'
    ],
    immediateActions: [
      'Check browser process count',
      'Review memory usage trends',
      'Consider restarting affected node'
    ]
  }
};
```

#### Avoid Alert Fatigue
- Use suppression windows
- Aggregate similar alerts
- Set appropriate thresholds

```typescript
const suppressionConfig = {
  window: '15m',           // Don't repeat alerts for 15 minutes
  maxAlerts: 3,            // Maximum 3 alerts per window
  aggregation: {
    enabled: true,
    groupBy: ['alert_type', 'node_id'],
    summary: 'Multiple {{alert_type}} alerts from {{node_id}}'
  }
};
```

### 2. Threshold Management

#### Dynamic Thresholds
```typescript
const dynamicThresholds = {
  metric: 'response_time',
  baselineWindow: '7d',     // Use 7-day baseline
  thresholds: {
    warning: 'baseline + 2 * stddev',
    critical: 'baseline + 3 * stddev'
  },
  minimumThreshold: 1000,   // Never go below 1 second
  maximumThreshold: 5000    // Never go above 5 seconds
};
```

#### Time-based Thresholds
```typescript
const timeBasedThresholds = {
  metric: 'error_rate',
  schedules: {
    business_hours: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      hours: '09:00-17:00',
      timezone: 'UTC',
      thresholds: {
        warning: 1,
        critical: 3
      }
    },
    off_hours: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      hours: '17:00-09:00',
      timezone: 'UTC',
      thresholds: {
        warning: 2,
        critical: 5
      }
    },
    weekends: {
      days: ['saturday', 'sunday'],
      thresholds: {
        warning: 3,
        critical: 7
      }
    }
  }
};
```

### 3. Testing Alerts

#### Alert Testing Framework
```bash
# Test alert configuration
npm run test:alerts

# Test specific alert
npm run test:alert -- --name "high-response-time"

# Simulate alert conditions
npm run simulate:alert -- --metric "response_time" --value 3000

# Test notification channels
npm run test:notifications -- --channel slack --severity critical
```

#### Testing Checklist
- [ ] Alert triggers at correct threshold
- [ ] Notifications are sent to correct channels
- [ ] Alert escalation works as expected
- [ ] Auto-resolution works when condition clears
- [ ] Suppression window prevents spam
- [ ] Metadata includes all necessary information

## Troubleshooting

### Common Issues

#### 1. Alerts Not Triggering
```bash
# Check metric availability
curl -X GET "/api/monitoring/metrics/response_time"

# Verify alert configuration
curl -X GET "/api/monitoring/alerts/high-response-time"

# Check alert evaluation logs
tail -f /var/log/monitoring/alert-evaluation.log
```

#### 2. Missing Notifications
```bash
# Test notification channels
curl -X POST "/api/monitoring/test-notification" \
  -H "Content-Type: application/json" \
  -d '{"channel": "slack", "message": "Test alert"}'

# Check notification delivery logs
grep "notification_sent" /var/log/monitoring/notifications.log
```

#### 3. False Positive Alerts
- Review alert thresholds
- Check for external dependencies
- Implement better suppression rules
- Use anomaly detection for dynamic thresholds

### Debugging Tools

#### Alert Simulation
```typescript
// Simulate alert condition
const simulator = new AlertSimulator();
await simulator.triggerCondition('high-response-time', {
  metric: 'response_time',
  value: 3000,
  duration: '5m'
});
```

#### Notification Testing
```typescript
// Test notification delivery
const notificationTest = new NotificationTester();
await notificationTest.send({
  channel: 'slack',
  severity: 'critical',
  message: 'Test critical alert'
});
```

## Advanced Configuration

### Custom Metrics
```typescript
const customMetric = {
  name: 'business_conversion_rate',
  type: 'gauge',
  description: 'Rate of successful data extractions',
  calculation: {
    numerator: 'successful_extractions',
    denominator: 'total_extraction_attempts',
    window: '5m'
  },
  alerts: [
    {
      threshold: 0.8,  // 80% success rate
      severity: 'warning',
      duration: '10m'
    }
  ]
};
```

### Multi-dimensional Alerts
```typescript
const multiDimensionalAlert = {
  name: 'Regional Performance Degradation',
  metric: 'response_time',
  groupBy: ['region', 'node_type'],
  conditions: [
    {
      // Alert if any region has high response time
      aggregation: 'max',
      threshold: 2000,
      scope: 'region'
    },
    {
      // Alert if average across all regions is high
      aggregation: 'avg',
      threshold: 1500,
      scope: 'global'
    }
  ]
};
```

---

*For additional support, please refer to the [monitoring documentation](./README.md) or contact the monitoring team.*
