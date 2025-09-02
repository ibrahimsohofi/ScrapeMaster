import { HTTrackEngine, type HTTrackOptions, type HTTrackResult, type ProgressCallback } from './httrack-engine';
import { PlaywrightScraper, type PlaywrightConfig, type ScrapingResult } from './playwright-engine';

// Real PlaywrightEngine class that uses the comprehensive implementation
export class PlaywrightEngine {
  private scraper = new PlaywrightScraper();

  async scrape(url: string, options: any = {}): Promise<any> {
    try {
      // Convert generic options to PlaywrightConfig format
      const config: PlaywrightConfig = {
        url,
        selectors: options.selectors || {},
        options: {
          headless: options.headless !== false,
          timeout: options.timeout || 30000,
          waitTime: options.waitTime || 0,
          userAgent: options.userAgent,
          viewport: options.viewport,
          javascript: options.javascript !== false,
          images: options.images !== false,
          proxy: options.proxy,
          antiDetection: options.antiDetection || { stealthMode: true },
          waitConditions: options.waitConditions || [{ type: 'networkidle' }],
        },
      };

      const result = await this.scraper.scrape(config);

      // Convert to legacy format for compatibility
      return {
        success: result.success,
        data: result.data,
        error: result.error,
        url: result.url,
        dataPointsCount: result.dataPointsCount,
        executionTime: result.executionTime,
        metadata: result.metadata,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Playwright scraping failed',
        url,
        timestamp: new Date(),
      };
    }
  }
}



export type ScrapingEngine = 'httrack' | 'playwright' | 'jsdom';

// Legacy scraper interfaces for backward compatibility
export interface LegacyScraperConfig {
  url: string;
  selectors: Record<string, string>;
  headers?: Record<string, string>;
  timeout?: number;
  waitTime?: number;
}

export interface LegacyScraperResult {
  success: boolean;
  data?: any[];
  error?: string;
  timestamp: Date;
  url: string;
  dataPointsCount?: number;
}

// Legacy scraper function for backward compatibility
export async function runLegacyScraper(config: LegacyScraperConfig): Promise<LegacyScraperResult> {
  try {
    const result = await quickScrape(config.url, 'jsdom', {
      selectors: config.selectors,
      headers: config.headers,
      timeout: config.timeout,
      userAgent: 'LeadHarvest/1.0 Legacy-Mode'
    });

    return {
      success: result.success,
      data: result.success ? [result] : undefined,
      error: result.success ? undefined : result.error,
      timestamp: new Date(),
      url: config.url,
      dataPointsCount: result.success ? 1 : 0
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      url: config.url,
      dataPointsCount: 0
    };
  }
}

export interface ScrapingJob {
  id: string;
  url: string;
  engine: ScrapingEngine;
  options: HTTrackOptions | any; // Can be extended for other engines
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: {
    downloaded: number;
    total: number;
    currentUrl: string;
    speed: number;
    eta: number;
  };
  result?: HTTrackResult | any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ScrapingJobManager {
  createJob(url: string, engine: ScrapingEngine, options?: any): Promise<ScrapingJob>;
  startJob(jobId: string, progressCallback?: ProgressCallback): Promise<void>;
  getJob(jobId: string): ScrapingJob | undefined;
  getAllJobs(): ScrapingJob[];
  cancelJob(jobId: string): boolean;
}

class ScrapingJobManagerImpl implements ScrapingJobManager {
  private jobs = new Map<string, ScrapingJob>();
  private runningJobs = new Set<string>();

  async createJob(url: string, engine: ScrapingEngine, options: any = {}): Promise<ScrapingJob> {
    const job: ScrapingJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      engine,
      options,
      status: 'pending',
      createdAt: new Date()
    };

    this.jobs.set(job.id, job);
    return job;
  }

  async startJob(jobId: string, progressCallback?: ProgressCallback): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (this.runningJobs.has(jobId)) {
      throw new Error(`Job ${jobId} is already running`);
    }

    this.runningJobs.add(jobId);
    job.status = 'running';
    job.startedAt = new Date();

    // Setup progress callback
    const wrappedProgressCallback: ProgressCallback = (progress) => {
      job.progress = progress;
      if (progressCallback) {
        progressCallback(progress);
      }
    };

