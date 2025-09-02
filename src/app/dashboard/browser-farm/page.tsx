"use client";

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import Phase4Dashboard from '@/components/dashboard/phase4-dashboard';

export default function BrowserFarmPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Phase4Dashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
