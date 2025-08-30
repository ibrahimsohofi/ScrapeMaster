"use client";

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/protected-route';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Clock,
  Download,
  Settings,
  Eye,
  Trash2,
  Copy,
  Edit,
  Calendar,
  TrendingUp,
  Database,
  Zap,
  Target,
  ArrowRight,
  Star,
  User,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import VisualPipelineEditor from '@/components/pipeline/visual-pipeline-editor';
import { pipelineTemplateService, PipelineTemplate } from '@/lib/pipeline/templates';

interface Pipeline {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft' | 'scheduled';
  lastRun: string | null;
  nextRun: string | null;
  nodes: number;
  connections: number;
  successRate: number;
  dataProcessed: number;
  createdAt: string;
  updatedAt: string;
  template?: string;
}

const samplePipelines: Pipeline[] = [
  {
    id: '1',
    name: 'E-commerce Product Monitor',
    description: 'Track product prices and availability across multiple stores',
    status: 'active',
    lastRun: '2024-02-20T14:30:00Z',
    nextRun: '2024-02-21T14:30:00Z',
    nodes: 6,
    connections: 5,
    successRate: 98.5,
    dataProcessed: 15420,
    createdAt: '2024-02-15T09:00:00Z',
    updatedAt: '2024-02-20T14:30:00Z',
    template: 'E-commerce Product Scraper'
  },
  {
    id: '2',
    name: 'News Sentiment Analysis',
    description: 'Collect news articles and perform sentiment analysis',
    status: 'scheduled',
    lastRun: null,
    nextRun: '2024-02-21T08:00:00Z',
    nodes: 8,
    connections: 7,
    successRate: 92.1,
    dataProcessed: 8750,
    createdAt: '2024-02-18T11:00:00Z',
    updatedAt: '2024-02-19T16:45:00Z',
    template: 'News Headlines Aggregator'
  },
  {
    id: '3',
    name: 'Lead Generation Pipeline',
    description: 'Extract and enrich professional contact information',
    status: 'paused',
    lastRun: '2024-02-19T10:15:00Z',
    nextRun: null,
    nodes: 10,
    connections: 9,
    successRate: 89.7,
    dataProcessed: 3200,
    createdAt: '2024-02-10T14:20:00Z',
    updatedAt: '2024-02-19T10:15:00Z',
    template: 'LinkedIn Lead Generator'
  }
];

export default function PipelinesPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'draft' | 'scheduled'>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);

  const filteredPipelines = samplePipelines.filter(pipeline => {
    const matchesSearch = pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pipeline.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || pipeline.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-3 h-3" />;
      case 'paused': return <Pause className="w-3 h-3" />;
      case 'draft': return <Edit className="w-3 h-3" />;
      case 'scheduled': return <Clock className="w-3 h-3" />;
      default: return <Settings className="w-3 h-3" />;
    }
  };

  const createNewPipeline = () => {
    setEditingPipeline(null);
    setShowEditor(true);
  };

  const editPipeline = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
    setShowEditor(true);
  };

  const closePipelineEditor = () => {
    setShowEditor(false);
    setEditingPipeline(null);
  };

  const duplicatePipeline = (pipeline: Pipeline) => {
    toast.success(`Pipeline "${pipeline.name}" duplicated successfully!`);
  };

  const deletePipeline = (pipeline: Pipeline) => {
    toast.success(`Pipeline "${pipeline.name}" deleted successfully!`);
  };

  const popularTemplates = pipelineTemplateService.getPopularTemplates(4);

  if (showEditor) {
    return (
      <div className="h-screen">
        <VisualPipelineEditor />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex-1 space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-blue-500" />
                Visual Data Pipelines
              </h1>
              <p className="text-gray-600 mt-1">
                Build powerful data processing pipelines with our visual editor
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={createNewPipeline}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Pipeline
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Pipelines</p>
                    <p className="text-2xl font-bold text-gray-900">{samplePipelines.length}</p>
                  </div>
                  <Database className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Pipelines</p>
                    <p className="text-2xl font-bold text-green-600">
                      {samplePipelines.filter(p => p.status === 'active').length}
                    </p>
                  </div>
                  <Play className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data Processed</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {samplePipelines.reduce((sum, p) => sum + p.dataProcessed, 0).toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Success Rate</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {(samplePipelines.reduce((sum, p) => sum + p.successRate, 0) / samplePipelines.length).toFixed(1)}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search pipelines..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pipelines List */}
              <div className="grid gap-6">
                {filteredPipelines.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No pipelines found</h3>
                      <p className="text-gray-500 mb-6">
                        {searchQuery || filterStatus !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Create your first data pipeline to get started'
                        }
                      </p>
                      <Button onClick={createNewPipeline}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Pipeline
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredPipelines.map((pipeline) => (
                    <Card key={pipeline.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{pipeline.name}</h3>
                              <Badge variant="outline" className={getStatusColor(pipeline.status)}>
                                {getStatusIcon(pipeline.status)}
                                <span className="ml-1 capitalize">{pipeline.status}</span>
                              </Badge>
                              {pipeline.template && (
                                <Badge variant="secondary" className="text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  {pipeline.template}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 mb-4">{pipeline.description}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Nodes:</span>
                                <span className="font-medium ml-2">{pipeline.nodes}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Success Rate:</span>
                                <span className="font-medium ml-2 text-green-600">{pipeline.successRate}%</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Data Processed:</span>
                                <span className="font-medium ml-2">{pipeline.dataProcessed.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Last Run:</span>
                                <span className="font-medium ml-2">
                                  {pipeline.lastRun
                                    ? new Date(pipeline.lastRun).toLocaleDateString()
                                    : 'Never'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editPipeline(pipeline)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => duplicatePipeline(pipeline)}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Duplicate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deletePipeline(pipeline)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    Pipeline Templates
                  </CardTitle>
                  <CardDescription>
                    Start with pre-built templates for common data processing scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {popularTemplates.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                              <p className="text-gray-600 text-sm mb-3">{template.description}</p>

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Download className="w-3 h-3" />
                                  <span>{template.downloadCount?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-current text-yellow-500" />
                                  <span>{template.rating}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{template.estimatedTime}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <Button size="sm" onClick={createNewPipeline}>
                              Use Template
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-6 text-center">
                    <Button variant="outline" onClick={createNewPipeline}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Browse All Templates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Analytics</CardTitle>
                  <CardDescription>
                    Performance metrics and insights for your data pipelines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                    <p className="text-gray-500">
                      Detailed analytics and reporting features coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
