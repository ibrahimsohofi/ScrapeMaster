import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

// Force dynamic rendering for all dashboard pages to prevent static generation issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard | ScrapeMaster',
  description: 'Manage your web scraping projects, analytics, and settings',
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
