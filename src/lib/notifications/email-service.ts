import nodemailer from 'nodemailer';
import type { User, JobExecution, Job } from '@prisma/client';
import { EmailTemplates } from './email-templates';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface NotificationContext {
  user: User;
  job?: Job;
  execution?: JobExecution;
  customData?: Record<string, any>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number.parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM || 'ScrapeMaster <scrapemaster@example.com>';

    if (!host || !user || !pass) {
      console.warn('⚠️  Email service not configured - missing SMTP credentials');
      console.info('💡 To enable email notifications, set SMTP_HOST, SMTP_USER, and SMTP_PASS in your .env file');
      return;
    }

    this.config = {
      host,
      port,
      secure: secure || port === 465,
      auth: { user, pass },
      from
    };

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        console.error('Email service connection failed:', error);
        this.transporter = null;
      } else {
        console.log('Email service connected successfully');
      }
    });
  }

  async sendJobCompletedNotification(context: NotificationContext): Promise<boolean> {
    if (!this.transporter || !context.job || !context.execution) {
      return false;
    }

    const template = this.getJobCompletedTemplate(context);

    return this.sendEmail({
      to: context.user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendJobFailedNotification(context: NotificationContext): Promise<boolean> {
    if (!this.transporter || !context.job || !context.execution) {
      return false;
    }

    const template = this.getJobFailedTemplate(context);

    return this.sendEmail({
      to: context.user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendWelcomeEmail(user: { name: string; email: string }): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const template = EmailTemplates.welcomeEmail({
      name: user.name,
      email: user.email,
      loginUrl: `${baseUrl}/dashboard`
    });

    return this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendScraperCompleteNotification(data: {
    userEmail: string;
    scraperName: string;
    status: 'success' | 'failed' | 'partial';
    recordsExtracted: number;
    executionTimeMs: number;
    errorMessage?: string;
  }): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const executionTime = this.formatDuration(data.executionTimeMs);

    const template = EmailTemplates.scraperCompleteNotification({
      scraperName: data.scraperName,
      status: data.status,
      recordsExtracted: data.recordsExtracted,
      executionTime,
      dashboardUrl: `${baseUrl}/dashboard/scrapers`,
      errorMessage: data.errorMessage
    });

    return this.sendEmail({
      to: data.userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendAlertNotification(data: {
    userEmail: string;
    alertType: 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const template = EmailTemplates.alertNotification({
      alertType: data.alertType,
      title: data.title,
      message: data.message,
      dashboardUrl: `${baseUrl}/dashboard`,
      timestamp: new Date().toLocaleString()
    });

    return this.sendEmail({
      to: data.userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendMonthlyReport(data: {
    userEmail: string;
    userName: string;
    totalScrapers: number;
    totalDataPoints: number;
    successRate: number;
    topScrapers: Array<{ name: string; records: number }>;
  }): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const template = EmailTemplates.monthlyReport({
      userName: data.userName,
      totalScrapers: data.totalScrapers,
      totalDataPoints: data.totalDataPoints,
      successRate: data.successRate,
      topScrapers: data.topScrapers,
      dashboardUrl: `${baseUrl}/dashboard/analytics`
    });

    return this.sendEmail({
      to: data.userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  async sendUsageLimitWarning(context: NotificationContext): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    const template = this.getUsageLimitTemplate(context);

    return this.sendEmail({
      to: context.user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendSystemAlert(
    adminEmails: string[],
    alertType: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<boolean> {
    if (!this.transporter || adminEmails.length === 0) {
      return false;
    }

    const template = this.getSystemAlertTemplate(alertType, message, severity);

    const results = await Promise.allSettled(
      adminEmails.map(email =>
        this.sendEmail({
          to: email,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      )
    );

    return results.some(result => result.status === 'fulfilled' && result.value);
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<boolean> {
    if (!this.transporter || !this.config) {
      return false;
    }

    try {
      const result = await this.transporter.sendMail({
        from: this.config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });

      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  private getJobCompletedTemplate(context: NotificationContext): EmailTemplate {
    const { user, job, execution } = context;
    const dataPoints = execution?.dataPointsCount || 0;
    const duration = execution?.duration ? Math.round(execution.duration / 1000) : 0;

    return {
      subject: `✅ Scraper "${job?.name}" completed successfully`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Job Completed Successfully!</h1>
          </div>

          <div style="padding: 20px; background: #f8f9fa;">
            <h2 style="color: #333;">Hello ${user.firstName || user.email},</h2>

            <p>Your scraping job has completed successfully:</p>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #667eea;">Job Details</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Name:</strong> ${job?.name}</li>
                <li><strong>URL:</strong> ${job?.url}</li>
                <li><strong>Data Points:</strong> ${dataPoints.toLocaleString()}</li>
                <li><strong>Duration:</strong> ${duration}s</li>
                <li><strong>Completed:</strong> ${execution?.completedAt?.toLocaleString()}</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/scrapers/${job?.id}"
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Results
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              You can view and download your scraped data from the TechFlow dashboard.
            </p>
          </div>

          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© 2025 TechFlow Pro. All rights reserved.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color: #ccc;">Notification Settings</a> |
              <a href="mailto:support@techflow.ai" style="color: #ccc;">Support</a>
            </p>
          </div>
        </div>
      `,
      text: `
Job Completed Successfully!

Hello ${user.firstName || user.email},

Your scraping job "${job?.name}" has completed successfully.

Job Details:
- Name: ${job?.name}
- URL: ${job?.url}
- Data Points: ${dataPoints.toLocaleString()}
- Duration: ${duration}s
- Completed: ${execution?.completedAt?.toLocaleString()}

View your results at: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/scrapers/${job?.id}

--
TechFlow Pro Team
      `
    };
  }

  private getJobFailedTemplate(context: NotificationContext): EmailTemplate {
    const { user, job, execution } = context;
    const errorMessage = execution?.errorMessage || 'Unknown error occurred';

    return {
      subject: `❌ Scraper "${job?.name}" failed`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Job Failed</h1>
          </div>

          <div style="padding: 20px; background: #f8f9fa;">
            <h2 style="color: #333;">Hello ${user.firstName || user.email},</h2>

            <p>Unfortunately, your scraping job encountered an error:</p>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ff6b6b;">
              <h3 style="margin-top: 0; color: #ff6b6b;">Job Details</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Name:</strong> ${job?.name}</li>
                <li><strong>URL:</strong> ${job?.url}</li>
                <li><strong>Error:</strong> ${errorMessage}</li>
                <li><strong>Failed At:</strong> ${execution?.completedAt?.toLocaleString()}</li>
              </ul>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
              <h4 style="margin-top: 0; color: #856404;">Troubleshooting Tips</h4>
              <ul style="color: #856404;">
                <li>Check if the target website is accessible</li>
                <li>Verify your CSS selectors are still valid</li>
                <li>Consider adjusting timeout settings</li>
                <li>Review anti-bot detection measures</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/scrapers/${job?.id}"
                 style="background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Debug Job
              </a>
            </div>
          </div>

          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>© 2025 TechFlow Pro. All rights reserved.</p>
            <p>
              <a href="mailto:support@techflow.ai" style="color: #ccc;">Contact Support</a>
            </p>
          </div>
        </div>
      `,
      text: `
Job Failed

Hello ${user.firstName || user.email},

Your scraping job "${job?.name}" has failed with the following error:
${errorMessage}

Job Details:
- Name: ${job?.name}
- URL: ${job?.url}
- Failed At: ${execution?.completedAt?.toLocaleString()}

Please check your job configuration and try again.
View job details: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/scrapers/${job?.id}

--
TechFlow Pro Team
      `
    };
  }

  private getWelcomeTemplate(user: User): EmailTemplate {
    return {
      subject: '🎉 Welcome to TechFlow Pro!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to TechFlow Pro!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your enterprise web scraping platform is ready</p>
          </div>

          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333;">Hello ${user.firstName || 'there'}! 👋</h2>

            <p>Welcome to TechFlow Pro! You now have access to our powerful web scraping platform with enterprise-grade features.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">What you can do:</h3>
              <ul>
                <li>🤖 <strong>AI-Powered Scraping:</strong> Generate CSS selectors automatically</li>
                <li>⚡ <strong>Lightning Fast:</strong> Distributed scraping with Playwright</li>
                <li>📊 <strong>Real-time Analytics:</strong> Monitor performance and success rates</li>
                <li>🛡️ <strong>Enterprise Security:</strong> GDPR compliance and data protection</li>
                <li>🔄 <strong>Smart Scheduling:</strong> Automate your data collection</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
                Go to Dashboard
              </a>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/tutorials/getting-started"
                 style="background: transparent; color: #667eea; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; border: 2px solid #667eea;">
                View Tutorial
              </a>
            </div>

            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #1565c0;"><strong>Need help getting started?</strong></p>
              <p style="margin: 5px 0 0 0; color: #1565c0;">Check out our documentation or contact our support team.</p>
            </div>
          </div>

          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>© 2025 TechFlow Pro. All rights reserved.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/documentation" style="color: #ccc;">Documentation</a> |
              <a href="mailto:support@techflow.ai" style="color: #ccc;">Support</a>
            </p>
          </div>
        </div>
      `,
      text: `
Welcome to TechFlow Pro!

Hello ${user.firstName || 'there'}!

Welcome to TechFlow Pro! You now have access to our powerful web scraping platform.

What you can do:
- AI-Powered Scraping: Generate CSS selectors automatically
- Lightning Fast: Distributed scraping with Playwright
- Real-time Analytics: Monitor performance and success rates
- Enterprise Security: GDPR compliance and data protection
- Smart Scheduling: Automate your data collection

Get started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
Documentation: ${process.env.NEXT_PUBLIC_APP_URL}/documentation

--
TechFlow Pro Team
      `
    };
  }

  private getUsageLimitTemplate(context: NotificationContext): EmailTemplate {
    const usage = context.customData?.usage || 0;
    const limit = context.customData?.limit || 1000;
    const percentage = Math.round((usage / limit) * 100);

    return {
      subject: `⚠️ Usage Limit Warning - ${percentage}% of monthly quota used`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Usage Limit Warning</h1>
          </div>

          <div style="padding: 20px; background: #f8f9fa;">
            <h2 style="color: #333;">Hello ${context.user.firstName || context.user.email},</h2>

            <p>You've used <strong>${percentage}%</strong> of your monthly scraping quota.</p>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #ff8f00;">Usage Details</h3>
              <div style="background: #f0f0f0; height: 20px; border-radius: 10px; margin: 10px 0;">
                <div style="background: linear-gradient(90deg, #ffc107, #ff8f00); height: 100%; width: ${percentage}%; border-radius: 10px;"></div>
              </div>
              <p><strong>${usage.toLocaleString()}</strong> of <strong>${limit.toLocaleString()}</strong> requests used</p>
            </div>

            ${percentage >= 90 ? `
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc3545;">
              <h4 style="margin-top: 0; color: #721c24;">Action Required</h4>
              <p style="color: #721c24;">You're approaching your monthly limit. Consider upgrading your plan to avoid service interruption.</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing"
                 style="background: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Upgrade Plan
              </a>
            </div>
          </div>
        </div>
      `,
      text: `
Usage Limit Warning

Hello ${context.user.firstName || context.user.email},

You've used ${percentage}% of your monthly scraping quota.
${usage.toLocaleString()} of ${limit.toLocaleString()} requests used.

${percentage >= 90 ? 'Action Required: Consider upgrading your plan to avoid service interruption.' : ''}

Upgrade your plan: ${process.env.NEXT_PUBLIC_APP_URL}/pricing

--
TechFlow Pro Team
      `
    };
  }

  private getSystemAlertTemplate(alertType: string, message: string, severity: string): EmailTemplate {
    const severityColors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    };

    const color = severityColors[severity as keyof typeof severityColors] || '#6c757d';

    return {
      subject: `🚨 System Alert: ${alertType} (${severity.toUpperCase()})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${color}; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">System Alert</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">${severity.toUpperCase()} Severity</p>
          </div>

          <div style="padding: 20px; background: #f8f9fa;">
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid ${color};">
              <h3 style="margin-top: 0; color: ${color};">${alertType}</h3>
              <p>${message}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      `,
      text: `
System Alert: ${alertType} (${severity.toUpperCase()})

${message}

Time: ${new Date().toLocaleString()}

--
TechFlow Pro System
      `
    };
  }

  isConfigured(): boolean {
    return this.transporter !== null && this.config !== null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Notification event types
export enum NotificationEvent {
  JOB_COMPLETED = 'job.completed',
  JOB_FAILED = 'job.failed',
  USER_WELCOME = 'user.welcome',
  USAGE_LIMIT_WARNING = 'usage.limit.warning',
  USAGE_LIMIT_EXCEEDED = 'usage.limit.exceeded',
  SYSTEM_ALERT = 'system.alert'
}

// Main notification dispatcher
export async function sendNotification(
  event: NotificationEvent,
  context: NotificationContext
): Promise<boolean> {
  try {
    switch (event) {
      case NotificationEvent.JOB_COMPLETED:
        return await emailService.sendJobCompletedNotification(context);

      case NotificationEvent.JOB_FAILED:
        return await emailService.sendJobFailedNotification(context);

      case NotificationEvent.USER_WELCOME:
        return await emailService.sendWelcomeEmail({
          name: context.user.name || 'User',
          email: context.user.email
        });

      case NotificationEvent.USAGE_LIMIT_WARNING:
        return await emailService.sendUsageLimitWarning(context);

      default:
        console.warn(`Unknown notification event: ${event}`);
        return false;
    }
  } catch (error) {
    console.error(`Failed to send notification for event ${event}:`, error);
    return false;
  }
}
