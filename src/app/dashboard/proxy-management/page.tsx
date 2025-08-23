import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import EnhancedProxyMonitoring from '@/components/dashboard/enhanced-proxy-monitoring';

export const metadata: Metadata = {
  title: 'Proxy Management - DataVault Pro',
  description: 'Manage and monitor your proxy providers with real-time analytics and intelligent selection algorithms',
};

export default function ProxyManagementPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <EnhancedProxyMonitoring />
      </div>
    </DashboardLayout>
  );
}
