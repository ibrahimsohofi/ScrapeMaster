'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Download,
  Star,
  Clock,
  User,
  Tag,
  Filter,
  Grid3X3,
  List,
  Sparkles,
  TrendingUp,
  Calendar,
  Copy,
  Play,
  Eye,
  Heart,
  Share2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { pipelineTemplateService, type PipelineTemplate, type TemplateCategory } from '@/lib/pipeline/templates';

interface TemplateBrowserProps {
  onTemplateSelect: (template: PipelineTemplate) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function TemplateBrowser({ onTemplateSelect, onClose, isOpen }: TemplateBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'name'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<PipelineTemplate | null>(null);

  const templates = useMemo(() => {
    let filtered = pipelineTemplateService.getAllTemplates();

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = pipelineTemplateService.searchTemplates(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
        break;
      case 'recent':
        filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const categories = pipelineTemplateService.getCategories();
  const popularTemplates = pipelineTemplateService.getPopularTemplates(5);
  const recentTemplates = pipelineTemplateService.getRecentTemplates(5);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: TemplateCategory) => {
    const iconMap = {
      'e-commerce': '🛒',
      'news-media': '📰',
      'social-media': '📱',
      'real-estate': '🏠',
      'job-listings': '💼',
      'financial': '💰',
      'lead-generation': '🎯',
      'product-monitoring': '📊',
      'content-aggregation': '📚',
      'data-transformation': '🔄',
      'api-integration': '🔌',
      'general': '⚙️'
    };
    return iconMap[category] || '📋';
  };

  const handleTemplateLoad = (template: PipelineTemplate) => {
    onTemplateSelect(template);
    onClose();
  };

  const TemplateCard = ({ template, compact = false }: { template: PipelineTemplate; compact?: boolean }) => (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${compact ? 'h-32' : 'h-64'}`}
          onClick={() => setSelectedTemplate(template)}>
      <CardHeader className={compact ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getCategoryIcon(template.category)}</span>
              <CardTitle className={`${compact ? 'text-sm' : 'text-lg'} line-clamp-1`}>
                {template.name}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                {template.difficulty}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {template.category}
              </Badge>
            </div>
          </div>
          {template.rating && (
            <div className="flex items-center gap-1 text-sm text-yellow-600">
              <Star className="w-3 h-3 fill-current" />
              <span>{template.rating}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className={compact ? 'pt-0 pb-2' : 'pt-0'}>
        {!compact && (
          <CardDescription className="text-sm line-clamp-2 mb-3">
            {template.description}
          </CardDescription>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{template.downloadCount?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{template.estimatedTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{template.author}</span>
          </div>
        </div>

        {!compact && (
          <>
            <Separator className="my-2" />
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const TemplateListItem = ({ template }: { template: PipelineTemplate }) => (
    <Card className="cursor-pointer transition-all duration-200 hover:shadow-md"
          onClick={() => setSelectedTemplate(template)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-2xl">{getCategoryIcon(template.category)}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{template.name}</h3>
                <Badge variant="outline" className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                  {template.difficulty}
                </Badge>
                {template.rating && (
                  <div className="flex items-center gap-1 text-sm text-yellow-600">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{template.rating}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-1">{template.description}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                <span>{template.category}</span>
                <span>{template.estimatedTime}</span>
                <span>{template.downloadCount?.toLocaleString() || '0'} downloads</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTemplate(template); }}>
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleTemplateLoad(template); }}>
              <Download className="w-4 h-4 mr-1" />
              Use
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Pipeline Template Library
          </DialogTitle>
          <DialogDescription>
            Choose from pre-built templates to quickly create powerful data pipelines
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 flex flex-col gap-4 overflow-y-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Library Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Templates</span>
                  <span className="font-semibold">{pipelineTemplateService.getAllTemplates().length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Categories</span>
                  <span className="font-semibold">{categories.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Most Popular</span>
                  <span className="font-semibold">{popularTemplates[0]?.name}</span>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as TemplateCategory | 'all')}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(({ category, count }) => (
                        <SelectItem key={category} value={category}>
                          {getCategoryIcon(category)} {category} ({count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="recent">Recently Updated</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Quick Access */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Popular</h4>
                  {popularTemplates.slice(0, 3).map(template => (
                    <div key={template.id}
                         className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer text-sm"
                         onClick={() => setSelectedTemplate(template)}>
                      <span>{getCategoryIcon(template.category)}</span>
                      <span className="flex-1 truncate">{template.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {template.downloadCount?.toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {templates.length} template{templates.length !== 1 ? 's' : ''}
                </span>
                {(searchQuery || selectedCategory !== 'all' || selectedDifficulty !== 'all') && (
                  <Badge variant="secondary" className="text-xs">
                    Filtered
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Templates Grid/List */}
            <div className="flex-1 overflow-y-auto">
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Search className="w-12 h-12 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No templates found</h3>
                  <p className="text-sm text-center">
                    Try adjusting your search criteria or filters
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(template => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map(template => (
                    <TemplateListItem key={template.id} template={template} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Template Detail Modal */}
        {selectedTemplate && (
          <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
            <DialogContent className="max-w-4xl h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-2xl">{getCategoryIcon(selectedTemplate.category)}</span>
                  {selectedTemplate.name}
                  <Badge variant="outline" className={getDifficultyColor(selectedTemplate.difficulty)}>
                    {selectedTemplate.difficulty}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{selectedTemplate.description}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-1 gap-6 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4">
                  {/* Template Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                      <div className="text-sm font-medium">{selectedTemplate.estimatedTime}</div>
                      <div className="text-xs text-gray-500">Setup Time</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Download className="w-5 h-5 mx-auto mb-1 text-green-500" />
                      <div className="text-sm font-medium">{selectedTemplate.downloadCount?.toLocaleString() || '0'}</div>
                      <div className="text-xs text-gray-500">Downloads</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Star className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                      <div className="text-sm font-medium">{selectedTemplate.rating || 'N/A'}</div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Tag className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                      <div className="text-sm font-medium">{selectedTemplate.tags.length}</div>
                      <div className="text-xs text-gray-500">Tags</div>
                    </div>
                  </div>

                  {/* Use Case */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Use Case</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedTemplate.useCase}</p>
                    </CardContent>
                  </Card>

                  {/* Pipeline Overview */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Pipeline Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Nodes</span>
                          <span className="font-semibold">{selectedTemplate.nodes.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Connections</span>
                          <span className="font-semibold">{selectedTemplate.edges.length}</span>
                        </div>
                        <Progress value={75} className="h-2" />
                        <p className="text-xs text-gray-500">Estimated complexity: {selectedTemplate.difficulty}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tags */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions */}
                <div className="w-64 space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => handleTemplateLoad(selectedTemplate)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Use This Template
                  </Button>

                  <Button variant="outline" className="w-full">
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </Button>

                  <Button variant="outline" className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>

                  <Separator />

                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Author: {selectedTemplate.author}</div>
                    <div>Version: {selectedTemplate.version}</div>
                    <div>Updated: {selectedTemplate.updatedAt.toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
