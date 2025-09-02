import type { EnhancedProxyProvider } from './enhanced-manager';

interface MLFeatures {
  responseTime: number;
  successRate: number;
  cost: number;
  reliability: number;
  geoCoverage: number;
  features: number;
  currentLoad: number;
  timeOfDay: number;
  dayOfWeek: number;
  targetComplexity: number;
}

interface ProxyPerformancePrediction {
  expectedResponseTime: number;
  expectedSuccessRate: number;
  confidence: number;
  recommendedConcurrency: number;
}

interface LearningData {
  features: MLFeatures;
  actualPerformance: {
    responseTime: number;
    successRate: number;
    cost: number;
  };
  timestamp: Date;
  context: {
    targetUrl: string;
    requestType: string;
    payloadSize: number;
  };
}

export class MLProxySelector {
  private learningHistory: Map<string, LearningData[]> = new Map();
  private performanceModels: Map<string, PerformanceModel> = new Map();
  private featureWeights: MLFeatureWeights;
  private adaptiveLearningRate = 0.1;

  constructor() {
    this.featureWeights = this.initializeFeatureWeights();
    this.loadModelsFromStorage();
  }

  // Advanced ML-inspired selection algorithm
  async selectOptimalProxyWithML(
    providers: EnhancedProxyProvider[],
    context: RequestContext
  ): Promise<MLProxySelection | null> {
    const predictions = await Promise.all(
      providers.map(provider => this.predictPerformance(provider, context))
    );

    // Multi-objective optimization
    const scoredProviders = providers.map((provider, index) => {
      const prediction = predictions[index];
      const score = this.calculateMultiObjectiveScore(provider, prediction, context);

      return {
        provider,
        prediction,
        score: score.totalScore,
        reasoning: score.reasoning,
        confidence: prediction.confidence
      };
    });

    // Sort by score and confidence
    scoredProviders.sort((a, b) => {
      const scoreA = a.score * a.confidence;
      const scoreB = b.score * b.confidence;
      return scoreB - scoreA;
    });

    const best = scoredProviders[0];
    if (!best || best.score < 0.3) return null;

    return {
      provider: best.provider,
      prediction: best.prediction,
      score: best.score,
      confidence: best.confidence,
      reasoning: best.reasoning,
      alternativeProviders: scoredProviders.slice(1, 4).map(p => ({
        provider: p.provider,
        score: p.score,
        confidence: p.confidence
      }))
    };
  }

  // Main method called by enhanced provider manager
  async selectBestProxy(
    providers: EnhancedProxyProvider[],
    context: RequestContext
  ): Promise<MLProxySelection | null> {
    return await this.selectOptimalProxyWithML(providers, context);
  }

  // Predict performance using learned patterns
  private async predictPerformance(
    provider: EnhancedProxyProvider,
    context: RequestContext
  ): Promise<ProxyPerformancePrediction> {
    const features = this.extractFeatures(provider, context);
    const model = this.getOrCreateModel(provider.name);

    // Use historical data to predict performance
    const prediction = model.predict(features);

    // Calculate confidence based on data availability and variance
    const confidence = this.calculatePredictionConfidence(provider.name, features);

    const result: ProxyPerformancePrediction = {
      expectedResponseTime: prediction.responseTime,
      expectedSuccessRate: prediction.successRate,
      confidence,
      recommendedConcurrency: 0 // Will be set below
    };

    result.recommendedConcurrency = this.calculateOptimalConcurrency(provider, result);

    return result;
  }

  // Extract ML features from provider and context
  private extractFeatures(provider: EnhancedProxyProvider, context: RequestContext): MLFeatures {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    return {
      responseTime: provider.performanceMetrics.responseTime / 1000, // Normalize to seconds
      successRate: provider.performanceMetrics.successRate,
      cost: provider.costMetrics.costPerGB / 20, // Normalize to 0-1 range
      reliability: provider.performanceMetrics.uptime,
      geoCoverage: provider.geoCoverage.countries.length / 100, // Normalize
      features: this.calculateFeatureScore(provider),
      currentLoad: provider.performanceMetrics.concurrentConnections / 1000, // Normalize
      timeOfDay: hour / 24,
      dayOfWeek: dayOfWeek / 7,
      targetComplexity: this.assessTargetComplexity(context.targetUrl)
    };
  }

