"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  LucidePlus,
  LucidePlay,
  LucidePause,
  LucideTrash2,
  LucideRefreshCw,
  LucideCheckCircle2,
  LucideAlertCircle,
  LucideClock,
  LucideActivity,
  LucideDownload,
  LucideFileText,
  LucideZap,
  LucideSettings,
  LucideBarChart3
} from 'lucide-react';

// Types for the enhanced job system
interface EnhancedScrapingJob {
  id: string;
  name: string;
  url: string;
  engine: 'httrack' | 'playwright' | 'jsdom';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: {
    downloaded: number;
    total: number;
    currentUrl: string;
    speed: number;
    eta: number;
  };
  result?: {
    success: boolean;
    filesDownloaded: number;
    totalSize: number;
    statistics: {
      duration: number;
      avgDownloadSpeed: number;
      errorRate: number;
    };
  };
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  config: {
    maxDepth: number;
    maxFiles: number;
    downloadImages: boolean;
    downloadCSS: boolean;
    delay: number;
    maxConcurrent?: number;
  };
}

export function EnhancedScraperList() {
  const [jobs, setJobs] = useState<EnhancedScrapingJob[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [newJobConfig, setNewJobConfig] = useState({
    name: '',
    url: '',
    engine: 'httrack' as const,
    maxDepth: 2,
    maxFiles: 50,
    downloadImages: true,
    downloadCSS: true,
    delay: 1000,
    maxConcurrent: 3
  });

  // Ensure Dialog only renders on client-side to prevent static generation issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Simulate job management API calls
  const createJob = useCallback(async () => {
    if (!newJobConfig.name || !newJobConfig.url) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Simulate API call to create job
      const newJob: EnhancedScrapingJob = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newJobConfig.name,
        url: newJobConfig.url,
        engine: newJobConfig.engine,
        status: 'pending',
        createdAt: new Date(),
        config: {
          maxDepth: newJobConfig.maxDepth,
          maxFiles: newJobConfig.maxFiles,
          downloadImages: newJobConfig.downloadImages,
          downloadCSS: newJobConfig.downloadCSS,
          delay: newJobConfig.delay,
          maxConcurrent: newJobConfig.maxConcurrent
        }
      };

      setJobs(prev => [newJob, ...prev]);
      setIsCreateDialogOpen(false);
      setNewJobConfig({
        name: '',
        url: '',
        engine: 'httrack',
        maxDepth: 2,
        maxFiles: 50,
        downloadImages: true,
        downloadCSS: true,
        delay: 1000,
        maxConcurrent: 3
      });

      toast.success(`Job "${newJob.name}" created successfully`);
    } catch (error) {
      toast.error('Failed to create job');
    }
  }, [newJobConfig]);

  const startJob = useCallback(async (jobId: string) => {
    setJobs(prev => prev.map(job =>
      job.id === jobId
        ? { ...job, status: 'running' as const, startedAt: new Date() }
        : job
    ));

    // Simulate job progress
    let downloaded = 0;
    const total = 5; // Simulate 5 files to download
    const interval = setInterval(() => {
      downloaded += 1;
      const speed = 1024 + Math.random() * 2048; // Random speed
      const eta = (total - downloaded) * 2; // Estimate 2 seconds per file

      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? {
              ...job,
              progress: {
                downloaded,
                total,
                currentUrl: `https://example.com/file-${downloaded}.html`,
                speed,
                eta
              }
            }
          : job
      ));

      if (downloaded >= total) {
        clearInterval(interval);
        // Complete the job
        setTimeout(() => {
          setJobs(prev => prev.map(job =>
            job.id === jobId
              ? {
                  ...job,
                  status: 'completed' as const,
                  completedAt: new Date(),
                  progress: undefined,
                  result: {
                    success: true,
                    filesDownloaded: total,
                    totalSize: 15420, // 15KB
                    statistics: {
                      duration: 10000,
                      avgDownloadSpeed: 1542,
                      errorRate: 0
                    }
                  }
                }
              : job
          ));
          toast.success('Job completed successfully!');
        }, 1000);
      }
    }, 2000);

    toast.success('Job started');
  }, []);

  const cancelJob = useCallback((jobId: string) => {
    setJobs(prev => prev.map(job =>
      job.id === jobId
        ? { ...job, status: 'cancelled' as const, completedAt: new Date() }
        : job
    ));
    toast.info('Job cancelled');
  }, []);

  const deleteJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
    toast.success('Job deleted');
  }, []);

  // Filter jobs based on active tab
  const filteredJobs = jobs.filter(job => {
    switch (activeTab) {
      case 'active':
        return job.status === 'running' || job.status === 'pending';
      case 'completed':
        return job.status === 'completed';
      case 'failed':
        return job.status === 'failed' || job.status === 'cancelled';
      default:
        return true;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <LucideActivity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <LucideCheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <LucideAlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <LucideAlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <LucideClock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  // Add some sample jobs for demonstration
  useEffect(() => {
    const sampleJobs: EnhancedScrapingJob[] = [
      {
        id: 'sample-1',
        name: 'Product Catalog Scraper',
        url: 'https://example.com/products',
        engine: 'httrack',
        status: 'completed',
        createdAt: new Date(Date.now() - 3600000),
        completedAt: new Date(Date.now() - 3300000),
        config: {
          maxDepth: 3,
          maxFiles: 100,
          downloadImages: true,
          downloadCSS: true,
          delay: 500,
          maxConcurrent: 5
        },
        result: {
          success: true,
          filesDownloaded: 87,
          totalSize: 2456789,
          statistics: {
            duration: 300000,
            avgDownloadSpeed: 8189,
            errorRate: 0.05
          }
        }
      },
      {
        id: 'sample-2',
        name: 'News Articles Collection',
        url: 'https://news.example.com',
        engine: 'httrack',
        status: 'pending',
        createdAt: new Date(Date.now() - 1800000),
        config: {
          maxDepth: 2,
          maxFiles: 50,
          downloadImages: false,
          downloadCSS: true,
          delay: 1000,
          maxConcurrent: 3
        }
      }
    ];

    setJobs(sampleJobs);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Enhanced Scrapers</h2>
          <p className="text-muted-foreground">
            Manage your web scraping jobs with real-time progress tracking
          </p>
        </div>

        {isMounted && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <LucidePlus className="h-4 w-4 mr-2" />
                New Scraper
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Scraping Job</DialogTitle>
              <DialogDescription>
                Configure your scraping job with enhanced HTTrack engine
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Job Name</Label>
                  <Input
                    id="name"
                    value={newJobConfig.name}
                    onChange={(e) => setNewJobConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Scraping Job"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Target URL</Label>
                  <Input
                    id="url"
                    value={newJobConfig.url}
                    onChange={(e) => setNewJobConfig(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDepth">Max Depth</Label>
                  <Input
                    id="maxDepth"
                    type="number"
                    value={newJobConfig.maxDepth}
                    onChange={(e) => setNewJobConfig(prev => ({ ...prev, maxDepth: Number.parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFiles">Max Files</Label>
                  <Input
                    id="maxFiles"
                    type="number"
                    value={newJobConfig.maxFiles}
                    onChange={(e) => setNewJobConfig(prev => ({ ...prev, maxFiles: Number.parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrent">Concurrent Downloads</Label>
                  <Input
                    id="maxConcurrent"
                    type="number"
                    value={newJobConfig.maxConcurrent}
                    onChange={(e) => setNewJobConfig(prev => ({ ...prev, maxConcurrent: Number.parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createJob}>
                  <LucideZap className="h-4 w-4 mr-2" />
                  Create Job
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({jobs.filter(j => j.status === 'running' || j.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({jobs.filter(j => j.status === 'completed').length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({jobs.filter(j => j.status === 'failed' || j.status === 'cancelled').length})</TabsTrigger>
          <TabsTrigger value="all">All ({jobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <LucideFileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground text-center">
                  {activeTab === 'active' ? 'No active jobs at the moment.' : `No ${activeTab} jobs found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <CardTitle className="text-lg">{job.name}</CardTitle>
                          <CardDescription className="flex items-center space-x-2">
                            <span>{job.url}</span>
                            <Badge variant="outline" className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                            <Badge variant="secondary">{job.engine.toUpperCase()}</Badge>
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {job.status === 'pending' && (
                          <Button size="sm" onClick={() => startJob(job.id)}>
                            <LucidePlay className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {job.status === 'running' && (
                          <Button size="sm" variant="outline" onClick={() => cancelJob(job.id)}>
                            <LucidePause className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        {(job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && (
                          <Button size="sm" variant="outline" onClick={() => deleteJob(job.id)}>
                            <LucideTrash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress bar for running jobs */}
                    {job.status === 'running' && job.progress && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress: {job.progress.downloaded}/{job.progress.total} files</span>
                          <span>{(job.progress.speed / 1024).toFixed(1)} KB/s • ETA: {job.progress.eta}s</span>
                        </div>
                        <Progress value={(job.progress.downloaded / job.progress.total) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground truncate">
                          Current: {job.progress.currentUrl}
                        </p>
                      </div>
                    )}

                    {/* Job configuration */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Max Depth</Label>
                        <p className="font-medium">{job.config.maxDepth}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Max Files</Label>
                        <p className="font-medium">{job.config.maxFiles}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Delay</Label>
                        <p className="font-medium">{job.config.delay}ms</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Concurrent</Label>
                        <p className="font-medium">{job.config.maxConcurrent || 1}</p>
                      </div>
                    </div>

                    {/* Results for completed jobs */}
                    {job.status === 'completed' && job.result && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div>
                          <Label className="text-xs text-muted-foreground">Files Downloaded</Label>
                          <p className="font-medium flex items-center">
                            <LucideDownload className="h-3 w-3 mr-1" />
                            {job.result.filesDownloaded}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Total Size</Label>
                          <p className="font-medium">{(job.result.totalSize / 1024).toFixed(1)} KB</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Speed</Label>
                          <p className="font-medium">{(job.result.statistics.avgDownloadSpeed / 1024).toFixed(1)} KB/s</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Success Rate</Label>
                          <p className="font-medium">{((1 - job.result.statistics.errorRate) * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    )}

                    {/* Error message for failed jobs */}
                    {job.status === 'failed' && job.error && (
                      <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <Label className="text-xs text-red-600 dark:text-red-400">Error</Label>
                        <p className="text-sm text-red-700 dark:text-red-300">{job.error}</p>
                      </div>
                    )}

                    {/* Timestamps */}
                    <Separator />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Created: {job.createdAt.toLocaleString()}</span>
                      {job.completedAt && (
                        <span>Completed: {job.completedAt.toLocaleString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
