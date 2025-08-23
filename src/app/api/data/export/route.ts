import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';

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

    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get('resultId');
    const format = searchParams.get('format') || 'json';
    const jobId = searchParams.get('jobId');

    let scrapingResults;

    if (resultId) {
      // Export specific result
      const result = await prisma.scrapingResult.findFirst({
        where: {
          id: resultId,
          userId: decoded.userId,
        },
      });

      if (!result) {
        return NextResponse.json(
          { error: 'Result not found' },
          { status: 404 }
        );
      }

      scrapingResults = [result];
    } else if (jobId) {
      // Export all results for a job
      // Get user and organization first
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { organization: true },
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: 'User not found or inactive' },
          { status: 401 }
        );
      }

      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          organizationId: user.organizationId,
        },
        include: {
          executions: {
            include: {
              scrapingResults: true,
            },
          },
        },
      });

      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      scrapingResults = job.executions.flatMap(exec => exec.scrapingResults);
    } else {
      // Export all user results (limited to last 1000)
      scrapingResults = await prisma.scrapingResult.findMany({
        where: {
          userId: decoded.userId,
          // Remove status filter as it doesn't exist in ScrapingResult
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1000,
      });
    }

    if (scrapingResults.length === 0) {
      return NextResponse.json(
        { error: 'No results found' },
        { status: 404 }
      );
    }

    // Prepare data for export
    const exportData = scrapingResults.flatMap(result => {
      try {
        const data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
        return data.map((item: any) => ({
          ...item,
          _metadata: {
            url: result.url,
            extractedAt: result.createdAt,
            resultId: result.id,
            engine: result.engine,
          },
        }));
      } catch (error) {
        console.error('Failed to parse result data:', error);
        return [];
      }
    });

    // Generate export based on format
    switch (format.toLowerCase()) {
      case 'csv':
        return exportAsCSV(exportData);
      case 'excel':
        return exportAsExcel(exportData);
      case 'xml':
        return exportAsXML(exportData);
      default:
        return NextResponse.json({
          success: true,
          data: exportData,
          count: exportData.length,
          format: 'json',
        });
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}

function exportAsCSV(data: any[]) {
  if (data.length === 0) {
    return new Response('No data to export', { status: 404 });
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== '_metadata') {
        allKeys.add(key);
      }
    });
    if (item._metadata) {
      Object.keys(item._metadata).forEach(key => {
        allKeys.add(`metadata_${key}`);
      });
    }
  });

  const headers = Array.from(allKeys);

  // Create CSV content
  let csvContent = headers.join(',') + '\n';

  data.forEach(item => {
    const row = headers.map(header => {
      let value;
      if (header.startsWith('metadata_')) {
        const metaKey = header.replace('metadata_', '');
        value = item._metadata?.[metaKey] || '';
      } else {
        value = item[header] || '';
      }

      // Escape CSV values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }

      return value;
    });

    csvContent += row.join(',') + '\n';
  });

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="scraping_results_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

function exportAsExcel(data: any[]) {
  // For now, return CSV with Excel MIME type
  // In production, you'd use a library like ExcelJS
  const csvResponse = exportAsCSV(data);

  return new Response(csvResponse.body, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="scraping_results_${new Date().toISOString().split('T')[0]}.xls"`,
    },
  });
}

function exportAsXML(data: any[]) {
  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n';

  data.forEach((item, index) => {
    xmlContent += `  <result index="${index}">\n`;

    Object.entries(item).forEach(([key, value]) => {
      if (key === '_metadata') {
        xmlContent += '    <metadata>\n';
        Object.entries(value as any).forEach(([metaKey, metaValue]) => {
          xmlContent += `      <${metaKey}>${escapeXML(String(metaValue))}</${metaKey}>\n`;
        });
        xmlContent += '    </metadata>\n';
      } else {
        xmlContent += `    <${key}>${escapeXML(String(value))}</${key}>\n`;
      }
    });

    xmlContent += '  </result>\n';
  });

  xmlContent += '</results>';

  return new Response(xmlContent, {
    headers: {
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="scraping_results_${new Date().toISOString().split('T')[0]}.xml"`,
    },
  });
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