  // Calculate multi-objective optimization score
  private calculateMultiObjectiveScore(
    provider: EnhancedProxyProvider,
    prediction: ProxyPerformancePrediction,
    context: RequestContext
  ): { totalScore: number; reasoning: string[] } {
    const reasoning: string[] = [];
    let totalScore = 0;

    // Performance objective (40% weight)
    const performanceScore = this.calculatePerformanceObjective(prediction, context);
    totalScore += performanceScore * 0.4;
    reasoning.push(`Performance: ${(performanceScore * 100).toFixed(1)}%`);

    // Cost objective (25% weight)
    const costScore = this.calculateCostObjective(provider, context);
    totalScore += costScore * 0.25;
    reasoning.push(`Cost efficiency: ${(costScore * 100).toFixed(1)}%`);

    // Reliability objective (20% weight)
    const reliabilityScore = prediction.expectedSuccessRate;
    totalScore += reliabilityScore * 0.2;
    reasoning.push(`Reliability: ${(reliabilityScore * 100).toFixed(1)}%`);

    // Geo-compliance objective (10% weight)
    const geoScore = this.calculateGeoCompliance(provider, context);
    totalScore += geoScore * 0.1;
    reasoning.push(`Geo compliance: ${(geoScore * 100).toFixed(1)}%`);

    // Innovation bonus (5% weight) - favor learning from new providers
    const innovationScore = this.calculateInnovationBonus(provider.name);
    totalScore += innovationScore * 0.05;
    reasoning.push(`Innovation bonus: ${(innovationScore * 100).toFixed(1)}%`);

    return { totalScore: Math.min(1, totalScore), reasoning };
  }

  // Learn from actual performance results
  async learnFromPerformance(
    providerName: string,
    context: RequestContext,
    actualPerformance: ActualPerformance
  ): Promise<void> {
    const provider = this.findProvider(providerName);
    if (!provider) return;

    const features = this.extractFeatures(provider, context);
    const learningData: LearningData = {
      features,
      actualPerformance,
      timestamp: new Date(),
      context: {
        targetUrl: context.targetUrl,
        requestType: context.requestType || 'GET',
        payloadSize: context.payloadSize || 0
      }
    };

    // Store learning data
    if (!this.learningHistory.has(providerName)) {
      this.learningHistory.set(providerName, []);
    }

    const history = this.learningHistory.get(providerName)!;
    history.push(learningData);

    // Keep only recent data (last 1000 records)
    if (history.length > 1000) {
      history.shift();
    }

    // Update model with new data
    await this.updateModel(providerName, learningData);

    // Adapt feature weights based on prediction accuracy
    this.adaptFeatureWeights(learningData);
  }

  // Update performance model with new learning data
  private async updateModel(providerName: string, data: LearningData): Promise<void> {
    const model = this.getOrCreateModel(providerName);

    // Simple gradient descent update (in production, use more sophisticated ML)
    const prediction = model.predict(data.features);
    const error = {
      responseTime: data.actualPerformance.responseTime - prediction.responseTime,
      successRate: data.actualPerformance.successRate - prediction.successRate
    };

    // Update model weights
    model.updateWeights(data.features, error, this.adaptiveLearningRate);

    // Adjust learning rate based on recent performance
    this.adjustLearningRate(providerName, error);
  }

  // Calculate prediction confidence
  private calculatePredictionConfidence(providerName: string, features: MLFeatures): number {
    const history = this.learningHistory.get(providerName) || [];

    if (history.length < 10) return 0.5; // Low confidence for new providers

    // Calculate confidence based on historical variance and data recency
    const recentData = history.slice(-50);
    const variance = this.calculateFeatureVariance(recentData, features);
    const dataRecency = this.calculateDataRecency(recentData);

    // High variance = low confidence, recent data = high confidence
    const varianceScore = Math.max(0, 1 - variance);
    const recencyScore = dataRecency;

    return (varianceScore * 0.6 + recencyScore * 0.4) * Math.min(1, history.length / 100);
  }

