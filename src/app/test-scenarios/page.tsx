"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TestTube,
  Play,
  CheckCircle,
  Code,
  Globe,
  Target,
  Database,
  Zap,
  ExternalLink,
  Copy,
  ArrowRight,
  ShoppingCart,
  Building,
  Users,
  Mail,
  Phone,
  MapPin,
  Star,
  DollarSign,
  Calendar,
  FileText,
  Linkedin,
  Twitter,
  Instagram
} from 'lucide-react';
import Link from 'next/link';

interface TestScenario {
  id: string;
  title: string;
  description: string;
  category: 'ai' | 'scraper' | 'engine';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prompt?: string;
  url?: string;
  engine?: 'playwright' | 'httrack';
  selectors?: Record<string, string>;
  expectedResults?: string[];
  icon: React.ReactNode;
  color: string;
}

const testScenarios: TestScenario[] = [
  // AI Selector Generation Tests
  {
    id: 'ai-contact-info',
    title: 'Extract Contact Information',
    description: 'Test AI generation for emails, phone numbers, and contact names from business websites',
    category: 'ai',
    difficulty: 'beginner',
    estimatedTime: '2-3 minutes',
    prompt: 'Find email addresses, phone numbers, and contact names from a business directory website',
    expectedResults: ['Email selectors with GDPR warnings', 'Phone number patterns', 'Contact name extraction'],
    icon: <Mail className="h-5 w-5" />,
    color: 'bg-blue-500'
  },
  {
    id: 'ai-product-data',
    title: 'E-commerce Product Extraction',
    description: 'Generate selectors for product titles, prices, descriptions, and images',
    category: 'ai',
    difficulty: 'beginner',
    estimatedTime: '2-3 minutes',
    prompt: 'Extract product titles, prices, descriptions, ratings, and product images from an e-commerce website',
    expectedResults: ['Product title selectors', 'Price extraction patterns', 'Image and rating selectors'],
    icon: <ShoppingCart className="h-5 w-5" />,
    color: 'bg-green-500'
  },
  {
    id: 'ai-social-profiles',
    title: 'Social Media Profile Discovery',
    description: 'Find LinkedIn, Twitter, and social media profile links',
    category: 'ai',
    difficulty: 'intermediate',
    estimatedTime: '3-4 minutes',
    prompt: 'Find LinkedIn profiles, Twitter accounts, and other social media links from company websites',
    expectedResults: ['LinkedIn profile links', 'Twitter handle extraction', 'Social media URL patterns'],
    icon: <Linkedin className="h-5 w-5" />,
    color: 'bg-purple-500'
  },
  {
    id: 'ai-company-data',
    title: 'Business Intelligence Mining',
    description: 'Extract company names, addresses, and organizational details',
    category: 'ai',
    difficulty: 'intermediate',
    estimatedTime: '3-4 minutes',
    prompt: 'Extract company names, business addresses, industry information, and organizational details at scale',
    expectedResults: ['Company name patterns', 'Address extraction', 'Industry classification'],
    icon: <Building className="h-5 w-5" />,
    color: 'bg-orange-500'
  },

  // Scraper Builder Tests
  {
    id: 'scraper-news-site',
    title: 'News Article Scraper',
    description: 'Build a scraper for news articles with titles, content, and publication dates',
    category: 'scraper',
    difficulty: 'beginner',
    estimatedTime: '5-7 minutes',
    url: 'https://example-news-site.com',
    engine: 'playwright',
    selectors: {
      title: 'h1, .article-title, [data-title]',
      content: '.article-content, .post-content, main p',
      date: '.publish-date, time, [datetime]',
      author: '.author, .byline, [data-author]'
    },
    expectedResults: ['Article titles', 'Full content extraction', 'Publication metadata'],
    icon: <FileText className="h-5 w-5" />,
    color: 'bg-blue-600'
  },
  {
    id: 'scraper-job-listings',
    title: 'Job Listings Aggregator',
    description: 'Create a scraper for job postings with titles, companies, and requirements',
    category: 'scraper',
    difficulty: 'intermediate',
    estimatedTime: '7-10 minutes',
    url: 'https://example-jobs-site.com',
    engine: 'playwright',
    selectors: {
      jobTitle: '.job-title, h2 a, [data-job-title]',
      company: '.company-name, .employer, [data-company]',
      location: '.location, .job-location, [data-location]',
      salary: '.salary, .pay, [data-salary]',
      description: '.job-description, .requirements'
    },
    expectedResults: ['Job titles and companies', 'Location and salary data', 'Requirements text'],
    icon: <Users className="h-5 w-5" />,
    color: 'bg-indigo-600'
  },
  {
    id: 'scraper-real-estate',
    title: 'Real Estate Listings',
    description: 'Build a property scraper with prices, locations, and features',
    category: 'scraper',
    difficulty: 'intermediate',
    estimatedTime: '8-12 minutes',
    url: 'https://example-realestate.com',
    engine: 'playwright',
    selectors: {
      price: '.price, .listing-price, [data-price]',
      address: '.address, .property-address, [data-address]',
      bedrooms: '.beds, .bedrooms, [data-beds]',
      bathrooms: '.baths, .bathrooms, [data-baths]',
      sqft: '.sqft, .square-feet, [data-sqft]',
      description: '.property-description, .listing-details'
    },
    expectedResults: ['Property prices', 'Location details', 'Property specifications'],
    icon: <MapPin className="h-5 w-5" />,
    color: 'bg-green-600'
  },

  // Engine Comparison Tests
  {
    id: 'engine-spa-comparison',
    title: 'Single Page Application (SPA)',
    description: 'Compare Playwright vs HTTrack for dynamic content websites',
    category: 'engine',
    difficulty: 'advanced',
    estimatedTime: '10-15 minutes',
    url: 'https://react-spa-example.com',
    expectedResults: ['JavaScript rendering differences', 'Dynamic content capture', 'Performance comparison'],
    icon: <Code className="h-5 w-5" />,
    color: 'bg-purple-600'
  },
  {
    id: 'engine-static-site',
    title: 'Static Website Archiving',
    description: 'Test HTTrack for complete website mirroring and offline access',
    category: 'engine',
    difficulty: 'intermediate',
    estimatedTime: '8-12 minutes',
    url: 'https://static-example-site.com',
    engine: 'httrack',
    expectedResults: ['Complete site mirror', 'Asset preservation', 'Offline browsability'],
    icon: <Globe className="h-5 w-5" />,
    color: 'bg-teal-600'
  },
  {
    id: 'engine-ecommerce-scale',
    title: 'Large E-commerce Catalog',
    description: 'Compare engines for scraping thousands of product pages',
    category: 'engine',
    difficulty: 'advanced',
    estimatedTime: '15-20 minutes',
    url: 'https://large-ecommerce-site.com',
    expectedResults: ['Scalability comparison', 'Rate limiting handling', 'Data consistency'],
    icon: <Database className="h-5 w-5" />,
    color: 'bg-red-600'
  }
];

