interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface WelcomeEmailData {
  name: string;
  email: string;
  loginUrl: string;
}

interface ScraperCompleteData {
  scraperName: string;
  status: 'success' | 'failed' | 'partial';
  recordsExtracted: number;
  executionTime: string;
  dashboardUrl: string;
  errorMessage?: string;
}

interface AlertData {
  alertType: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  dashboardUrl: string;
  timestamp: string;
}

export class EmailTemplates {
  private static baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; line-height: 1.6; }
      .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }
      .header { background: linear-gradient(135deg, #059669 0%, #0D9488 50%, #0F766E 100%); padding: 40px 24px; text-align: center; position: relative; }
      .header::before { content: ''; position: absolute; inset: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="30" r="0.8" fill="rgba(255,255,255,0.08)"/><circle cx="40" cy="70" r="1.2" fill="rgba(255,255,255,0.06)"/></svg>'); }
      .logo-container { position: relative; z-index: 1; }
      .logo { color: white; font-size: 32px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
      .tagline { color: rgba(255, 255, 255, 0.95); font-size: 15px; font-weight: 500; }
      .content { padding: 40px 32px; }
      .content h2 { color: #1f2937; font-size: 24px; font-weight: 700; margin: 0 0 16px 0; }
      .content p { color: #4b5563; font-size: 16px; margin: 0 0 20px 0; }
      .footer { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 32px 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
      .button { display: inline-block; background: linear-gradient(135deg, #059669, #0D9488); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 24px 0; box-shadow: 0 4px 14px 0 rgba(5, 150, 105, 0.3); transition: all 0.2s; }
      .button:hover { transform: translateY(-2px); box-shadow: 0 8px 25px 0 rgba(5, 150, 105, 0.4); }
      .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
      .feature-item { background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 3px solid #059669; }
      .feature-title { font-weight: 600; color: #1f2937; margin-bottom: 4px; }
      .feature-desc { font-size: 14px; color: #6b7280; }
      .status-success { color: #059669; background: linear-gradient(135deg, #d1fae5, #a7f3d0); padding: 12px 20px; border-radius: 8px; display: inline-block; font-weight: 600; }
      .status-failed { color: #dc2626; background: linear-gradient(135deg, #fee2e2, #fecaca); padding: 12px 20px; border-radius: 8px; display: inline-block; font-weight: 600; }
      .status-warning { color: #d97706; background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 12px 20px; border-radius: 8px; display: inline-block; font-weight: 600; }
      .stats-container { background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 24px; border-radius: 12px; margin: 24px 0; }
      .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; text-align: center; }
      .stat-item { background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
      .stat-number { font-size: 24px; font-weight: 800; color: #059669; margin-bottom: 4px; }
      .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
      @media (max-width: 600px) { .features-grid, .stats-grid { grid-template-columns: 1fr; } }
    </style>
  `;

  static welcomeEmail(data: WelcomeEmailData): EmailTemplate {
    return {
      subject: '🎉 Welcome to ScrapeMaster - Your Web Scraping Journey Starts Now!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>${this.baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌐 ScrapeMaster</div>
              <div class="tagline">Enterprise Web Scraping Platform</div>
            </div>
            <div class="content">
              <h2>Welcome to ScrapeMaster, ${data.name}! 🚀</h2>
              <p>Thank you for joining ScrapeMaster, the most advanced web scraping platform designed for professionals and enterprises.</p>

              <h3>🎯 What you can do right now:</h3>
              <ul>
                <li><strong>Create your first scraper</strong> using our no-code builder</li>
                <li><strong>Explore AI-powered selectors</strong> for smarter data extraction</li>
                <li><strong>Set up automated schedules</strong> for continuous monitoring</li>
                <li><strong>Export data</strong> in 9+ formats including JSON, CSV, and XLSX</li>
              </ul>

              <h3>🛡️ Enterprise Features Available:</h3>
              <ul>
                <li>Advanced proxy management (6+ premium providers)</li>
                <li>CAPTCHA solving (4 major providers)</li>
                <li>Real-time analytics and monitoring</li>
                <li>Enterprise security and compliance</li>
              </ul>

              <a href="${data.loginUrl}" class="button">Access Your Dashboard →</a>

              <p><strong>Need help getting started?</strong><br>
              Check out our <a href="${data.loginUrl.replace('/dashboard', '/tutorials')}">tutorials</a> or reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>ScrapeMaster - Professional Web Scraping Platform<br>
              <a href="mailto:support@scrapemaster.io">support@scrapemaster.io</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to ScrapeMaster, ${data.name}!\n\nThank you for joining our enterprise web scraping platform. You can now access your dashboard at: ${data.loginUrl}\n\nNeed help? Contact us at support@scrapemaster.io`
    };
  }

  static scraperCompleteNotification(data: ScraperCompleteData): EmailTemplate {
    const statusClass = data.status === 'success' ? 'status-success' :
                       data.status === 'failed' ? 'status-failed' : 'status-warning';
    const statusEmoji = data.status === 'success' ? '✅' :
                       data.status === 'failed' ? '❌' : '⚠️';

    return {
      subject: `${statusEmoji} Scraper "${data.scraperName}" ${data.status === 'success' ? 'Completed Successfully' : data.status === 'failed' ? 'Failed' : 'Completed with Issues'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${this.baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌐 ScrapeMaster</div>
              <div class="tagline">Scraper Execution Report</div>
            </div>
            <div class="content">
              <h2>${statusEmoji} Scraper Execution Report</h2>

              <h3>Scraper: ${data.scraperName}</h3>
              <p><span class="${statusClass}">${data.status.toUpperCase()}</span></p>

              <h3>📊 Execution Summary:</h3>
              <ul>
                <li><strong>Records Extracted:</strong> ${data.recordsExtracted.toLocaleString()}</li>
                <li><strong>Execution Time:</strong> ${data.executionTime}</li>
                <li><strong>Status:</strong> ${data.status}</li>
              </ul>

              ${data.errorMessage ? `<h3>🚨 Error Details:</h3><p style="background: #fee2e2; padding: 16px; border-radius: 8px; color: #dc2626;">${data.errorMessage}</p>` : ''}

              <a href="${data.dashboardUrl}" class="button">View Full Report →</a>

              <p><strong>Next Steps:</strong><br>
              ${data.status === 'success' ? 'Your data is ready for export and analysis.' :
                data.status === 'failed' ? 'Please review the error details and update your scraper configuration.' :
                'Review the extracted data and check for any quality issues.'}</p>
            </div>
            <div class="footer">
              <p>ScrapeMaster - Professional Web Scraping Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Scraper "${data.scraperName}" ${data.status}\n\nRecords: ${data.recordsExtracted}\nTime: ${data.executionTime}\nView report: ${data.dashboardUrl}`
    };
  }

  static alertNotification(data: AlertData): EmailTemplate {
    const alertEmoji = data.alertType === 'error' ? '🚨' :
                      data.alertType === 'warning' ? '⚠️' : 'ℹ️';
    const statusClass = data.alertType === 'error' ? 'status-failed' :
                       data.alertType === 'warning' ? 'status-warning' : 'status-success';

    return {
      subject: `${alertEmoji} ScrapeMaster Alert: ${data.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${this.baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌐 ScrapeMaster</div>
              <div class="tagline">System Alert</div>
            </div>
            <div class="content">
              <h2>${alertEmoji} ${data.title}</h2>

              <p><span class="${statusClass}">${data.alertType.toUpperCase()}</span></p>

              <h3>📋 Alert Details:</h3>
              <p style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">${data.message}</p>

              <p><strong>Timestamp:</strong> ${data.timestamp}</p>

              <a href="${data.dashboardUrl}" class="button">View Dashboard →</a>
            </div>
            <div class="footer">
              <p>ScrapeMaster - Professional Web Scraping Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `ScrapeMaster Alert: ${data.title}\n\n${data.message}\n\nTime: ${data.timestamp}\nDashboard: ${data.dashboardUrl}`
    };
  }

  static monthlyReport(data: {
    userName: string;
    totalScrapers: number;
    totalDataPoints: number;
    successRate: number;
    topScrapers: Array<{ name: string; records: number }>;
    dashboardUrl: string;
  }): EmailTemplate {
    return {
      subject: '📊 Your Monthly ScrapeMaster Report is Ready',
      html: `
        <!DOCTYPE html>
        <html>
        <head>${this.baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌐 ScrapeMaster</div>
              <div class="tagline">Monthly Performance Report</div>
            </div>
            <div class="content">
              <h2>📊 Monthly Report - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>

              <p>Hi ${data.userName}, here's your scraping performance summary:</p>

              <h3>🎯 Key Metrics:</h3>
              <ul>
                <li><strong>Total Scrapers:</strong> ${data.totalScrapers}</li>
                <li><strong>Data Points Extracted:</strong> ${data.totalDataPoints.toLocaleString()}</li>
                <li><strong>Success Rate:</strong> ${data.successRate}%</li>
              </ul>

              <h3>🏆 Top Performing Scrapers:</h3>
              <ul>
                ${data.topScrapers.map(scraper => `<li><strong>${scraper.name}</strong>: ${scraper.records.toLocaleString()} records</li>`).join('')}
              </ul>

              <a href="${data.dashboardUrl}" class="button">View Full Analytics →</a>
            </div>
            <div class="footer">
              <p>ScrapeMaster - Professional Web Scraping Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Monthly ScrapeMaster Report\n\nScrapers: ${data.totalScrapers}\nData Points: ${data.totalDataPoints}\nSuccess Rate: ${data.successRate}%\n\nView full report: ${data.dashboardUrl}`
    };
  }
}
