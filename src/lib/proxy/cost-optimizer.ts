import { EventEmitter } from 'events';
import { ProxyProvider, ProviderStats } from './enhanced-provider-manager';

export interface CostOptimizationReport {
  currentCost: number;
  projectedCost: number;
  potentialSavings: number;
  recommendations: CostRecommendation[];
  topCostDrivers: CostDriver[];
  efficiencyScore: number;
  timeframe: string;
}

export interface CostRecommendation {
  type: 'provider_switch' | 'volume_optimization' | 'timing_optimization' | 'feature_adjustment';
  priority: 'high' | 'medium' | 'low';
  description: string;
  potentialSavings: number;
  implementation: string;
  impact: 'immediate' | 'short_term' | 'long_term';
}

export interface CostDriver {
  providerId: string;
  providerName: string;
  cost: number;
  percentage: number;
  requests: number;
  efficiency: number;
}

export interface BudgetAlert {
  type: 'approaching_limit' | 'exceeded_limit' | 'spike_detected' | 'inefficient_usage';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  currentSpend: number;
  budgetLimit: number;
  timeframe: string;
  recommendations: string[];
}

export interface PricingModel {
  providerId: string;
  tiers: PricingTier[];
  discounts: VolumeDiscount[];
  penalties: UsagePenalty[];
}

export interface PricingTier {
  name: string;
  minVolume: number;
  maxVolume: number;
  ratePerGB: number;
  ratePerRequest: number;
  monthlyFee: number;
}

export interface VolumeDiscount {
  minVolume: number;
  discountPercent: number;
  description: string;
}

export interface UsagePenalty {
  condition: string;
  penalty: number;
  description: string;
}

export class ProxyCostOptimizer extends EventEmitter {
  private costHistory: Map<string, CostRecord[]> = new Map();
  private budgetLimits: Map<string, BudgetLimit> = new Map();
  private pricingModels: Map<string, PricingModel> = new Map();
  private alertThresholds: AlertThresholds;

  constructor() {
    super();
    this.alertThresholds = {
      budgetWarning: 0.80, // 80% of budget
      budgetCritical: 0.95, // 95% of budget
      spikeThreshold: 2.0, // 200% of normal usage
      inefficiencyThreshold: 0.60 // Below 60% efficiency
    };
    this.initializePricingModels();
  }

  // Initialize pricing models for different providers
  private initializePricingModels() {
    // BrightData pricing model
    this.pricingModels.set('brightdata', {
      providerId: 'brightdata',
      tiers: [
        {
          name: 'Starter',
          minVolume: 0,
          maxVolume: 40,
          ratePerGB: 15.00,
          ratePerRequest: 0,
          monthlyFee: 0
        },
        {
          name: 'Growth',
          minVolume: 40,
          maxVolume: 300,
          ratePerGB: 11.25,
          ratePerRequest: 0,
          monthlyFee: 0
        },
        {
          name: 'Scale',
          minVolume: 300,
          maxVolume: 1000,
          ratePerGB: 7.50,
          ratePerRequest: 0,
          monthlyFee: 0
        }
      ],
      discounts: [
        { minVolume: 1000, discountPercent: 15, description: 'Enterprise volume discount' },
        { minVolume: 5000, discountPercent: 25, description: 'Large enterprise discount' }
      ],
      penalties: [
        { condition: 'burst_usage', penalty: 1.5, description: 'Burst usage multiplier' }
      ]
    });

    // Oxylabs pricing model
    this.pricingModels.set('oxylabs', {
      providerId: 'oxylabs',
      tiers: [
        {
          name: 'Micro',
          minVolume: 0,
          maxVolume: 30,
          ratePerGB: 12.00,
          ratePerRequest: 0,
          monthlyFee: 0
        },
        {
          name: 'Starter',
          minVolume: 30,
          maxVolume: 100,
          ratePerGB: 9.00,
          ratePerRequest: 0,
          monthlyFee: 0
        },
        {
          name: 'Advanced',
          minVolume: 100,
          maxVolume: 500,
          ratePerGB: 6.00,
          ratePerRequest: 0,
          monthlyFee: 0
        }
      ],
      discounts: [
        { minVolume: 500, discountPercent: 20, description: 'Volume discount' }
      ],
      penalties: []
    });
  }

  // Track cost for a specific request
  trackCost(providerId: string, cost: number, dataSize: number, timestamp: Date = new Date()) {
    const history = this.costHistory.get(providerId) || [];
    history.push({
      timestamp,
      cost,
      dataSize,
      requests: 1
    });

    // Keep only last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter(record => record.timestamp >= thirtyDaysAgo);

    this.costHistory.set(providerId, filteredHistory);

    // Check for alerts
    this.checkBudgetAlerts(providerId);
    this.emit('costTracked', { providerId, cost, dataSize, timestamp });
  }

