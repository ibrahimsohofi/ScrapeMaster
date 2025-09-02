import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';

// Basic types for webhook functionality
interface WebhookPayload {
  event: string;
  timestamp: Date;
  data: any;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  payload: WebhookPayload;
  url: string;
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  status: 'pending' | 'delivered' | 'failed';
  error?: string;
  secret?: string;
}

class WebhookService {
  private deliveryQueue = new Map<string, WebhookDelivery>();
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    this.startDeliveryProcessor();
  }

  async createWebhook(data: {
    organizationId: string;
    url: string;
    events: string[];
    secret?: string;
    isActive?: boolean;
  }) {
    try {
      return await prisma.webhook.create({
        data: {
          name: `Webhook ${Date.now()}`,
          organizationId: data.organizationId,
          url: data.url,
          events: data.events,
          secret: data.secret,
          isActive: data.isActive ?? true,
        },
      });
    } catch (error) {
      console.error('Failed to create webhook:', error);
      throw error;
    }
  }

  async getWebhooks(organizationId: string) {
    try {
      return await prisma.webhook.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Failed to get webhooks:', error);
      throw error;
    }
  }

  async updateWebhook(id: string, data: any) {
    try {
      return await prisma.webhook.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Failed to update webhook:', error);
      throw error;
    }
  }

  async deleteWebhook(id: string) {
    try {
      return await prisma.webhook.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      throw error;
    }
  }

  async triggerWebhook(organizationId: string, event: string, data: any) {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: {
          organizationId,
          isActive: true,
          events: {
            path: ['events'],
          } as any
        }
      });

      for (const webhook of webhooks) {
        await this.queueWebhookDelivery(webhook, event, data);
      }
    } catch (error) {
      console.error('Failed to trigger webhook:', error);
      throw error;
    }
  }

  private async queueWebhookDelivery(webhook: any, event: string, data: any) {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date(),
      data,
    };

    const delivery: WebhookDelivery = {
      id: crypto.randomUUID(),
      webhookId: webhook.id,
      payload,
      url: webhook.url,
      attempts: 0,
      maxAttempts: 3,
      scheduledFor: new Date(),
      status: 'pending',
      secret: webhook.secret,
    };

    this.deliveryQueue.set(delivery.id, delivery);
  }

  private startDeliveryProcessor() {
    this.processingInterval = setInterval(async () => {
      await this.processDeliveryQueue();
    }, 5000);
  }

  private async processDeliveryQueue() {
    const now = new Date();
    const pendingDeliveries = Array.from(this.deliveryQueue.values()).filter(
      delivery => delivery.status === 'pending' && delivery.scheduledFor <= now
    );

    for (const delivery of pendingDeliveries) {
      await this.attemptDelivery(delivery);
    }
  }

  private async attemptDelivery(delivery: WebhookDelivery) {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: delivery.webhookId }
      });

      if (!webhook || !webhook.isActive) {
        this.deliveryQueue.delete(delivery.id);
        return;
      }

      delivery.attempts++;

      const response = await this.sendWebhook(webhook, delivery.payload);

      if (response.ok) {
        delivery.status = 'delivered';
        this.deliveryQueue.delete(delivery.id);
        await this.storeDeliveryRecord(delivery, webhook);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      await this.handleDeliveryFailure(delivery, error);
    }
  }

  private async sendWebhook(webhook: any, payload: WebhookPayload) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'TechFlow-Webhooks/1.0',
      'X-TechFlow-Event': payload.event,
      'X-TechFlow-Timestamp': payload.timestamp.toString()
    };

    if (webhook.secret) {
      const signature = this.signPayload(payload, webhook.secret);
      headers['X-TechFlow-Signature'] = signature;
    }

    return fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  private async handleDeliveryFailure(delivery: WebhookDelivery, error: any) {
    delivery.error = error instanceof Error ? error.message : String(error);

    if (delivery.attempts >= delivery.maxAttempts) {
      delivery.status = 'failed';
      this.deliveryQueue.delete(delivery.id);
    } else {
      delivery.scheduledFor = new Date(Date.now() + Math.pow(2, delivery.attempts) * 1000);
    }

    await this.updateDeliveryRecord(delivery);
  }

  private async storeDeliveryRecord(delivery: WebhookDelivery, webhook: any) {
    try {
      await prisma.webhookDelivery.create({
        data: {
          webhookId: delivery.webhookId,
          url: delivery.url,
          event: delivery.payload.event || 'webhook_triggered',
          payload: delivery.payload as any,
          status: delivery.status.toUpperCase() as any,
          attempts: delivery.attempts,
          error: delivery.error,
          organizationId: webhook.organizationId,
        },
      });
    } catch (error) {
      console.error('Failed to store delivery record:', error);
    }
  }

  private signPayload(payload: WebhookPayload, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  private async updateDeliveryRecord(delivery: WebhookDelivery) {
    // Implementation for updating delivery record
    console.log('Updating delivery record:', delivery.id);
  }

  async testWebhook(webhookId: string) {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        return { success: false, error: 'Webhook not found' };
      }

      const testPayload: WebhookPayload = {
        event: 'webhook.test',
        timestamp: new Date(),
        data: {
          message: 'This is a test webhook delivery',
          test: true,
        },
      };

      const startTime = Date.now();
      const response = await this.sendWebhook(webhook, testPayload);
      const deliveryTime = Date.now() - startTime;

      return {
        success: response.ok,
        response: response.status,
        deliveryTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getDeliveryHistory(organizationId: string, webhookId?: string, limit = 50) {
    try {
      const where: any = { organizationId };
      if (webhookId) {
        where.webhookId = webhookId;
      }

      const deliveries = await prisma.webhookDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          webhook: true,
        },
      });

      return deliveries.map(delivery => ({
        id: delivery.id,
        url: delivery.webhook?.url || '',
        status: delivery.status,
        attempts: delivery.attempts,
        error: delivery.error,
        createdAt: delivery.createdAt,
        webhook: delivery.webhook,
      }));
    } catch (error) {
      console.error('Failed to get delivery history:', error);
      return [];
    }
  }

  async getWebhookStats(organizationId: string) {
    try {
      const [total, successful, failed] = await Promise.all([
        prisma.webhookDelivery.count({ where: { organizationId } }),
        prisma.webhookDelivery.count({ where: { organizationId, status: 'DELIVERED' as any } }),
        prisma.webhookDelivery.count({ where: { organizationId, status: 'FAILED' as any } }),
      ]);

      const successRate = total > 0 ? (successful / total) * 100 : 0;

      return {
        totalDeliveries: total,
        successfulDeliveries: successful,
        failedDeliveries: failed,
        avgDeliveryTime: 0, // TODO: Calculate actual average
        successRate,
      };
    } catch (error) {
      console.error('Failed to get webhook stats:', error);
      return {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        avgDeliveryTime: 0,
        successRate: 0,
      };
    }
  }

  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }
}

export default new WebhookService();
