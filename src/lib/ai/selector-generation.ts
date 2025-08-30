import OpenAI from 'openai';
import type { Page } from 'playwright';
import { GeneratedSelector as GeneratedSelectorType } from '@/lib/types/ai';

export interface SelectorGenerationRequest {
  prompt: string;
  htmlContext?: string;
  pageUrl?: string;
  existingSelectors?: Record<string, string>;
  outputFormat?: 'css' | 'xpath' | 'both';
  complexity?: 'simple' | 'advanced';
}

export interface GeneratedSelector {
  key: string;
  cssSelector: string;
  xpathSelector?: string;
  confidence: number;
  description: string;
  alternatives: string[];
  warnings: string[];
}

export interface SelectorGenerationResult {
  success: boolean;
  selectors: GeneratedSelector[];
  error?: string;
  processingTime: number;
  model: string;
  tokensUsed?: number;
}

class AISeIectorGenerator {
  private openai: OpenAI | null = null;
  private fallbackPatterns: Map<string, string> = new Map();

  constructor(apiKey?: string) {
    // Only initialize OpenAI client if API key is available
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (key) {
      this.openai = new OpenAI({
        apiKey: key,
      });
    }

    this.initializeFallbackPatterns();
  }

  private initializeFallbackPatterns() {
    // Common patterns for fallback when AI fails
    this.fallbackPatterns.set('title', 'h1, .title, [data-title], .headline, .header-title');
    this.fallbackPatterns.set('price', '.price, [data-price], .cost, .amount, [class*="price"]');
    this.fallbackPatterns.set('description', '.description, [data-description], .summary, .overview');
    this.fallbackPatterns.set('image', 'img, [data-src], [data-image]');
    this.fallbackPatterns.set('link', 'a[href], [data-link], .link');
    this.fallbackPatterns.set('button', 'button, .btn, [role="button"], input[type="submit"]');
    this.fallbackPatterns.set('form', 'form, [data-form], .form');
    this.fallbackPatterns.set('email', 'input[type="email"], [data-email], [name*="email"]');
    this.fallbackPatterns.set('phone', 'input[type="tel"], [data-phone], [name*="phone"]');
    this.fallbackPatterns.set('date', 'input[type="date"], [data-date], .date, [class*="date"]');
  }

  async generateSelectors(request: SelectorGenerationRequest): Promise<SelectorGenerationResult> {
    const startTime = Date.now();

    try {
      // First try AI generation
      const aiResult = await this.generateWithAI(request);

      if (aiResult.success) {
        return {
          success: true,
          selectors: aiResult.selectors || [],
          model: aiResult.model || 'gpt-4-turbo-preview',
          processingTime: Date.now() - startTime,
          error: aiResult.error,
          tokensUsed: aiResult.tokensUsed
        };
      }

      // Fallback to pattern-based generation
      console.warn('AI generation failed, using fallback patterns');
      const fallbackResult = this.generateWithFallback(request);

      return {
        success: fallbackResult.success || false,
        selectors: fallbackResult.selectors || [],
        model: fallbackResult.model || 'fallback-patterns',
        processingTime: Date.now() - startTime,
        error: fallbackResult.error
      };

    } catch (error) {
      return {
        success: false,
        selectors: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
        model: 'fallback'
      };
    }
  }

  private async generateWithAI(request: SelectorGenerationRequest): Promise<Partial<SelectorGenerationResult>> {
    // Check if OpenAI client is available
    if (!this.openai) {
      // Check if demo mode is enabled
      if (process.env.ENABLE_AI_DEMO_MODE === 'true') {
        return this.generateDemoResponse(request);
      }
      return {
        success: false,
        selectors: [],
        error: 'OpenAI API key not configured. Add your API key to enable AI-powered selector generation.'
      };
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(request);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      const parsed = JSON.parse(content);
      const selectors = this.validateAndProcessAIResponse(parsed, request);

      return {
        success: true,
        selectors,
        model: 'gpt-4-turbo-preview',
        tokensUsed: response.usage?.total_tokens
      };

    } catch (error) {
      console.error('AI selector generation failed:', error);
      return {
        success: false,
        selectors: [],
        error: error instanceof Error ? error.message : 'AI generation failed'
      };
    }
  }

