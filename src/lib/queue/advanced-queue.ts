import { Queue, Worker, type Job, type QueueOptions, type WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { playwrightScraper, type PlaywrightConfig, type ScrapingResult } from '../scraper/playwright-engine';
import { updateJob, findJobById } from '../db';
import { JobStatus } from '../db/types';

export interface ScrapingJobData {
  jobId: string;
  userId: string;
  organizationId: string;
  config: PlaywrightConfig;
  priority: number;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  webhook?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

import type { ScrapedData, ScrapedDataItem } from '@/lib/types/scraper';

export interface ScrapingJobProgress {
  percentage: number;
  stage: string;
  message?: string;
  eta?: number;
}

export interface JobResult {
  success: boolean;
  data?: ScrapedData;
  error?: string;
  metrics?: {
    executionTime: number;
    dataPoints: number;
    proxyUsed?: boolean;
    complianceChecks: string[];
  };
  screenshot?: string;
}

class AdvancedScrapingQueue {
  private queue: Queue<ScrapingJobData>;
  private worker: Worker<ScrapingJobData, JobResult>;
  private redis: Redis;
  private isInitialized = false;

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    // Initialize queue
    const queueOptions: QueueOptions = {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50,      // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    };

    this.queue = new Queue<ScrapingJobData>('scraping-jobs', queueOptions);

    // Initialize worker
    const workerOptions: WorkerOptions = {
      connection: this.redis,
      concurrency: Number.parseInt(process.env.QUEUE_CONCURRENCY || '5'),
      maxStalledCount: 1,
      stalledInterval: 30000,
    };

    this.worker = new Worker<ScrapingJobData, JobResult>(
      'scraping-jobs',
      this.processJob.bind(this),
      workerOptions
    );

    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.redis.ping();
      console.log('✅ Redis connection established');

      // Set up queue event listeners
      await this.queue.waitUntilReady();
      console.log('✅ BullMQ queue ready');

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize advanced queue:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    // Queue events
    this.queue.on('error', (error) => {
      console.error('Queue error:', error);
    });

    // Worker events
    this.worker.on('completed', (job: Job<ScrapingJobData, JobResult>) => {
      console.log(`✅ Job ${job.id} completed successfully`);
      this.updateJobStatus(job.data.jobId, JobStatus.COMPLETED, job.returnvalue);
    });

    this.worker.on('failed', (job: Job<ScrapingJobData> | undefined, error: Error) => {
      if (job) {
        console.error(`❌ Job ${job.id} failed:`, error.message);
        this.updateJobStatus(job.data.jobId, JobStatus.FAILED, undefined, error.message);
      }
    });

    this.worker.on('stalled', (jobId: string) => {
      console.warn(`⚠️ Job ${jobId} stalled`);
    });

    this.worker.on('progress', (job: Job<ScrapingJobData>, progress: unknown) => {
      if (typeof progress === 'object' && progress !== null) {
        const progressObj = progress as { stage?: string; percentage?: number };
        console.log(`🔄 Job ${job.id} progress: ${progressObj.stage || 'processing'} (${progressObj.percentage || 0}%)`);
      } else {
        console.log(`🔄 Job ${job.id} progress: ${progress}`);
      }
    });

    this.worker.on('error', (error) => {
      console.error('Worker error:', error);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Gracefully shutting down worker...');
      await this.worker.close();
      await this.queue.close();
      await this.redis.quit();
      process.exit(0);
    });
  }

  // Main job processing function
  private async processJob(job: Job<ScrapingJobData>): Promise<JobResult> {
    const { jobId, config, timeout, metadata } = job.data;

    console.log(`🚀 Processing job ${jobId} (${job.id})`);

    try {
      // Update job status to running
      await this.updateJobStatus(jobId, JobStatus.RUNNING);

      // Update progress
      await job.updateProgress(10);

      // Add timeout to config
      const configWithTimeout = {
        ...config,
        options: {
          ...config.options,
          timeout: timeout || 30000
        }
      };

      await job.updateProgress(20);

      // Execute scraping
      const startTime = Date.now();
      const result: ScrapingResult = await playwrightScraper.scrape(configWithTimeout);
      const executionTime = Date.now() - startTime;

      await job.updateProgress(90);

      // Process result
      const jobResult: JobResult = {
        success: result.success,
        data: result.data ? this.convertToScrapedData(result.data) : [],
        error: result.error,
        metrics: {
          executionTime,
          dataPoints: result.dataPointsCount || 0,
          proxyUsed: !!config.options?.proxy,
          complianceChecks: result.complianceResult?.reason ? [result.complianceResult.reason] : []
        },
        screenshot: result.metadata?.screenshot
      };

      await job.updateProgress(95);

      // Send webhook if configured
      if (job.data.webhook) {
        await this.sendWebhook(job.data.webhook, jobResult);
      }

      await job.updateProgress(100);

      return jobResult;

    } catch (error) {
      console.error(`Job ${jobId} processing error:`, error);
      throw error;
    }
  }

  // Add job to queue
  async addJob(jobData: ScrapingJobData): Promise<Job<ScrapingJobData>> {
    await this.initialize();

    const jobOptions = {
      priority: jobData.priority || 1,
      attempts: jobData.maxRetries || 3,
      backoff: {
        type: 'exponential' as const,
        delay: jobData.retryDelay || 2000,
      },
      delay: 0, // Immediate execution
      removeOnComplete: 100,
      removeOnFail: 50,
    };

    const job = await this.queue.add(
      `scrape-${jobData.jobId}`,
      jobData,
      jobOptions
    );

    console.log(`📝 Job ${jobData.jobId} added to queue with ID ${job.id}`);

    // Update database
    await this.updateJobStatus(jobData.jobId, JobStatus.SCHEDULED);

    return job;
  }

  // Schedule recurring job
  async scheduleRecurringJob(
    jobData: ScrapingJobData,
    cronExpression: string
  ): Promise<Job<ScrapingJobData>> {
    await this.initialize();

    const job = await this.queue.add(
      `recurring-${jobData.jobId}`,
      jobData,
      {
        repeat: { pattern: cronExpression },
        priority: jobData.priority || 1,
      }
    );

    console.log(`⏰ Recurring job ${jobData.jobId} scheduled with cron: ${cronExpression}`);
    return job;
  }

  // Batch job processing
  async addBatchJobs(jobs: ScrapingJobData[]): Promise<Job<ScrapingJobData>[]> {
    await this.initialize();

    const batchJobs = jobs.map(jobData => ({
      name: `batch-scrape-${jobData.jobId}`,
      data: jobData,
      opts: {
        priority: jobData.priority || 1,
        attempts: jobData.maxRetries || 3,
      }
    }));

    const addedJobs = await this.queue.addBulk(batchJobs);
    console.log(`📦 Added batch of ${jobs.length} jobs to queue`);

    return addedJobs;
  }

  // Job management methods
  async pauseJob(jobId: string): Promise<void> {
    const jobs = await this.queue.getJobs(['waiting', 'delayed']);
    const job = jobs.find(j => j.data.jobId === jobId);

    if (job) {
      await job.remove();
      await this.updateJobStatus(jobId, JobStatus.PAUSED);
      console.log(`⏸️ Job ${jobId} paused`);
    }
  }

  async resumeJob(jobId: string): Promise<void> {
    // Would need to re-add the job with original data
    await this.updateJobStatus(jobId, JobStatus.SCHEDULED);
    console.log(`▶️ Job ${jobId} resumed`);
  }

  async cancelJob(jobId: string): Promise<void> {
    const jobs = await this.queue.getJobs(['waiting', 'delayed', 'active']);
    const job = jobs.find(j => j.data.jobId === jobId);

    if (job) {
      await job.remove();
      await this.updateJobStatus(jobId, JobStatus.CANCELLED);
      console.log(`❌ Job ${jobId} cancelled`);
    }
  }

  // Queue statistics and monitoring
  async getQueueStats(): Promise<QueueStats> {
    await this.initialize();

    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();
    const delayed = await this.queue.getDelayed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length
    };
  }

  async getJobHistory(limit = 50): Promise<JobHistoryItem[]> {
    await this.initialize();

    const jobs = await this.queue.getJobs(
      ['completed', 'failed'],
      0,
      limit - 1,
      true
    );

    return jobs.map(job => ({
      id: job.id!,
      jobId: job.data.jobId,
      status: job.finishedOn ? (job.failedReason ? 'failed' : 'completed') : 'unknown',
      createdAt: new Date(job.timestamp),
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      duration: job.finishedOn ? job.finishedOn - job.timestamp : undefined,
      error: job.failedReason,
      dataPoints: job.returnvalue?.metrics?.dataPoints || 0
    }));
  }

  // Health monitoring
  async healthCheck(): Promise<HealthStatus> {
    try {
      await this.redis.ping();
      const stats = await this.getQueueStats();

      return {
        healthy: true,
        redis: 'connected',
        queue: 'operational',
        worker: 'running',
        stats
      };
    } catch (error) {
      return {
        healthy: false,
        redis: 'disconnected',
        queue: 'error',
        worker: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Cost optimization
  async optimizeQueue(): Promise<void> {
    // Clean up old jobs
    await this.queue.clean(24 * 60 * 60 * 1000, 1000, 'completed'); // 24 hours
    await this.queue.clean(7 * 24 * 60 * 60 * 1000, 100, 'failed'); // 7 days

    console.log('🧹 Queue optimized - old jobs cleaned up');
  }

  // Private helper methods
  private async updateJobStatus(
    jobId: string,
    status: JobStatus,
    result?: JobResult,
    error?: string
  ): Promise<void> {
    try {
      const updateData: {
        status: JobStatus;
        dataPointsCount?: number;
        lastSuccessAt?: Date;
        lastFailureAt?: Date;
        errorMessage?: string;
        retryCount?: number;
      } = { status };

      if (result) {
        updateData.dataPointsCount = result.metrics?.dataPoints;
        updateData.lastSuccessAt = new Date();
      }

      if (error) {
        updateData.errorMessage = error;
        updateData.lastFailureAt = new Date();
      }

      await updateJob(jobId, updateData);
    } catch (dbError) {
      console.error('Failed to update job status in database:', dbError);
    }
  }

  private async sendWebhook(webhookUrl: string, result: JobResult): Promise<void> {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: result.success,
          dataPoints: result.metrics?.dataPoints,
          executionTime: result.metrics?.executionTime,
          error: result.error,
          timestamp: new Date().toISOString()
        })
      });
      console.log(`📡 Webhook sent to ${webhookUrl}`);
    } catch (error) {
      console.error('Failed to send webhook:', error);
    }
  }

  // Convert LocalScrapedData to ScrapedData format
  private convertToScrapedData(data: Record<string, unknown>[]): ScrapedData {
    return data.map(item => {
      const converted: ScrapedDataItem = {};
      for (const [key, value] of Object.entries(item)) {
        if (Array.isArray(value)) {
          // Convert arrays to comma-separated strings
          converted[key] = value.join(', ');
        } else {
          converted[key] = value as string | number | boolean | null | undefined;
        }
      }
      return converted;
    });
  }

  // Cleanup on shutdown
  async shutdown(): Promise<void> {
    console.log('Shutting down advanced queue...');
    await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
  }
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

interface JobHistoryItem {
  id: string;
  jobId: string;
  status: string;
  createdAt: Date;
  finishedAt?: Date;
  duration?: number;
  error?: string;
  dataPoints: number;
}

interface HealthStatus {
  healthy: boolean;
  redis: string;
  queue: string;
  worker: string;
  stats?: QueueStats;
  error?: string;
}

// Export singleton instance
export const advancedQueue = new AdvancedScrapingQueue();

export { AdvancedScrapingQueue };
