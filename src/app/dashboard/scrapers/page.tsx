"use client";

import { useEffect, useState } from 'react';

// Disable static generation for this page to prevent build errors
export const dynamic = 'force-dynamic';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  LucidePlus,
  LucideLayoutGrid,
  LucidePlay,
  LucidePause,
  LucideEdit,
  LucideMoreHorizontal,
  LucideRefreshCw,
  LucideCheckCircle2,
  LucideAlertCircle,
  LucideClock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

// Sample data for demonstration
const scrapers = [
  {
    id: '1',
    name: 'Product Price Monitoring',
    url: 'https://example.com/products',
    status: 'active',
    lastRun: '2023-06-01T10:30:00Z',
    nextRun: '2023-06-02T10:30:00Z',
    schedule: 'daily',
    dataPoints: 245,
  },
  {
    id: '2',
    name: 'Competitor Analysis',
    url: 'https://competitor.example.com',
    status: 'scheduled',
    lastRun: null,
    nextRun: '2023-06-03T12:00:00Z',
    schedule: 'weekly',
    dataPoints: 0,
  },
  {
    id: '3',
    name: 'News Articles Scraper',
    url: 'https://news.example.com',
    status: 'failed',
    lastRun: '2023-05-31T15:45:00Z',
    nextRun: null,
    schedule: 'daily',
    dataPoints: 0,
    error: 'CAPTCHA detected',
  },
  {
    id: '4',
    name: 'Stock Price Tracker',
    url: 'https://finance.example.com/stocks',
    status: 'active',
    lastRun: '2023-06-01T09:00:00Z',
    nextRun: '2023-06-01T10:00:00Z',
    schedule: 'hourly',
    dataPoints: 1200,
  },
  {
    id: '5',
    name: 'Real Estate Listings',
    url: 'https://realestate.example.com/listings',
    status: 'paused',
    lastRun: '2023-05-28T11:30:00Z',
    nextRun: null,
    schedule: 'weekly',
    dataPoints: 320,
  },
];

export default function ScrapersPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading scrapers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Your Scrapers</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and monitor your web scrapers</p>
          </div>
          <Link href="/dashboard/scrapers/new" className="sm:flex-shrink-0">
            <Button className="w-full sm:w-auto">
              <LucidePlus className="h-4 w-4 mr-2" />
              New Scraper
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Input placeholder="Search scrapers..." className="pl-9 h-10" />
            <svg
              className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <Button variant="outline" size="sm" className="whitespace-nowrap flex-shrink-0 min-w-[60px] sm:flex-none h-10">
              All
            </Button>
            <Button variant="ghost" size="sm" className="whitespace-nowrap flex-shrink-0 min-w-[60px] sm:flex-none h-10">
              Active
            </Button>
            <Button variant="ghost" size="sm" className="whitespace-nowrap flex-shrink-0 min-w-[60px] sm:flex-none h-10">
              Paused
            </Button>
            <Button variant="ghost" size="sm" className="whitespace-nowrap flex-shrink-0 min-w-[60px] sm:flex-none h-10">
              Failed
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Scrapers</CardTitle>
            <CardDescription>Manage your web scrapers and view their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scrapers.map((scraper) => (
                <div key={scraper.id} className="flex flex-col sm:flex-row sm:items-center justify-between border p-4 rounded-lg gap-4 bg-background shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-md bg-primary/10 flex-shrink-0">
                      <LucideLayoutGrid className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base mb-1">{scraper.name}</div>
                      <div className="text-sm text-muted-foreground mb-2 break-all">{scraper.url}</div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        {scraper.status === 'active' && (
                          <div className="flex items-center text-green-600">
                            <LucideCheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Active
                          </div>
                        )}
                        {scraper.status === 'scheduled' && (
                          <div className="flex items-center text-amber-600">
                            <LucideClock className="h-3.5 w-3.5 mr-1" />
                            Scheduled
                          </div>
                        )}
                        {scraper.status === 'failed' && (
                          <div className="flex items-center text-red-600">
                            <LucideAlertCircle className="h-3.5 w-3.5 mr-1" />
                            Failed
                          </div>
                        )}
                        {scraper.status === 'paused' && (
                          <div className="flex items-center text-gray-500">
                            <LucidePause className="h-3.5 w-3.5 mr-1" />
                            Paused
                          </div>
                        )}

                        <div>
                          Schedule: {scraper.schedule}
                        </div>

                        {scraper.lastRun && (
                          <div>
                            Last run: {new Date(scraper.lastRun).toLocaleDateString()}
                          </div>
                        )}

                        {scraper.nextRun && (
                          <div>
                            Next run: {new Date(scraper.nextRun).toLocaleDateString()}
                          </div>
                        )}

                        {scraper.dataPoints > 0 && (
                          <div>
                            {scraper.dataPoints.toLocaleString()} data points
                          </div>
                        )}

                        {scraper.error && (
                          <div className="text-red-600">
                            Error: {scraper.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    {(scraper.status === 'active' || scraper.status === 'scheduled') && (
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none min-w-0">
                        <LucidePause className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Pause</span>
                      </Button>
                    )}

                    {scraper.status === 'paused' && (
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none min-w-0">
                        <LucidePlay className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Resume</span>
                      </Button>
                    )}

                    {scraper.status === 'failed' && (
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none min-w-0">
                        <LucideRefreshCw className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Retry</span>
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" className="flex-1 sm:flex-none min-w-0">
                      <LucideEdit className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <LucideMoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Link href={`/dashboard/scrapers/${scraper.id}`} className="flex w-full">
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Run Now</DropdownMenuItem>
                        <DropdownMenuItem>Clone</DropdownMenuItem>
                        <DropdownMenuItem>Export Configuration</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
