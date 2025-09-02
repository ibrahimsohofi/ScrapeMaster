import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import cron from 'node-cron';
import winston from 'winston';

const execAsync = promisify(exec);

export interface SSLCertificate {
  domain: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
  keyType: string;
  keySize: number;
  serialNumber: string;
  autoRenewal: boolean;
  status: 'valid' | 'expiring' | 'expired' | 'invalid';
}

export interface DomainConfig {
  domain: string;
  subdomain?: string;
  dnsProvider: 'cloudflare' | 'route53' | 'godaddy' | 'custom';
  dnsCredentials: any;
  sslProvider: 'letsencrypt' | 'zerossl' | 'custom';
  autoRenewal: boolean;
  redirects?: string[];
}

export class SSLCertificateManager {
  private domains: Map<string, DomainConfig> = new Map();
  private certificates: Map<string, SSLCertificate> = new Map();
  private logger: winston.Logger;
  private certbotPath: string = '/usr/bin/certbot';
  private nginxConfigPath: string = '/etc/nginx/sites-enabled';
  private sslCertPath: string = '/etc/letsencrypt/live';

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/ssl-manager.log' }),
        new winston.transports.Console()
      ]
    });

    this.initializeManager();
  }

  private async initializeManager(): Promise<void> {
    // Skip initialization if SSL manager is disabled
    if (process.env.DISABLE_SSL_MANAGER === 'true') {
      this.logger.info('SSL Certificate Manager disabled via environment variable');
      return;
    }

    try {
      // Check if certbot is installed
      await this.checkCertbotInstallation();

      // Schedule certificate renewal check
      this.scheduleCertificateRenewal();

      // Load existing certificates
      await this.loadExistingCertificates();

      this.logger.info('SSL Certificate Manager initialized');
    } catch (error) {
      this.logger.warn('SSL Certificate Manager initialization failed:', error);
      // Don't throw error to prevent build failure
    }
  }

  // ============================================================================
  // DOMAIN MANAGEMENT
  // ============================================================================

  public async addDomain(config: DomainConfig): Promise<void> {
    try {
      // Validate domain
      await this.validateDomain(config.domain);

      // Configure DNS if needed
      await this.configureDNS(config);

      // Issue SSL certificate
      await this.issueCertificate(config);

      // Configure web server
      await this.configureWebServer(config);

      this.domains.set(config.domain, config);
      this.logger.info(`Domain ${config.domain} added successfully`);

    } catch (error) {
      this.logger.error(`Failed to add domain ${config.domain}:`, error);
      throw error;
    }
  }

  public async removeDomain(domain: string): Promise<void> {
    try {
      const config = this.domains.get(domain);
      if (!config) {
        throw new Error(`Domain ${domain} not found`);
      }

      // Remove SSL certificate
      await this.revokeCertificate(domain);

      // Remove web server configuration
      await this.removeWebServerConfig(domain);

      this.domains.delete(domain);
      this.certificates.delete(domain);

      this.logger.info(`Domain ${domain} removed successfully`);

    } catch (error) {
      this.logger.error(`Failed to remove domain ${domain}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // CERTIFICATE MANAGEMENT
  // ============================================================================

  public async issueCertificate(config: DomainConfig): Promise<SSLCertificate> {
    try {
      let certificate: SSLCertificate;

      switch (config.sslProvider) {
        case 'letsencrypt':
          certificate = await this.issueLetsEncryptCertificate(config);
          break;
        case 'zerossl':
          certificate = await this.issueZeroSSLCertificate(config);
          break;
        case 'custom':
          certificate = await this.issueCustomCertificate(config);
          break;
        default:
          throw new Error(`Unsupported SSL provider: ${config.sslProvider}`);
      }

      this.certificates.set(config.domain, certificate);
      this.logger.info(`SSL certificate issued for ${config.domain}`);

      return certificate;

    } catch (error) {
      this.logger.error(`Failed to issue certificate for ${config.domain}:`, error);
      throw error;
    }
  }

  private async issueLetsEncryptCertificate(config: DomainConfig): Promise<SSLCertificate> {
    const domain = config.subdomain ? `${config.subdomain}.${config.domain}` : config.domain;

    // Use DNS challenge for automatic verification
    const dnsPlugin = this.getDNSPlugin(config.dnsProvider);

    const command = [
      this.certbotPath,
      'certonly',
      '--dns-' + dnsPlugin,
      '--dns-' + dnsPlugin + '-credentials', await this.getDNSCredentialsPath(config),
      '-d', domain,
      '--non-interactive',
      '--agree-tos',
      '--email', process.env.ADMIN_EMAIL || 'admin@datavault.pro',
      '--expand'
    ].join(' ');

    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('successfully received certificate')) {
      throw new Error(`Certbot error: ${stderr}`);
    }

    return await this.parseCertificateInfo(domain);
  }

  private async issueZeroSSLCertificate(config: DomainConfig): Promise<SSLCertificate> {
    // ZeroSSL API implementation
    const apiKey = process.env.ZEROSSL_API_KEY;
    if (!apiKey) {
      throw new Error('ZeroSSL API key not configured');
    }

    const domain = config.subdomain ? `${config.subdomain}.${config.domain}` : config.domain;

    // Create certificate request
    const response = await axios.post('https://api.zerossl.com/certificates', {
      certificate_domains: domain,
      certificate_validity_days: 90,
      certificate_csr: await this.generateCSR(domain)
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Handle verification and issuance
    return await this.handleZeroSSLIssuance(response.data, config);
  }

  private async issueCustomCertificate(config: DomainConfig): Promise<SSLCertificate> {
    // Custom certificate implementation for enterprise CAs
    throw new Error('Custom certificate issuance not implemented');
  }

  // ============================================================================
  // CERTIFICATE RENEWAL
  // ============================================================================

  private scheduleCertificateRenewal(): void {
    // Check for renewal daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.checkAndRenewCertificates();
    });

    this.logger.info('Certificate renewal scheduled');
  }

  private async checkAndRenewCertificates(): Promise<void> {
    for (const [domain, certificate] of this.certificates) {
      try {
        const daysUntilExpiry = this.getDaysUntilExpiry(certificate);

        // Renew if less than 30 days until expiry
        if (daysUntilExpiry <= 30) {
          await this.renewCertificate(domain);
        }

      } catch (error) {
        this.logger.error(`Failed to check certificate for ${domain}:`, error);
      }
    }
  }

  public async renewCertificate(domain: string): Promise<void> {
    try {
      const config = this.domains.get(domain);
      if (!config) {
        throw new Error(`Domain configuration not found for ${domain}`);
      }

      this.logger.info(`Renewing certificate for ${domain}`);

      // Renew based on provider
      switch (config.sslProvider) {
        case 'letsencrypt':
          await this.renewLetsEncryptCertificate(domain);
          break;
        case 'zerossl':
          await this.renewZeroSSLCertificate(domain);
          break;
        default:
          throw new Error(`Renewal not supported for provider: ${config.sslProvider}`);
      }

      // Reload web server configuration
      await this.reloadWebServer();

      this.logger.info(`Certificate renewed successfully for ${domain}`);

    } catch (error) {
      this.logger.error(`Failed to renew certificate for ${domain}:`, error);
      throw error;
    }
  }

  private async renewLetsEncryptCertificate(domain: string): Promise<void> {
    const command = `${this.certbotPath} renew --cert-name ${domain} --non-interactive`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('successfully renewed') && !stderr.includes('not yet due for renewal')) {
      throw new Error(`Renewal failed: ${stderr}`);
    }

    // Update certificate info
    const updatedCert = await this.parseCertificateInfo(domain);
    this.certificates.set(domain, updatedCert);
  }

  private async renewZeroSSLCertificate(domain: string): Promise<void> {
    // ZeroSSL renewal implementation
    throw new Error('ZeroSSL renewal not implemented');
  }

  // ============================================================================
  // DNS CONFIGURATION
  // ============================================================================

  private async configureDNS(config: DomainConfig): Promise<void> {
    switch (config.dnsProvider) {
      case 'cloudflare':
        await this.configureCloudflare(config);
        break;
      case 'route53':
        await this.configureRoute53(config);
        break;
      case 'godaddy':
        await this.configureGoDaddy(config);
        break;
      default:
        this.logger.info(`Manual DNS configuration required for ${config.domain}`);
        break;
    }
  }

  private async configureCloudflare(config: DomainConfig): Promise<void> {
    const { apiToken, zoneId } = config.dnsCredentials;
    const domain = config.subdomain ? `${config.subdomain}.${config.domain}` : config.domain;

    // Get server IP
    const serverIP = await this.getServerIP();

    // Create/update A record
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        type: 'A',
        name: domain,
        content: serverIP,
        ttl: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    this.logger.info(`Cloudflare DNS configured for ${domain}`);
  }

  private async configureRoute53(config: DomainConfig): Promise<void> {
    // AWS Route53 configuration implementation
    this.logger.info(`Route53 DNS configuration for ${config.domain} - implementation needed`);
  }

  private async configureGoDaddy(config: DomainConfig): Promise<void> {
    // GoDaddy DNS configuration implementation
    this.logger.info(`GoDaddy DNS configuration for ${config.domain} - implementation needed`);
  }

  // ============================================================================
  // WEB SERVER CONFIGURATION
  // ============================================================================

  private async configureWebServer(config: DomainConfig): Promise<void> {
    await this.createNginxConfig(config);
    await this.reloadWebServer();
  }

  private async createNginxConfig(config: DomainConfig): Promise<void> {
    const domain = config.subdomain ? `${config.subdomain}.${config.domain}` : config.domain;
    const configPath = path.join(this.nginxConfigPath, `${domain}.conf`);

    const nginxConfig = `
server {
    listen 80;
    server_name ${domain} www.${domain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain} www.${domain};

    ssl_certificate ${this.sslCertPath}/${domain}/fullchain.pem;
    ssl_certificate_key ${this.sslCertPath}/${domain}/privkey.pem;
    ssl_trusted_certificate ${this.sslCertPath}/${domain}/chain.pem;

    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Application Configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

    await fs.writeFile(configPath, nginxConfig);
    this.logger.info(`Nginx configuration created for ${domain}`);
  }

  private async reloadWebServer(): Promise<void> {
    try {
      // Test nginx configuration
      await execAsync('nginx -t');

      // Reload nginx
      await execAsync('systemctl reload nginx');

      this.logger.info('Web server reloaded successfully');
    } catch (error) {
      this.logger.error('Failed to reload web server:', error);
      throw error;
    }
  }

  private async removeWebServerConfig(domain: string): Promise<void> {
    const configPath = path.join(this.nginxConfigPath, `${domain}.conf`);

    try {
      await fs.unlink(configPath);
      await this.reloadWebServer();
      this.logger.info(`Web server configuration removed for ${domain}`);
    } catch (error) {
      this.logger.error(`Failed to remove web server config for ${domain}:`, error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async checkCertbotInstallation(): Promise<void> {
    try {
      await execAsync('which certbot');
    } catch (error) {
      throw new Error('Certbot is not installed. Please install certbot first.');
    }
  }

  private async validateDomain(domain: string): Promise<void> {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!domainRegex.test(domain)) {
      throw new Error(`Invalid domain format: ${domain}`);
    }
  }

  private async loadExistingCertificates(): Promise<void> {
    try {
      const certDirs = await fs.readdir(this.sslCertPath);

      for (const certDir of certDirs) {
        if (certDir === 'README') continue;

        try {
          const certificate = await this.parseCertificateInfo(certDir);
          this.certificates.set(certDir, certificate);
        } catch (error) {
          this.logger.warn(`Failed to load certificate for ${certDir}:`, error);
        }
      }

      this.logger.info(`Loaded ${this.certificates.size} existing certificates`);
    } catch (error) {
      this.logger.warn('No existing certificates found');
    }
  }

  private async parseCertificateInfo(domain: string): Promise<SSLCertificate> {
    const certPath = path.join(this.sslCertPath, domain, 'cert.pem');

    try {
      const { stdout } = await execAsync(`openssl x509 -in ${certPath} -text -noout`);

      // Parse certificate information from openssl output
      const validFromMatch = stdout.match(/Not Before: (.+)/);
      const validToMatch = stdout.match(/Not After : (.+)/);
      const issuerMatch = stdout.match(/Issuer: (.+)/);
      const serialMatch = stdout.match(/Serial Number:\s*(.+)/);

      const validFrom = validFromMatch ? new Date(validFromMatch[1]) : new Date();
      const validTo = validToMatch ? new Date(validToMatch[1]) : new Date();
      const now = new Date();

      let status: 'valid' | 'expiring' | 'expired' | 'invalid' = 'valid';
      if (validTo < now) {
        status = 'expired';
      } else if ((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 30) {
        status = 'expiring';
      }

      return {
        domain,
        issuer: issuerMatch ? issuerMatch[1] : 'Unknown',
        validFrom,
        validTo,
        fingerprint: await this.getCertificateFingerprint(certPath),
        keyType: 'RSA', // Default, could be parsed
        keySize: 2048, // Default, could be parsed
        serialNumber: serialMatch ? serialMatch[1] : 'Unknown',
        autoRenewal: true,
        status
      };

    } catch (error) {
      throw new Error(`Failed to parse certificate for ${domain}: ${error}`);
    }
  }

  private async getCertificateFingerprint(certPath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`openssl x509 -in ${certPath} -fingerprint -noout`);
      const match = stdout.match(/Fingerprint=(.+)/);
      return match ? match[1] : 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  private getDaysUntilExpiry(certificate: SSLCertificate): number {
    return Math.ceil((certificate.validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  private getDNSPlugin(provider: string): string {
    const plugins = {
      cloudflare: 'cloudflare',
      route53: 'route53',
      godaddy: 'godaddy'
    };
    return plugins[provider as keyof typeof plugins] || 'manual';
  }

  private async getDNSCredentialsPath(config: DomainConfig): Promise<string> {
    const credentialsDir = '/etc/letsencrypt/credentials';
    const credentialsFile = path.join(credentialsDir, `${config.dnsProvider}.ini`);

    // Ensure credentials directory exists
    await fs.mkdir(credentialsDir, { recursive: true });

    // Write credentials file based on provider
    let credentialsContent = '';
    switch (config.dnsProvider) {
      case 'cloudflare':
        credentialsContent = `dns_cloudflare_api_token = ${config.dnsCredentials.apiToken}`;
        break;
      case 'route53':
        credentialsContent = `dns_route53_access_key_id = ${config.dnsCredentials.accessKeyId}\ndns_route53_secret_access_key = ${config.dnsCredentials.secretAccessKey}`;
        break;
      // Add other providers as needed
    }

    await fs.writeFile(credentialsFile, credentialsContent);
    await execAsync(`chmod 600 ${credentialsFile}`);

    return credentialsFile;
  }

  private async getServerIP(): Promise<string> {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      return response.data.ip;
    } catch (error) {
      // Fallback to local IP detection
      const { stdout } = await execAsync("hostname -I | awk '{print $1}'");
      return stdout.trim();
    }
  }

  private async generateCSR(domain: string): Promise<string> {
    // Generate Certificate Signing Request
    const keyPath = `/tmp/${domain}.key`;
    const csrPath = `/tmp/${domain}.csr`;

    await execAsync(`openssl genrsa -out ${keyPath} 2048`);
    await execAsync(`openssl req -new -key ${keyPath} -out ${csrPath} -subj "/CN=${domain}"`);

    const csr = await fs.readFile(csrPath, 'utf8');

    // Cleanup temporary files
    await fs.unlink(keyPath);
    await fs.unlink(csrPath);

    return csr;
  }

  private async handleZeroSSLIssuance(certificateData: any, config: DomainConfig): Promise<SSLCertificate> {
    // Handle ZeroSSL certificate issuance workflow
    throw new Error('ZeroSSL issuance not fully implemented');
  }

  private async revokeCertificate(domain: string): Promise<void> {
    try {
      const command = `${this.certbotPath} revoke --cert-path ${this.sslCertPath}/${domain}/cert.pem --non-interactive`;
      await execAsync(command);
      this.logger.info(`Certificate revoked for ${domain}`);
    } catch (error) {
      this.logger.error(`Failed to revoke certificate for ${domain}:`, error);
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  public getCertificates(): SSLCertificate[] {
    return Array.from(this.certificates.values());
  }

  public getCertificate(domain: string): SSLCertificate | undefined {
    return this.certificates.get(domain);
  }

  public getDomains(): DomainConfig[] {
    return Array.from(this.domains.values());
  }

  public async getSystemStatus(): Promise<any> {
    const certificates = this.getCertificates();
    const now = new Date();

    return {
      totalCertificates: certificates.length,
      validCertificates: certificates.filter(c => c.status === 'valid').length,
      expiringCertificates: certificates.filter(c => c.status === 'expiring').length,
      expiredCertificates: certificates.filter(c => c.status === 'expired').length,
      autoRenewalEnabled: certificates.filter(c => c.autoRenewal).length,
      nextRenewal: certificates
        .filter(c => c.autoRenewal && c.status !== 'expired')
        .sort((a, b) => a.validTo.getTime() - b.validTo.getTime())[0]?.validTo
    };
  }
}
