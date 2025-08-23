import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';
import { wsManager } from '@/lib/websocket/server';

// Dynamic imports to avoid build-time issues
const getDynamicImports = async () => {
  const { playwrightScraper } = await import('@/lib/scraper/playwright-engine');
  const { runLegacyScraper } = await import('@/lib/scraper');
  const { proxyManager } = await import('@/lib/proxy/manager');

  return { playwrightScraper, runLegacyScraper, proxyManager };
};

// Helper function to verify scraper ownership and access
async function verifyScraperAccess(scraperId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });

  if (!user || !user.isActive) {
    return { error: 'User not found or inactive', status: 401 };
  }

  const scraper = await prisma.job.findFirst({
    where: {
      id: scraperId,
      organizationId: user.organizationId,
    },
  });

  if (!scraper) {
    return { error: 'Scraper not found or access denied', status: 404 };
  }

  return { scraper, user };
}

// POST - Execute a scraper
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  let executionId: string | null = null;

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

    const result = await verifyScraperAccess(resolvedParams.id, decoded.userId);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { scraper, user } = result;

    // Check if scraper is already running
    if (scraper.status === 'RUNNING') {
      return NextResponse.json(
        { error: 'Scraper is already running' },
        { status: 409 }
      );
    }

    // Check if scraper is active
    if (!scraper.isActive) {
      return NextResponse.json(
        { error: 'Scraper is disabled' },
        { status: 400 }
      );
    }

    // Parse request options
    const body = await request.json().catch(() => ({}));
    const options = {
      useProxy: body.useProxy || false,
      antiDetection: body.antiDetection !== false, // Default to true
      ...body.options || {},
    };

    // Create execution record
    const execution = await prisma.jobExecution.create({
      data: {
        jobId: scraper.id,
        status: 'STARTED',
        startedAt: new Date(),
        engine: scraper.engine,
      },
    });

    executionId = execution.id;

    // Update scraper status
    await prisma.job.update({
      where: { id: scraper.id },
      data: {
        status: 'RUNNING',
        lastRunAt: new Date(),
      },
    });

    // 📡 Real-time notification: Job started
    wsManager.broadcastJobUpdate(user.organizationId, {
      jobId: scraper.id,
      executionId: execution.id,
      status: 'RUNNING',
      message: `Scraper "${scraper.name}" started`,
      startedAt: execution.startedAt,
      url: scraper.url,
    });

    // Get dynamic imports
    const { playwrightScraper, runLegacyScraper, proxyManager } = await getDynamicImports();

    // Prepare scraper configuration
    const scraperSettings = scraper.settings as any || {};
    const scraperSelectors = scraper.selectors as any || {};

    // Get proxy if requested
    let proxyConfig;
    if (options.useProxy) {
      try {
        const proxyResult = await proxyManager.getProxy({
          url: scraper.url,
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

    // Execute the scraper
    let scraperResult;
    let usedFallback = false;
    const startTime = Date.now();

    try {
      if (scraper.engine === 'PLAYWRIGHT') {
        // Use Playwright for JavaScript-enabled scraping
        const config = {
          url: scraper.url,
          selectors: scraperSelectors,
          options: {
            browserType: 'chromium' as const,
            headless: true,
            timeout: Math.min(scraperSettings.timeout || 30000, 300000), // Max 5 minutes
            waitTime: scraperSettings.delay || 2000,
            retries: scraperSettings.retries || 2,
            proxy: proxyConfig,
            userAgent: scraperSettings.userAgent,
            viewport: { width: 1920, height: 1080 },
            locale: 'en-US',
            timezone: 'America/New_York',
            javascript: scraperSettings.javascript !== false,
            images: true,
            waitConditions: [
              { type: 'networkidle' as const, timeout: 5000 }
            ],
            antiDetection: options.antiDetection ? {
              randomizeFingerprint: true,
              spoofWebGL: true,
              spoofCanvas: true,
              stealthMode: true
            } : undefined
          }
        };

        scraperResult = await playwrightScraper.scrape(config);

        // Fallback to JSDOM if Playwright fails
        if (!scraperResult.success && scraperResult.error?.includes('Host system is missing dependencies')) {
          throw new Error('Playwright dependencies missing');
        }
      } else {
        throw new Error('HTTrack engine not implemented yet');
      }
    } catch (scraperError) {
      console.warn('Primary scraper failed, falling back to JSDOM:', scraperError);
      usedFallback = true;

      // Fallback to JSDOM scraper
      const jsdomConfig = {
        url: scraper.url,
        selectors: scraperSelectors,
        timeout: scraperSettings.timeout || 30000,
        waitTime: scraperSettings.delay || 2000
      };

      const jsdomResult = await runLegacyScraper(jsdomConfig);

      // Transform JSDOM result to match expected format
      scraperResult = {
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

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Save results and update execution
    if (scraperResult.success && scraperResult.data) {
      // Save scraping result
      const savedResult = await prisma.scrapingResult.create({
        data: {
          sourceUrl: scraperResult.url || scraper.url,
          url: scraperResult.url || scraper.url,
          // Remove status field as it doesn't exist in ScrapingResult
          dataPointsCount: scraperResult.dataPointsCount || 0,
          executionTime: duration,
          engine: usedFallback ? 'JSDOM' : scraper.engine,
          data: JSON.stringify(scraperResult.data),
          selectors: JSON.stringify(scraperSelectors),
          metadata: JSON.stringify({
            complianceResult: scraperResult.complianceResult,
            metrics: scraperResult.metrics,
            usedProxy: options.useProxy && !!proxyConfig,
            usedFallback: usedFallback,
            options,
          }),
          userId: user.id,
          jobExecutionId: execution.id,
        },
      });

      // Update execution as completed
      await prisma.jobExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration,
          dataPointsCount: scraperResult.dataPointsCount || 0,
          // resultId: savedResult.id, // Not part of schema
        },
      });

      // Update scraper with success
      await prisma.job.update({
        where: { id: scraper.id },
        data: {
          status: 'COMPLETED',
          lastSuccessAt: new Date(),
          dataPointsCount: (scraper.dataPointsCount || 0) + (scraperResult.dataPointsCount || 0),
          errorMessage: null,
        },
      });

      // 📡 Real-time notification: Job completed successfully
      wsManager.broadcastJobUpdate(user.organizationId, {
        jobId: scraper.id,
        executionId: execution.id,
        status: 'COMPLETED',
        message: `Scraper "${scraper.name}" completed successfully`,
        completedAt: new Date(),
        dataPointsCount: scraperResult.dataPointsCount || 0,
        duration,
        url: scraper.url,
      });

      // 📡 Real-time notification: Success notification
      wsManager.broadcastNotification(user.organizationId, {
        type: 'success',
        title: 'Scraper Completed',
        message: `"${scraper.name}" scraped ${scraperResult.dataPointsCount || 0} data points in ${Math.round(duration / 1000)}s`,
        timestamp: Date.now(),
        metadata: {
          scraperId: scraper.id,
          executionId: execution.id,
          dataPointsCount: scraperResult.dataPointsCount || 0,
        },
      });

      return NextResponse.json({
        success: true,
        executionId: execution.id,
        resultId: savedResult.id,
        data: scraperResult.data,
        metadata: {
          url: scraperResult.url || scraper.url,
          dataPointsCount: scraperResult.dataPointsCount || 0,
          executionTime: duration,
          engine: usedFallback ? 'JSDOM' : scraper.engine,
          usedProxy: options.useProxy && !!proxyConfig,
          usedFallback,
          complianceResult: scraperResult.complianceResult,
        },
        message: 'Scraper executed successfully',
      });

    } else {
      // Handle scraper failure
      const errorMessage = scraperResult.error || 'Unknown scraping error';

      await prisma.jobExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration,
          errorMessage,
        },
      });

      await prisma.job.update({
        where: { id: scraper.id },
        data: {
          status: 'FAILED',
          lastFailureAt: new Date(),
          errorMessage,
        },
      });

      // 📡 Real-time notification: Job failed
      wsManager.broadcastJobUpdate(user.organizationId, {
        jobId: scraper.id,
        executionId: execution.id,
        status: 'FAILED',
        message: `Scraper "${scraper.name}" failed`,
        completedAt: new Date(),
        errorMessage,
        duration,
        url: scraper.url,
      });

      // 📡 Real-time notification: Error notification
      wsManager.broadcastNotification(user.organizationId, {
        type: 'error',
        title: 'Scraper Failed',
        message: `"${scraper.name}" failed: ${errorMessage}`,
        timestamp: Date.now(),
        metadata: {
          scraperId: scraper.id,
          executionId: execution.id,
          error: errorMessage,
        },
      });

      return NextResponse.json({
        success: false,
        executionId: execution.id,
        error: errorMessage,
        metadata: {
          executionTime: duration,
          engine: usedFallback ? 'JSDOM' : scraper.engine,
          usedFallback,
        },
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Scraper execution error:', error);

    // Update execution as failed if it was created
    if (executionId) {
      try {
        await prisma.jobExecution.update({
          where: { id: executionId },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        // Update scraper status
        const failedScraper = await prisma.job.update({
          where: { id: resolvedParams.id },
          data: {
            status: 'FAILED',
            lastFailureAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
          include: { organization: true },
        });

        // 📡 Real-time notification: Execution error
        if (failedScraper.organizationId) {
          wsManager.broadcastJobUpdate(failedScraper.organizationId, {
            jobId: failedScraper.id,
            executionId,
            status: 'FAILED',
            message: `Scraper "${failedScraper.name}" encountered an error`,
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            url: failedScraper.url,
          });

          wsManager.broadcastNotification(failedScraper.organizationId, {
            type: 'error',
            title: 'Scraper Error',
            message: `"${failedScraper.name}" encountered an unexpected error`,
            timestamp: Date.now(),
            metadata: {
              scraperId: failedScraper.id,
              executionId,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      } catch (updateError) {
        console.error('Failed to update execution/job status:', updateError);
      }
    }

    return NextResponse.json(
      {
        error: 'Scraper execution failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        executionId,
      },
      { status: 500 }
    );
  }
}
