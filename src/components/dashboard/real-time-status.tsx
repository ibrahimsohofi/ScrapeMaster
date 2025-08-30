"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDashboardRealtime, useNotifications } from '@/hooks/use-realtime';
import {
  LucideWifi,
  LucideWifiOff,
  LucidePlay,
  LucidePause,
  LucideCheckCircle2,
  LucideAlertCircle,
  LucideClock,
  LucideX,
  LucideRefreshCw,
  LucideBell,
  LucideEye
} from 'lucide-react';

// Job status badge component
function JobStatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return { color: 'bg-blue-500', icon: LucidePlay, text: 'Running' };
      case 'completed':
        return { color: 'bg-green-500', icon: LucideCheckCircle2, text: 'Completed' };
      case 'failed':
        return { color: 'bg-red-500', icon: LucideAlertCircle, text: 'Failed' };
      case 'paused':
        return { color: 'bg-yellow-500', icon: LucidePause, text: 'Paused' };
      case 'pending':
        return { color: 'bg-gray-500', icon: LucideClock, text: 'Pending' };
      default:
        return { color: 'bg-gray-500', icon: LucideClock, text: status };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <Icon className="w-3 h-3" />
      {config.text}
    </Badge>
  );
}

// Job update item component
function JobUpdateItem({ job }: { job: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{job.scraperName}</h4>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="text-xs text-muted-foreground truncate mb-2">{job.scraperUrl}</p>

          {job.progress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{Math.round((job.progress.completed / job.progress.total) * 100)}%</span>
              </div>
              <Progress
                value={(job.progress.completed / job.progress.total) * 100}
                className="h-1"
              />
            </div>
          )}

          {job.error && (
            <Alert className="mt-2">
              <LucideAlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {job.error}
              </AlertDescription>
            </Alert>
          )}

          {expanded && job.result && (
            <div className="mt-2 p-2 bg-muted rounded text-xs">
              <div className="grid grid-cols-2 gap-2">
                {job.result.dataPoints && (
                  <div>
                    <span className="font-medium">Data Points:</span> {job.result.dataPoints}
                  </div>
                )}
                {job.result.duration && (
                  <div>
                    <span className="font-medium">Duration:</span> {job.result.duration}ms
                  </div>
                )}
                {job.result.pages && (
                  <div>
                    <span className="font-medium">Pages:</span> {job.result.pages}
                  </div>
                )}
                {job.result.size && (
                  <div>
                    <span className="font-medium">Size:</span> {job.result.size}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {job.result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 p-0"
            >
              <LucideEye className="h-3 w-3" />
            </Button>
          )}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(job.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Notification item component
function NotificationItem({ notification, onMarkAsRead }: {
  notification: any;
  onMarkAsRead: (id: string) => void;
}) {
  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'error':
        return { color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
      case 'warning':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
      case 'success':
        return { color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
      default:
        return { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
    }
  };

  const config = getLevelConfig(notification.level || 'info');

  return (
    <div className={`p-3 border rounded-lg ${config.bg} ${notification.read ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className={`font-medium text-sm ${config.color}`}>
            {notification.title || 'Notification'}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            {notification.message}
          </p>
          <span className="text-xs text-gray-500 mt-2 block">
            {new Date(notification.timestamp).toLocaleString()}
          </span>
        </div>
        {!notification.read && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkAsRead(notification.id)}
            className="h-6 w-6 p-0"
          >
            <LucideX className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Main real-time status component
export function RealTimeStatus() {
  const { isConnected: jobsConnected, error: jobsError, dashboardData } = useDashboardRealtime();
  const {
    isConnected: notifConnected,
    notifications,
    clearAll,
    markAsRead
  } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const connected = jobsConnected && notifConnected;
  const error = jobsError;

  // Get recent jobs (last 10)
  const recentJobs = (dashboardData.recentJobs || [])
    .sort((a: any, b: any) => b.timestamp - a.timestamp)
    .slice(0, 10);

  // Get unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connected ? (
                <LucideWifi className="h-4 w-4 text-green-500" />
              ) : (
                <LucideWifiOff className="h-4 w-4 text-red-500" />
              )}
              <CardTitle className="text-base">
                Real-time Status
              </CardTitle>
            </div>
            <Badge variant={connected ? "default" : "destructive"}>
              {connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          {error && (
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LucideBell className="h-4 w-4" />
              <CardTitle className="text-base">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                {showNotifications ? 'Hide' : 'Show'}
              </Button>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {showNotifications && (
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notifications
                </p>
              ) : (
                notifications.slice(0, 5).map((notification, index) => (
                  <NotificationItem
                    key={notification.id || index}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                ))
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Recent Job Updates */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LucideRefreshCw className="h-4 w-4" />
              <CardTitle className="text-base">Recent Job Updates</CardTitle>
            </div>
            <Badge variant="outline">
              {recentJobs.length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent job updates
              </p>
            ) : (
              recentJobs.map((job, index) => (
                <JobUpdateItem key={job.jobId || index} job={job} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RealTimeStatus;