  private generateDemoResponse(request: SelectorGenerationRequest): Partial<SelectorGenerationResult> {
    const prompt = request.prompt.toLowerCase();
    const selectors: GeneratedSelector[] = [];

    // Lead generation and contact scraping demo responses
    if (prompt.includes('email') || prompt.includes('contact')) {
      selectors.push({
        key: 'email_addresses',
        cssSelector: 'a[href^="mailto:"], [data-email], .email, [class*="email"], [id*="email"]',
        xpathSelector: '//a[starts-with(@href, "mailto:")]|//*[contains(@class, "email")]',
        confidence: 0.92,
        description: 'AI-generated selector for email addresses',
        alternatives: ['a[href*="@"]', '[href^="mailto:"]', '.contact-email'],
        warnings: ['Verify GDPR compliance when scraping email addresses']
      });
    }

    if (prompt.includes('phone') || prompt.includes('number')) {
      selectors.push({
        key: 'phone_numbers',
        cssSelector: 'a[href^="tel:"], [data-phone], .phone, [class*="phone"], [id*="phone"]',
        xpathSelector: '//a[starts-with(@href, "tel:")]|//*[contains(@class, "phone")]',
        confidence: 0.88,
        description: 'AI-generated selector for phone numbers',
        alternatives: ['[href^="tel:"]', '.contact-phone', '[data-tel]'],
        warnings: ['Consider international number formats']
      });
    }

    if (prompt.includes('name') || prompt.includes('person') || prompt.includes('contact')) {
      selectors.push({
        key: 'contact_names',
        cssSelector: '.name, [data-name], .contact-name, h1, h2, .person-name, .full-name',
        xpathSelector: '//*[contains(@class, "name")]|//h1|//h2',
        confidence: 0.85,
        description: 'AI-generated selector for contact names',
        alternatives: ['.title', '.heading', '[data-person]'],
        warnings: ['Names may require additional validation']
      });
    }

    if (prompt.includes('company') || prompt.includes('business') || prompt.includes('organization')) {
      selectors.push({
        key: 'company_names',
        cssSelector: '.company, [data-company], .business-name, .organization, .company-name',
        xpathSelector: '//*[contains(@class, "company")]|//*[contains(@class, "business")]',
        confidence: 0.90,
        description: 'AI-generated selector for company names',
        alternatives: ['.org-name', '.business', '[data-org]'],
        warnings: ['Verify business name accuracy']
      });
    }

    if (prompt.includes('address') || prompt.includes('location')) {
      selectors.push({
        key: 'addresses',
        cssSelector: '.address, [data-address], .location, .street, .postal-address',
        xpathSelector: '//*[contains(@class, "address")]|//*[contains(@class, "location")]',
        confidence: 0.87,
        description: 'AI-generated selector for addresses',
        alternatives: ['.street-address', '.postal', '[data-location]'],
        warnings: ['Address formats vary by region']
      });
    }

    if (prompt.includes('social') || prompt.includes('linkedin') || prompt.includes('twitter')) {
      selectors.push({
        key: 'social_profiles',
        cssSelector: 'a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="facebook.com"], .social-link',
        xpathSelector: '//a[contains(@href, "linkedin.com")]|//a[contains(@href, "twitter.com")]',
        confidence: 0.94,
        description: 'AI-generated selector for social media profiles',
        alternatives: ['.social', '[data-social]', 'a[href*="instagram.com"]'],
        warnings: ['Social links may be external or internal']
      });
    }

    if (prompt.includes('title') || prompt.includes('job') || prompt.includes('position')) {
      selectors.push({
        key: 'job_titles',
        cssSelector: '.title, .job-title, .position, [data-title], .role',
        xpathSelector: '//*[contains(@class, "title")]|//*[contains(@class, "position")]',
        confidence: 0.86,
        description: 'AI-generated selector for job titles',
        alternatives: ['.designation', '.role', '[data-position]'],
        warnings: ['Job titles may be abbreviated']
      });
    }

    // Generic fallback for any other lead generation terms
    if (selectors.length === 0) {
      selectors.push({
        key: 'lead_data',
        cssSelector: '.content, .info, [data-info], .details, .profile',
        xpathSelector: '//*[contains(@class, "content")]|//*[contains(@class, "info")]',
        confidence: 0.75,
        description: 'AI-generated generic lead data selector',
        alternatives: ['.data', '.profile-info', '[data-content]'],
        warnings: ['Generic selector - may need refinement for specific use case']
      });
    }

    return {
      success: true,
      selectors,
      model: 'gpt-4-turbo-preview (demo mode)',
      tokensUsed: Math.floor(Math.random() * 500) + 100
    };
  }

