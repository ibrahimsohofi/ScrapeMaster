"use client";

// Disable static generation for this page to prevent build errors
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  SCRAPER_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  getPopularTemplates,
  searchTemplates,
  type ScraperTemplate
} from '@/lib/scraper/templates';
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Play,
  Copy,
  Edit,
  Trash2,
  Plus,
  Download,
  Eye,
  Code,
  Settings,
  Target,
  Zap,
  Globe,
  Database,
  Heart,
  TrendingUp,
  Calendar,
  Tag
} from 'lucide-react';

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ScraperTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getFilteredTemplates = () => {
    let templates = SCRAPER_TEMPLATES;

    if (selectedCategory !== 'all') {
      templates = getTemplatesByCategory(selectedCategory as any);
    }

    if (searchQuery) {
      templates = searchTemplates(searchQuery);
    }

    return templates;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryInfo = TEMPLATE_CATEGORIES.find(c => c.id === category);
    return categoryInfo?.color || 'gray';
  };

  const popularTemplates = getPopularTemplates(3);
  const filteredTemplates = getFilteredTemplates();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold">Scraper Templates</h1>
              <p className="text-gray-600">
                Pre-built templates for common scraping use cases. Get started in minutes!
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Custom Template
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Templates</p>
                    <p className="text-2xl font-bold">{SCRAPER_TEMPLATES.length}</p>
                  </div>
                  <Database className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Categories</p>
                    <p className="text-2xl font-bold">{TEMPLATE_CATEGORIES.length}</p>
                  </div>
                  <Tag className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Most Popular</p>
                    <p className="text-2xl font-bold">{popularTemplates[0]?.popularity}%</p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ready to Use</p>
                    <p className="text-2xl font-bold">{SCRAPER_TEMPLATES.filter(t => t.difficulty === 'beginner').length}</p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Start Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Popular Templates
              </CardTitle>
              <CardDescription>
                Most used templates by the community. Perfect for getting started quickly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {popularTemplates.map((template) => (
                  <Card key={template.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{template.icon}</span>
                          <div>
                            <h3 className="font-semibold text-sm">{template.name}</h3>
                            <Badge variant="secondary" className={getDifficultyColor(template.difficulty)}>
                              {template.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">{template.popularity}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Play className="w-3 h-3 mr-1" />
                          Use Template
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search and Filters */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TEMPLATE_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-48">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{template.icon}</span>
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={`bg-${getCategoryColor(template.category)}-100 text-${getCategoryColor(template.category)}-800 border-${getCategoryColor(template.category)}-200`}>
                                {template.category}
                              </Badge>
                              <Badge className={getDifficultyColor(template.difficulty)}>
                                {template.difficulty}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm">{template.popularity}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CardDescription className="line-clamp-3">
                        {template.description}
                      </CardDescription>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{template.estimatedTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Target className="w-4 h-4" />
                          <span>{Object.keys(template.selectors).length} selectors</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="w-4 h-4" />
                          <span>{template.targetSites.length} target sites</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.tags.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <Separator />

                      <div className="flex gap-2">
                        <Button className="flex-1">
                          <Play className="w-4 h-4 mr-2" />
                          Use Template
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <div className="space-y-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{template.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{template.name}</h3>
                              <Badge variant="outline" className={`bg-${getCategoryColor(template.category)}-100 text-${getCategoryColor(template.category)}-800`}>
                                {template.category}
                              </Badge>
                              <Badge className={getDifficultyColor(template.difficulty)}>
                                {template.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {template.estimatedTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {Object.keys(template.selectors).length} selectors
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {template.popularity}% popularity
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button>
                            <Play className="w-4 h-4 mr-2" />
                            Use Template
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setIsPreviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Template Preview Dialog */}
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              {selectedTemplate && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <span className="text-2xl">{selectedTemplate.icon}</span>
                      {selectedTemplate.name}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedTemplate.description}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Template Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Category</Label>
                        <Badge variant="outline" className={`bg-${getCategoryColor(selectedTemplate.category)}-100 text-${getCategoryColor(selectedTemplate.category)}-800`}>
                          {selectedTemplate.category}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Difficulty</Label>
                        <Badge className={getDifficultyColor(selectedTemplate.difficulty)}>
                          {selectedTemplate.difficulty}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Estimated Time</Label>
                        <p className="text-sm">{selectedTemplate.estimatedTime}</p>
                      </div>
                    </div>

                    {/* Use Case */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Use Case</Label>
                      <p className="text-sm text-gray-600">{selectedTemplate.useCase}</p>
                    </div>

                    {/* Target Sites */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Target Sites</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.targetSites.map((site) => (
                          <Badge key={site} variant="secondary">{site}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Selectors */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">CSS Selectors ({Object.keys(selectedTemplate.selectors).length})</Label>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {Object.entries(selectedTemplate.selectors).map(([key, selector]) => (
                          <div key={key} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">{key}</code>
                                {selector.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                                <Badge variant="outline" className="text-xs">{selector.dataType}</Badge>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{selector.description}</p>
                            <code className="text-xs bg-gray-50 p-2 rounded block">{selector.selector}</code>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Default Settings</Label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Engine:</span> {selectedTemplate.settings.engine}
                          </div>
                          <div>
                            <span className="font-medium">Delay:</span> {selectedTemplate.settings.delay}ms
                          </div>
                          <div>
                            <span className="font-medium">Timeout:</span> {selectedTemplate.settings.timeout}ms
                          </div>
                          <div>
                            <span className="font-medium">Retries:</span> {selectedTemplate.settings.retries}
                          </div>
                          <div>
                            <span className="font-medium">JavaScript:</span> {selectedTemplate.settings.javascript ? 'Enabled' : 'Disabled'}
                          </div>
                          <div>
                            <span className="font-medium">Robots.txt:</span> {selectedTemplate.settings.respectRobots ? 'Respect' : 'Ignore'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button className="flex-1">
                        <Play className="w-4 h-4 mr-2" />
                        Use This Template
                      </Button>
                      <Button variant="outline">
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
