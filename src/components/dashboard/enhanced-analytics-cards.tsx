"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  LucideActivity,
  LucideBarChart3,
  LucideDatabase,
  LucideGlobe,
  LucideZap,
  LucideShield,
  LucideClock,
  LucideTrendingUp,
  LucideTrendingDown,
  LucideAlertTriangle,
  LucideCheckCircle2,
  LucideWifi,
  LucideDollarSign,
  LucideTarget,
  LucideServer,
  LucideTimer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  scheduledJobs: number;
  totalDataPoints: number;
  monthlyUsage: number;
  monthlyLimit: number;
  monthlyDataPoints: number;
  storageUsed: number;
  estimatedCost: number;
  avgExecutionTime: number;
  successRate: number;
  realtimeMetrics?: {
    activeBrowsers: number;
    proxyHealthScore: number;
    avgResponseTime: number;
    queuedJobs: number;
    resourceUtilization: number;
    costPerHour: number;
    dataProcessingRate: number;
    errorRate: number;
  };
}

interface EnhancedAnalyticsCardsProps {
  stats: DashboardStats | null;
  organization?: {
    name: string;
    plan: string;
  };
}

export function EnhancedAnalyticsCards({ stats, organization }: EnhancedAnalyticsCardsProps) {
  const usagePercentage = stats ? Math.round((stats.monthlyUsage / stats.monthlyLimit) * 100) : 0;
  const storageGB = stats ? (stats.storageUsed / (1024 * 1024 * 1024)).toFixed(2) : '0.00';
  const realtime = stats?.realtimeMetrics;

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'text-emerald-600';
    if (percentage < 80) return 'text-amber-600';
    return 'text-red-600';
  };

  const getUsageGradient = (percentage: number) => {
    if (percentage < 50) return 'from-emerald-500 to-teal-500';
    if (percentage < 80) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = "blue",
    trend,
    progress,
    badges = []
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: string;
    trend?: { value: number; direction: 'up' | 'down' };
    progress?: number;
    badges?: Array<{ text: string; variant?: 'default' | 'secondary' | 'outline' | 'destructive' }>;
  }) => {
    const colorClasses = {
      blue: 'from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30',
      emerald: 'from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/30 dark:to-teal-950/30',
      amber: 'from-amber-50/70 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/30',
      purple: 'from-purple-50/70 to-violet-50/70 dark:from-purple-950/30 dark:to-violet-950/30',
      pink: 'from-pink-50/70 to-rose-50/70 dark:from-pink-950/30 dark:to-rose-950/30',
    };

    const iconColors = {
      blue: 'text-blue-600 bg-blue-500/10',
      emerald: 'text-emerald-600 bg-emerald-500/10',
      amber: 'text-amber-600 bg-amber-500/10',
      purple: 'text-purple-600 bg-purple-500/10',
      pink: 'text-pink-600 bg-pink-500/10',
    };

    return (
      <Card className={cn(
        "relative overflow-hidden border-0 bg-gradient-to-br transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
        colorClasses[color as keyof typeof colorClasses]
      )}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-current/5 to-transparent rounded-full blur-2xl" />
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", iconColors[color as keyof typeof iconColors])}>
                <Icon className="h-4 w-4" />
              </div>
              {title}
            </div>
            {trend && (
              <div className={cn(
                "flex items-center text-xs",
                trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
              )}>
                {trend.direction === 'up' ?
                  <LucideTrendingUp className="h-3 w-3 mr-1" /> :
                  <LucideTrendingDown className="h-3 w-3 mr-1" />
                }
                {Math.abs(trend.value)}%
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 space-y-3">
          <div className="text-3xl font-bold text-foreground">
            {typeof value === 'number' ? formatNumber(value) : value}
          </div>

          {subtitle && (
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          )}

          {progress !== undefined && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground">{progress}% of limit</div>
            </div>
          )}

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {badges.map((badge, index) => (
                <Badge key={index} variant={badge.variant || 'secondary'} className="text-xs">
                  {badge.text}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Organization Status Banner */}
      {organization && (
        <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200/50 dark:border-emerald-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <LucideShield className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                    {organization.name}
                  </h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    {organization.plan} Plan • All systems operational
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-300">
                <LucideCheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Jobs"
          value={stats?.totalJobs || 0}
          icon={LucideActivity}
          color="blue"
          trend={{ value: 12, direction: 'up' }}
          badges={[
            { text: `${stats?.runningJobs || 0} active`, variant: 'default' },
            { text: `${stats?.completedJobs || 0} completed`, variant: 'secondary' }
          ]}
        />

        <MetricCard
          title="Success Rate"
          value={`${stats?.successRate || 0}%`}
          icon={LucideTarget}
          color="emerald"
          subtitle="Last 30 days"
          trend={{ value: 5, direction: 'up' }}
        />

        <MetricCard
          title="Data Points"
          value={formatNumber(stats?.totalDataPoints || 0)}
          icon={LucideDatabase}
          color="purple"
          subtitle="Total extracted"
          trend={{ value: 23, direction: 'up' }}
        />

        <MetricCard
          title="Avg Response"
          value={`${stats?.avgExecutionTime || 0}s`}
          icon={LucideTimer}
          color="amber"
          subtitle="Execution time"
          trend={{ value: 8, direction: 'down' }}
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Monthly Usage"
          value={formatNumber(stats?.monthlyUsage || 0)}
          icon={LucideBarChart3}
          color="blue"
          progress={usagePercentage}
          subtitle={`${formatNumber(stats?.monthlyLimit || 0)} requests limit`}
        />

        <MetricCard
          title="Storage Used"
          value={`${storageGB} GB`}
          icon={LucideServer}
          color="purple"
          subtitle="Data storage"
        />

        <MetricCard
          title="Monthly Cost"
          value={`$${stats?.estimatedCost || 0}`}
          icon={LucideDollarSign}
          color="emerald"
          subtitle="Estimated this month"
          trend={{ value: 15, direction: 'down' }}
        />
      </div>

      {/* Real-time Metrics */}
      {realtime && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <LucideWifi className="h-5 w-5 text-emerald-500" />
            Real-time Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Active Browsers"
              value={realtime.activeBrowsers}
              icon={LucideGlobe}
              color="blue"
              subtitle="Currently running"
            />

            <MetricCard
              title="Proxy Health"
              value={`${realtime.proxyHealthScore}%`}
              icon={LucideShield}
              color="emerald"
              subtitle="Network status"
            />

            <MetricCard
              title="Queue Size"
              value={realtime.queuedJobs}
              icon={LucideClock}
              color="amber"
              subtitle="Pending jobs"
            />

            <MetricCard
              title="Error Rate"
              value={`${realtime.errorRate}%`}
              icon={LucideAlertTriangle}
              color={realtime.errorRate > 5 ? "pink" : "emerald"}
              subtitle="Last hour"
            />
          </div>
        </div>
      )}
    </div>
  );
}