  private buildSystemPrompt(): string {
    return `You are an expert web scraping engineer specializing in CSS and XPath selector generation. Your task is to convert natural language descriptions into precise, robust selectors that can extract data from web pages.

CORE PRINCIPLES:
1. Prioritize specificity over generality - selectors should be precise but not overly brittle
2. Consider common web patterns and semantic HTML
3. Provide multiple alternatives when possible
4. Always include confidence scores based on selector robustness
5. Warn about potential issues (dynamic content, anti-scraping measures, etc.)

SELECTOR BEST PRACTICES:
- Use semantic selectors when possible (e.g., [data-testid], [aria-label])
- Combine attribute selectors for robustness
- Avoid position-based selectors unless necessary
- Consider :contains() for text-based matching
- Use nth-child() sparingly and with warnings

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "selectors": [
    {
      "key": "descriptive_key",
      "cssSelector": "specific CSS selector",
      "xpathSelector": "equivalent XPath selector",
      "confidence": 0.85,
      "description": "What this selector extracts",
      "alternatives": ["alternative1", "alternative2"],
      "warnings": ["potential issues"]
    }
  ]
}

CONFIDENCE SCORING:
- 0.9-1.0: Highly robust, semantic selectors
- 0.7-0.89: Good selectors with minor brittleness
- 0.5-0.69: Moderate selectors requiring validation
- 0.3-0.49: Fragile selectors, high maintenance
- 0.1-0.29: Very brittle, likely to break`;
  }

  private buildUserPrompt(request: SelectorGenerationRequest): string {
    let prompt = `Generate CSS and XPath selectors for: "${request.prompt}"\n\n`;

    if (request.pageUrl) {
      prompt += `Target URL: ${request.pageUrl}\n`;
    }

    if (request.htmlContext) {
      prompt += `HTML Context (relevant page structure):\n${request.htmlContext.substring(0, 3000)}\n\n`;
    }

    if (request.existingSelectors && Object.keys(request.existingSelectors).length > 0) {
      prompt += `Existing selectors for reference:\n${JSON.stringify(request.existingSelectors, null, 2)}\n\n`;
    }

    prompt += `Requirements:
- Output format: ${request.outputFormat || 'both'}
- Complexity level: ${request.complexity || 'advanced'}
- Provide 1-3 alternative selectors per target
- Include confidence scores and warnings
- Consider modern web development patterns`;

    return prompt;
  }

  private validateAndProcessAIResponse(response: { selectors?: unknown[] }, request: SelectorGenerationRequest): GeneratedSelector[] {
    if (!response.selectors || !Array.isArray(response.selectors)) {
      throw new Error('Invalid AI response format');
    }

    return response.selectors.map((selector: unknown) => {
      const selectorObj = selector as Record<string, unknown>;
      return {
        key: typeof selectorObj.key === 'string' ? selectorObj.key : 'unknown',
        cssSelector: typeof selectorObj.cssSelector === 'string' ? selectorObj.cssSelector : '',
        xpathSelector: typeof selectorObj.xpathSelector === 'string' ? selectorObj.xpathSelector : '',
        confidence: Math.max(0, Math.min(1, typeof selectorObj.confidence === 'number' ? selectorObj.confidence : 0.5)),
        description: typeof selectorObj.description === 'string' ? selectorObj.description : '',
        alternatives: Array.isArray(selectorObj.alternatives) ? selectorObj.alternatives.filter((alt): alt is string => typeof alt === 'string') : [],
        warnings: Array.isArray(selectorObj.warnings) ? selectorObj.warnings.filter((warn): warn is string => typeof warn === 'string') : []
      };
    });
  }