  // Adaptive learning and optimization
  private adaptFeatureWeights(data: LearningData): void {
    const features = data.features;
    const performance = data.actualPerformance;

    // Increase weight for features that correlate with good performance
    if (performance.successRate > 0.95 && performance.responseTime < 2000) {
      // Reward current feature combination
      Object.keys(features).forEach(key => {
        const featureKey = key as keyof MLFeatures;
        this.featureWeights[featureKey] *= 1.01; // Small increase
      });
    } else if (performance.successRate < 0.8 || performance.responseTime > 5000) {
      // Penalize current feature combination
      Object.keys(features).forEach(key => {
        const featureKey = key as keyof MLFeatures;
        this.featureWeights[featureKey] *= 0.99; // Small decrease
      });
    }

    // Normalize weights to prevent drift
    this.normalizeFeatureWeights();
  }

  // Calculate optimal concurrency for provider
  private calculateOptimalConcurrency(
    provider: EnhancedProxyProvider,
    prediction: ProxyPerformancePrediction
  ): number {
    const baseCapacity = provider.performanceMetrics.concurrentConnections;
    const reliabilityFactor = prediction.expectedSuccessRate;
    const performanceFactor = Math.max(0.1, 1 - (prediction.expectedResponseTime / 10000));

    return Math.floor(baseCapacity * reliabilityFactor * performanceFactor * 0.8); // 80% safety margin
  }

  // Utility methods
  private calculateFeatureScore(provider: EnhancedProxyProvider): number {
    const features = provider.features;
    let score = 0;

    if (features.staticResidential) score += 0.2;
    if (features.rotatingResidential) score += 0.2;
    if (features.mobile) score += 0.15;
    if (features.stickySession) score += 0.15;
    if (features.ipWhitelisting) score += 0.1;
    if (features.customHeaders) score += 0.1;
    if (features.httpsTunnel) score += 0.1;

    return score;
  }

  private assessTargetComplexity(url: string): number {
    // Simple heuristic for target complexity
    let complexity = 0.5; // Base complexity

    if (url.includes('login') || url.includes('auth')) complexity += 0.3;
    if (url.includes('api')) complexity += 0.2;
    if (url.includes('search')) complexity += 0.1;
    if (url.includes('dynamic') || url.includes('ajax')) complexity += 0.2;

    return Math.min(1, complexity);
  }

  private calculatePerformanceObjective(
    prediction: ProxyPerformancePrediction,
    context: RequestContext
  ): number {
    const maxAcceptableLatency = context.maxLatency || 5000;
    const minAcceptableSuccess = context.minSuccessRate || 0.9;

    const latencyScore = Math.max(0, (maxAcceptableLatency - prediction.expectedResponseTime) / maxAcceptableLatency);
    const successScore = Math.max(0, (prediction.expectedSuccessRate - minAcceptableSuccess) / (1 - minAcceptableSuccess));

    return (latencyScore * 0.6 + successScore * 0.4);
  }

  private calculateCostObjective(provider: EnhancedProxyProvider, context: RequestContext): number {
    const budget = context.budget || 20; // $20/GB default budget
    const costEfficiency = Math.max(0, (budget - provider.costMetrics.costPerGB) / budget);

    return costEfficiency;
  }

  private calculateGeoCompliance(provider: EnhancedProxyProvider, context: RequestContext): number {
    if (!context.requiredCountry) return 1;

    return provider.geoCoverage.countries.includes(context.requiredCountry) ? 1 : 0;
  }

  private calculateInnovationBonus(providerName: string): number {
    const history = this.learningHistory.get(providerName) || [];

    // Give bonus to providers with less data (encourage exploration)
    if (history.length < 50) return 0.8;
    if (history.length < 100) return 0.5;
    if (history.length < 200) return 0.2;

    return 0;
  }

  // Model and data management
  private getOrCreateModel(providerName: string): PerformanceModel {
    if (!this.performanceModels.has(providerName)) {
      this.performanceModels.set(providerName, new PerformanceModel());
    }
    return this.performanceModels.get(providerName)!;
  }

  private findProvider(name: string): EnhancedProxyProvider | null {
    // This would be injected or accessed from the enhanced proxy manager
    return null; // Placeholder
  }

  private initializeFeatureWeights(): MLFeatureWeights {
    return {
      responseTime: 1.0,
      successRate: 1.0,
      cost: 1.0,
      reliability: 1.0,
      geoCoverage: 1.0,
      features: 1.0,
      currentLoad: 1.0,
      timeOfDay: 0.5,
      dayOfWeek: 0.3,
      targetComplexity: 0.8
    };
  }

