import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { aiSelectorGenerator } from '@/lib/ai/selector-generation';
import { playwrightScraper } from '@/lib/scraper/playwright-engine';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      prompt,
      pageUrl,
      outputFormat = 'both',
      complexity = 'advanced',
      testSelectors = false,
      existingSelectors = {}
    } = body;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    let htmlContext: string | undefined;

    // Optionally fetch page HTML for better context
    if (pageUrl && testSelectors) {
      try {
        const quickScrape = await playwrightScraper.scrape({
          url: pageUrl,
          selectors: { content: 'body' },
          options: {
            timeout: 15000,
            headless: true,
            javascript: false, // Faster without JS for HTML context
          }
        });

        if (quickScrape.success && quickScrape.data?.[0]) {
          // Try to get HTML content from the scraped data
          const scrapedData = quickScrape.data[0];
          const htmlContent = scrapedData.html || scrapedData.content || JSON.stringify(scrapedData);
          // Limit HTML context to prevent token overflow
          htmlContext = (htmlContent as string).substring(0, 5000);
        }
      } catch (contextError) {
        console.warn('Failed to fetch page context:', contextError);
        // Continue without context
      }
    }

    // Generate selectors using AI
    const result = await aiSelectorGenerator.generateSelectors({
      prompt,
      pageUrl,
      htmlContext,
      existingSelectors,
      outputFormat,
      complexity
    });

    let testResults = null;

    // Test selectors against the actual page if requested
    if (testSelectors && pageUrl && result.success) {
      try {
        const testPage = await playwrightScraper.scrape({
          url: pageUrl,
          selectors: result.selectors.reduce((acc, sel) => {
            acc[sel.key] = sel.cssSelector;
            return acc;
          }, {} as Record<string, string>),
          options: {
            timeout: 20000,
            headless: true,
            waitTime: 2000
          }
        });

        testResults = {
          success: testPage.success,
          extractedData: testPage.data,
          dataPointsFound: testPage.dataPointsCount,
          executionTime: testPage.executionTime,
          screenshot: testPage.metadata?.screenshot,
          error: testPage.error
        };

        // Update confidence scores based on test results
        if (testPage.success && testPage.data) {
          result.selectors = result.selectors.map(selector => {
            const firstItem = testPage.data?.[0];
            const extractedValue = firstItem ? firstItem[selector.key] : undefined;
            const hasData = extractedValue && extractedValue !== null && extractedValue !== '';

            return {
              ...selector,
              confidence: hasData ? Math.min(selector.confidence + 0.1, 1.0) : Math.max(selector.confidence - 0.2, 0.1),
              warnings: hasData ?
                selector.warnings :
                [...selector.warnings, 'No data extracted during testing']
            };
          });
        }

      } catch (testError) {
        testResults = {
          success: false,
          error: testError instanceof Error ? testError.message : 'Testing failed'
        };
      }
    }

    return NextResponse.json({
      success: result.success,
      selectors: result.selectors,
      metadata: {
        model: result.model,
        processingTime: result.processingTime,
        tokensUsed: result.tokensUsed,
        prompt,
        pageUrl,
        complexity,
        timestamp: new Date().toISOString()
      },
      testResults,
      error: result.error,
      suggestions: generateUsageSuggestions(result.selectors, prompt)
    });

  } catch (error) {
    console.error('AI selector generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Return available AI selector generation options and examples
    return NextResponse.json({
      features: {
        naturalLanguagePrompts: true,
        multipleOutputFormats: ['css', 'xpath', 'both'],
        complexityLevels: ['simple', 'advanced'],
        livePageTesting: true,
        selectorOptimization: true
      },
      examples: [
        {
          prompt: "Extract product prices",
          expectedSelectors: [".price", "[data-price]", ".cost"]
        },
        {
          prompt: "Get all article titles from the news page",
          expectedSelectors: ["h1", "h2", ".title", ".headline", "[data-title]"]
        },
        {
          prompt: "Find contact email addresses",
          expectedSelectors: ["a[href^='mailto:']", "[data-email]", ".email"]
        },
        {
          prompt: "Extract product images",
          expectedSelectors: ["img.product-image", "[data-product-img]", ".product img"]
        }
      ],
      tips: [
        "Be specific about what data you want to extract",
        "Mention the context (e.g., 'from the product listing page')",
        "Include data types if relevant (e.g., 'prices in USD')",
        "Test selectors on live pages for best results"
      ],
      limits: {
        maxPromptLength: 500,
        maxSelectorsPerRequest: 10,
        rateLimitPerMinute: 20
      }
    });

  } catch (error) {
    console.error('AI selector info error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve selector generation info' },
      { status: 500 }
    );
  }
}

import type { GeneratedSelector } from '@/lib/types/ai';

// Helper function to generate usage suggestions
function generateUsageSuggestions(selectors: GeneratedSelector[], prompt: string): string[] {
  const suggestions: string[] = [];

  if (selectors.length === 0) {
    suggestions.push("Try being more specific in your prompt");
    suggestions.push("Include the exact element type you're looking for");
    suggestions.push("Provide a sample URL for better context");
  } else {
    const lowConfidenceSelectors = selectors.filter(s => s.confidence < 0.6);

    if (lowConfidenceSelectors.length > 0) {
      suggestions.push("Some selectors have low confidence - consider testing on the actual page");
      suggestions.push("Try refining your prompt with more specific details");
    }

    const hasWarnings = selectors.some(s => s.warnings.length > 0);
    if (hasWarnings) {
      suggestions.push("Review selector warnings before using in production");
      suggestions.push("Consider using fallback selectors for robustness");
    }

    if (selectors.every(s => s.confidence > 0.8)) {
      suggestions.push("Great! These selectors look robust and ready to use");
      suggestions.push("Consider setting up monitoring to detect if selectors break");
    }
  }

  // Prompt-specific suggestions
  if (prompt.toLowerCase().includes('price')) {
    suggestions.push("For prices, consider multiple currency formats");
    suggestions.push("Test with different product types to ensure consistency");
  }

  if (prompt.toLowerCase().includes('image')) {
    suggestions.push("Don't forget to extract both src and alt attributes");
    suggestions.push("Consider lazy-loaded images with data-src attributes");
  }

  return suggestions;
}
