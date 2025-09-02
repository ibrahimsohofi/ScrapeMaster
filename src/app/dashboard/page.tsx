"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { EnhancedAnalyticsCards } from '@/components/dashboard/enhanced-analytics-cards';
import { EnhancedRealTimeDashboard } from '@/components/dashboard/enhanced-real-time-dashboard';
import Link from 'next/link';
import {
  LucideActivity,
  LucideCode,
  LucideFileSpreadsheet,
  LucideArrowRight,
  LucideLayoutGrid,
  LucidePlus,
  LucideDatabase,
  LucideCheckCircle2,
  LucideAlertCircle,
  LucideTrendingUp,
  LucideZap,
  LucideGlobe,
  LucidePlay,
  LucidePause,
  LucideClock,
  LucideLoader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { toast } from 'sonner';

interface DashboardStats {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  scheduledJobs: number;
  totalDataPoints: number;
  monthlyUsage: number;
  monthlyLimit: number;
  monthlyDataPoints: number;
  storageUsed: number;
  estimatedCost: number;
  avgExecutionTime: number;
  successRate: number;
}

interface RecentJob {
  id: string;
  name: string;
  description?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'SCHEDULED' | 'CANCELLED' | 'PAUSED';
  lastRun: string;
  lastRunAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  dataPoints: number;
  schedule?: string;
  url: string;
  errorMessage?: string;
  executionDetails?: {
    status: string;
    duration?: number;
    dataPointsCount?: number;
    errorMessage?: string;
    startedAt: string;
    completedAt?: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const [statsResponse, jobsResponse] = await Promise.all([
        fetch('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/dashboard/recent-jobs', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!statsResponse.ok || !jobsResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsResponse.json();
      const jobsData = await jobsResponse.json();

      setStats(statsData.stats);
      setRecentJobs(jobsData.jobs);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchDashboardData();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'text-blue-600';
      case 'COMPLETED':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      case 'PENDING':
        return 'text-yellow-600';
      case 'SCHEDULED':
        return 'text-purple-600';
      case 'PAUSED':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <LucidePlay className="h-3.5 w-3.5" />;
      case 'COMPLETED':
        return <LucideCheckCircle2 className="h-3.5 w-3.5" />;
      case 'FAILED':
        return <LucideAlertCircle className="h-3.5 w-3.5" />;
      case 'PENDING':
        return <LucideClock className="h-3.5 w-3.5" />;
      case 'SCHEDULED':
        return <LucideZap className="h-3.5 w-3.5" />;
      case 'PAUSED':
        return <LucidePause className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <LucideLoader2 className="h-8 w-8 animate-spin" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Monitor your scraping operations and performance</p>
            </div>
            <Link href="/dashboard/scrapers/new">
              <Button variant="gradient" size="lg">
                <LucidePlus className="h-4 w-4 mr-2" />
                New Scraper
              </Button>
            </Link>
          </div>

          {/* Enhanced Real-Time Dashboard */}
          <EnhancedRealTimeDashboard />

          {/* Enhanced Analytics */}
          <EnhancedAnalyticsCards
            stats={stats}
            organization={user?.organization}
          />

          {/* Recent Jobs */}
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Recent Jobs</CardTitle>
                  <CardDescription>Your most recent scraping jobs and their status</CardDescription>
                </div>
                <Link href="/dashboard/scrapers">
                  <Button variant="ghost" size="sm" className="gap-1 group">
                    View All
                    <LucideArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <LucideDatabase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No jobs created yet. Create your first scraper to get started!</p>
                  </div>
                ) : (
                  recentJobs.map((job) => (
                    <Card key={job.id} variant="glass" className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-md bg-gradient-to-r from-primary/10 to-primary/5">
                            <LucideLayoutGrid className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{job.name}</div>
                            <div className="text-sm text-muted-foreground">{job.url}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`flex items-center text-sm ${getStatusColor(job.status)}`}>
                                {getStatusIcon(job.status)}
                                <span className="ml-1 capitalize">{job.status.toLowerCase()}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Last run: {job.lastRun}
                              </div>
                              {job.dataPoints > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {job.dataPoints} data points
                                </div>
                              )}
                              {job.errorMessage && (
                                <div className="text-xs text-red-600">
                                  Error: {job.errorMessage}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <Link href={`/dashboard/scrapers/${job.id}`}>
                            <Button variant="outline" size="sm">View Details</Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="gradient" className="flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-full blur-xl" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucidePlus className="h-5 w-5 text-orange-500" />
                  Create New Scraper
                </CardTitle>
                <CardDescription>Build a new scraper using our no-code builder</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Select elements on any website to extract structured data without writing code.
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Link href="/dashboard/scrapers/new">
                  <Button variant="gradient" className="w-full">
                    <LucidePlus className="h-4 w-4 mr-2" />
                    Start Building
                  </Button>
                </Link>
              </div>
            </Card>

            <Card variant="glass" className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucideFileSpreadsheet className="h-5 w-5 text-blue-500" />
                  Browse Your Data
                </CardTitle>
                <CardDescription>View and download your scraped data</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Access all your scraped data in JSON, CSV, or Excel formats for analysis.
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Link href="/dashboard/data">
                  <Button variant="outline" className="w-full">
                    <LucideFileSpreadsheet className="h-4 w-4 mr-2" />
                    View Data
                  </Button>
                </Link>
              </div>
            </Card>

            <Card variant="glass" className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucideCode className="h-5 w-5 text-purple-500" />
                  API Documentation
                </CardTitle>
                <CardDescription>Integrate DataVault Pro with your applications</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Use our RESTful API to programmatically create jobs and access your data.
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Link href="/api-reference">
                  <Button variant="outline" className="w-full">
                    <LucideCode className="h-4 w-4 mr-2" />
                    View API Docs
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
