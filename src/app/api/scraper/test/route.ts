import { type NextRequest, NextResponse } from 'next/server';

// Dynamic imports to avoid build-time issues
const getDynamicImports = async () => {
  const { verifyToken } = await import('@/lib/auth/jwt');
  const { playwrightScraper } = await import('@/lib/scraper/playwright-engine');
  const { runLegacyScraper } = await import('@/lib/scraper');
  const { aiSelectorGenerator } = await import('@/lib/ai/selector-generation');
  const { proxyManager } = await import('@/lib/proxy/manager');
  const { default: prisma } = await import('@/lib/db/prisma');

  return { verifyToken, playwrightScraper, runLegacyScraper, aiSelectorGenerator, proxyManager, prisma };
};

// Add runtime config to mark this as dynamic
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get dynamic imports
    const { verifyToken, playwrightScraper, runLegacyScraper, aiSelectorGenerator, proxyManager, prisma } = await getDynamicImports();

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
      url,
      selectors,
      naturalLanguagePrompt,
      options = {},
      useAI = false,
      useProxy = false,
      antiDetection = true
    } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    let finalSelectors = selectors;

    // Generate selectors using AI if requested
    if (useAI && naturalLanguagePrompt) {
      try {
        const aiResult = await aiSelectorGenerator.generateSelectors({
          prompt: naturalLanguagePrompt,
          pageUrl: url,
          complexity: 'advanced'
        });

        if (aiResult.success && aiResult.selectors.length > 0) {
          finalSelectors = aiResult.selectors.reduce((acc, sel) => {
            acc[sel.key] = sel.cssSelector;
            return acc;
          }, {} as Record<string, string>);
        }
      } catch (aiError) {
        console.warn('AI selector generation failed:', aiError);
        // Continue with manual selectors if AI fails
      }
    }

    if (!finalSelectors || Object.keys(finalSelectors).length === 0) {
      return NextResponse.json(
        { error: 'Selectors are required (either manual or generated via AI)' },
        { status: 400 }
      );
    }

    // Get proxy if requested
    let proxyConfig;
    if (useProxy) {
      try {
        const proxyResult = await proxyManager.getProxy({
          url,
          maxLatency: 5000
        });

        if (proxyResult.success) {
          proxyConfig = {
            server: `${proxyResult.proxy.protocol}://${proxyResult.proxy.host}:${proxyResult.proxy.port}`,
            username: process.env.BRIGHT_DATA_USERNAME,
            password: process.env.BRIGHT_DATA_PASSWORD
          };
        }
      } catch (proxyError) {
        console.warn('Proxy setup failed:', proxyError);
        // Continue without proxy
      }
    }

    // Create advanced scraper config
    const config = {
      url,
      selectors: finalSelectors,
      options: {
        browserType: options.browserType || 'chromium',
        headless: true,
        timeout: Math.min(options.timeout || 30000, 60000), // Max 60 seconds for testing
        waitTime: options.waitTime || 2000,
        retries: 2,
        proxy: proxyConfig,
        userAgent: options.userAgent,
        viewport: options.viewport || { width: 1920, height: 1080 },
        locale: options.locale || 'en-US',
        timezone: options.timezone || 'America/New_York',
        javascript: options.javascript !== false,
        images: options.images !== false,
        waitConditions: options.waitConditions || [
          { type: 'networkidle', timeout: 5000 }
        ],
        antiDetection: antiDetection ? {
          randomizeFingerprint: true,
          spoofWebGL: true,
          spoofCanvas: true,
          stealthMode: true
        } : undefined
      }
    };

    // Try Playwright first, fallback to JSDOM if it fails
    let result;
    let usedFallback = false;
    const startTime = Date.now();

    try {
      // Run the Playwright scraper
      result = await playwrightScraper.scrape(config);

      // Check if Playwright failed due to browser dependencies
      if (!result.success && result.error?.includes('Host system is missing dependencies')) {
        throw new Error('Playwright dependencies missing');
      }
    } catch (playwrightError) {
      console.warn('Playwright scraping failed, falling back to JSDOM:', playwrightError);
      usedFallback = true;

      // Fallback to JSDOM scraper for static content
      const jsdomConfig = {
        url,
        selectors: finalSelectors,
        timeout: config.options?.timeout || 30000,
        waitTime: config.options?.waitTime || 2000
      };

      const jsdomResult = await runLegacyScraper(jsdomConfig);

      // Transform JSDOM result to match Playwright result format
      result = {
        ...jsdomResult,
        executionTime: Date.now() - startTime,
        complianceResult: { allowed: true, reason: 'No compliance check for JSDOM fallback' },
        metrics: {
          pageLoadTime: 0,
          networkRequests: 1,
          failedRequests: 0,
          resourceSizes: {}
        }
      };
    }

    // Save results to database
    let savedResultId = null;
    if (result.success && result.data) {
      try {
        const savedResult = await prisma.scrapingResult.create({
          data: {
            sourceUrl: result.url || url,
            url: result.url,
            dataPointsCount: result.dataPointsCount || 0,
            engine: usedFallback ? 'JSDOM' : 'PLAYWRIGHT',
            data: JSON.stringify(result.data),
            selectors: JSON.stringify(finalSelectors),
            metadata: JSON.stringify({
              complianceResult: result.complianceResult,
              metrics: result.metrics,
              usedAI: useAI && naturalLanguagePrompt,
              usedProxy: useProxy && !!proxyConfig,
              usedFallback: usedFallback,
            }),
            userId: decoded.userId,
          },
        });
        savedResultId = savedResult.id;
      } catch (dbError) {
        console.error('Failed to save scraping result:', dbError);
        // Don't fail the request if saving fails
      }
    }

    // Return detailed results
    return NextResponse.json({
      success: result.success,
      data: result.data,
      resultId: savedResultId,
      metadata: {
        url: result.url,
        timestamp: new Date().toISOString(),
        dataPointsCount: result.dataPointsCount,
        executionTime: result.executionTime,
        complianceResult: result.complianceResult,
        metrics: result.metrics,
        usedAI: useAI && naturalLanguagePrompt,
        usedProxy: useProxy && !!proxyConfig,
        usedFallback: usedFallback,
        engine: usedFallback ? 'JSDOM' : 'Playwright',
        selectors: finalSelectors
      },
      error: result.error,
      screenshot: usedFallback ? null : (result as any).screenshot // No screenshot for JSDOM
    });

  } catch (error) {
    console.error('Scraper test error:', error);
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
