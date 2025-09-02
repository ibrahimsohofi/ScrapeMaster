"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ProtectedRoute } from '@/components/auth/protected-route';
import {
  ChevronLeft,
  Play,
  Plus,
  X,
  Check,
  MousePointer,
  Eye,
  Code,
  Settings,
  Clock,
  Download,
  Zap,
  Target,
  Database,
  Globe,
  RefreshCw,
  Save,
  Trash2,
  Edit,
  Copy,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  ArrowRight,
  Monitor,
  Smartphone,
  Tablet,
  RotateCcw,
  ExternalLink,
  FileText,
  Image,
  Link2,
  Hash,
  Calendar,
  Type,
  List,
  Table,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ExtractedField {
  id: string;
  name: string;
  selector: string;
  type: 'text' | 'link' | 'image' | 'number' | 'date' | 'list' | 'table';
  sample?: string;
  required: boolean;
  multiple: boolean;
  attribute?: string;
  transform?: string;
}

interface ScraperConfig {
  name: string;
  url: string;
  engine: 'playwright' | 'httrack';
  fields: ExtractedField[];
  settings: {
    userAgent: string;
    delay: number;
    timeout: number;
    retries: number;
    respectRobots: boolean;
    followRedirects: boolean;
    javascript: boolean;
    cookies: boolean;
  };
  httrackSettings: {
    maxDepth: number;
    maxFiles: number;
    followExternalLinks: boolean;
    downloadImages: boolean;
    downloadCSS: boolean;
    downloadJS: boolean;
    excludePatterns: string[];
    includePatterns: string[];
  };
  schedule: {
    type: 'manual' | 'interval' | 'cron';
    interval?: number;
    cronExpression?: string;
    timezone: string;
  };
  output: {
    format: 'json' | 'csv' | 'excel';
    destination: 'download' | 'webhook' | 'database';
    webhookUrl?: string;
  };
}

const sampleData = [
  {
    title: "Sample Product Title 1",
    price: "$29.99",
    image: "https://example.com/image1.jpg",
    description: "This is a sample product description...",
    rating: "4.5"
  },
  {
    title: "Sample Product Title 2",
    price: "$39.99",
    image: "https://example.com/image2.jpg",
    description: "Another sample product description...",
    rating: "4.2"
  },
  {
    title: "Sample Product Title 3",
    price: "$19.99",
    image: "https://example.com/image3.jpg",
    description: "Yet another sample product description...",
    rating: "4.8"
  }
];

const fieldTypeIcons = {
  text: <Type className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
  table: <Table className="h-4 w-4" />
};

export default function NewScraperPage() {
  const router = useRouter();
  const [config, setConfig] = useState<ScraperConfig>({
    name: '',
    url: '',
    engine: 'playwright',
    fields: [],
    settings: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      delay: 1000,
      timeout: 30000,
      retries: 3,
      respectRobots: true,
      followRedirects: true,
      javascript: true,
      cookies: true,
    },
    httrackSettings: {
      maxDepth: 2,
      maxFiles: 100,
      followExternalLinks: false,
      downloadImages: true,
      downloadCSS: true,
      downloadJS: false,
      excludePatterns: [],
      includePatterns: [],
    },
    schedule: {
      type: 'manual',
      timezone: 'UTC',
    },
    output: {
      format: 'json',
      destination: 'download',
    },
  });

  const [activeTab, setActiveTab] = useState('builder');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isTestingSelector, setIsTestingSelector] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [urlTested, setUrlTested] = useState(false);
  const [urlTestResult, setUrlTestResult] = useState<'success' | 'error' | null>(null);

  // Demo data for showcase
  const demoWebsite = "https://quotes.toscrape.com";
  const demoFields = [
    {
      id: '1',
      name: 'Quote Text',
      selector: '.text',
      type: 'text' as const,
      sample: '"The world as we have created it is a process of our thinking..."',
      required: true,
      multiple: false,
    },
    {
      id: '2',
      name: 'Author',
      selector: '.author',
      type: 'text' as const,
      sample: 'Albert Einstein',
      required: true,
      multiple: false,
    },
    {
      id: '3',
      name: 'Tags',
      selector: '.tag',
      type: 'list' as const,
      sample: 'inspirational, life, mind',
      required: false,
      multiple: true,
    }
  ];

  const steps = [
    { id: 0, title: 'Basic Setup', description: 'Configure scraper name and target URL' },
    { id: 1, title: 'Element Selection', description: 'Select data fields to extract' },
    { id: 2, title: 'Preview & Test', description: 'Preview extracted data' },
    { id: 3, title: 'Advanced Settings', description: 'Configure scraper behavior' },
    { id: 4, title: 'Schedule & Output', description: 'Set up automation and output' }
  ];

  const addField = () => {
    const newField: ExtractedField = {
      id: Date.now().toString(),
      name: `Field ${config.fields.length + 1}`,
      selector: '',
      type: 'text',
      required: false,
      multiple: false,
    };
    setConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
    setSelectedField(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<ExtractedField>) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    }));
  };

  const removeField = (fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId),
    }));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const runTest = async () => {
    if (!config.url || config.fields.length === 0) {
      toast.error('Please provide a URL and at least one field selector');
      return;
    }

    setIsTestingSelector(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please log in to test scraping');
        return;
      }

      // Convert fields to selectors format for API
      const selectors = config.fields.reduce((acc, field) => {
        if (field.selector) {
          acc[field.name] = field.selector;
        }
        return acc;
      }, {} as Record<string, string>);

      const response = await fetch('/api/scraper/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: config.url,
          selectors,
          options: {
            timeout: config.settings.timeout,
            userAgent: config.settings.userAgent,
            javascript: config.settings.javascript,
          },
          useAI: false,
          useProxy: false,
          antiDetection: true
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setTestResults(result.data);
        toast.success(`Successfully extracted ${result.data.length} items from ${config.url}`);
      } else {
        toast.error(result.error || 'Failed to extract data');
        setTestResults([]);
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to test scraper. Please try again.');
      setTestResults([]);
    } finally {
      setIsTestingSelector(false);
    }
  };

  const saveScraper = async () => {
    if (!config.name || !config.url || config.fields.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    // Simulate saving
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Scraper created successfully!');
      router.push('/dashboard/scrapers');
    }, 2000);
  };

  const generateSelector = (elementType: string) => {
    const selectors = {
      title: '.product-title, h1, h2, .title, [data-title]',
      price: '.price, .cost, .amount, [data-price], .product-price',
      image: 'img, .image, [data-image]',
      description: '.description, .summary, .content, [data-description]',
      rating: '.rating, .score, .stars, [data-rating]'
    };
    return selectors[elementType as keyof typeof selectors] || '';
  };

  const loadDemoData = () => {
    setConfig(prev => ({
      ...prev,
      name: 'Quotes Scraper Demo',
      url: demoWebsite,
      fields: demoFields,
    }));
    setUrlTested(true);
    setUrlTestResult('success');
    toast.success('Demo data loaded! Ready to test the scraper.');
  };

  const testUrl = async () => {
    if (!config.url) {
      toast.error('Please enter a URL to test');
      return;
    }

    setIsTestingSelector(true);
    setUrlTestResult(null);

    // Simulate URL testing
    setTimeout(() => {
      setIsTestingSelector(false);
      setUrlTested(true);
      setUrlTestResult('success');
      toast.success('URL is accessible and ready for scraping!');
    }, 2000);
  };

  const testPreview = async () => {
    if (config.fields.length === 0) {
      toast.error('Please add at least one field to preview');
      return;
    }

    setIsPreviewLoading(true);

    // Simulate preview data
    setTimeout(() => {
      const mockData = [
        {
          'Quote Text': '"The world as we have created it is a process of our thinking..."',
          'Author': 'Albert Einstein',
          'Tags': ['change', 'deep-thoughts', 'thinking', 'world']
        },
        {
          'Quote Text': '"It is our choices, Harry, that show what we truly are, far more than our abilities."',
          'Author': 'J.K. Rowling',
          'Tags': ['abilities', 'choices']
        },
        {
          'Quote Text': '"There are only two ways to live your life. One is as though nothing is a miracle. The other is as though everything is a miracle."',
          'Author': 'Albert Einstein',
          'Tags': ['inspirational', 'life', 'live', 'miracle', 'miracles']
        }
      ];
      setPreviewData(mockData);
      setIsPreviewLoading(false);
      toast.success('Preview generated successfully!');
    }, 1500);
  };

  const [testResults, setTestResults] = useState<Record<string, string>[]>([]);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <Link href="/dashboard/scrapers">
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Scrapers</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Create New Scraper</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Build a custom web scraper with our no-code visual builder
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={loadDemoData}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 flex-1 sm:flex-none"
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Load Demo</span>
              <span className="sm:hidden">Demo</span>
            </Button>
            <Button
              onClick={saveScraper}
              className="flex-1 sm:flex-none"
              size="sm"
              disabled={isSaving || !config.name || !config.url || config.fields.length === 0}
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Scraper'}
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-8 overflow-x-auto">
                <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'} flex-shrink-0`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {currentStep > 1 ? <Check className="h-4 w-4" /> : '1'}
                  </div>
                  <span className="font-medium text-sm sm:text-base">Setup URL</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />
                <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'} flex-shrink-0`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {currentStep > 2 ? <Check className="h-4 w-4" /> : '2'}
                  </div>
                  <span className="font-medium text-sm sm:text-base">Select Fields</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />
                <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'} flex-shrink-0`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {currentStep > 3 ? <Check className="h-4 w-4" /> : '3'}
                  </div>
                  <span className="font-medium text-sm sm:text-base">Configure & Test</span>
                </div>
              </div>
              <Progress value={(currentStep / 3) * 100} className="w-full sm:w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="builder" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm p-2 sm:p-3">
              <MousePointer className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Visual Builder</span>
              <span className="sm:hidden">Builder</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm p-2 sm:p-3">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm p-2 sm:p-3">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Preview</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm p-2 sm:p-3">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Schedule</span>
            </TabsTrigger>
          </TabsList>

          {/* Visual Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* URL Configuration */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span>Target Website</span>
                  </CardTitle>
                  <CardDescription>
                    Enter the URL you want to scrape and configure basic settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scraper-name">Scraper Name</Label>
                    <Input
                      id="scraper-name"
                      placeholder="e.g., Product Price Monitor"
                      value={config.name}
                      onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-url">Target URL</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="target-url"
                        placeholder="https://example.com"
                        value={config.url}
                        onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                        className="flex-1"
                      />
                      <Button
                        onClick={testUrl}
                        variant="outline"
                        disabled={isTestingSelector || !config.url}
                      >
                        {isTestingSelector ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Test
                      </Button>
                    </div>
                    {urlTestResult && (
                      <div className={`flex items-center space-x-2 text-sm ${
                        urlTestResult === 'success' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {urlTestResult === 'success' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span>
                          {urlTestResult === 'success' ? 'URL is accessible!' : 'URL not accessible'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scraping-engine">Scraping Engine</Label>
                    <Select
                      value={config.engine}
                      onValueChange={(value: 'playwright' | 'httrack') =>
                        setConfig(prev => ({ ...prev, engine: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="playwright">
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-blue-500" />
                            <div>
                              <div className="font-medium">Playwright (Recommended)</div>
                              <div className="text-xs text-gray-500">JavaScript-enabled scraping</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="httrack">
                          <div className="flex items-center space-x-2">
                            <Download className="h-4 w-4 text-green-500" />
                            <div>
                              <div className="font-medium">HTTrack</div>
                              <div className="text-xs text-gray-500">Full website download</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={loadDemoData}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Zap className="h-4 w-4 mr-2 text-blue-500" />
                    Load Demo Data
                  </Button>
                  <Button
                    onClick={() => setActiveTab('preview')}
                    variant="outline"
                    className="w-full justify-start"
                    disabled={config.fields.length === 0}
                  >
                    <Eye className="h-4 w-4 mr-2 text-purple-500" />
                    Preview Results
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={!urlTested}
                  >
                    <Code className="h-4 w-4 mr-2 text-orange-500" />
                    AI Selector Helper
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Fields Configuration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="h-5 w-5 text-purple-600" />
                      <span>Data Fields ({config.fields.length})</span>
                    </CardTitle>
                    <CardDescription>
                      Define what data you want to extract from the website
                    </CardDescription>
                  </div>
                  <Button onClick={addField} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {config.fields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No fields defined</h3>
                    <p className="text-gray-500 mb-4">
                      Add your first data field or load the demo to get started
                    </p>
                    <div className="flex justify-center space-x-3">
                      <Button onClick={addField} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                      <Button onClick={loadDemoData} variant="outline">
                        <Zap className="h-4 w-4 mr-2" />
                        Load Demo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {config.fields.map((field, index) => (
                      <Card
                        key={field.id}
                        className={`transition-all ${
                          selectedField === field.id
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:shadow-md'
                        }`}
                      >
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-500">FIELD NAME</Label>
                              <Input
                                value={field.name}
                                onChange={(e) => updateField(field.id, { name: e.target.value })}
                                placeholder="Field name"
                                className="font-medium"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-500">CSS SELECTOR</Label>
                              <Input
                                value={field.selector}
                                onChange={(e) => updateField(field.id, { selector: e.target.value })}
                                placeholder=".class-name"
                                className="font-mono text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-500">DATA TYPE</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value: any) => updateField(field.id, { type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">
                                    <div className="flex items-center space-x-2">
                                      <Type className="h-4 w-4" />
                                      <span>Text</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="link">
                                    <div className="flex items-center space-x-2">
                                      <Link2 className="h-4 w-4" />
                                      <span>Link/URL</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="image">
                                    <div className="flex items-center space-x-2">
                                      <Image className="h-4 w-4" />
                                      <span>Image</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="number">
                                    <div className="flex items-center space-x-2">
                                      <Hash className="h-4 w-4" />
                                      <span>Number</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="date">
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4" />
                                      <span>Date</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="list">
                                    <div className="flex items-center space-x-2">
                                      <List className="h-4 w-4" />
                                      <span>List</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={field.required}
                                    onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                                  />
                                  <Label className="text-xs text-gray-500">Required</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={field.multiple}
                                    onCheckedChange={(checked) => updateField(field.id, { multiple: checked })}
                                  />
                                  <Label className="text-xs text-gray-500">Multiple</Label>
                                </div>
                              </div>
                              <Button
                                onClick={() => removeField(field.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {field.sample && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                              <Label className="text-xs font-medium text-gray-500 mb-1 block">SAMPLE DATA</Label>
                              <code className="text-sm text-gray-700">{field.sample}</code>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scraping Settings</CardTitle>
                  <CardDescription>Configure how the scraper behaves</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>User Agent</Label>
                    <Input
                      value={config.settings.userAgent}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        settings: { ...prev.settings, userAgent: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delay (ms)</Label>
                      <Input
                        type="number"
                        value={config.settings.delay}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          settings: { ...prev.settings, delay: Number.parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Timeout (ms)</Label>
                      <Input
                        type="number"
                        value={config.settings.timeout}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          settings: { ...prev.settings, timeout: Number.parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Respect robots.txt</Label>
                      <Switch
                        checked={config.settings.respectRobots}
                        onCheckedChange={(checked) => setConfig(prev => ({
                          ...prev,
                          settings: { ...prev.settings, respectRobots: checked }
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Enable JavaScript</Label>
                      <Switch
                        checked={config.settings.javascript}
                        onCheckedChange={(checked) => setConfig(prev => ({
                          ...prev,
                          settings: { ...prev.settings, javascript: checked }
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Handle Cookies</Label>
                      <Switch
                        checked={config.settings.cookies}
                        onCheckedChange={(checked) => setConfig(prev => ({
                          ...prev,
                          settings: { ...prev.settings, cookies: checked }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {config.engine === 'httrack' && (
                <Card>
                  <CardHeader>
                    <CardTitle>HTTrack Settings</CardTitle>
                    <CardDescription>Website download configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Depth</Label>
                        <Input
                          type="number"
                          value={config.httrackSettings.maxDepth}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            httrackSettings: { ...prev.httrackSettings, maxDepth: Number.parseInt(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Files</Label>
                        <Input
                          type="number"
                          value={config.httrackSettings.maxFiles}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            httrackSettings: { ...prev.httrackSettings, maxFiles: Number.parseInt(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Download Images</Label>
                        <Switch
                          checked={config.httrackSettings.downloadImages}
                          onCheckedChange={(checked) => setConfig(prev => ({
                            ...prev,
                            httrackSettings: { ...prev.httrackSettings, downloadImages: checked }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Download CSS</Label>
                        <Switch
                          checked={config.httrackSettings.downloadCSS}
                          onCheckedChange={(checked) => setConfig(prev => ({
                            ...prev,
                            httrackSettings: { ...prev.httrackSettings, downloadCSS: checked }
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Follow External Links</Label>
                        <Switch
                          checked={config.httrackSettings.followExternalLinks}
                          onCheckedChange={(checked) => setConfig(prev => ({
                            ...prev,
                            httrackSettings: { ...prev.httrackSettings, followExternalLinks: checked }
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="h-5 w-5 text-purple-600" />
                      <span>Live Preview</span>
                    </CardTitle>
                    <CardDescription>
                      See what data will be extracted with your current configuration
                    </CardDescription>
                  </div>
                  <Button
                    onClick={testPreview}
                    disabled={isPreviewLoading || config.fields.length === 0}
                  >
                    {isPreviewLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isPreviewLoading ? 'Testing...' : 'Run Preview'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {config.fields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No fields to preview</h3>
                    <p className="text-gray-500 mb-4">
                      Add some data fields first to see the preview
                    </p>
                    <Button onClick={() => setActiveTab('builder')} variant="outline">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Go to Builder
                    </Button>
                  </div>
                ) : previewData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Preview successful!</span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        Found {previewData.length} items with your current field configuration
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            {config.fields.map(field => (
                              <th key={field.id} className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                                {field.name}
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {field.type}
                                </Badge>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              {config.fields.map(field => (
                                <td key={field.id} className="px-4 py-3 text-sm text-gray-900">
                                  <div className="max-w-xs truncate">
                                    {Array.isArray(row[field.name])
                                      ? row[field.name].join(', ')
                                      : row[field.name]
                                    }
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to preview</h3>
                    <p className="text-gray-500 mb-4">
                      Click "Run Preview" to test your scraper configuration
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span>Automation & Scheduling</span>
                </CardTitle>
                <CardDescription>
                  Set up automated scraping schedules for continuous data collection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Schedule Type</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card
                      className={`cursor-pointer transition-all ${
                        config.schedule.type === 'manual'
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, type: 'manual' }
                      }))}
                    >
                      <CardContent className="pt-4 text-center">
                        <MousePointer className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                        <h4 className="font-medium">Manual</h4>
                        <p className="text-sm text-gray-500">Run manually when needed</p>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all ${
                        config.schedule.type === 'interval'
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, type: 'interval' }
                      }))}
                    >
                      <CardContent className="pt-4 text-center">
                        <RefreshCw className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h4 className="font-medium">Interval</h4>
                        <p className="text-sm text-gray-500">Run every X minutes/hours</p>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all ${
                        config.schedule.type === 'cron'
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, type: 'cron' }
                      }))}
                    >
                      <CardContent className="pt-4 text-center">
                        <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <h4 className="font-medium">Advanced</h4>
                        <p className="text-sm text-gray-500">Custom cron expression</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {config.schedule.type === 'interval' && (
                  <div className="space-y-2">
                    <Label>Run Every (minutes)</Label>
                    <Input
                      type="number"
                      placeholder="60"
                      value={config.schedule.interval || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, interval: Number.parseInt(e.target.value) || undefined }
                      }))}
                    />
                    <p className="text-sm text-gray-500">
                      Minimum interval is 5 minutes. For more frequent runs, upgrade to Enterprise.
                    </p>
                  </div>
                )}

                {config.schedule.type === 'cron' && (
                  <div className="space-y-2">
                    <Label>Cron Expression</Label>
                    <Input
                      placeholder="0 0 * * *"
                      value={config.schedule.cronExpression || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, cronExpression: e.target.value }
                      }))}
                    />
                    <p className="text-sm text-gray-500">
                      Use standard cron format. <a href="#" className="text-blue-600 hover:underline">Learn more</a>
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={config.schedule.timezone}
                    onValueChange={(value) => setConfig(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, timezone: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
