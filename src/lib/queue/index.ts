import { type Job, JobStatus, type ScraperConfig } from '../db/types';
import { updateJob, findJobById } from '../db';
import { quickScrape } from '../scraper';

// Simple in-memory queue for demonstration
// In a production app, we would use a proper queue system like Redis + BullMQ or RabbitMQ

interface QueuedJob {
  id: string;
  jobId: string;
  config: ScraperConfig;
  scheduledAt: Date;
}

class JobQueue {
  private queue: QueuedJob[] = [];
  private running: Set<string> = new Set(); // Set of running job IDs
  private maxConcurrent = 2; // Maximum concurrent jobs
  private processing = false;

  // Add a job to the queue
  enqueue(job: Job): void {
    const config: ScraperConfig = {
      url: job.url,
      selectors: job.selectors,
    };

    const queuedJob: QueuedJob = {
      id: `${job.id}-${Date.now()}`,
      jobId: job.id,
      config,
      scheduledAt: job.nextRun || new Date(),
    };

    this.queue.push(queuedJob);
    this.queue.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

    // Update job status to scheduled
    updateJob(job.id, { status: JobStatus.SCHEDULED });

    // Start processing if not already
    if (!this.processing) {
      this.processQueue();
    }
  }

  // Process the queue
  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
      const now = new Date();
      const nextJob = this.queue.find(job => job.scheduledAt <= now);

      if (!nextJob) {
        // No jobs ready to run yet
        break;
      }

      // Remove from queue
      this.queue = this.queue.filter(job => job.id !== nextJob.id);

      // Add to running set
      this.running.add(nextJob.jobId);

      // Update job status
      updateJob(nextJob.jobId, {
        status: JobStatus.RUNNING,
        lastRun: new Date(),
      });

      // Execute the job
      this.executeJob(nextJob);
    }

    // If there are more jobs and we're not at capacity, continue processing
    if (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
      setTimeout(() => this.processQueue(), 1000);
    } else {
      this.processing = false;
    }
  }

  // Execute a single job
  private async executeJob(queuedJob: QueuedJob): Promise<void> {
    try {
      console.log(`Starting job ${queuedJob.jobId}...`);

      // Run the scraper with enhanced system
      const result = await quickScrape(
        queuedJob.config.url,
        'httrack', // Default to HTTrack engine
        {
          maxDepth: 2,
          maxFiles: 50,
          selectors: queuedJob.config.selectors,
          delay: 1000
        }
      );

      // Job completed successfully
      const job = findJobById(queuedJob.jobId);

      if (job) {
        // Calculate next run based on schedule
        let nextRun: Date | null = null;

        if (job.schedule === 'hourly') {
          nextRun = new Date(Date.now() + 60 * 60 * 1000);
        } else if (job.schedule === 'daily') {
          nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000);
        } else if (job.schedule === 'weekly') {
          nextRun = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }

        // Update job with results
        updateJob(queuedJob.jobId, {
          status: JobStatus.COMPLETED,
          resultsUrl: result.url,
          nextRun,
        });

        // If the job is scheduled, add it back to the queue
        if (nextRun) {
          this.enqueue({
            ...job,
            nextRun,
          });
        }
      }
    } catch (error) {
      console.error(`Error executing job ${queuedJob.jobId}:`, error);

      // Update job status to failed
      updateJob(queuedJob.jobId, {
        status: JobStatus.FAILED,
      });
    } finally {
      // Remove from running set
      this.running.delete(queuedJob.jobId);

      // Continue processing the queue
      if (this.queue.length > 0 && !this.processing) {
        this.processQueue();
      }
    }
  }

  // Cancel a job
  cancelJob(jobId: string): boolean {
    // If the job is in the queue, remove it
    const wasInQueue = this.queue.some(job => job.jobId === jobId);
    this.queue = this.queue.filter(job => job.jobId !== jobId);

    // If the job is running, it will complete but we can mark it as cancelled
    if (this.running.has(jobId)) {
      updateJob(jobId, { status: JobStatus.CANCELLED });
      return true;
    }

    // If the job was in the queue, mark it as cancelled
    if (wasInQueue) {
      updateJob(jobId, { status: JobStatus.CANCELLED });
      return true;
    }

    return false;
  }

  // Get queue status
  getStatus(): { queuedCount: number; runningCount: number } {
    return {
      queuedCount: this.queue.length,
      runningCount: this.running.size,
    };
  }
}

// Create a singleton instance
const jobQueue = new JobQueue();

export default jobQueue;
