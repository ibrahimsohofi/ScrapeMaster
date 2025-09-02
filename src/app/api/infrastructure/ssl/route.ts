import { NextRequest, NextResponse } from 'next/server';
import { SSLCertificateManager } from '@/lib/infrastructure/ssl-certificate-manager';

// Initialize SSL manager
const sslManager = new SSLCertificateManager();

// GET /api/infrastructure/ssl - Get SSL certificates status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (domain) {
      // Get specific certificate
      const certificate = sslManager.getCertificate(domain);
      if (!certificate) {
        return NextResponse.json(
          { error: 'Certificate not found for domain' },
          { status: 404 }
        );
      }
      return NextResponse.json(certificate);
    } else {
      // Get all certificates
      const certificates = sslManager.getCertificates();
      const systemStatus = await sslManager.getSystemStatus();

      return NextResponse.json({
        certificates,
        systemStatus,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('SSL API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/infrastructure/ssl - Add or manage SSL certificates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, domain, config } = body;

    switch (action) {
      case 'add-domain':
        if (!domain || !config) {
          return NextResponse.json(
            { error: 'Domain and configuration required' },
            { status: 400 }
          );
        }

        await sslManager.addDomain({
          domain,
          ...config
        });

        return NextResponse.json({
          message: `Domain ${domain} added successfully`,
          timestamp: new Date().toISOString()
        });

      case 'remove-domain':
        if (!domain) {
          return NextResponse.json(
            { error: 'Domain required' },
            { status: 400 }
          );
        }

        await sslManager.removeDomain(domain);

        return NextResponse.json({
          message: `Domain ${domain} removed successfully`,
          timestamp: new Date().toISOString()
        });

      case 'renew-certificate':
        if (!domain) {
          return NextResponse.json(
            { error: 'Domain required' },
            { status: 400 }
          );
        }

        await sslManager.renewCertificate(domain);

        return NextResponse.json({
          message: `Certificate renewed for ${domain}`,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action', availableActions: ['add-domain', 'remove-domain', 'renew-certificate'] },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('SSL management error:', error);
    return NextResponse.json(
      { error: 'SSL operation failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
