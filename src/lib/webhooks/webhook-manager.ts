import crypto from 'crypto';
import axios, { type AxiosError } from 'axios';

export interface WebhookEvent {
  id: string;
  type: 'scraper.completed' | 'scraper.failed' | 'scraper.started' | 'data.exported' | 'alert.triggered';
  timestamp: string;
  data: Record<string, any>;
  signature?: string;
}

export interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  retryCount: number;
  timeout: number;
  headers?: Record<string, string>;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: 'pending' | 'success' | 'failed';
  responseStatus?: number;
  responseBody?: string;
  error?: string;
  attempts: number;
  deliveredAt?: Date;
  nextRetryAt?: Date;
}

export class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();

  constructor() {
    this.loadWebhooks();
  }

  // Webhook Management
  async addWebhook(config: Omit<WebhookConfig, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    const webhook: WebhookConfig = {
      id,
      ...config,
      retryCount: config.retryCount || 3,
      timeout: config.timeout || 10000,
      active: config.active !== false
    };

    this.webhooks.set(id, webhook);
    await this.saveWebhooks();
    return id;
  }

  async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<boolean> {
    const webhook = this.webhooks.get(id);
    if (!webhook) return false;

    this.webhooks.set(id, { ...webhook, ...updates });
    await this.saveWebhooks();
    return true;
  }

  async deleteWebhook(id: string): Promise<boolean> {
    const deleted = this.webhooks.delete(id);
    if (deleted) {
      await this.saveWebhooks();
    }
    return deleted;
  }

  getWebhook(id: string): WebhookConfig | undefined {
    return this.webhooks.get(id);
  }

  listWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  // Event Delivery
  async sendEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<string[]> {
    const webhookEvent: WebhookEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event
    };

    const relevantWebhooks = Array.from(this.webhooks.values())
      .filter(webhook =>
        webhook.active &&
        webhook.events.includes(event.type)
      );

    const deliveryPromises = relevantWebhooks.map(webhook =>
      this.deliverEvent(webhook, webhookEvent)
    );

    const results = await Promise.allSettled(deliveryPromises);
    return results
      .filter((result, index) => result.status === 'fulfilled')
      .map((_, index) => relevantWebhooks[index].id);
  }

  private async deliverEvent(webhook: WebhookConfig, event: WebhookEvent): Promise<void> {
    const deliveryId = crypto.randomUUID();
    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: webhook.id,
      eventId: event.id,
      status: 'pending',
      attempts: 0
    };

    this.deliveries.set(deliveryId, delivery);

    try {
      await this.attemptDelivery(webhook, event, delivery);
    } catch (error) {
      console.error(`Webhook delivery failed for ${webhook.id}:`, error);
      await this.scheduleRetry(webhook, event, delivery);
    }
  }

  private async attemptDelivery(
    webhook: WebhookConfig,
    event: WebhookEvent,
    delivery: WebhookDelivery
  ): Promise<void> {
    delivery.attempts++;

    // Create signature
    const signature = this.createSignature(event, webhook.secret);
    event.signature = signature;

    const headers = {
      'Content-Type': 'application/json',
      'X-ScrapeMaster-Event': event.type,
      'X-ScrapeMaster-Signature': signature,
      'X-ScrapeMaster-Delivery': delivery.id,
      'User-Agent': 'ScrapeMaster-Webhook/1.0',
      ...webhook.headers
    };

    try {
      const response = await axios.post(webhook.url, event, {
        headers,
        timeout: webhook.timeout,
        validateStatus: () => true // Don't throw on 4xx/5xx
      });

      delivery.responseStatus = response.status;
      delivery.responseBody = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data);

      if (response.status >= 200 && response.status < 300) {
        delivery.status = 'success';
        delivery.deliveredAt = new Date();
        console.log(`Webhook delivered successfully to ${webhook.url}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      delivery.error = axiosError.message;
      delivery.status = 'failed';

      if (delivery.attempts < webhook.retryCount) {
        await this.scheduleRetry(webhook, event, delivery);
      } else {
        console.error(`Webhook delivery permanently failed for ${webhook.url} after ${delivery.attempts} attempts`);
      }
    }

    this.deliveries.set(delivery.id, delivery);
  }

  private async scheduleRetry(
    webhook: WebhookConfig,
    event: WebhookEvent,
    delivery: WebhookDelivery
  ): Promise<void> {
    // Exponential backoff: 5s, 25s, 125s
    const backoffSeconds = Math.pow(5, delivery.attempts);
    const retryAt = new Date(Date.now() + backoffSeconds * 1000);

    delivery.nextRetryAt = retryAt;
    console.log(`Scheduling webhook retry for ${webhook.url} at ${retryAt.toISOString()}`);

    // In a real implementation, you'd use a job queue like Bull/BullMQ
    setTimeout(() => {
      this.attemptDelivery(webhook, event, delivery);
    }, backoffSeconds * 1000);
  }

  private createSignature(event: WebhookEvent, secret: string): string {
    const payload = JSON.stringify(event);
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  // Verification helper for webhook endpoints
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Delivery Status and Analytics
  getDelivery(id: string): WebhookDelivery | undefined {
    return this.deliveries.get(id);
  }

  getWebhookDeliveries(webhookId: string): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter(delivery => delivery.webhookId === webhookId)
      .sort((a, b) => b.attempts - a.attempts);
  }

  getWebhookStats(webhookId: string): {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
    averageResponseTime: number;
  } {
    const deliveries = this.getWebhookDeliveries(webhookId);
    const successful = deliveries.filter(d => d.status === 'success');
    const failed = deliveries.filter(d => d.status === 'failed');

    return {
      totalDeliveries: deliveries.length,
      successfulDeliveries: successful.length,
      failedDeliveries: failed.length,
      successRate: deliveries.length > 0 ? (successful.length / deliveries.length) * 100 : 0,
      averageResponseTime: 0 // Would calculate from delivery times in real implementation
    };
  }

  // Event Templates
  static createScraperCompletedEvent(data: {
    scraperId: string;
    scraperName: string;
    status: 'success' | 'failed';
    recordsExtracted: number;
    executionTime: number;
    error?: string;
  }): Omit<WebhookEvent, 'id' | 'timestamp'> {
    return {
      type: 'scraper.completed',
      data: {
        scraper: {
          id: data.scraperId,
          name: data.scraperName
        },
        execution: {
          status: data.status,
          recordsExtracted: data.recordsExtracted,
          executionTimeMs: data.executionTime,
          error: data.error
        },
        metadata: {
          source: 'ScrapeMaster',
          version: '1.0'
        }
      }
    };
  }

  static createDataExportedEvent(data: {
    exportId: string;
    format: string;
    recordCount: number;
    downloadUrl: string;
  }): Omit<WebhookEvent, 'id' | 'timestamp'> {
    return {
      type: 'data.exported',
      data: {
        export: {
          id: data.exportId,
          format: data.format,
          recordCount: data.recordCount,
          downloadUrl: data.downloadUrl
        }
      }
    };
  }

  static createAlertEvent(data: {
    alertType: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    source: string;
  }): Omit<WebhookEvent, 'id' | 'timestamp'> {
    return {
      type: 'alert.triggered',
      data: {
        alert: {
          type: data.alertType,
          title: data.title,
          message: data.message,
          source: data.source
        }
      }
    };
  }

  // Persistence (in real implementation, this would use a database)
  private async loadWebhooks(): Promise<void> {
    // Load from database or file
    console.log('Loading webhooks from storage...');
  }

  private async saveWebhooks(): Promise<void> {
    // Save to database or file
    console.log('Saving webhooks to storage...');
  }
}

export const webhookManager = new WebhookManager();
