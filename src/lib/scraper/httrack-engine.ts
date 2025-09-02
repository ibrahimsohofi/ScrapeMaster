import { promises as fs } from 'fs';
import path from 'path';
import { URL } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface HTTrackOptions {
  maxDepth: number;
  maxFiles: number;
  followExternalLinks: boolean;
  downloadImages: boolean;
  downloadCSS: boolean;
  downloadJS: boolean;
  userAgent: string;
  delay: number; // ms between requests
  respectRobots: boolean;
  allowedDomains?: string[];
  excludePatterns?: string[];
  includePatterns?: string[];
  maxConcurrent: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  maxFileSize: number; // bytes
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  proxyUrl?: string;
}

export interface HTTrackResult {
  success: boolean;
  filesDownloaded: number;
  totalSize: number;
  errors: string[];
  outputPath: string;
  sitemap: Array<{
    url: string;
    localPath: string;
    size: number;
    contentType: string;
    depth: number;
    downloadTime: number;
  }>;
  statistics: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    avgDownloadSpeed: number;
    errorRate: number;
  };
}

export type ProgressCallback = (progress: {
    downloaded: number;
    total: number;
    currentUrl: string;
    speed: number;
    eta: number;
  }) => void

interface RobotsRule {
  userAgent: string;
  disallow: string[];
  allow: string[];
  crawlDelay?: number;
}

export class HTTrackEngine {
  private options: HTTrackOptions;
  private visited = new Set<string>();
  private errors: string[] = [];
  private sitemap: HTTrackResult['sitemap'] = [];
  private totalSize = 0;
  private baseDomain = '';
  private robotsCache = new Map<string, RobotsRule[]>();
  private downloadQueue: Array<{ url: string; depth: number; outputPath: string }> = [];
  private activeDownloads = 0;
  private statistics = {
    startTime: new Date(),
    endTime: undefined as Date | undefined,
    duration: undefined as number | undefined,
    avgDownloadSpeed: 0,
    errorRate: 0
  };
  private progressCallback?: ProgressCallback;

  constructor(options: Partial<HTTrackOptions> = {}) {
    this.options = {
      maxDepth: 3,
      maxFiles: 100,
      followExternalLinks: false,
      downloadImages: true,
      downloadCSS: true,
      downloadJS: false,
      userAgent: 'LeadHarvest/1.0 HTTrack-Engine',
      delay: 1000,
      respectRobots: true,
      maxConcurrent: 3,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      ...options
    };
  }

  setProgressCallback(callback: ProgressCallback): void {
    this.progressCallback = callback;
  }

  async mirror(startUrl: string, outputPath: string): Promise<HTTrackResult> {
    try {
      this.statistics.startTime = new Date();
      this.baseDomain = new URL(startUrl).hostname;

      // Create output directory
      await fs.mkdir(outputPath, { recursive: true });

      // Load robots.txt if enabled
      if (this.options.respectRobots) {
        await this.loadRobotsTxt(startUrl);
      }

      // Start crawling from the initial URL
      await this.crawlWithConcurrency(startUrl, outputPath, 0);

      this.statistics.endTime = new Date();
      this.statistics.duration = this.statistics.endTime.getTime() - this.statistics.startTime.getTime();
      this.statistics.avgDownloadSpeed = this.totalSize / (this.statistics.duration / 1000);
      this.statistics.errorRate = this.errors.length / (this.sitemap.length + this.errors.length);

      return {
        success: true,
        filesDownloaded: this.sitemap.length,
        totalSize: this.totalSize,
        errors: this.errors,
        outputPath,
        sitemap: this.sitemap,
        statistics: this.statistics
      };

    } catch (error) {
      this.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
      this.statistics.endTime = new Date();
      this.statistics.duration = this.statistics.endTime.getTime() - this.statistics.startTime.getTime();

      return {
        success: false,
        filesDownloaded: this.sitemap.length,
        totalSize: this.totalSize,
        errors: this.errors,
        outputPath,
        sitemap: this.sitemap,
        statistics: this.statistics
      };
    }
  }

