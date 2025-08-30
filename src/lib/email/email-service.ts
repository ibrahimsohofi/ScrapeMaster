import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
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
}

interface JobFailedData {
  jobName: string;
  jobId: string;
  error: string;
  retryCount: number;
  organization: string;
  userName: string;
}

interface WelcomeData {
  userName: string;
  userEmail: string;
  organization: string;
  dashboardUrl: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number.parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: process.env.SMTP_FROM || 'ScrapeMaster <noreply@scrapemaster.io>',
      fromName: process.env.EMAIL_FROM_NAME || 'ScrapeMaster Team',
    };

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
    });
  }

  // Enhanced HTML Template Generators
  private generateJobCompletedHTML(data: JobCompletedData): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Job Completed - ScrapeMaster</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #059669 0%, #0D9488 50%, #0F766E 100%); padding: 40px 32px; text-align: center; }
            .logo { width: 48px; height: 48px; margin: 0 auto 16px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
            .content { padding: 40px 32px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 24px 0; }
            .stat-card { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; }
            .btn-primary { display: inline-block; background: linear-gradient(135deg, #059669 0%, #0D9488 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; transition: transform 0.2s; }
            .btn-primary:hover { transform: translateY(-2px); }
            .footer { background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="logo">🚀</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; line-height: 1.2;">Job Completed Successfully!</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Your scraping job has finished processing</p>
            </div>

            <!-- Content -->
            <div class="content">
              <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${data.jobName}</h2>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">Job ID: ${data.jobId}</p>

              <!-- Stats Grid -->
              <div class="stats-grid">
                <div class="stat-card">
                  <div style="font-size: 32px; font-weight: 700; color: #059669; margin-bottom: 8px;">${data.dataPoints.toLocaleString()}</div>
                  <div style="color: #6b7280; font-size: 14px; font-weight: 500;">Data Points</div>
                </div>
                <div class="stat-card">
                  <div style="font-size: 32px; font-weight: 700; color: #3b82f6; margin-bottom: 8px;">${(data.executionTime / 1000).toFixed(1)}s</div>
                  <div style="color: #6b7280; font-size: 14px; font-weight: 500;">Execution Time</div>
                </div>
              </div>

              ${data.downloadUrl ? `
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.downloadUrl}" class="btn-primary">
                    📥 Download Results
                  </a>
                </div>
              ` : ''}

              <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <p style="margin: 0; color: #1e40af; font-weight: 600;">What's Next?</p>
                <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 14px;">You can view detailed analytics and manage your scrapers in the <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #1e40af; font-weight: 600;">ScrapeMaster Dashboard</a>.</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">&copy; 2025 ScrapeMaster. All rights reserved.</p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">This email was sent to ${data.userName} at ${data.organization}</p>
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
          <title>Job Failed - ScrapeMaster</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 32px; text-align: center; }
            .content { padding: 40px 32px; }
            .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0; }
            .btn-primary { display: inline-block; background: linear-gradient(135deg, #059669 0%, #0D9488 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
            .footer { background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Job Failed</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Your scraping job encountered an error</p>
            </div>

            <!-- Content -->
            <div class="content">
              <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${data.jobName}</h2>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">Job ID: ${data.jobId}</p>

              <div class="error-box">
                <h3 style="margin: 0 0 8px 0; color: #dc2626; font-size: 16px; font-weight: 600;">Error Details</h3>
                <p style="margin: 0; color: #7f1d1d; font-size: 14px; font-family: monospace; background: white; padding: 12px; border-radius: 4px;">${data.error}</p>
              </div>

              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-weight: 600;">Retry Information</p>
                <p style="margin: 8px 0 0 0; color: #92400e; font-size: 14px;">This was attempt ${data.retryCount + 1}. The job will automatically retry if retries are enabled.</p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/scrapers" class="btn-primary">
                  🔧 View Job Details
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">&copy; 2025 ScrapeMaster. All rights reserved.</p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">This email was sent to ${data.userName} at ${data.organization}</p>
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
          <title>Welcome to ScrapeMaster</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #059669 0%, #0D9488 100%); padding: 40px 32px; text-align: center; }
            .content { padding: 40px 32px; }
            .feature-list { list-style: none; padding: 0; margin: 24px 0; }
            .feature-item { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
            .btn-primary { display: inline-block; background: linear-gradient(135deg, #059669 0%, #0D9488 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
            .footer { background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Welcome to ScrapeMaster!</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Your account has been successfully created</p>
            </div>

            <!-- Content -->
            <div class="content">
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700;">Hi ${data.userName}! 👋</h2>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">Welcome to ${data.organization}! You're now part of the ScrapeMaster platform and ready to start extracting valuable data from the web with our AI-powered tools.</p>

              <h3 style="margin: 24px 0 16px 0; color: #1f2937; font-size: 20px; font-weight: 600;">What you can do with ScrapeMaster:</h3>

              <ul class="feature-list">
                <li class="feature-item">
                  <span style="font-size: 20px; margin-right: 12px;">🤖</span>
                  <span style="color: #4b5563; font-size: 14px;">Use AI-powered selectors to extract data without coding</span>
                </li>
                <li class="feature-item">
                  <span style="font-size: 20px; margin-right: 12px;">⚡</span>
                  <span style="color: #4b5563; font-size: 14px;">Scale to millions of pages with our distributed infrastructure</span>
                </li>
                <li class="feature-item">
                  <span style="font-size: 20px; margin-right: 12px;">🌍</span>
                  <span style="color: #4b5563; font-size: 14px;">Access global proxy networks and bypass restrictions</span>
                </li>
                <li class="feature-item">
                  <span style="font-size: 20px; margin-right: 12px;">📊</span>
                  <span style="color: #4b5563; font-size: 14px;">Export data in 9+ formats with real-time monitoring</span>
                </li>
              </ul>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.dashboardUrl}" class="btn-primary">
                  🚀 Start Your First Scraper
                </a>
              </div>

              <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <p style="margin: 0; color: #1e40af; font-weight: 600;">Need Help Getting Started?</p>
                <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 14px;">Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL}/tutorials" style="color: #1e40af; font-weight: 600;">tutorials</a> and <a href="${process.env.NEXT_PUBLIC_APP_URL}/documentation" style="color: #1e40af; font-weight: 600;">documentation</a> to get up to speed quickly.</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">&copy; 2025 ScrapeMaster. All rights reserved.</p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">Questions? Reply to this email or contact us at support@scrapemaster.io</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Main email sending methods
  async sendJobCompletedEmail(to: string, data: JobCompletedData): Promise<boolean> {
    try {
      const html = this.generateJobCompletedHTML(data);
      const text = `Job "${data.jobName}" completed successfully! ${data.dataPoints} data points extracted in ${data.executionTime}ms.`;

      await this.transporter.sendMail({
        from: this.config.from,
        to,
        subject: `✅ Job "${data.jobName}" Completed Successfully`,
        html,
        text,
      });

      console.log(`Job completion email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send job completion email:', error);
      return false;
    }
  }

  async sendJobFailedEmail(to: string, data: JobFailedData): Promise<boolean> {
    try {
      const html = this.generateJobFailedHTML(data);
      const text = `Job "${data.jobName}" failed with error: ${data.error}`;

      await this.transporter.sendMail({
        from: this.config.from,
        to,
        subject: `⚠️ Job "${data.jobName}" Failed`,
        html,
        text,
      });

      console.log(`Job failure email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send job failure email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, data: WelcomeData): Promise<boolean> {
    try {
      const html = this.generateWelcomeHTML(data);
      const text = `Welcome to ScrapeMaster, ${data.userName}! Your account has been created for ${data.organization}.`;

      await this.transporter.sendMail({
        from: this.config.from,
        to,
        subject: `🎉 Welcome to ScrapeMaster - Let's Get Started!`,
        html,
        text,
      });

      console.log(`Welcome email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  async sendCustomEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to,
        subject,
        html,
        text: text || 'Please view this email in an HTML-capable client.',
      });

      console.log(`Custom email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send custom email:', error);
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
