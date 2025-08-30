interface CaptchaProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
  priority: number; // 1 = highest priority
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  pricing: {
    recaptcha: number;
    hcaptcha: number;
    funcaptcha: number;
    textCaptcha: number;
  };
}

interface CaptchaTask {
  id: string;
  type: 'recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha' | 'funcaptcha' | 'text_captcha' | 'geetest';
  sitekey?: string;
  url: string;
  action?: string; // For reCAPTCHA v3
  minScore?: number; // For reCAPTCHA v3
  data?: string; // For text captchas
  proxy?: {
    type: 'http' | 'socks5';
    host: string;
    port: number;
    username?: string;
    password?: string;
  };
  userAgent?: string;
  cookies?: string;
  status: 'pending' | 'processing' | 'solved' | 'failed' | 'timeout';
  result?: string;
  providerId?: string;
  createdAt: Date;
  solvedAt?: Date;
  cost?: number;
  attempts: number;
  maxAttempts: number;
}

interface CaptchaSolverConfig {
  providers: CaptchaProvider[];
  fallbackStrategy: 'next_provider' | 'retry_same' | 'fail';
  maxRetries: number;
  timeout: number; // seconds
  defaultProxy?: {
    type: 'http' | 'socks5';
    host: string;
    port: number;
    username?: string;
    password?: string;
  };
  budget?: {
    dailyLimit: number;
    monthlyLimit: number;
    currency: 'USD';
  };
}

class CaptchaSolver {
  private config: CaptchaSolverConfig;
  private activeTasks: Map<string, CaptchaTask> = new Map();
  private statistics = {
    totalSolved: 0,
    totalFailed: 0,
    averageSolveTime: 0,
    costToday: 0,
    costThisMonth: 0,
    byProvider: {} as Record<string, { solved: number; failed: number; cost: number }>
  };

  constructor(config: CaptchaSolverConfig) {
    this.config = config;
    this.initializeProviderStats();
  }

  private initializeProviderStats() {
    this.config.providers.forEach(provider => {
      this.statistics.byProvider[provider.name] = {
        solved: 0,
        failed: 0,
        cost: 0
      };
    });
  }

  async solveCaptcha(params: {
    type: CaptchaTask['type'];
    sitekey?: string;
    url: string;
    action?: string;
    minScore?: number;
    data?: string;
    proxy?: CaptchaTask['proxy'];
    userAgent?: string;
    cookies?: string;
    maxAttempts?: number;
  }): Promise<string> {
    const task: CaptchaTask = {
      id: this.generateTaskId(),
      type: params.type,
      sitekey: params.sitekey,
      url: params.url,
      action: params.action,
      minScore: params.minScore,
      data: params.data,
      proxy: params.proxy || this.config.defaultProxy,
      userAgent: params.userAgent,
      cookies: params.cookies,
      status: 'pending',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: params.maxAttempts || this.config.maxRetries
    };

    this.activeTasks.set(task.id, task);

    try {
      const result = await this.processTask(task);
      this.activeTasks.delete(task.id);
      return result;
    } catch (error) {
      this.activeTasks.delete(task.id);
      throw error;
    }
  }

  private async processTask(task: CaptchaTask): Promise<string> {
    const availableProviders = this.getAvailableProviders();

    for (const provider of availableProviders) {
      if (task.attempts >= task.maxAttempts) {
        throw new Error(`Maximum attempts (${task.maxAttempts}) reached for task ${task.id}`);
      }

      try {
        task.attempts++;
        task.providerId = provider.name;
        task.status = 'processing';

        const result = await this.solveWithProvider(task, provider);

        task.status = 'solved';
        task.result = result;
        task.solvedAt = new Date();

        this.updateStatistics(task, provider, 'solved');
        return result;

      } catch (error) {
        console.error(`Provider ${provider.name} failed for task ${task.id}:`, error);
        this.updateStatistics(task, provider, 'failed');

        if (this.config.fallbackStrategy === 'fail') {
          task.status = 'failed';
          throw error;
        }

        // Continue to next provider or retry
        continue;
      }
    }

    task.status = 'failed';
    throw new Error(`All providers failed for task ${task.id}`);
  }

  private async solveWithProvider(task: CaptchaTask, provider: CaptchaProvider): Promise<string> {
    switch (provider.name) {
      case '2captcha':
        return this.solve2Captcha(task, provider);
      case 'anticaptcha':
        return this.solveAntiCaptcha(task, provider);
      case 'capmonster':
        return this.solveCapMonster(task, provider);
      case 'deathbycaptcha':
        return this.solveDeathByCaptcha(task, provider);
      default:
        throw new Error(`Unsupported provider: ${provider.name}`);
    }
  }