  private async crawlWithConcurrency(startUrl: string, outputPath: string, depth: number): Promise<void> {
    // Add initial URL to queue
    this.downloadQueue.push({ url: startUrl, depth, outputPath });

    // Process queue with concurrency control
    while (this.downloadQueue.length > 0 || this.activeDownloads > 0) {
      // Start downloads up to maxConcurrent
      while (this.downloadQueue.length > 0 && this.activeDownloads < this.options.maxConcurrent) {
        const item = this.downloadQueue.shift()!;
        this.activeDownloads++;
        this.processUrl(item.url, item.outputPath, item.depth);
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async processUrl(url: string, outputPath: string, depth: number): Promise<void> {
    try {
      await this.crawlRecursive(url, outputPath, depth);
    } finally {
      this.activeDownloads--;
    }
  }

  private async crawlRecursive(url: string, outputPath: string, depth: number): Promise<void> {
    // Check limits
    if (depth > this.options.maxDepth) return;
    if (this.sitemap.length >= this.options.maxFiles) return;
    if (this.visited.has(url)) return;

    // Check domain restrictions and robots.txt
    if (!this.isAllowedUrl(url)) return;
    if (this.options.respectRobots && !await this.isAllowedByRobots(url)) return;

    this.visited.add(url);

    try {
      console.log(`[HTTrack] Downloading: ${url} (depth: ${depth})`);

      // Update progress
      this.updateProgress(url);

      // Download the page with retry logic
      const result = await this.downloadWithRetry(url);
      if (!result) return;

      const { data, headers, downloadTime } = result;

      // Check file size limit
      if (data.length > this.options.maxFileSize) {
        this.errors.push(`File too large: ${url} (${data.length} bytes)`);
        return;
      }

      // Save the file
      const localPath = await this.saveFile(url, data, outputPath);

      this.sitemap.push({
        url,
        localPath,
        size: data.length,
        contentType: headers['content-type'] || 'unknown',
        depth,
        downloadTime
      });

      this.totalSize += data.length;

      // If it's HTML, parse for more links
      if (headers['content-type']?.includes('text/html')) {
        const html = data.toString('utf-8');
        const links = this.extractLinks(html, url);

        // Add links to queue
        for (const link of links) {
          if (this.sitemap.length + this.downloadQueue.length >= this.options.maxFiles) break;
          if (!this.visited.has(link)) {
            this.downloadQueue.push({ url: link, depth: depth + 1, outputPath });
          }
        }

        // Extract and queue assets
        await this.queueAssets(html, url, outputPath, depth);
      }

      // Apply delay
      await new Promise(resolve => setTimeout(resolve, this.options.delay));

    } catch (error) {
      this.errors.push(`Failed to download ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async downloadWithRetry(url: string): Promise<{ data: Buffer; headers: any; downloadTime: number } | null> {
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= this.options.retryAttempts; attempt++) {
      try {
        const startTime = Date.now();

        const config: any = {
          headers: {
            'User-Agent': this.options.userAgent,
            ...this.options.headers
          },
          timeout: this.options.timeout,
          responseType: 'arraybuffer',
          maxContentLength: this.options.maxFileSize,
          maxBodyLength: this.options.maxFileSize
        };

        // Add cookies if provided
        if (this.options.cookies) {
          const cookieString = Object.entries(this.options.cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
          config.headers.Cookie = cookieString;
        }

        // Add proxy if provided
        if (this.options.proxyUrl) {
          const proxyUrl = new URL(this.options.proxyUrl);
          config.proxy = {
            protocol: proxyUrl.protocol.slice(0, -1),
            host: proxyUrl.hostname,
            port: Number(proxyUrl.port) || (proxyUrl.protocol === 'https:' ? 443 : 80),
            auth: proxyUrl.username && proxyUrl.password ? {
              username: proxyUrl.username,
              password: proxyUrl.password
            } : undefined
          };
        }

        const response = await axios.get(url, config);
        const downloadTime = Date.now() - startTime;

        return {
          data: Buffer.from(response.data),
          headers: response.headers,
          downloadTime
        };

      } catch (error) {
        lastError = error;

        if (attempt < this.options.retryAttempts) {
          console.log(`[HTTrack] Retry ${attempt + 1}/${this.options.retryAttempts} for ${url}`);
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay * (attempt + 1)));
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    return null;
  }

  private async loadRobotsTxt(baseUrl: string): Promise<void> {
    try {
      const robotsUrl = new URL('/robots.txt', baseUrl).toString();
      const response = await axios.get(robotsUrl, {
        headers: { 'User-Agent': this.options.userAgent },
        timeout: this.options.timeout
      });

      const rules = this.parseRobotsTxt(response.data);
      this.robotsCache.set(new URL(baseUrl).hostname, rules);
    } catch (error) {
      // robots.txt not found or error loading, continue without restrictions
      console.log(`[HTTrack] Could not load robots.txt: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parseRobotsTxt(content: string): RobotsRule[] {
    const rules: RobotsRule[] = [];
    const lines = content.split('\n').map(line => line.trim());

    let currentRule: Partial<RobotsRule> = {};

    for (const line of lines) {
      if (line.startsWith('#') || !line) continue;

      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      switch (key.toLowerCase()) {
        case 'user-agent':
          if (currentRule.userAgent) {
            rules.push(currentRule as RobotsRule);
            currentRule = {};
          }
          currentRule.userAgent = value;
          currentRule.disallow = [];
          currentRule.allow = [];
          break;

        case 'disallow':
          if (currentRule.disallow) {
            currentRule.disallow.push(value);
          }
          break;

        case 'allow':
          if (currentRule.allow) {
            currentRule.allow.push(value);
          }
          break;

        case 'crawl-delay':
          currentRule.crawlDelay = Number.parseInt(value, 10);
          break;
      }
    }

    if (currentRule.userAgent) {
      rules.push(currentRule as RobotsRule);
    }

    return rules;
  }

  private async isAllowedByRobots(url: string): Promise<boolean> {
    const hostname = new URL(url).hostname;
    const rules = this.robotsCache.get(hostname);

    if (!rules) return true;

    const path = new URL(url).pathname;
    const userAgent = this.options.userAgent.toLowerCase();

    // Find applicable rules
    const applicableRules = rules.filter(rule =>
      rule.userAgent === '*' ||
      rule.userAgent.toLowerCase() === userAgent ||
      userAgent.includes(rule.userAgent.toLowerCase())
    );

    for (const rule of applicableRules) {
      // Check disallow rules first
      for (const disallow of rule.disallow) {
        if (disallow && path.startsWith(disallow)) {
          // Check if there's a more specific allow rule
          const hasAllowOverride = rule.allow.some(allow =>
            allow && path.startsWith(allow) && allow.length > disallow.length
          );

          if (!hasAllowOverride) {
            return false;
          }
        }
      }

      // Apply crawl delay if specified
      if (rule.crawlDelay && rule.crawlDelay > this.options.delay) {
        this.options.delay = rule.crawlDelay * 1000; // Convert to milliseconds
      }
    }

    return true;
  }

  private async queueAssets(html: string, baseUrl: string, outputPath: string, depth: number): Promise<void> {
    const $ = cheerio.load(html);
    const assets: string[] = [];

    // Extract images
    if (this.options.downloadImages) {
      $('img[src], img[data-src]').each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src) {
          try {
            assets.push(new URL(src, baseUrl).toString());
          } catch (e) {}
        }
      });
    }

    // Extract CSS
    if (this.options.downloadCSS) {
      $('link[rel="stylesheet"][href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            assets.push(new URL(href, baseUrl).toString());
          } catch (e) {}
        }
      });
    }

    // Extract JavaScript
    if (this.options.downloadJS) {
      $('script[src]').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
          try {
            assets.push(new URL(src, baseUrl).toString());
          } catch (e) {}
        }
      });
    }

    // Add assets to queue
    for (const assetUrl of assets) {
      if (this.sitemap.length + this.downloadQueue.length >= this.options.maxFiles) break;
      if (!this.visited.has(assetUrl)) {
        this.downloadQueue.push({ url: assetUrl, depth: depth + 1, outputPath });
      }
    }
  }

  private updateProgress(currentUrl: string): void {
    if (!this.progressCallback) return;

    const downloaded = this.sitemap.length;
    const total = Math.min(this.options.maxFiles, downloaded + this.downloadQueue.length + this.activeDownloads);
    const elapsed = Date.now() - this.statistics.startTime.getTime();
    const speed = this.totalSize / (elapsed / 1000); // bytes per second
    const remaining = total - downloaded;
    const eta = remaining > 0 ? (remaining * elapsed / downloaded) / 1000 : 0;

    this.progressCallback({
      downloaded,
      total,
      currentUrl,
      speed,
      eta
    });
  }

  private isAllowedUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);

      // Check allowed domains
      if (this.options.allowedDomains && this.options.allowedDomains.length > 0) {
        const isAllowed = this.options.allowedDomains.some(domain =>
          parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
        );
        if (!isAllowed) return false;
      }

      // Check external links
      if (!this.options.followExternalLinks && this.baseDomain) {
        const isExternal = parsedUrl.hostname !== this.baseDomain &&
                          !parsedUrl.hostname.endsWith('.' + this.baseDomain);
        if (isExternal) return false;
      }

      // Check exclude patterns
      if (this.options.excludePatterns) {
        for (const pattern of this.options.excludePatterns) {
          if (url.includes(pattern)) return false;
        }
      }

      // Check include patterns
      if (this.options.includePatterns && this.options.includePatterns.length > 0) {
        const isIncluded = this.options.includePatterns.some(pattern => url.includes(pattern));
        if (!isIncluded) return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private async saveFile(url: string, data: Buffer, outputPath: string): Promise<string> {
    const parsedUrl = new URL(url);
    let filePath = decodeURIComponent(parsedUrl.pathname);

    // Handle directory paths
    if (filePath.endsWith('/')) {
      filePath += 'index.html';
    }

    // Ensure file extension for HTML content
    if (!path.extname(filePath) && data.toString().includes('<html')) {
      filePath += '.html';
    }

    // Create safe file path (sanitize for filesystem)
    const safePath = path.join(
      outputPath,
      parsedUrl.hostname,
      filePath.replace(/[<>:"|?*]/g, '_')
    );
    const dir = path.dirname(safePath);

    // Create directory structure
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(safePath, data);

    return safePath;
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const links: string[] = [];

    // Extract all href links
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).toString();
          if (this.isValidLink(absoluteUrl)) {
            links.push(absoluteUrl);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    return [...new Set(links)]; // Remove duplicates
  }

  private isValidLink(url: string): boolean {
    try {
      const parsedUrl = new URL(url);

      // Only HTTP/HTTPS
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return false;
      }

      // Skip common file types that aren't web pages
      const skipExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.tar', '.gz'];
      const pathname = parsedUrl.pathname.toLowerCase();

      if (skipExtensions.some(ext => pathname.endsWith(ext))) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

// Enhanced utility function with progress tracking
export async function createHTTrackJob(
  url: string,
  outputPath: string,
  options: Partial<HTTrackOptions> = {},
  progressCallback?: ProgressCallback
): Promise<HTTrackResult> {
  const engine = new HTTrackEngine(options);

  if (progressCallback) {
    engine.setProgressCallback(progressCallback);
  }

  return engine.mirror(url, outputPath);
}