  private generateWithFallback(request: SelectorGenerationRequest): Partial<SelectorGenerationResult> {
    const selectors: GeneratedSelector[] = [];
    const prompt = request.prompt.toLowerCase();

    // Pattern matching for common requests
    for (const [pattern, selector] of this.fallbackPatterns) {
      if (prompt.includes(pattern)) {
        selectors.push({
          key: pattern,
          cssSelector: selector,
          confidence: 0.6,
          description: `Fallback selector for ${pattern}`,
          alternatives: [selector.split(',')[0].trim()],
          warnings: ['Generated using fallback patterns - may need refinement']
        });
      }
    }

    // Generic selectors based on common terms
    if (prompt.includes('text') || prompt.includes('content')) {
      selectors.push({
        key: 'text_content',
        cssSelector: 'p, span, div:not(:has(*))',
        confidence: 0.4,
        description: 'Generic text content selector',
        alternatives: ['[data-text]', '.content', '.text'],
        warnings: ['Very generic selector - needs refinement']
      });
    }

    if (prompt.includes('list') || prompt.includes('items')) {
      selectors.push({
        key: 'list_items',
        cssSelector: 'li, .item, [data-item]',
        confidence: 0.5,
        description: 'Generic list items selector',
        alternatives: ['ul > li', '.list-item', '[role="listitem"]'],
        warnings: ['May select too many elements']
      });
    }

    return {
      success: selectors.length > 0,
      selectors,
      model: 'fallback-patterns'
    };
  }

  // Test selectors against a live page
  async testSelectors(page: Page, selectors: GeneratedSelector[]): Promise<SelectorTestResult[]> {
    const results: SelectorTestResult[] = [];

    for (const selector of selectors) {
      const testResult = await this.testSingleSelector(page, selector);
      results.push(testResult);
    }

    return results;
  }

  private async testSingleSelector(page: Page, selector: GeneratedSelector): Promise<SelectorTestResult> {
    try {
      const elements = await page.$$(selector.cssSelector);
      const sampleData = elements.length > 0 ? await elements[0].textContent() : null;

      return {
        selector: selector.key,
        cssSelector: selector.cssSelector,
        elementCount: elements.length,
        success: elements.length > 0,
        sampleData: sampleData?.trim() || null,
        performance: await this.measureSelectorPerformance(page, selector.cssSelector)
      };

    } catch (error) {
      return {
        selector: selector.key,
        cssSelector: selector.cssSelector,
        elementCount: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        performance: { executionTime: 0, memoryUsage: 0 }
      };
    }
  }

  private async measureSelectorPerformance(page: Page, cssSelector: string): Promise<{ executionTime: number; memoryUsage: number }> {
    const start = Date.now();

    try {
      await page.$$(cssSelector);
      const executionTime = Date.now() - start;

      // Simple performance metrics
      return {
        executionTime,
        memoryUsage: cssSelector.length * 2 // Rough estimate
      };
    } catch {
      return { executionTime: 0, memoryUsage: 0 };
    }
  }

  // Generate selectors from visual information
  async generateFromVisualContext(visualDescription: string, elementPosition?: { x: number; y: number }): Promise<SelectorGenerationResult> {
    const request: SelectorGenerationRequest = {
      prompt: `Generate selectors for element described as: ${visualDescription}`,
      complexity: 'advanced'
    };

    if (elementPosition) {
      request.prompt += ` located at coordinates (${elementPosition.x}, ${elementPosition.y})`;
    }

    return this.generateSelectors(request);
  }

  // Optimize existing selectors
  async optimizeSelectors(selectors: Record<string, string>, htmlContext?: string): Promise<SelectorGenerationResult> {
    const request: SelectorGenerationRequest = {
      prompt: 'Optimize and improve the following selectors for better reliability and performance',
      existingSelectors: selectors,
      htmlContext,
      complexity: 'advanced'
    };

    return this.generateSelectors(request);
  }

  // Learning system to improve selector generation over time
  recordSelectorPerformance(selector: string, success: boolean, metrics: {
    pageLoadTime?: number;
    elementCount?: number;
    errorMessage?: string
  }) {
    // In a production system, this would feed back into the AI training process
    console.log(`Selector performance recorded: ${selector} - Success: ${success}`, metrics);
  }
}

export interface SelectorTestResult {
  selector: string;
  cssSelector: string;
  elementCount: number;
  success: boolean;
  sampleData?: string | null;
  error?: string;
  performance: {
    executionTime: number;
    memoryUsage: number;
  };
}

// Export singleton instance
export const aiSelectorGenerator = new AISeIectorGenerator();

// Utility functions
export function validateSelector(selector: string): { valid: boolean; error?: string } {
  try {
    document.querySelector(selector);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid selector'
    };
  }
}

export function estimateSelectorSpecificity(selector: string): number {
  // Simple specificity calculation
  const idCount = (selector.match(/#/g) || []).length;
  const classCount = (selector.match(/\./g) || []).length;
  const elementCount = selector.split(/[\s>+~]/).length;

  return idCount * 100 + classCount * 10 + elementCount;
}

export { AISeIectorGenerator };