  private normalizeFeatureWeights(): void {
    const sum = Object.values(this.featureWeights).reduce((a, b) => a + b, 0);
    Object.keys(this.featureWeights).forEach(key => {
      const featureKey = key as keyof MLFeatureWeights;
      this.featureWeights[featureKey] /= sum;
    });
  }

  private loadModelsFromStorage(): void {
    // In production, load from persistent storage
    // For now, initialize empty models
  }

  private calculateFeatureVariance(data: LearningData[], currentFeatures: MLFeatures): number {
    if (data.length < 2) return 1;

    // Calculate variance for key features
    const variances = Object.keys(currentFeatures).map(key => {
      const featureKey = key as keyof MLFeatures;
      const values = data.map(d => d.features[featureKey]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      return variance;
    });

    return variances.reduce((a, b) => a + b, 0) / variances.length;
  }

  private calculateDataRecency(data: LearningData[]): number {
    if (data.length === 0) return 0;

    const now = Date.now();
    const avgAge = data.reduce((sum, d) => sum + (now - d.timestamp.getTime()), 0) / data.length;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    return Math.max(0, 1 - (avgAge / maxAge));
  }

  private adjustLearningRate(providerName: string, error: { responseTime: number; successRate: number }): void {
    const avgError = (Math.abs(error.responseTime) + Math.abs(error.successRate)) / 2;

    if (avgError > 0.5) {
      this.adaptiveLearningRate = Math.min(0.3, this.adaptiveLearningRate * 1.1);
    } else if (avgError < 0.1) {
      this.adaptiveLearningRate = Math.max(0.01, this.adaptiveLearningRate * 0.9);
    }
  }
}

// Simple performance model (in production, use more sophisticated ML models)
class PerformanceModel {
  private weights: { [key: string]: number } = {};
  private bias = 0;

  constructor() {
    // Initialize random weights
    this.initializeWeights();
  }

  predict(features: MLFeatures): { responseTime: number; successRate: number } {
    let responseTime = this.bias;
    let successRate = 0.5; // Base success rate

    Object.entries(features).forEach(([key, value]) => {
      const weight = this.weights[key] || 0;
      responseTime += value * weight;
      successRate += value * weight * 0.1; // Simpler model for success rate
    });

    return {
      responseTime: Math.max(100, responseTime), // Minimum 100ms
      successRate: Math.max(0, Math.min(1, successRate))
    };
  }

  updateWeights(features: MLFeatures, error: { responseTime: number; successRate: number }, learningRate: number): void {
    // Simple gradient descent
    Object.entries(features).forEach(([key, value]) => {
      if (!this.weights[key]) this.weights[key] = Math.random() * 0.1;
      this.weights[key] -= learningRate * error.responseTime * value;
    });

    this.bias -= learningRate * error.responseTime;
  }

  private initializeWeights(): void {
    const featureNames = ['responseTime', 'successRate', 'cost', 'reliability', 'geoCoverage', 'features', 'currentLoad', 'timeOfDay', 'dayOfWeek', 'targetComplexity'];
    featureNames.forEach(name => {
      this.weights[name] = (Math.random() - 0.5) * 0.2;
    });
  }
}

// Interfaces
interface RequestContext {
  targetUrl: string;
  requestType?: string;
  payloadSize?: number;
  maxLatency?: number;
  minSuccessRate?: number;
  budget?: number;
  requiredCountry?: string;
  priority: 'speed' | 'cost' | 'reliability';
}

interface ActualPerformance {
  responseTime: number;
  successRate: number;
  cost: number;
}

interface MLProxySelection {
  provider: EnhancedProxyProvider;
  prediction: ProxyPerformancePrediction;
  score: number;
  confidence: number;
  reasoning: string[];
  alternativeProviders: Array<{
    provider: EnhancedProxyProvider;
    score: number;
    confidence: number;
  }>;
}

interface MLFeatureWeights {
  responseTime: number;
  successRate: number;
  cost: number;
  reliability: number;
  geoCoverage: number;
  features: number;
  currentLoad: number;
  timeOfDay: number;
  dayOfWeek: number;
  targetComplexity: number;
}

export type { RequestContext, MLProxySelection };