  // Generate comprehensive cost optimization report
  generateOptimizationReport(timeframe = '30d'): CostOptimizationReport {
    const endTime = new Date();
    const startTime = this.getStartTime(timeframe, endTime);

    const totalCost = this.calculateTotalCost(startTime, endTime);
    const projectedCost = this.projectFutureCost(timeframe);
    const recommendations = this.generateRecommendations(startTime, endTime);
    const costDrivers = this.identifyCostDrivers(startTime, endTime);
    const efficiencyScore = this.calculateEfficiencyScore(startTime, endTime);

    const potentialSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);

    return {
      currentCost: totalCost,
      projectedCost,
      potentialSavings,
      recommendations,
      topCostDrivers: costDrivers,
      efficiencyScore,
      timeframe
    };
  }

  // Calculate total cost for a time period
  private calculateTotalCost(startTime: Date, endTime: Date): number {
    let totalCost = 0;

    this.costHistory.forEach(history => {
      history.forEach(record => {
        if (record.timestamp >= startTime && record.timestamp <= endTime) {
          totalCost += record.cost;
        }
      });
    });

    return totalCost;
  }

  // Project future cost based on current trends
  private projectFutureCost(timeframe: string): number {
    const days = this.parseTimeframeToDays(timeframe);
    const recentCost = this.calculateTotalCost(
      new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      new Date()
    );

    // Simple linear projection (could be enhanced with ML)
    const dailyAverage = recentCost / days;
    return dailyAverage * days * 1.1; // Add 10% growth factor
  }

  // Generate cost optimization recommendations
  private generateRecommendations(startTime: Date, endTime: Date): CostRecommendation[] {
    const recommendations: CostRecommendation[] = [];

    // Analyze provider efficiency
    const providerEfficiency = this.analyzeProviderEfficiency(startTime, endTime);
    providerEfficiency.forEach(({ providerId, efficiency, cost }) => {
      if (efficiency < 0.7) {
        recommendations.push({
          type: 'provider_switch',
          priority: cost > 100 ? 'high' : 'medium',
          description: `Consider switching from ${providerId} to a more cost-effective provider`,
          potentialSavings: cost * 0.3,
          implementation: 'Gradually migrate traffic to better-performing providers',
          impact: 'short_term'
        });
      }
    });

    // Check for volume optimization opportunities
    const volumeOptimization = this.analyzeVolumeOptimization();
    if (volumeOptimization.potential > 50) {
      recommendations.push({
        type: 'volume_optimization',
        priority: 'high',
        description: 'Optimize request volumes to reach better pricing tiers',
        potentialSavings: volumeOptimization.potential,
        implementation: 'Consolidate usage to fewer providers to reach volume discounts',
        impact: 'immediate'
      });
    }

    // Timing optimization
    const timingOptimization = this.analyzeTimingOptimization(startTime, endTime);
    if (timingOptimization.savings > 20) {
      recommendations.push({
        type: 'timing_optimization',
        priority: 'medium',
        description: 'Optimize request timing to avoid peak pricing',
        potentialSavings: timingOptimization.savings,
        implementation: 'Schedule non-urgent scraping during off-peak hours',
        impact: 'long_term'
      });
    }

    return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  // Identify top cost drivers
  private identifyCostDrivers(startTime: Date, endTime: Date): CostDriver[] {
    const drivers: CostDriver[] = [];
    const totalCost = this.calculateTotalCost(startTime, endTime);

    this.costHistory.forEach((history, providerId) => {
      let providerCost = 0;
      let providerRequests = 0;

      history.forEach(record => {
        if (record.timestamp >= startTime && record.timestamp <= endTime) {
          providerCost += record.cost;
          providerRequests += record.requests;
        }
      });

      if (providerCost > 0) {
        drivers.push({
          providerId,
          providerName: providerId, // This would be fetched from provider manager
          cost: providerCost,
          percentage: (providerCost / totalCost) * 100,
          requests: providerRequests,
          efficiency: this.calculateProviderEfficiency(providerId, startTime, endTime)
        });
      }
    });

    return drivers.sort((a, b) => b.cost - a.cost).slice(0, 5);
  }

  // Calculate efficiency score
  private calculateEfficiencyScore(startTime: Date, endTime: Date): number {
    const providers = Array.from(this.costHistory.keys());
    let totalEfficiency = 0;

    providers.forEach(providerId => {
      totalEfficiency += this.calculateProviderEfficiency(providerId, startTime, endTime);
    });

    return providers.length > 0 ? totalEfficiency / providers.length : 0;
  }

  // Calculate provider efficiency
  private calculateProviderEfficiency(providerId: string, startTime: Date, endTime: Date): number {
    const history = this.costHistory.get(providerId) || [];
    let totalCost = 0;
    let totalData = 0;

    history.forEach(record => {
      if (record.timestamp >= startTime && record.timestamp <= endTime) {
        totalCost += record.cost;
        totalData += record.dataSize;
      }
    });

    if (totalData === 0) return 0;

    const costPerGB = totalCost / (totalData / (1024 * 1024 * 1024));
    const benchmarkCost = 10; // $10 per GB as benchmark

    return Math.max(0, Math.min(100, (benchmarkCost / costPerGB) * 100));
  }

  // Analyze provider efficiency across all providers
  private analyzeProviderEfficiency(startTime: Date, endTime: Date) {
    return Array.from(this.costHistory.keys()).map(providerId => ({
      providerId,
      efficiency: this.calculateProviderEfficiency(providerId, startTime, endTime) / 100,
      cost: this.calculateProviderCost(providerId, startTime, endTime)
    }));
  }

  // Calculate cost for a specific provider
  private calculateProviderCost(providerId: string, startTime: Date, endTime: Date): number {
    const history = this.costHistory.get(providerId) || [];
    return history
      .filter(record => record.timestamp >= startTime && record.timestamp <= endTime)
      .reduce((sum, record) => sum + record.cost, 0);
  }

  // Analyze volume optimization opportunities
  private analyzeVolumeOptimization() {
    // This would analyze current volume vs pricing tiers
    // and identify opportunities to consolidate usage
    return { potential: 75 }; // Placeholder
  }

  // Analyze timing optimization opportunities
  private analyzeTimingOptimization(startTime: Date, endTime: Date) {
    // This would analyze usage patterns and identify
    // opportunities to shift usage to lower-cost times
    return { savings: 25 }; // Placeholder
  }

  // Check for budget alerts
  private checkBudgetAlerts(providerId: string) {
    const budget = this.budgetLimits.get(providerId);
    if (!budget) return;

    const currentSpend = this.calculateCurrentSpend(providerId, budget.timeframe);
    const percentage = currentSpend / budget.limit;

    if (percentage >= this.alertThresholds.budgetCritical) {
      this.emitBudgetAlert({
        type: 'exceeded_limit',
        severity: 'critical',
        message: `Budget exceeded for provider ${providerId}`,
        currentSpend,
        budgetLimit: budget.limit,
        timeframe: budget.timeframe,
        recommendations: ['Pause non-critical scraping', 'Switch to cheaper provider']
      });
    } else if (percentage >= this.alertThresholds.budgetWarning) {
      this.emitBudgetAlert({
        type: 'approaching_limit',
        severity: 'warning',
        message: `Approaching budget limit for provider ${providerId}`,
        currentSpend,
        budgetLimit: budget.limit,
        timeframe: budget.timeframe,
        recommendations: ['Monitor usage closely', 'Consider optimization']
      });
    }
  }

  // Calculate current spend for a provider
  private calculateCurrentSpend(providerId: string, timeframe: string): number {
    const days = this.parseTimeframeToDays(timeframe);
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.calculateProviderCost(providerId, startTime, new Date());
  }

  // Emit budget alert
  private emitBudgetAlert(alert: BudgetAlert) {
    this.emit('budgetAlert', alert);
  }

  // Set budget limit for a provider
  setBudgetLimit(providerId: string, limit: number, timeframe: string) {
    this.budgetLimits.set(providerId, { limit, timeframe });
  }

  // Get budget status
  getBudgetStatus(providerId: string) {
    const budget = this.budgetLimits.get(providerId);
    if (!budget) return null;

    const currentSpend = this.calculateCurrentSpend(providerId, budget.timeframe);
    return {
      limit: budget.limit,
      spent: currentSpend,
      remaining: budget.limit - currentSpend,
      percentage: (currentSpend / budget.limit) * 100,
      timeframe: budget.timeframe
    };
  }

  // Helper methods
  private getStartTime(timeframe: string, endTime: Date): Date {
    const days = this.parseTimeframeToDays(timeframe);
    return new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private parseTimeframeToDays(timeframe: string): number {
    const match = timeframe.match(/(\d+)([dwmy])/);
    if (!match) return 30; // Default to 30 days

    const [, value, unit] = match;
    const num = Number.parseInt(value);

    switch (unit) {
      case 'd': return num;
      case 'w': return num * 7;
      case 'm': return num * 30;
      case 'y': return num * 365;
      default: return 30;
    }
  }
}

// Types for internal use
interface CostRecord {
  timestamp: Date;
  cost: number;
  dataSize: number;
  requests: number;
}

interface BudgetLimit {
  limit: number;
  timeframe: string;
}

interface AlertThresholds {
  budgetWarning: number;
  budgetCritical: number;
  spikeThreshold: number;
  inefficiencyThreshold: number;
}

// Export singleton instance
export const proxyCostOptimizer = new ProxyCostOptimizer();
