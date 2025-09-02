import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import { CaptchaSolver, CaptchaTask } from '../captcha/captcha-solver';
import { getCaptchaConfig, CAPTCHA_SELECTORS } from '../captcha/config';

export interface PlaywrightConfig {
  url: string;
  selectors: Record<string, string>;
  options: {
    browserType?: 'chromium' | 'firefox' | 'webkit';
    headless?: boolean;
    timeout?: number;
    waitTime?: number;
    userAgent?: string;
    viewport?: { width: number; height: number };
    locale?: string;
    timezone?: string;
    javascript?: boolean;
    images?: boolean;
    proxy?: ProxyConfig;
    antiDetection?: AntiDetectionConfig;
    waitConditions?: WaitCondition[];
    captcha?: CaptchaConfig;
  };
}

export interface CaptchaConfig {
  enabled?: boolean;
  autoSolve?: boolean;
  timeout?: number;
  maxAttempts?: number;
  types?: Array<'recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha' | 'funcaptcha' | 'text_captcha'>;
}

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

export interface AntiDetectionConfig {
  randomizeFingerprint?: boolean;
  spoofWebGL?: boolean;
  spoofCanvas?: boolean;
  stealthMode?: boolean;
}

export interface WaitCondition {
  type: 'networkidle' | 'load' | 'domcontentloaded' | 'selector';
  timeout?: number;
  selector?: string;
}

export interface ScrapingResult {
  success: boolean;
  data?: any;
  error?: string;
  url?: string;
  dataPointsCount?: number;
  executionTime?: number;
  complianceResult?: {
    allowed: boolean;
    reason?: string;
  };
  metrics?: {
    pageLoadTime: number;
    networkRequests: number;
    failedRequests: number;
    resourceSizes: Record<string, number>;
  };
  metadata?: {
    screenshot?: string;
    finalUrl?: string;
    responseStatus?: number;
  };
  captcha?: {
    detected: boolean;
    solved: boolean;
    type?: string;
    attempts: number;
    cost?: number;
    solveTime?: number;
    provider?: string;
  };
}

