import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';

interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'resend';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  resend?: {
    apiKey: string;
  };
  from: string;
  fromName: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface JobCompletedData {
  jobName: string;
  jobId: string;
  dataPoints: number;
  executionTime: number;
  downloadUrl?: string;
  organization: string;
  userName: string;
  userEmail: string;
}

interface JobFailedData {
  jobName: string;
  jobId: string;
  error: string;
  retryCount: number;
  organization: string;
  userName: string;
  userEmail: string;
}

interface WelcomeData {
  userName: string;
  userEmail: string;
  organization: string;
  dashboardUrl: string;
}

interface AlertData {
  alertType: 'system' | 'quota' | 'performance' | 'security';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  organization: string;
  userName: string;
  userEmail: string;
}

export class EnhancedEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = this.loadConfig();
    this.initializeTransporter();
  }

  private loadConfig(): EmailConfig {
    const provider = (process.env.EMAIL_PROVIDER || 'smtp') as EmailConfig['provider'];

    return {
      provider,
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number.parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASSWORD || '',
        },
      },
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY || '',
      },
      mailgun: {
        apiKey: process.env.MAILGUN_API_KEY || '',
        domain: process.env.MAILGUN_DOMAIN || '',
      },
      resend: {
        apiKey: process.env.RESEND_API_KEY || '',
      },
      from: process.env.FROM_EMAIL || 'DataVault Pro <noreply@datavaultpro.com>',
      fromName: process.env.EMAIL_FROM_NAME || 'DataVault Pro Team',
    };
  }

  private async initializeTransporter() {
    try {
      switch (this.config.provider) {
        case 'smtp':
          if (this.config.smtp?.auth.user && this.config.smtp?.auth.pass) {
            this.transporter = nodemailer.createTransport({
              host: this.config.smtp.host,
              port: this.config.smtp.port,
              secure: this.config.smtp.secure,
              auth: this.config.smtp.auth,
            });
          }
          break;

        case 'sendgrid':
          if (this.config.sendgrid?.apiKey) {
            this.transporter = nodemailer.createTransport({
              service: 'SendGrid',
              auth: {
                user: 'apikey',
                pass: this.config.sendgrid.apiKey,
              },
            });
          }
          break;

        // Add other providers as needed
        default:
          console.warn(`Email provider ${this.config.provider} not implemented, falling back to SMTP`);
          break;
      }

      // Test the connection
      if (this.transporter) {
        await this.transporter.verify();
        console.log('✅ Email service initialized successfully');
      }
    } catch (error) {
      console.warn('⚠️ Email service initialization failed:', error);
      this.transporter = null;
    }
  }

  // Enhanced HTML Template Generators
  private generateJobCompletedHTML(data: JobCompletedData): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Job Completed Successfully - DataVault Pro</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #059669 0%, #0D9488 50%, #0F766E 100%); padding: 40px 32px; text-align: center; position: relative; }
            .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><defs><radialGradient id="a" cx="50%" cy="0%"><stop offset="0%" stop-color="rgba(255,255,255,.1)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient></defs><rect width="100" height="20" fill="url(%23a)"/></svg>') repeat-x; }
            .logo { width: 64px; height: 64px; margin: 0 auto 20px; background: rgba(255,255,255,0.15); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; backdrop-filter: blur(10px); }
            .content { padding: 40px 32px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 32px 0; }
            .stat-card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 24px 20px; text-align: center; border: 1px solid #e2e8f0; transition: transform 0.2s; }
            .stat-card:hover { transform: translateY(-2px); }
            .btn-primary { display: inline-block; background: linear-gradient(135deg, #059669 0%, #0D9488 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; margin: 24px 0; transition: all 0.3s; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3); }
            .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(5, 150, 105, 0.4); }
            .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0; }
            .feature-list { list-style: none; padding: 0; margin: 24px 0; }
            .feature-list li { padding: 8px 0; color: #4b5563; display: flex; align-items: center; }
            .feature-list li::before { content: '✓'; color: #059669; font-weight: bold; margin-right: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="logo">🚀</div>
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; line-height: 1.2;">Job Completed Successfully!</h1>
              <p style="margin: 16px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 18px;">Your data extraction is ready for download</p>
            </div>

            <!-- Content -->
            <div class="content">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 16px;">Hello ${data.userName},</p>
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 28px; font-weight: 700;">${data.jobName}</h2>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; font-family: monospace;">Job ID: ${data.jobId}</p>

              <!-- Stats Grid -->
              <div class="stats-grid">
                <div class="stat-card">
                  <div style="font-size: 36px; font-weight: 700; color: #059669; margin-bottom: 8px;">${data.dataPoints.toLocaleString()}</div>
                  <div style="color: #6b7280; font-size: 14px; font-weight: 500;">Data Points Extracted</div>
                </div>
                <div class="stat-card">
                  <div style="font-size: 36px; font-weight: 700; color: #3b82f6; margin-bottom: 8px;">${(data.executionTime / 1000).toFixed(1)}s</div>
                  <div style="color: #6b7280; font-size: 14px; font-weight: 500;">Execution Time</div>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 32px 0;">
                <h3 style="margin: 0 0 16px 0; color: #065f46; font-size: 18px; font-weight: 600;">What's included:</h3>
                <ul class="feature-list">
                  <li>Structured data in JSON format</li>
                  <li>CSV export for spreadsheet analysis</li>
                  <li>Data quality report and statistics</li>
                  <li>Extraction logs and metadata</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                ${data.downloadUrl ? `<a href="${data.downloadUrl}" class="btn-primary">Download Your Data</a>` : ''}
                <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">Download link expires in 7 days</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
                Need help? <a href="mailto:support@datavaultpro.com" style="color: #059669; text-decoration: none;">Contact our support team</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2024 DataVault Pro. All rights reserved.<br>
                ${data.organization}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateJobFailedHTML(data: JobFailedData): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Job Failed - DataVault Pro</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); padding: 40px 32px; text-align: center; }
            .content { padding: 40px 32px; }
            .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 24px 0; }
            .btn-secondary { display: inline-block; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 8px; }
            .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: rgba(255,255,255,0.15); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px;">⚠️</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Job Execution Failed</h1>
              <p style="margin: 16px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">We encountered an issue with your scraping job</p>
            </div>

            <div class="content">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 16px;">Hello ${data.userName},</p>
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${data.jobName}</h2>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; font-family: monospace;">Job ID: ${data.jobId}</p>

              <div class="error-box">
                <h3 style="margin: 0 0 12px 0; color: #dc2626; font-size: 16px; font-weight: 600;">Error Details:</h3>
                <p style="margin: 0; color: #374151; font-size: 14px; font-family: monospace; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">${data.error}</p>
              </div>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Don't worry! Our system will automatically retry this job ${data.retryCount > 0 ? `(Attempt ${data.retryCount + 1})` : 'shortly'}.
                If the issue persists, our support team has been notified and will investigate.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="/dashboard/scrapers/${data.jobId}" class="btn-secondary">View Job Details</a>
                <a href="mailto:support@datavaultpro.com" class="btn-secondary">Contact Support</a>
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
                Need immediate assistance? <a href="mailto:support@datavaultpro.com" style="color: #dc2626; text-decoration: none;">Contact our support team</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2024 DataVault Pro. All rights reserved.<br>
                ${data.organization}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateWelcomeHTML(data: WelcomeData): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to DataVault Pro</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%); padding: 40px 32px; text-align: center; }
            .content { padding: 40px 32px; }
            .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 32px 0; }
            .feature-card { background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; }
            .btn-primary { display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; margin: 24px 0; }
            .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: rgba(255,255,255,0.15); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px;">🎉</div>
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">Welcome to DataVault Pro!</h1>
              <p style="margin: 16px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 18px;">Your enterprise data extraction platform is ready</p>
            </div>

            <div class="content">
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 18px; line-height: 1.6;">
                Hello ${data.userName},<br><br>
                Welcome to DataVault Pro! Your account has been successfully created and you're ready to start extracting valuable data from the web.
              </p>

              <div class="feature-grid">
                <div class="feature-card">
                  <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">🤖 AI-Powered Extraction</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Let our AI automatically generate CSS selectors for any website</p>
                </div>
                <div class="feature-card">
                  <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">⚡ Real-Time Monitoring</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Track your scraping jobs with live performance metrics</p>
                </div>
                <div class="feature-card">
                  <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">🛡️ Enterprise Security</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Bank-level security with advanced proxy management</p>
                </div>
                <div class="feature-card">
                  <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">📊 Data Insights</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Transform raw data into actionable business intelligence</p>
                </div>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${data.dashboardUrl}" class="btn-primary">Start Your First Scraper</a>
                <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">Ready to extract data in minutes, not hours</p>
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
                Questions? <a href="mailto:support@datavaultpro.com" style="color: #0ea5e9; text-decoration: none;">We're here to help!</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2024 DataVault Pro. All rights reserved.<br>
                ${data.organization}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Public methods
  async sendJobCompletedEmail(data: JobCompletedData): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured, skipping job completion email');
      return false;
    }

    try {
      const mailOptions = {
        from: this.config.from,
        to: data.userEmail,
        subject: `✅ Job Completed: ${data.jobName}`,
        html: this.generateJobCompletedHTML(data),
        text: `Your scraping job "${data.jobName}" has completed successfully with ${data.dataPoints} data points extracted.`,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Job completion email sent to ${data.userEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send job completion email:', error);
      return false;
    }
  }

  async sendJobFailedEmail(data: JobFailedData): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured, skipping job failure email');
      return false;
    }

    try {
      const mailOptions = {
        from: this.config.from,
        to: data.userEmail,
        subject: `⚠️ Job Failed: ${data.jobName}`,
        html: this.generateJobFailedHTML(data),
        text: `Your scraping job "${data.jobName}" has failed with error: ${data.error}`,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Job failure email sent to ${data.userEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send job failure email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeData): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured, skipping welcome email');
      return false;
    }

    try {
      const mailOptions = {
        from: this.config.from,
        to: data.userEmail,
        subject: '🎉 Welcome to DataVault Pro - Your Enterprise Data Platform',
        html: this.generateWelcomeHTML(data),
        text: `Welcome to DataVault Pro, ${data.userName}! Your enterprise data extraction platform is ready. Visit ${data.dashboardUrl} to get started.`,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${data.userEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  async sendAlertEmail(data: AlertData): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured, skipping alert email');
      return false;
    }

    try {
      const severityEmoji = {
        low: '🔵',
        medium: '🟡',
        high: '🟠',
        critical: '🔴'
      };

      const mailOptions = {
        from: this.config.from,
        to: data.userEmail,
        subject: `${severityEmoji[data.severity]} Alert: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">${data.title}</h2>
            <p><strong>Severity:</strong> ${data.severity.toUpperCase()}</p>
            <p><strong>Type:</strong> ${data.alertType}</p>
            <p><strong>Time:</strong> ${data.timestamp.toLocaleString()}</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0;">${data.message}</p>
            </div>
            <p>Organization: ${data.organization}</p>
          </div>
        `,
        text: `Alert: ${data.title}\nSeverity: ${data.severity}\nMessage: ${data.message}\nTime: ${data.timestamp.toLocaleString()}`,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Alert email sent to ${data.userEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send alert email:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const emailService = new EnhancedEmailService();
