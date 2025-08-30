import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import EnhancedProxyMonitoring from '@/components/dashboard/enhanced-proxy-monitoring';

export const metadata: Metadata = {
  title: 'Proxy Management - DataVault Pro',
  description: 'Manage and monitor your proxy providers with real-time analytics and intelligent selection algorithms',
};

// Disable static generation for this page to prevent build errors
export const dynamic = 'force-dynamic';

export default function ProxyManagementPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <EnhancedProxyMonitoring />
      </div>
    </DashboardLayout>
  );
}
