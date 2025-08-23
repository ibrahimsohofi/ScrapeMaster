"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  BarChart3,
  Brain,
  Code,
  Database,
  Globe,
  Play,
  Settings,
  Users,
  Zap,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Monitor,
  Activity,
  Shield,
  Download,
  Copy,
  ExternalLink,
  Smartphone,
  Tablet,
  Plus
} from 'lucide-react';

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResults, setAiResults] = useState<{
    selectors: Array<{
      key: string;
      selector: string;
      confidence: number;
    }>;
  } | null>(null);

  const handleAIGeneration = async () => {
    setIsLoading(true);
    // Simulate AI generation
    setTimeout(() => {
      setAiResults({
        selectors: [
          { key: 'title', selector: 'h1.product-title', confidence: 95 },
          { key: 'price', selector: '.price-display', confidence: 92 },
          { key: 'description', selector: '.product-description', confidence: 88 },
          { key: 'rating', selector: '.rating-stars', confidence: 85 }
        ]
      });
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 DataVault Pro Feature Demonstration
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Experience the power of enterprise-grade web scraping and data extraction
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <Badge variant="secondary" className="px-4 py-2">
              <Globe className="w-4 h-4 mr-2" />
              Multi-Engine Scraping
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Brain className="w-4 h-4 mr-2" />
              AI-Powered Selectors
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <BarChart3 className="w-4 h-4 mr-2" />
              Real-time Analytics
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Enterprise Security
            </Badge>
          </div>
        </div>

        {/* Main Demo Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scraper-builder">No-Code Builder</TabsTrigger>
            <TabsTrigger value="ai-selectors">AI Selectors</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    Active Scrapers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">24</div>
                  <p className="text-sm text-gray-600">Running across 3 engines</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Playwright</span>
                      <span>18</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>JSDOM</span>
                      <span>4</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>HTTrack</span>
                      <span>2</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">98.5%</div>
                  <p className="text-sm text-gray-600">Last 30 days</p>
                  <Progress value={98.5} className="mt-3" />
                  <div className="mt-2 text-sm text-gray-600">
                    2,847 successful / 2,891 total jobs
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Data Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">1.2M</div>
                  <p className="text-sm text-gray-600">Collected this month</p>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Today</span>
                      <span className="font-medium">47,832</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>This week</span>
                      <span className="font-medium">324,891</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>🎯 Key Features Demonstration</CardTitle>
                <CardDescription>
                  Click through the tabs above to explore each feature in detail
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">No-Code Scraper Builder</h3>
                        <p className="text-sm text-gray-600">Visual interface for creating scrapers without coding</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">AI-Powered CSS Selectors</h3>
                        <p className="text-sm text-gray-600">Intelligent selector generation using machine learning</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">Real-time Analytics</h3>
                        <p className="text-sm text-gray-600">Live monitoring and performance metrics</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">Multi-Engine Support</h3>
                        <p className="text-sm text-gray-600">Playwright, JSDOM, and HTTrack engines</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">Enterprise Security</h3>
                        <p className="text-sm text-gray-600">Rate limiting, geo-blocking, and compliance tools</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">RESTful API</h3>
                        <p className="text-sm text-gray-600">Complete API for external integrations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scraper Builder Tab */}
          <TabsContent value="scraper-builder" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  No-Code Scraper Builder
                </CardTitle>
                <CardDescription>
                  Create powerful web scrapers using our visual interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="scraper-name">Scraper Name</Label>
                      <Input id="scraper-name" placeholder="E-commerce Product Monitor" />
                    </div>
                    <div>
                      <Label htmlFor="target-url">Target URL</Label>
                      <Input id="target-url" placeholder="https://example-store.com/products" />
                    </div>
                    <div>
                      <Label htmlFor="engine">Scraping Engine</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select engine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="playwright">Playwright (Recommended)</SelectItem>
                          <SelectItem value="jsdom">JSDOM (Fast)</SelectItem>
                          <SelectItem value="httrack">HTTrack (Deep crawling)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="javascript" />
                      <Label htmlFor="javascript">Enable JavaScript</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Field Selectors</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input placeholder="Field name" value="title" readOnly />
                        <Input placeholder="CSS Selector" value="h1.product-title" />
                        <Button variant="outline" size="sm">
                          <Target className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input placeholder="Field name" value="price" readOnly />
                        <Input placeholder="CSS Selector" value=".price-display" />
                        <Button variant="outline" size="sm">
                          <Target className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input placeholder="Field name" value="description" readOnly />
                        <Input placeholder="CSS Selector" value=".product-description" />
                        <Button variant="outline" size="sm">
                          <Target className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Test Scraper
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Save as Template
                  </Button>
                  <Button>
                    <Download className="w-4 h-4 mr-2" />
                    Deploy Scraper
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">Desktop View</span>
                  </div>
                  <p className="text-sm text-gray-600">Optimized for desktop websites</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Tablet className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Tablet View</span>
                  </div>
                  <p className="text-sm text-gray-600">Responsive design testing</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold">Mobile View</span>
                  </div>
                  <p className="text-sm text-gray-600">Mobile-first scraping</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Selectors Tab */}
          <TabsContent value="ai-selectors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI-Powered CSS Selector Generation
                </CardTitle>
                <CardDescription>
                  Let AI analyze your target page and generate optimal selectors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-prompt">Describe what you want to extract</Label>
                    <Textarea
                      id="ai-prompt"
                      placeholder="Extract product information including title, price, description, and customer rating from an e-commerce product page"
                      className="min-h-20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="page-url">Target Page URL</Label>
                    <Input id="page-url" placeholder="https://example-store.com/product/123" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label>Output Format</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="CSS Selectors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="css">CSS Selectors</SelectItem>
                          <SelectItem value="xpath">XPath Selectors</SelectItem>
                          <SelectItem value="both">Both CSS & XPath</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label>Complexity</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Simple" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleAIGeneration}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Generating Selectors...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate AI Selectors
                    </>
                  )}
                </Button>

                {aiResults && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold">Generated Selectors</h3>
                    <div className="space-y-3">
                      {aiResults.selectors.map((selector, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">{selector.key}</Badge>
                                  <Badge variant="secondary">{selector.confidence}% confidence</Badge>
                                </div>
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{selector.selector}</code>
                              </div>
                              <Button variant="outline" size="sm">
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Scrapers</p>
                      <p className="text-2xl font-bold">24</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="mt-2 text-sm text-green-600">+12% from last month</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Jobs Today</p>
                      <p className="text-2xl font-bold">1,247</p>
                    </div>
                    <Clock className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="mt-2 text-sm text-green-600">+5.7% from yesterday</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold">98.5%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="mt-2 text-sm text-green-600">+0.3% improvement</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Data Points</p>
                      <p className="text-2xl font-bold">2.1M</p>
                    </div>
                    <Database className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="mt-2 text-sm text-green-600">+15% this week</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Usage</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>67%</span>
                      </div>
                      <Progress value={67} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Network I/O</span>
                        <span>23%</span>
                      </div>
                      <Progress value={23} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Storage Usage</span>
                        <span>89%</span>
                      </div>
                      <Progress value={89} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Product Price Monitor completed</p>
                        <p className="text-xs text-gray-600">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">News Headlines Scraper finished</p>
                        <p className="text-xs text-gray-600">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Social Media Monitor running</p>
                        <p className="text-xs text-gray-600">8 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Contact Info Extractor completed</p>
                        <p className="text-xs text-gray-600">12 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <a href="/dashboard">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Dashboard
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/auth/login">
                <Users className="w-4 h-4 mr-2" />
                Sign In
              </a>
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Use credentials: <strong>admin@acme.com</strong> / <strong>password123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
