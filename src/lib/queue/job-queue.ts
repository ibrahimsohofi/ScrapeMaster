import { Queue, Worker, type Job, type QueueOptions, type WorkerOptions } from 'bullmq';
import { getRedisClient } from '@/lib/redis/client';
import prisma from '@/lib/db/prisma';

// Job types and interfaces
export interface ScrapingJobData {
  scraperId: string;
  organizationId: string;
  userId?: string;
  url: string;
  selectors: Record<string, string>;
  settings: {
    engine: 'PLAYWRIGHT' | 'JSDOM' | 'HTTRACK';
    delay: number;
    timeout: number;
    retries: number;
    userAgent?: string;
    viewport?: { width: number; height: number };
    respectRobots: boolean;
    javascript: boolean;
  };
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  webhook?: {
    url: string;
    events: string[];
    secret?: string;
  };
}

export interface WebhookJobData {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  payload: any;
  secret?: string;
  maxRetries: number;
}

export interface ExportJobData {
  organizationId: string;
  userId: string;
  format: 'JSON' | 'CSV' | 'EXCEL';
  filters: {
    dateRange?: { start: string; end: string };
    scraperId?: string;
    status?: string;
  };
  webhook?: {
    url: string;
    secret?: string;
  };
  email?: string;
}

export interface NotificationJobData {
  type: 'email' | 'webhook' | 'in-app';
  recipient: string;
  subject?: string;
  template: string;
  data: Record<string, any>;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
}

// Queue names
export const QUEUE_NAMES = {
  SCRAPING: 'scraping',
  WEBHOOKS: 'webhooks',
  EXPORTS: 'exports',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  CLEANUP: 'cleanup'
} as const;

// Priority mapping
const PRIORITY_MAP = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  URGENT: 20
};