export class PlaywrightScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private captchaSolver: CaptchaSolver | null = null;

  constructor() {
    try {
      const captchaConfig = getCaptchaConfig();
      if (captchaConfig.providers.length > 0) {
        this.captchaSolver = new CaptchaSolver(captchaConfig);
      }
    } catch (error) {
      console.warn('CAPTCHA solver initialization failed:', error);
    }
  }

  async scrape(config: PlaywrightConfig): Promise<ScrapingResult> {
    const startTime = Date.now();
    let page: Page | null = null;

    try {
      // Setup browser
      this.browser = await this.setupBrowser(config);
      this.context = await this.createContext(config);
      page = await this.context.newPage();

      // Setup page
      await this.setupPage(page, config);

      // Navigate to URL
      console.log(`Navigating to: ${config.url}`);
      const response = await page.goto(config.url, {
        waitUntil: 'networkidle',
        timeout: config.options.timeout || 30000,
      });

      if (!response) {
        throw new Error('Failed to navigate to URL');
      }

      // Wait for additional conditions
      await this.waitForConditions(page, config.options.waitConditions || []);

      // Add delay if specified
      if (config.options.waitTime) {
        await page.waitForTimeout(config.options.waitTime);
      }

      // Detect and solve CAPTCHAs if enabled
      const captchaResult = await this.handleCaptchas(page, config);

      // Extract data using selectors
      const extractedData = await this.extractData(page, config.selectors);

      // Calculate metrics
      const executionTime = Date.now() - startTime;
      const metrics = await this.collectMetrics(page);

      // Take screenshot for debugging
      const screenshot = await page.screenshot({ type: 'png' }).catch(() => null);

      return {
        success: true,
        data: extractedData,
        url: config.url,
        dataPointsCount: this.countDataPoints(extractedData),
        executionTime,
        complianceResult: { allowed: true },
        captcha: captchaResult,
        metrics,
        metadata: {
          screenshot: screenshot ? `data:image/png;base64,${screenshot.toString('base64')}` : undefined,
          finalUrl: page.url(),
          responseStatus: response.status(),
        },
      };

    } catch (error) {
      console.error('Playwright scraping error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error',
        url: config.url,
        executionTime: Date.now() - startTime,
        dataPointsCount: 0,
        complianceResult: { allowed: false, reason: 'Scraping failed' },
      };

    } finally {
      // Cleanup
      if (page) {
        await page.close().catch(console.error);
      }
      if (this.context) {
        await this.context.close().catch(console.error);
      }
      if (this.browser) {
        await this.browser.close().catch(console.error);
      }
    }
  }

  private async setupBrowser(config: PlaywrightConfig): Promise<Browser> {
    const launchOptions: any = {
      headless: config.options.headless !== false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-blink-features=AutomationControlled'
      ],
    };

    // Add proxy if specified
    if (config.options.proxy) {
      launchOptions.proxy = config.options.proxy;
    }

    // Anti-detection measures
    if (config.options.antiDetection?.stealthMode) {
      launchOptions.args.push(
        '--disable-blink-features=AutomationControlled',
        '--exclude-switches=enable-automation',
        '--disable-extensions'
      );
    }

    try {
      return await chromium.launch(launchOptions);
    } catch (error) {
      console.error('Failed to launch browser:', error);
      throw new Error('Browser launch failed. Please check Playwright installation.');
    }
  }

  private async createContext(config: PlaywrightConfig): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const contextOptions: any = {
      viewport: config.options.viewport || { width: 1920, height: 1080 },
      userAgent: config.options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: config.options.locale || 'en-US',
      timezoneId: config.options.timezone || 'America/New_York',
      permissions: [],
      ignoreHTTPSErrors: true,
    };

    // JavaScript control
    if (config.options.javascript === false) {
      contextOptions.javaScriptEnabled = false;
    }

    return await this.browser.newContext(contextOptions);
  }

  private async setupPage(page: Page, config: PlaywrightConfig): Promise<void> {
    // Block images if specified
    if (config.options.images === false) {
      await page.route('**/*.{png,jpg,jpeg,gif,svg,webp}', route => route.abort());
    }

    // Anti-detection: Remove automation flags
    if (config.options.antiDetection?.stealthMode) {
      await page.addInitScript(() => {
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });

        // Mock languages and plugins
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });

        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
      });
    }

    // Set timeouts
    page.setDefaultTimeout(config.options.timeout || 30000);
    page.setDefaultNavigationTimeout(config.options.timeout || 30000);
  }

  private async waitForConditions(page: Page, conditions: WaitCondition[]): Promise<void> {
    for (const condition of conditions) {
      try {
        switch (condition.type) {
          case 'networkidle':
            await page.waitForLoadState('networkidle', { timeout: condition.timeout || 5000 });
            break;
          case 'load':
            await page.waitForLoadState('load', { timeout: condition.timeout || 5000 });
            break;
          case 'domcontentloaded':
            await page.waitForLoadState('domcontentloaded', { timeout: condition.timeout || 5000 });
            break;
          case 'selector':
            if (condition.selector) {
              await page.waitForSelector(condition.selector, { timeout: condition.timeout || 5000 });
            }
            break;
        }
      } catch (error) {
        console.warn(`Wait condition ${condition.type} failed:`, error);
        // Continue with other conditions
      }
    }
  }

  private async extractData(page: Page, selectors: Record<string, string>): Promise<any> {
    const results: Record<string, any> = {};

    for (const [key, selector] of Object.entries(selectors)) {
      try {
        const elements = await page.$$(selector);

        if (elements.length === 0) {
          results[key] = null;
          continue;
        }

        // Extract data from all matching elements
        const elementData = await Promise.all(
          elements.map(async (element) => {
            const textContent = await element.textContent();
            const innerHTML = await element.innerHTML().catch(() => null);
            const href = await element.getAttribute('href').catch(() => null);
            const src = await element.getAttribute('src').catch(() => null);
            const value = await element.getAttribute('value').catch(() => null);

            return {
              text: textContent?.trim() || '',
              html: innerHTML,
              href,
              src,
              value,
              attributes: await this.getElementAttributes(element),
            };
          })
        );

        // If only one element, return object directly; otherwise return array
        results[key] = elementData.length === 1 ? elementData[0] : elementData;

      } catch (error) {
        console.warn(`Error extracting data for selector "${selector}":`, error);
        results[key] = {
          error: error instanceof Error ? error.message : 'Extraction failed',
          selector,
        };
      }
    }

    return results;
  }

  private async getElementAttributes(element: any): Promise<Record<string, string>> {
    try {
      return await element.evaluate((el: Element) => {
        const attrs: Record<string, string> = {};
        for (const attr of el.attributes) {
          attrs[attr.name] = attr.value;
        }
        return attrs;
      });
    } catch {
      return {};
    }
  }

  private async collectMetrics(page: Page): Promise<any> {
    try {
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          pageLoadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
          firstContentfulPaint: 0, // Would need additional APIs
        };
      });

      return {
        networkRequests: 0, // Would need request interception
        failedRequests: 0,
        resourceSizes: {},
        ...performanceMetrics,
      };
    } catch {
      return {
        pageLoadTime: 0,
        networkRequests: 0,
        failedRequests: 0,
        resourceSizes: {},
      };
    }
  }

  private countDataPoints(data: any): number {
    if (!data || typeof data !== 'object') return 0;

    let count = 0;
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (value && typeof value === 'object' && 'text' in value) {
        count += 1;
      }
    }
    return count;
  }

  // CAPTCHA Detection and Solving Methods
  private async handleCaptchas(page: Page, config: PlaywrightConfig): Promise<any> {
    const captchaConfig = config.options.captcha;

    if (!captchaConfig?.enabled || !this.captchaSolver) {
      return { detected: false, solved: false, attempts: 0 };
    }

    const detectedCaptcha = await this.detectCaptcha(page);

    if (!detectedCaptcha) {
      return { detected: false, solved: false, attempts: 0 };
    }

    if (!captchaConfig.autoSolve) {
      return {
        detected: true,
        solved: false,
        attempts: 0,
        type: detectedCaptcha.type
      };
    }

    // Attempt to solve the CAPTCHA
    return await this.solveCaptcha(page, detectedCaptcha, captchaConfig);
  }

  private async detectCaptcha(page: Page): Promise<{ type: string; sitekey?: string; element?: any } | null> {
    // Check for reCAPTCHA v2
    for (const selector of CAPTCHA_SELECTORS.RECAPTCHA_V2) {
      const element = await page.$(selector).catch(() => null);
      if (element) {
        const sitekey = await element.getAttribute('data-sitekey').catch(() => null);
        return { type: 'recaptcha_v2', sitekey: sitekey || undefined, element };
      }
    }

    // Check for hCaptcha
    for (const selector of CAPTCHA_SELECTORS.HCAPTCHA) {
      const element = await page.$(selector).catch(() => null);
      if (element) {
        const sitekey = await element.getAttribute('data-sitekey').catch(() => null);
        return { type: 'hcaptcha', sitekey: sitekey || undefined, element };
      }
    }

    // Check for FunCaptcha
    for (const selector of CAPTCHA_SELECTORS.FUNCAPTCHA) {
      const element = await page.$(selector).catch(() => null);
      if (element) {
        const sitekey = await element.getAttribute('data-pkey').catch(() => null);
        return { type: 'funcaptcha', sitekey: sitekey || undefined, element };
      }
    }

    // Check for text-based CAPTCHAs
    for (const selector of CAPTCHA_SELECTORS.TEXT_CAPTCHA) {
      const element = await page.$(selector).catch(() => null);
      if (element) {
        return { type: 'text_captcha', element };
      }
    }

    return null;
  }

  private async solveCaptcha(
    page: Page,
    captcha: { type: string; sitekey?: string; element?: any },
    config: CaptchaConfig
  ): Promise<any> {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = config.maxAttempts || 3;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        let solution: string;

        if (captcha.type === 'text_captcha') {
          // Handle text-based CAPTCHAs
          const imageData = await this.extractCaptchaImage(page, captcha.element);
          solution = await this.captchaSolver!.solveCaptcha({
            type: 'text_captcha',
            url: page.url(),
            data: imageData,
            maxAttempts: 1
          });
        } else {
          // Handle widget-based CAPTCHAs (reCAPTCHA, hCaptcha, etc.)
          solution = await this.captchaSolver!.solveCaptcha({
            type: captcha.type as any,
            sitekey: captcha.sitekey,
            url: page.url(),
            maxAttempts: 1
          });
        }

        // Submit the solution
        const submitted = await this.submitCaptchaSolution(page, captcha, solution);

        if (submitted) {
          const solveTime = Date.now() - startTime;
          return {
            detected: true,
            solved: true,
            type: captcha.type,
            attempts,
            solveTime,
            cost: this.estimateCaptchaCost(captcha.type),
            provider: 'auto-detected'
          };
        }

      } catch (error) {
        console.warn(`CAPTCHA solve attempt ${attempts} failed:`, error);

        if (attempts >= maxAttempts) {
          return {
            detected: true,
            solved: false,
            type: captcha.type,
            attempts,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }

        // Wait before retry
        await page.waitForTimeout(2000);
      }
    }

    return {
      detected: true,
      solved: false,
      type: captcha.type,
      attempts,
      error: 'Max attempts reached'
    };
  }

  private async extractCaptchaImage(page: Page, element: any): Promise<string> {
    // Get the image source
    const src = await element.getAttribute('src');

    if (src && src.startsWith('data:image/')) {
      // Extract base64 data from data URL
      return src.split(',')[1];
    }

    if (src) {
      // Download the image and convert to base64
      const response = await page.request.get(src);
      const buffer = await response.body();
      return buffer.toString('base64');
    }

    // Take a screenshot of the element if no src
    const screenshot = await element.screenshot({ type: 'png' });
    return screenshot.toString('base64');
  }

  private async submitCaptchaSolution(
    page: Page,
    captcha: { type: string; element?: any },
    solution: string
  ): Promise<boolean> {
    try {
      if (captcha.type === 'text_captcha') {
        // Find the input field and submit
        const input = await page.$('input[name*="captcha"], input[type="text"]:near(img[src*="captcha"])').catch(() => null);
        if (input) {
          await input.fill(solution);

          // Look for submit button
          const submitButton = await page.$('button[type="submit"], input[type="submit"], .submit-btn').catch(() => null);
          if (submitButton) {
            await submitButton.click();
            await page.waitForTimeout(2000);
            return true;
          }
        }
      } else {
        // For widget-based CAPTCHAs, inject the solution
        await page.evaluate(({ token, type }: { token: string; type: string }) => {
          if (type === 'recaptcha_v2' || type === 'recaptcha_v3') {
            (window as any).grecaptcha?.execute();
            // Set the response token
            const textarea = document.querySelector('textarea[name="g-recaptcha-response"]') as HTMLTextAreaElement;
            if (textarea) {
              textarea.value = token;
              textarea.style.display = '';
            }
          } else if (type === 'hcaptcha') {
            const textarea = document.querySelector('textarea[name="h-captcha-response"]') as HTMLTextAreaElement;
            if (textarea) {
              textarea.value = token;
            }
          }
        }, { token: solution, type: captcha.type });

        await page.waitForTimeout(1000);
        return true;
      }
    } catch (error) {
      console.warn('Failed to submit CAPTCHA solution:', error);
    }

    return false;
  }

  private estimateCaptchaCost(type: string): number {
    // Rough cost estimates in USD
    switch (type) {
      case 'recaptcha_v2':
      case 'recaptcha_v3':
      case 'hcaptcha':
      case 'funcaptcha':
        return 0.002;
      case 'text_captcha':
        return 0.001;
      default:
        return 0.002;
    }
  }
}

// Export the scraper instance
export const playwrightScraper = new PlaywrightScraper();