export default function TestScenariosPage() {
  const [activeTab, setActiveTab] = useState('ai');
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([]);

  const markComplete = (scenarioId: string) => {
    setCompletedScenarios(prev => [...prev, scenarioId]);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredScenarios = testScenarios.filter(scenario => scenario.category === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <TestTube className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DataVault Pro Test Scenarios
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Comprehensive testing suite for AI, scraping, and engine capabilities
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {completedScenarios.length} / {testScenarios.length} Complete
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              🧪 Production Testing Ready
            </Badge>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('ai')}>
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 mx-auto mb-3 text-blue-500" />
              <h3 className="font-semibold">AI Selector Tests</h3>
              <p className="text-sm text-muted-foreground">4 scenarios</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('scraper')}>
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-3 text-green-500" />
              <h3 className="font-semibold">Scraper Builder</h3>
              <p className="text-sm text-muted-foreground">3 scenarios</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('engine')}>
            <CardContent className="p-6 text-center">
              <Globe className="h-8 w-8 mx-auto mb-3 text-purple-500" />
              <h3 className="font-semibold">Engine Comparison</h3>
              <p className="text-sm text-muted-foreground">3 scenarios</p>
            </CardContent>
          </Card>
        </div>

        {/* Test Scenarios */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai">AI Selector Generation</TabsTrigger>
            <TabsTrigger value="scraper">Scraper Builder</TabsTrigger>
            <TabsTrigger value="engine">Engine Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  AI Selector Generation Tests
                </CardTitle>
                <CardDescription>
                  Test the AI-powered selector generation with various business intelligence scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredScenarios.map((scenario) => (
                    <Card key={scenario.id} className="transition-all hover:shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-3 rounded-lg ${scenario.color} bg-opacity-10`}>
                              <div className={`${scenario.color.replace('bg-', 'text-')} opacity-80`}>
                                {scenario.icon}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{scenario.title}</h3>
                                <Badge className={getDifficultyColor(scenario.difficulty)}>
                                  {scenario.difficulty}
                                </Badge>
                                <Badge variant="outline">
                                  {scenario.estimatedTime}
                                </Badge>
                                {completedScenarios.includes(scenario.id) && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Complete
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground mb-3">{scenario.description}</p>

                              {scenario.prompt && (
                                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                                  <h4 className="text-sm font-medium mb-1">Test Prompt:</h4>
                                  <p className="text-sm font-mono text-blue-800">{scenario.prompt}</p>
                                </div>
                              )}

                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Expected Results:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {scenario.expectedResults?.map((result, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {result}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Link href="/test-ai">
                              <Button size="sm" className="w-full">
                                <Play className="h-4 w-4 mr-2" />
                                Test Now
                              </Button>
                            </Link>
                            {scenario.prompt && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigator.clipboard.writeText(scenario.prompt || '')}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Prompt
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markComplete(scenario.id)}
                              disabled={completedScenarios.includes(scenario.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Done
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scraper" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Visual Scraper Builder Tests
                </CardTitle>
                <CardDescription>
                  Build complete scrapers using the 5-step visual builder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredScenarios.map((scenario) => (
                    <Card key={scenario.id} className="transition-all hover:shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-3 rounded-lg ${scenario.color} bg-opacity-10`}>
                              <div className={`${scenario.color.replace('bg-', 'text-')} opacity-80`}>
                                {scenario.icon}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{scenario.title}</h3>
                                <Badge className={getDifficultyColor(scenario.difficulty)}>
                                  {scenario.difficulty}
                                </Badge>
                                <Badge variant="outline">
                                  {scenario.estimatedTime}
                                </Badge>
                                {scenario.engine && (
                                  <Badge className="bg-purple-100 text-purple-800">
                                    {scenario.engine}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground mb-3">{scenario.description}</p>

                              {scenario.selectors && (
                                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                  <h4 className="text-sm font-medium mb-2">Suggested Selectors:</h4>
                                  <div className="space-y-1">
                                    {Object.entries(scenario.selectors).map(([key, selector]) => (
                                      <div key={key} className="text-xs">
                                        <span className="font-medium text-blue-600">{key}:</span>
                                        <span className="font-mono ml-2">{selector}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Expected Results:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {scenario.expectedResults?.map((result, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {result}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Link href="/dashboard/scrapers/new">
                              <Button size="sm" className="w-full">
                                <Play className="h-4 w-4 mr-2" />
                                Build Scraper
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markComplete(scenario.id)}
                              disabled={completedScenarios.includes(scenario.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Done
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engine" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-500" />
                  Engine Comparison Tests
                </CardTitle>
                <CardDescription>
                  Compare Playwright and HTTrack engines for different use cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredScenarios.map((scenario) => (
                    <Card key={scenario.id} className="transition-all hover:shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-3 rounded-lg ${scenario.color} bg-opacity-10`}>
                              <div className={`${scenario.color.replace('bg-', 'text-')} opacity-80`}>
                                {scenario.icon}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{scenario.title}</h3>
                                <Badge className={getDifficultyColor(scenario.difficulty)}>
                                  {scenario.difficulty}
                                </Badge>
                                <Badge variant="outline">
                                  {scenario.estimatedTime}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-3">{scenario.description}</p>

                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <h4 className="text-sm font-medium text-blue-800 mb-1">Playwright Engine</h4>
                                  <p className="text-xs text-blue-600">Targeted extraction, JavaScript rendering, dynamic content</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                  <h4 className="text-sm font-medium text-green-800 mb-1">HTTrack Engine</h4>
                                  <p className="text-xs text-green-600">Complete mirroring, static sites, offline access</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Expected Results:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {scenario.expectedResults?.map((result, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {result}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Link href="/dashboard/scrapers/new">
                              <Button size="sm" className="w-full">
                                <Play className="h-4 w-4 mr-2" />
                                Test Engines
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markComplete(scenario.id)}
                              disabled={completedScenarios.includes(scenario.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Done
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Progress Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Testing Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {testScenarios.filter(s => s.category === 'ai' && completedScenarios.includes(s.id)).length} / 4
                </div>
                <p className="text-sm text-muted-foreground">AI Tests Complete</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testScenarios.filter(s => s.category === 'scraper' && completedScenarios.includes(s.id)).length} / 3
                </div>
                <p className="text-sm text-muted-foreground">Scrapers Built</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {testScenarios.filter(s => s.category === 'engine' && completedScenarios.includes(s.id)).length} / 3
                </div>
                <p className="text-sm text-muted-foreground">Engine Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
