export interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  encoding?: string;
}

export interface NotificationSettings {
  userId: string;
  email: string;
  enabled: boolean;
  preferences: {
    jobCompleted: boolean;
    jobFailed: boolean;
    usageAlerts: boolean;
    maintenanceNotifications: boolean;
    weeklyReports: boolean;
    securityAlerts: boolean;
    newFeatures: boolean;
  };
  frequency: {
    immediate: boolean;
    digest: boolean;
    weekly: boolean;
  };
  thresholds: {
    usageAlert: number; // percentage
    errorRateAlert: number; // percentage
    responseTimeAlert: number; // milliseconds
  };
}

export interface EmailNotificationData {
  jobCompleted?: {
    jobName: string;
    dataPoints: number;
    executionTime: number;
    downloadUrl?: string;
  };
  jobFailed?: {
    jobName: string;
    errorMessage: string;
    retryCount: number;
  };
  usageAlert?: {
    usagePercentage: number;
    currentUsage: number;
    limit: number;
  };
  maintenanceNotification?: {
    start: Date;
    end: Date;
    description: string;
  };
  welcome?: {
    userName: string;
    organizationName: string;
  };
}

export type NotificationType =
  | 'job-completed'
  | 'job-failed'
  | 'usage-alert'
  | 'maintenance'
  | 'welcome'
  | 'security-alert'
  | 'weekly-report';

export interface NotificationQueue {
  id: string;
  userId: string;
  type: NotificationType;
  data: EmailNotificationData;
  scheduled: Date;
  attempts: number;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
  lastAttempt?: Date;
}

export interface EmailServiceConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  replyTo?: string;
}

export interface EmailMetrics {
  sent: number;
  failed: number;
  bounced: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  type: NotificationType;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