// Base queue configuration
const baseQueueConfig: QueueOptions = {
  connection: getRedisClient() || { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    removeOnComplete: 50, // Keep last 50 completed jobs
    removeOnFail: 100,    // Keep last 100 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Queue Manager Class
export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeQueues();
  }

  private initializeQueues() {
    if (this.isInitialized) return;

    // Only initialize if Redis is available
    const redis = getRedisClient();
    if (!redis) {
      console.warn('⚠️  Redis not available - using database fallback for job queue');
      return;
    }

    try {
      // Create queues
      Object.values(QUEUE_NAMES).forEach(queueName => {
        const queue = new Queue(queueName, {
          ...baseQueueConfig,
          defaultJobOptions: {
            ...baseQueueConfig.defaultJobOptions,
            // Queue-specific configurations
            ...(queueName === QUEUE_NAMES.SCRAPING && {
              attempts: 5,
              backoff: { type: 'exponential', delay: 5000 }
            }),
            ...(queueName === QUEUE_NAMES.WEBHOOKS && {
              attempts: 3,
              backoff: { type: 'fixed', delay: 1000 }
            }),
          }
        });

        this.queues.set(queueName, queue);
        console.log(`✅ Queue '${queueName}' initialized`);
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize queues:', error);
    }
  }

  // Add job to queue
  async addJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: {
      delay?: number;
      priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
      attempts?: number;
      repeat?: { cron: string; tz?: string };
    }
  ): Promise<Job<T> | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      console.error(`Queue '${queueName}' not found`);
      return this.fallbackToDatabase(queueName, jobName, data, options);
    }

    try {
      const job = await queue.add(jobName, data, {
        delay: options?.delay,
        priority: options?.priority ? PRIORITY_MAP[options.priority] : undefined,
        attempts: options?.attempts,
        repeat: options?.repeat,
      });

      console.log(`📥 Job '${jobName}' added to queue '${queueName}' with ID: ${job.id}`);
      return job;
    } catch (error) {
      console.error(`❌ Failed to add job to queue '${queueName}':`, error);
      return this.fallbackToDatabase(queueName, jobName, data, options);
    }
  }

  // Database fallback for when Redis is not available
  private async fallbackToDatabase<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: any
  ): Promise<Job<T> | null> {
    try {
      const queueJob = await prisma.queueJob.create({
        data: {
          queue: queueName,
          name: jobName,
          data: data as any,
          priority: options?.priority && options.priority in PRIORITY_MAP ? PRIORITY_MAP[options.priority as keyof typeof PRIORITY_MAP] : 0,
          maxAttempts: options?.attempts || 3,
          delay: options?.delay,
          status: options?.delay ? 'DELAYED' : 'WAITING',
        }
      });

      console.log(`📥 Job '${jobName}' saved to database queue with ID: ${queueJob.id}`);
      return {
        id: queueJob.id,
        name: jobName,
        data: data,
        opts: options || {}
      } as Job<T>;
    } catch (error) {
      console.error('❌ Failed to save job to database:', error);
      return null;
    }
  }

  // Get queue by name
  getQueue(queueName: string): Queue | null {
    return this.queues.get(queueName) || null;
  }

  // Add worker for a queue
  addWorker(
    queueName: string,
    processor: (job: Job) => Promise<any>,
    options?: WorkerOptions
  ): Worker | null {
    const redis = getRedisClient();
    if (!redis) {
      console.warn(`⚠️  Cannot add worker for '${queueName}' - Redis not available`);
      return null;
    }

    try {
      const worker = new Worker(queueName, processor, {
        connection: redis,
        concurrency: 5,
        ...options
      });

      // Worker event handlers
      worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} in queue '${queueName}' completed`);
      });

      worker.on('failed', (job, err) => {
        console.error(`❌ Job ${job?.id} in queue '${queueName}' failed:`, err);
      });

      worker.on('stalled', (jobId) => {
        console.warn(`⚠️  Job ${jobId} in queue '${queueName}' stalled`);
      });

      this.workers.set(queueName, worker);
      console.log(`👷 Worker for queue '${queueName}' started`);

      return worker;
    } catch (error) {
      console.error(`❌ Failed to create worker for queue '${queueName}':`, error);
      return null;
    }
  }

  // Stop all workers and close queues
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down queue manager...');

    // Close workers
    for (const [queueName, worker] of this.workers) {
      try {
        await worker.close();
        console.log(`✅ Worker for '${queueName}' closed`);
      } catch (error) {
        console.error(`❌ Error closing worker for '${queueName}':`, error);
      }
    }

    // Close queues
    for (const [queueName, queue] of this.queues) {
      try {
        await queue.close();
        console.log(`✅ Queue '${queueName}' closed`);
      } catch (error) {
        console.error(`❌ Error closing queue '${queueName}':`, error);
      }
    }

    this.workers.clear();
    this.queues.clear();
    this.isInitialized = false;
  }

  // Get queue statistics
  async getQueueStats(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };
    } catch (error) {
      console.error(`Error getting stats for queue '${queueName}':`, error);
      return null;
    }
  }

  // Clean old jobs
  async cleanQueue(queueName: string, grace: number = 24 * 60 * 60 * 1000): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) return;

    try {
      await queue.clean(grace, 100, 'completed');
      await queue.clean(grace, 100, 'failed');
      console.log(`🧹 Cleaned old jobs from queue '${queueName}'`);
    } catch (error) {
      console.error(`❌ Error cleaning queue '${queueName}':`, error);
    }
  }
}

// Create singleton queue manager
export const queueManager = new QueueManager();

// Convenient wrapper functions for common job types
export class JobScheduler {
  static async scheduleScrapingJob(data: ScrapingJobData): Promise<Job | null> {
    return queueManager.addJob(
      QUEUE_NAMES.SCRAPING,
      'scrape-website',
      data,
      {
        priority: data.priority,
        attempts: data.settings.retries + 1,
      }
    );
  }

  static async scheduleWebhookJob(data: WebhookJobData, delay?: number): Promise<Job | null> {
    return queueManager.addJob(
      QUEUE_NAMES.WEBHOOKS,
      'send-webhook',
      data,
      {
        delay,
        attempts: data.maxRetries,
        priority: 'NORMAL'
      }
    );
  }

  static async scheduleExportJob(data: ExportJobData): Promise<Job | null> {
    return queueManager.addJob(
      QUEUE_NAMES.EXPORTS,
      'export-data',
      data,
      {
        priority: 'NORMAL',
        attempts: 2
      }
    );
  }

  static async scheduleNotificationJob(data: NotificationJobData, delay?: number): Promise<Job | null> {
    return queueManager.addJob(
      QUEUE_NAMES.NOTIFICATIONS,
      'send-notification',
      data,
      {
        delay,
        priority: data.priority,
        attempts: 3
      }
    );
  }

  static async scheduleRecurringJob(
    queueName: string,
    jobName: string,
    data: any,
    cronExpression: string,
    timezone = 'UTC'
  ): Promise<Job | null> {
    return queueManager.addJob(
      queueName,
      jobName,
      data,
      {
        repeat: {
          cron: cronExpression,
          tz: timezone
        }
      }
    );
  }

  // Schedule cleanup job to run daily
  static async scheduleCleanupJob(): Promise<Job | null> {
    return queueManager.addJob(
      QUEUE_NAMES.CLEANUP,
      'daily-cleanup',
      {},
      {
        repeat: {
          cron: '0 2 * * *', // Daily at 2 AM
          tz: 'UTC'
        }
      }
    );
  }

  // Schedule analytics aggregation job
  static async scheduleAnalyticsJob(): Promise<Job | null> {
    return queueManager.addJob(
      QUEUE_NAMES.ANALYTICS,
      'aggregate-analytics',
      {},
      {
        repeat: {
          cron: '0 */6 * * *', // Every 6 hours
          tz: 'UTC'
        }
      }
    );
  }
}

// Database fallback queue processor (for when Redis is not available)
export class DatabaseQueueProcessor {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  start(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processingInterval = setInterval(() => {
      this.processQueuedJobs();
    }, 5000); // Process every 5 seconds

    console.log('📦 Database queue processor started');
  }

  stop(): void {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('🛑 Database queue processor stopped');
  }

  private async processQueuedJobs(): Promise<void> {
    try {
      // Get waiting jobs
      const jobs = await prisma.queueJob.findMany({
        where: {
          status: 'WAITING',
          OR: [
            { delay: null },
            { createdAt: { lte: new Date(Date.now() - (5 * 60 * 1000)) } } // 5 minutes delay
          ]
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ],
        take: 10
      });

      for (const job of jobs) {
        await this.processJob(job);
      }
    } catch (error) {
      console.error('❌ Error processing database queue:', error);
    }
  }

  private async processJob(job: any): Promise<void> {
    try {
      await prisma.queueJob.update({
        where: { id: job.id },
        data: { status: 'ACTIVE', processedAt: new Date() }
      });

      // Process job based on queue and name
      // This would call the appropriate processor
      console.log(`🔄 Processing job ${job.id} from queue '${job.queue}'`);

      // Mark as completed
      await prisma.queueJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED' }
      });

    } catch (error) {
      console.error(`❌ Error processing job ${job.id}:`, error);

      // Update attempts and mark as failed if max attempts reached
      const updatedJob = await prisma.queueJob.update({
        where: { id: job.id },
        data: {
          attempts: job.attempts + 1,
          status: job.attempts + 1 >= job.maxAttempts ? 'FAILED' : 'WAITING',
          failedAt: job.attempts + 1 >= job.maxAttempts ? new Date() : null
        }
      });
    }
  }
}

// Create database queue processor instance
export const dbQueueProcessor = new DatabaseQueueProcessor();

// Initialize database queue processor if Redis is not available
if (!getRedisClient()) {
  dbQueueProcessor.start();
}

export default queueManager;