    try {
      let result: any;

      switch (job.engine) {
        case 'httrack':
          const outputPath = `./downloads/${job.id}`;
          const httrackEngine = new HTTrackEngine(job.options as HTTrackOptions);

          if (progressCallback) {
            httrackEngine.setProgressCallback(wrappedProgressCallback);
          }

          result = await httrackEngine.mirror(job.url, outputPath);
          break;

        case 'playwright':
          // Integrate with existing Playwright engine
          const playwrightEngine = new PlaywrightEngine();
          // This would need to be implemented based on your existing PlaywrightEngine
          result = await playwrightEngine.scrape(job.url, job.options);
          break;

        case 'jsdom':
          // Basic JSDOM implementation for simple scraping
          result = await this.scrapeWithJSDOM(job.url, job.options);
          break;

        default:
          throw new Error(`Unsupported engine: ${job.engine}`);
      }

      job.result = result;
      job.status = 'completed';
      job.completedAt = new Date();

    } catch (error) {
      job.error = error instanceof Error ? error.message : String(error);
      job.status = 'failed';
      job.completedAt = new Date();
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  private async scrapeWithJSDOM(url: string, options: any): Promise<any> {
    const axios = require('axios');
    const { JSDOM } = require('jsdom');

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': options.userAgent || 'LeadHarvest/1.0 JSDOM-Engine'
        },
        timeout: options.timeout || 30000
      });

      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      // Extract basic information
      const title = document.querySelector('title')?.textContent || '';
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const links = Array.from(document.querySelectorAll('a[href]')).map((a: any) => a.getAttribute('href'));
      const images = Array.from(document.querySelectorAll('img[src]')).map((img: any) => img.getAttribute('src'));

      return {
        success: true,
        url,
        title,
        description,
        links,
        images,
        html: response.data,
        size: response.data.length,
        contentType: response.headers['content-type'],
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        url,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  }

  getJob(jobId: string): ScrapingJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): ScrapingJob[] {
    return Array.from(this.jobs.values());
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || !this.runningJobs.has(jobId)) {
      return false;
    }

    job.status = 'failed';
    job.error = 'Job cancelled by user';
    job.completedAt = new Date();
    this.runningJobs.delete(jobId);
    return true;
  }
}

// Singleton instance
export const scrapingJobManager = new ScrapingJobManagerImpl();

// Enhanced utility functions
export async function quickScrape(
  url: string,
  engine: ScrapingEngine = 'httrack',
  options: any = {},
  progressCallback?: ProgressCallback
): Promise<any> {
  const job = await scrapingJobManager.createJob(url, engine, options);
  await scrapingJobManager.startJob(job.id, progressCallback);
  return scrapingJobManager.getJob(job.id)?.result;
}

export async function batchScrape(
  urls: string[],
  engine: ScrapingEngine = 'httrack',
  options: any = {},
  progressCallback?: (jobId: string, progress: any) => void
): Promise<ScrapingJob[]> {
  const jobs: ScrapingJob[] = [];

  for (const url of urls) {
    const job = await scrapingJobManager.createJob(url, engine, options);
    jobs.push(job);
  }

  // Start all jobs with individual progress tracking
  const startPromises = jobs.map(job =>
    scrapingJobManager.startJob(job.id, progressCallback ?
      (progress) => progressCallback(job.id, progress) : undefined
    )
  );

  await Promise.allSettled(startPromises);

  return jobs.map(job => scrapingJobManager.getJob(job.id)!);
}

// Lead extraction utilities specifically for HTTrack results
export function extractLeadsFromHTTrackResult(result: HTTrackResult): Array<{
  type: 'email' | 'phone' | 'social' | 'contact';
  value: string;
  source: string;
  confidence: number;
}> {
  const leads: Array<{
    type: 'email' | 'phone' | 'social' | 'contact';
    value: string;
    source: string;
    confidence: number;
  }> = [];

  if (!result.success) return leads;

  // This is a placeholder for lead extraction logic
  // In a real implementation, you would:
  // 1. Read the downloaded HTML files
  // 2. Use regex patterns to find emails, phone numbers, etc.
  // 3. Apply ML models for contact information detection
  // 4. Score confidence based on context and patterns

  return leads;
}

export function generateHTTrackReport(result: HTTrackResult): {
  summary: string;
  metrics: Record<string, any>;
  recommendations: string[];
} {
  if (!result.success) {
    return {
      summary: 'Scraping failed',
      metrics: {
        errors: result.errors.length,
        errorRate: 1
      },
      recommendations: [
        'Check target URL accessibility',
        'Review error messages for specific issues',
        'Consider adjusting timeout and retry settings'
      ]
    };
  }

  const duration = result.statistics.duration || 0;
  const avgFileSize = result.totalSize / result.filesDownloaded;

  return {
    summary: `Successfully downloaded ${result.filesDownloaded} files (${(result.totalSize / 1024 / 1024).toFixed(2)} MB) in ${(duration / 1000).toFixed(1)} seconds`,
    metrics: {
      filesDownloaded: result.filesDownloaded,
      totalSize: result.totalSize,
      duration,
      avgDownloadSpeed: result.statistics.avgDownloadSpeed,
      errorRate: result.statistics.errorRate,
      avgFileSize,
      successRate: 1 - result.statistics.errorRate
    },
    recommendations: [
      result.statistics.errorRate > 0.1 ? 'High error rate detected - consider adjusting retry settings' : 'Low error rate - good scraping quality',
      avgFileSize > 1024 * 1024 ? 'Large average file size - consider file size limits' : 'Good file size distribution',
      duration > 300000 ? 'Long scraping duration - consider reducing depth or file limits' : 'Reasonable scraping duration'
    ].filter(Boolean)
  };
}

// Export the enhanced HTTrack functionality
export {
  HTTrackEngine,
  createHTTrackJob
} from './httrack-engine';

export type {
  HTTrackOptions,
  HTTrackResult,
  ProgressCallback
} from './httrack-engine';
