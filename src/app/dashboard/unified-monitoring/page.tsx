import { UnifiedMonitoringDashboard } from '@/components/dashboard/unified-monitoring-dashboard';

export default function UnifiedMonitoringPage() {
  return (
    <div className="container mx-auto p-6">
      <UnifiedMonitoringDashboard />
    </div>
  );
}

export const metadata = {
  title: 'Unified Monitoring Dashboard - DataVault Pro',
  description: 'Real-time monitoring across DataDog and New Relic platforms',
};