  private async solve2Captcha(task: CaptchaTask, provider: CaptchaProvider): Promise<string> {
    const apiKey = provider.apiKey;
    const baseUrl = provider.baseUrl;

    // Submit captcha task
    const submitData = this.build2CaptchaSubmitData(task);
    const submitResponse = await fetch(`${baseUrl}/in.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ key: apiKey, ...submitData }).toString()
    });

    const submitResult = await submitResponse.text();
    if (!submitResult.startsWith('OK|')) {
      throw new Error(`2Captcha submit failed: ${submitResult}`);
    }

    const captchaId = submitResult.split('|')[1];

    // Poll for result
    return this.poll2CaptchaResult(captchaId, provider);
  }

  private build2CaptchaSubmitData(task: CaptchaTask): Record<string, string> {
    const data: Record<string, string> = {
      pageurl: task.url
    };

    switch (task.type) {
      case 'recaptcha_v2':
        data.method = 'userrecaptcha';
        data.googlekey = task.sitekey!;
        break;
      case 'recaptcha_v3':
        data.method = 'userrecaptcha';
        data.googlekey = task.sitekey!;
        data.version = 'v3';
        data.action = task.action || 'verify';
        data.min_score = (task.minScore || 0.3).toString();
        break;
      case 'hcaptcha':
        data.method = 'hcaptcha';
        data.sitekey = task.sitekey!;
        break;
      case 'funcaptcha':
        data.method = 'funcaptcha';
        data.publickey = task.sitekey!;
        break;
      case 'text_captcha':
        data.method = 'post';
        data.body = Buffer.from(task.data!, 'base64').toString('base64');
        break;
    }

    if (task.proxy) {
      data.proxy = `${task.proxy.host}:${task.proxy.port}`;
      data.proxytype = task.proxy.type.toUpperCase();
      if (task.proxy.username && task.proxy.password) {
        data.proxy = `${task.proxy.username}:${task.proxy.password}@${data.proxy}`;
      }
    }

    if (task.userAgent) {
      data.userAgent = task.userAgent;
    }

    if (task.cookies) {
      data.cookies = task.cookies;
    }

    return data;
  }

  private async poll2CaptchaResult(captchaId: string, provider: CaptchaProvider): Promise<string> {
    const maxAttempts = Math.floor(this.config.timeout / 5); // Poll every 5 seconds
    let attempts = 0;

    while (attempts < maxAttempts) {
      await this.sleep(5000); // Wait 5 seconds
      attempts++;

      const response = await fetch(
        `${provider.baseUrl}/res.php?key=${provider.apiKey}&action=get&id=${captchaId}`
      );
      const result = await response.text();

      if (result === 'CAPCHA_NOT_READY') {
        continue;
      }

      if (result.startsWith('OK|')) {
        return result.split('|')[1];
      }

      throw new Error(`2Captcha error: ${result}`);
    }

    throw new Error('2Captcha timeout');
  }

  private async solveAntiCaptcha(task: CaptchaTask, provider: CaptchaProvider): Promise<string> {
    // Similar implementation for AntiCaptcha API
    // This would follow their API documentation
    throw new Error('AntiCaptcha implementation not yet available');
  }

  private async solveCapMonster(task: CaptchaTask, provider: CaptchaProvider): Promise<string> {
    // Similar implementation for CapMonster API
    throw new Error('CapMonster implementation not yet available');
  }

  private async solveDeathByCaptcha(task: CaptchaTask, provider: CaptchaProvider): Promise<string> {
    // Similar implementation for DeathByCaptcha API
    throw new Error('DeathByCaptcha implementation not yet available');
  }

  private getAvailableProviders(): CaptchaProvider[] {
    return this.config.providers
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  private updateStatistics(task: CaptchaTask, provider: CaptchaProvider, result: 'solved' | 'failed') {
    const providerStats = this.statistics.byProvider[provider.name];

    if (result === 'solved') {
      this.statistics.totalSolved++;
      providerStats.solved++;

      if (task.solvedAt && task.createdAt) {
        const solveTime = task.solvedAt.getTime() - task.createdAt.getTime();
        this.statistics.averageSolveTime =
          (this.statistics.averageSolveTime * (this.statistics.totalSolved - 1) + solveTime) /
          this.statistics.totalSolved;
      }

      // Calculate cost
      const cost = this.calculateTaskCost(task, provider);
      task.cost = cost;
      this.statistics.costToday += cost;
      this.statistics.costThisMonth += cost;
      providerStats.cost += cost;

    } else {
      this.statistics.totalFailed++;
      providerStats.failed++;
    }
  }

  private calculateTaskCost(task: CaptchaTask, provider: CaptchaProvider): number {
    switch (task.type) {
      case 'recaptcha_v2':
      case 'recaptcha_v3':
        return provider.pricing.recaptcha;
      case 'hcaptcha':
        return provider.pricing.hcaptcha;
      case 'funcaptcha':
        return provider.pricing.funcaptcha;
      case 'text_captcha':
        return provider.pricing.textCaptcha;
      default:
        return provider.pricing.recaptcha; // Default fallback
    }
  }

  private generateTaskId(): string {
    return `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for monitoring and management
  getStatistics() {
    return { ...this.statistics };
  }

  getActiveTasks(): CaptchaTask[] {
    return Array.from(this.activeTasks.values());
  }

  cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (task && task.status !== 'solved') {
      task.status = 'failed';
      this.activeTasks.delete(taskId);
      return true;
    }
    return false;
  }

  updateConfig(newConfig: Partial<CaptchaSolverConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Health check for providers
  async testProviders(): Promise<Record<string, { healthy: boolean; latency?: number; error?: string }>> {
    const results: Record<string, { healthy: boolean; latency?: number; error?: string }> = {};

    for (const provider of this.config.providers) {
      const startTime = Date.now();
      try {
        // Simple health check - usually balance check
        const response = await fetch(
          `${provider.baseUrl}/res.php?key=${provider.apiKey}&action=getbalance`
        );
        const latency = Date.now() - startTime;

        if (response.ok) {
          results[provider.name] = { healthy: true, latency };
        } else {
          results[provider.name] = { healthy: false, error: `HTTP ${response.status}` };
        }
      } catch (error) {
        results[provider.name] = {
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return results;
  }
}

export { CaptchaSolver, type CaptchaTask, type CaptchaProvider, type CaptchaSolverConfig };
