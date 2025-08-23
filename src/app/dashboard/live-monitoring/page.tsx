import LiveMonitoringDashboard from '@/components/dashboard/live-monitoring-dashboard';

export default function LiveMonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <LiveMonitoringDashboard />
    </div>
  );
}

export const metadata = {
  title: 'Live Monitoring - DataVault Pro',
  description: 'Real-time monitoring dashboard for DataVault Pro application metrics, system performance, and alerts',
};
