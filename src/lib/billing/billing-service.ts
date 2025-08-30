// Comprehensive billing and subscription management service
import { PrismaClient } from '@prisma/client';
import { usageTracker, type UsageEvent, BillingMetrics } from './usage-tracker';

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  type: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  price: {
    monthly: number;
    yearly: number;
    currency: 'USD';
  };
  features: {
    scrapeRequests: number;
    dataPoints: number;
    concurrentJobs: number;
    apiCalls: number;
    proxyRequests: number;
    storageGB: number;
    exportRequests: number;
    customScripts: boolean;
    prioritySupport: boolean;
    slaGuarantee: boolean;
    advancedAnalytics: boolean;
    customIntegrations: boolean;
    dedicatedInfrastructure: boolean;
  };
  overage: {
    scrapeRequestCost: number; // per request
    dataPointCost: number; // per data point
    apiCallCost: number; // per call
    proxyRequestCost: number; // per request
    storageCost: number; // per GB per month
  };
}

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  period: { start: Date; end: Date };
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: 'USD';
  dueDate: Date;
  paidAt?: Date;
  paymentMethod?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  type: 'subscription' | 'overage' | 'proxy' | 'storage' | 'addon';
  quantity: number;
  unitPrice: number;
  amount: number;
  period?: { start: Date; end: Date };
  metadata?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  organizationId: string;
  type: 'card' | 'bank_account' | 'paypal';
  provider: 'stripe' | 'paypal' | 'bank';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface BillingAlert {
  id: string;
  organizationId: string;
  type: 'quota_warning' | 'quota_exceeded' | 'payment_failed' | 'invoice_due' | 'plan_upgrade_suggested';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  threshold?: number;
  currentValue?: number;
  isResolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

export class BillingService {
  private prisma: PrismaClient;
  private plans: Map<string, SubscriptionPlan> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
    this.initializePlans();
  }

  private initializePlans(): void {
    const plans: SubscriptionPlan[] = [
      {
        id: 'free',
        name: 'FREE',
        displayName: 'Free',
        type: 'FREE',
        price: { monthly: 0, yearly: 0, currency: 'USD' },
        features: {
          scrapeRequests: 1000,
          dataPoints: 10000,
          concurrentJobs: 1,
          apiCalls: 1000,
          proxyRequests: 500,
          storageGB: 1,
          exportRequests: 10,
          customScripts: false,
          prioritySupport: false,
          slaGuarantee: false,
          advancedAnalytics: false,
          customIntegrations: false,
          dedicatedInfrastructure: false
        },
        overage: {
          scrapeRequestCost: 0.02,
          dataPointCost: 0.002,
          apiCallCost: 0.01,
          proxyRequestCost: 0.005,
          storageCost: 0.10
        }
      },
      {
        id: 'starter',
        name: 'STARTER',
        displayName: 'Starter',
        type: 'STARTER',
        price: { monthly: 19, yearly: 190, currency: 'USD' },
        features: {
          scrapeRequests: 50000,
          dataPoints: 500000,
          concurrentJobs: 3,
          apiCalls: 10000,
          proxyRequests: 5000,
          storageGB: 10,
          exportRequests: 100,
          customScripts: false,
          prioritySupport: false,
          slaGuarantee: false,
          advancedAnalytics: true,
          customIntegrations: false,
          dedicatedInfrastructure: false
        },
        overage: {
          scrapeRequestCost: 0.015,
          dataPointCost: 0.0015,
          apiCallCost: 0.008,
          proxyRequestCost: 0.004,
          storageCost: 0.08
        }
      },
      {
        id: 'pro',
        name: 'PRO',
        displayName: 'Pro',
        type: 'PRO',
        price: { monthly: 59, yearly: 590, currency: 'USD' },
        features: {
          scrapeRequests: 250000,
          dataPoints: 2500000,
          concurrentJobs: 10,
          apiCalls: 50000,
          proxyRequests: 25000,
          storageGB: 100,
          exportRequests: 500,
          customScripts: true,
          prioritySupport: true,
          slaGuarantee: false,
          advancedAnalytics: true,
          customIntegrations: true,
          dedicatedInfrastructure: false
        },
        overage: {
          scrapeRequestCost: 0.01,
          dataPointCost: 0.001,
          apiCallCost: 0.005,
          proxyRequestCost: 0.003,
          storageCost: 0.05
        }
      },
      {
        id: 'enterprise',
        name: 'ENTERPRISE',
        displayName: 'Enterprise',
        type: 'ENTERPRISE',
        price: { monthly: 499, yearly: 4990, currency: 'USD' },
        features: {
          scrapeRequests: -1, // Unlimited
          dataPoints: -1,
          concurrentJobs: -1,
          apiCalls: -1,
          proxyRequests: -1,
          storageGB: 1000,
          exportRequests: -1,
          customScripts: true,
          prioritySupport: true,
          slaGuarantee: true,
          advancedAnalytics: true,
          customIntegrations: true,
          dedicatedInfrastructure: true
        },
        overage: {
          scrapeRequestCost: 0.005,
          dataPointCost: 0.0005,
          apiCallCost: 0.002,
          proxyRequestCost: 0.001,
          storageCost: 0.03
        }
      }
    ];

    for (const plan of plans) {
      this.plans.set(plan.id, plan);
    }
  }

  async createSubscription(organizationId: string, planId: string, billingCycle: 'monthly' | 'yearly'): Promise<void> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    try {
      const now = new Date();
      const periodEnd = new Date();

      if (billingCycle === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      await this.prisma.organization.update({
        where: { id: organizationId },
        data: {
          plan: plan.type,
          currentPeriodEnd: periodEnd,
          // Reset usage counters
          monthlyRequestsUsed: 0,
          // Update limits based on plan
          monthlyRequestLimit: plan.features.scrapeRequests > 0 ? plan.features.scrapeRequests : 999999999,
          maxConcurrentJobs: plan.features.concurrentJobs > 0 ? plan.features.concurrentJobs : 999999999,
          dataRetentionDays: this.getDataRetentionForPlan(plan.type)
        }
      });

      // Create subscription record in payment processor (Stripe, PayPal, etc.)
      // This would integrate with actual payment processor API

      console.log(`✅ Created ${billingCycle} subscription for organization ${organizationId} on ${plan.displayName} plan`);
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  async generateInvoice(organizationId: string, period: { start: Date; end: Date }): Promise<Invoice> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      const plan = this.plans.get(organization.plan.toLowerCase());
      if (!plan) {
        throw new Error(`Plan ${organization.plan} not found`);
      }

      // Get billing metrics for the period
      const metrics = await usageTracker.getBillingMetrics(organizationId, period);

      const items: InvoiceItem[] = [];

      // Add subscription item
      const subscriptionPrice = plan.price.monthly; // Assume monthly for now
      items.push({
        id: `sub_${Date.now()}`,
        description: `${plan.displayName} Plan - ${this.formatPeriod(period)}`,
        type: 'subscription',
        quantity: 1,
        unitPrice: subscriptionPrice,
        amount: subscriptionPrice,
        period
      });

      // Add overage items
      const quota = await usageTracker.getUsageQuota(organizationId);
      if (quota) {
        if (quota.overage.scrapeRequests > 0) {
          const amount = quota.overage.scrapeRequests * plan.overage.scrapeRequestCost;
          items.push({
            id: `overage_requests_${Date.now()}`,
            description: `Overage: ${quota.overage.scrapeRequests} extra scrape requests`,
            type: 'overage',
            quantity: quota.overage.scrapeRequests,
            unitPrice: plan.overage.scrapeRequestCost,
            amount
          });
        }

        if (quota.overage.dataPoints > 0) {
          const amount = quota.overage.dataPoints * plan.overage.dataPointCost;
          items.push({
            id: `overage_datapoints_${Date.now()}`,
            description: `Overage: ${quota.overage.dataPoints} extra data points`,
            type: 'overage',
            quantity: quota.overage.dataPoints,
            unitPrice: plan.overage.dataPointCost,
            amount
          });
        }
      }

      // Add proxy usage charges
      if (metrics.costs.proxyUsage > 0) {
        items.push({
          id: `proxy_usage_${Date.now()}`,
          description: `Proxy usage - ${metrics.usage.totalProxyRequests} requests`,
          type: 'proxy',
          quantity: metrics.usage.totalProxyRequests,
          unitPrice: plan.overage.proxyRequestCost,
          amount: metrics.costs.proxyUsage
        });
      }

      // Add storage charges
      if (metrics.costs.storageCharges > 0) {
        items.push({
          id: `storage_${Date.now()}`,
          description: `Storage overage - ${metrics.usage.totalStorageUsed}GB`,
          type: 'storage',
          quantity: metrics.usage.totalStorageUsed,
          unitPrice: plan.overage.storageCost,
          amount: metrics.costs.storageCharges
        });
      }

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const tax = subtotal * 0.08; // 8% tax (would be calculated based on location)
      const total = subtotal + tax;

      const invoice: Invoice = {
        id: `inv_${Date.now()}_${organizationId}`,
        organizationId,
        invoiceNumber: this.generateInvoiceNumber(),
        period,
        status: 'pending',
        items,
        subtotal,
        tax,
        total,
        currency: 'USD',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return invoice;
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      throw error;
    }
  }

  async processPayment(invoiceId: string, paymentMethodId: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // This would integrate with actual payment processor (Stripe, PayPal, etc.)
      // For now, simulate payment processing

      const success = Math.random() > 0.1; // 90% success rate for simulation

      if (success) {
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2)}`;

        // Update invoice status
        // await this.updateInvoiceStatus(invoiceId, 'paid', { transactionId, paidAt: new Date() });

        return { success: true, transactionId };
      } else {
        return { success: false, error: 'Payment declined by processor' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown payment error' };
    }
  }

  async checkQuotaAndCreateAlert(organizationId: string, eventType: UsageEvent['eventType']): Promise<void> {
    try {
      const quota = await usageTracker.getUsageQuota(organizationId);
      if (!quota) return;

      const alerts: BillingAlert[] = [];

      // Check usage thresholds
      switch (eventType) {
        case 'scrape_request':
          const requestUsage = quota.usage.scrapeRequests / quota.limits.scrapeRequests;
          if (requestUsage >= 0.8 && requestUsage < 1.0) {
            alerts.push({
              id: `alert_${Date.now()}`,
              organizationId,
              type: 'quota_warning',
              severity: 'warning',
              title: 'Scrape Request Quota Warning',
              message: `You've used ${Math.round(requestUsage * 100)}% of your monthly scrape requests`,
              threshold: quota.limits.scrapeRequests,
              currentValue: quota.usage.scrapeRequests,
              isResolved: false,
              createdAt: new Date()
            });
          } else if (requestUsage >= 1.0) {
            alerts.push({
              id: `alert_${Date.now()}`,
              organizationId,
              type: 'quota_exceeded',
              severity: 'critical',
              title: 'Scrape Request Quota Exceeded',
              message: 'You have exceeded your monthly scrape request limit. Overage charges will apply.',
              threshold: quota.limits.scrapeRequests,
              currentValue: quota.usage.scrapeRequests,
              isResolved: false,
              createdAt: new Date()
            });
          }
          break;
      }

      // Save alerts to database
      for (const alert of alerts) {
        // In a real implementation, save to database and send notifications
        console.log(`🚨 Billing Alert: ${alert.title} - ${alert.message}`);
      }
    } catch (error) {
      console.error('Failed to check quota and create alerts:', error);
    }
  }

  async suggestPlanUpgrade(organizationId: string): Promise<{ suggested: boolean; currentPlan: string; suggestedPlan: string; reason: string } | null> {
    try {
      const quota = await usageTracker.getUsageQuota(organizationId);
      if (!quota) return null;

      // Calculate usage patterns
      const requestUsage = quota.limits.scrapeRequests > 0 ? quota.usage.scrapeRequests / quota.limits.scrapeRequests : 0;
      const concurrentJobUsage = quota.limits.concurrentJobs > 0 ? quota.usage.concurrentJobs / quota.limits.concurrentJobs : 0;

      // Suggest upgrade if consistently hitting limits
      if (requestUsage >= 0.9 || concurrentJobUsage >= 0.9) {
        const currentPlanIndex = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'].indexOf(quota.planType);

        if (currentPlanIndex < 3) { // Not already on Enterprise
          const suggestedPlan = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'][currentPlanIndex + 1];

          return {
            suggested: true,
            currentPlan: quota.planType,
            suggestedPlan,
            reason: requestUsage >= 0.9
              ? 'You are consistently hitting your scrape request limits'
              : 'You are consistently hitting your concurrent job limits'
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to suggest plan upgrade:', error);
      return null;
    }
  }

  async getPaymentMethods(organizationId: string): Promise<PaymentMethod[]> {
    // In a real implementation, fetch from payment processor
    return [];
  }

  async addPaymentMethod(organizationId: string, paymentMethodData: any): Promise<PaymentMethod> {
    // In a real implementation, create payment method with processor
    const paymentMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      organizationId,
      type: paymentMethodData.type,
      provider: 'stripe',
      last4: paymentMethodData.last4,
      brand: paymentMethodData.brand,
      expiryMonth: paymentMethodData.expiryMonth,
      expiryYear: paymentMethodData.expiryYear,
      isDefault: true,
      isActive: true,
      createdAt: new Date()
    };

    return paymentMethod;
  }

  getPlans(): SubscriptionPlan[] {
    return Array.from(this.plans.values());
  }

  getPlan(planId: string): SubscriptionPlan | null {
    return this.plans.get(planId) || null;
  }

  private getDataRetentionForPlan(planType: string): number {
    const retention: Record<string, number> = {
      FREE: 7,
      STARTER: 30,
      PRO: 90,
      ENTERPRISE: 365
    };

    return retention[planType] || 7;
  }

  private formatPeriod(period: { start: Date; end: Date }): string {
    const start = period.start.toLocaleDateString();
    const end = period.end.toLocaleDateString();
    return `${start} - ${end}`;
  }

  private generateInvoiceNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `INV-${timestamp}-${random}`.toUpperCase();
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const billingService = new BillingService();
