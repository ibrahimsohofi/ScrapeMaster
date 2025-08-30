"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Code,
  Globe,
  Zap,
  Search,
  ArrowRight,
  CheckCircle,
  Copy,
  ExternalLink,
  Bookmark,
  Star,
  Clock,
  Users,
  Settings,
  Database,
  Shield,
  Terminal,
  FileText,
  Lightbulb,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

const documentationSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Everything you need to start scraping with DataVault Pro",
    icon: <Zap className="h-6 w-6" />,
    articles: [
      { title: "Quick Start Guide", description: "Get up and running in 5 minutes", readTime: "5 min" },
      { title: "Your First Scraper", description: "Build your first web scraper", readTime: "10 min" },
      { title: "Understanding Plans", description: "Choose the right plan for your needs", readTime: "3 min" },
      { title: "Account Setup", description: "Configure your account settings", readTime: "5 min" }
    ]
  },
  {
    id: "scraper-builder",
    title: "Scraper Builder",
    description: "Master the no-code scraper builder",
    icon: <Settings className="h-6 w-6" />,
    articles: [
      { title: "Visual Element Selection", description: "Point and click to select data", readTime: "8 min" },
      { title: "Field Configuration", description: "Configure extraction fields", readTime: "12 min" },
      { title: "Data Preview", description: "Preview your scraped data", readTime: "5 min" },
      { title: "Advanced Selectors", description: "CSS and XPath selectors", readTime: "15 min" }
    ]
  },
  {
    id: "api-reference",
    title: "API Reference",
    description: "Complete REST API documentation",
    icon: <Code className="h-6 w-6" />,
    articles: [
      { title: "Authentication", description: "API keys and authentication", readTime: "7 min" },
      { title: "Scrapers API", description: "Manage scrapers via API", readTime: "20 min" },
      { title: "Jobs API", description: "Run and monitor scraping jobs", readTime: "15 min" },
      { title: "Data Export API", description: "Export and download data", readTime: "10 min" }
    ]
  },
  {
    id: "integrations",
    title: "Integrations",
    description: "Connect DataVault Pro with your tools",
    icon: <Globe className="h-6 w-6" />,
    articles: [
      { title: "Webhooks", description: "Real-time data notifications", readTime: "12 min" },
      { title: "Database Connections", description: "Direct database exports", readTime: "18 min" },
      { title: "Cloud Storage", description: "AWS S3, Google Cloud storage", readTime: "15 min" },
      { title: "Third-party Tools", description: "Zapier, Make.com integrations", readTime: "10 min" }
    ]
  },
  {
    id: "advanced",
    title: "Advanced Features",
    description: "Pro tips and advanced configurations",
    icon: <Star className="h-6 w-6" />,
    articles: [
      { title: "Custom Scripts", description: "JavaScript and Python scripts", readTime: "25 min" },
      { title: "Proxy Configuration", description: "Advanced proxy settings", readTime: "12 min" },
      { title: "Error Handling", description: "Retry logic and error recovery", readTime: "15 min" },
      { title: "Performance Optimization", description: "Speed up your scrapers", readTime: "20 min" }
    ]
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Common issues and solutions",
    icon: <AlertCircle className="h-6 w-6" />,
    articles: [
      { title: "Common Errors", description: "Fixing common scraping errors", readTime: "10 min" },
      { title: "Rate Limiting", description: "Handling rate limits", readTime: "8 min" },
      { title: "CAPTCHA Issues", description: "Dealing with CAPTCHAs", readTime: "12 min" },
      { title: "Data Quality", description: "Improving data accuracy", readTime: "15 min" }
    ]
  }
];

const popularArticles = [
  {
    title: "Quick Start Guide",
    description: "Get up and running in 5 minutes",
    category: "Getting Started",
    readTime: "5 min",
    views: "12.5k"
  },
  {
    title: "Visual Element Selection",
    description: "Point and click to select data",
    category: "Scraper Builder",
    readTime: "8 min",
    views: "8.2k"
  },
  {
    title: "API Authentication",
    description: "API keys and authentication",
    category: "API Reference",
    readTime: "7 min",
    views: "6.1k"
  },
  {
    title: "Webhook Integration",
    description: "Real-time data notifications",
    category: "Integrations",
    readTime: "12 min",
    views: "4.8k"
  }
];

const codeExamples = [
  {
    title: "Create a Scraper",
    language: "JavaScript",
    code: `const response = await fetch('https://api.datavaultpro.com/v1/scrapers', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Product Scraper',
    url: 'https://example-store.com/products',
    selectors: {
      title: '.product-title',
      price: '.price',
      image: '.product-image img@src'
    }
  })
});

const scraper = await response.json();
console.log('Scraper created:', scraper.id);`
  },
  {
    title: "Run a Job",
    language: "Python",
    code: `import requests

# Start a scraping job
response = requests.post(
    'https://api.datavaultpro.com/v1/jobs',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'scraper_id': 'scraper_123',
        'schedule': 'now'
    }
)

job = response.json()
print(f"Job started: {job['id']}")`
  },
  {
    title: "Webhook Handler",
    language: "Node.js",
    code: `app.post('/webhook', (req, res) => {
  const { event, data } = req.body;

  if (event === 'job.completed') {
    console.log('Job completed:', data.job_id);
    console.log('Records found:', data.records_count);

    // Process the scraped data
    processScrapedData(data.download_url);
  }

  res.status(200).send('OK');
});`
  }
];

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("getting-started");

  const filteredSections = documentationSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.articles.some(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            <BookOpen className="w-3 h-3 mr-1" />
            Comprehensive Documentation
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Learn DataVault Pro
            <span className="text-primary"> Inside & Out</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            From quick start guides to advanced API documentation. Everything you need to master web scraping with DataVault Pro.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="#getting-started">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#api-reference">
                API Reference
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((section) => (
              <Card key={section.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedSection(section.id)}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {section.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {section.articles.slice(0, 3).map((article, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{article.title}</span>
                        <Badge variant="secondary" className="text-xs">{article.readTime}</Badge>
                      </div>
                    ))}
                    {section.articles.length > 3 && (
                      <div className="text-sm text-primary mt-2">
                        +{section.articles.length - 3} more articles
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Articles</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Most read articles by our community
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {popularArticles.map((article, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-2">{article.title}</CardTitle>
                      <CardDescription>{article.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{article.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {article.views} views
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      Read <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Code Examples</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ready-to-use code snippets to get you started quickly
            </p>
          </div>

          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {codeExamples.map((example, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  {example.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {codeExamples.map((example, index) => (
              <TabsContent key={index} value={index.toString()}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{example.title}</CardTitle>
                        <CardDescription>Example using {example.language}</CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm">{example.code}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Getting Started Guide */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Quick Start Guide</h2>
            <p className="text-xl text-muted-foreground">
              Get your first scraper running in under 5 minutes
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: 1,
                title: "Create Your Account",
                description: "Sign up for DataVault Pro and verify your email address",
                icon: <Users className="h-6 w-6" />
              },
              {
                step: 2,
                title: "Build Your First Scraper",
                description: "Use our visual builder to select elements you want to scrape",
                icon: <Settings className="h-6 w-6" />
              },
              {
                step: 3,
                title: "Configure & Test",
                description: "Set up your scraping configuration and run a test",
                icon: <CheckCircle className="h-6 w-6" />
              },
              {
                step: 4,
                title: "Export Your Data",
                description: "Download your data in JSON, CSV, or connect via API",
                icon: <Database className="h-6 w-6" />
              }
            ].map((step, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                      {step.step}
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {step.icon}
                    </div>
                    <div>
                      <CardTitle>{step.title}</CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Start Building <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* API Reference Preview */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">API Reference</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Complete REST API documentation with examples
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Authentication
                  </CardTitle>
                  <CardDescription>
                    All API requests require authentication using Bearer tokens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    Authorization: Bearer YOUR_API_KEY
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Base URL
                  </CardTitle>
                  <CardDescription>
                    All API endpoints are relative to the base URL
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    https://api.datavaultpro.com/v1
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Rate Limits
                  </CardTitle>
                  <CardDescription>
                    API requests are rate limited based on your plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Free: 100 requests/hour</li>
                    <li>• Starter: 1,000 requests/hour</li>
                    <li>• Pro: 10,000 requests/hour</li>
                    <li>• Enterprise: Custom limits</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Common Endpoints</CardTitle>
                  <CardDescription>
                    Most frequently used API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { method: "GET", endpoint: "/scrapers", description: "List all scrapers" },
                      { method: "POST", endpoint: "/scrapers", description: "Create a new scraper" },
                      { method: "POST", endpoint: "/jobs", description: "Start a scraping job" },
                      { method: "GET", endpoint: "/jobs/{id}", description: "Get job status" },
                      { method: "GET", endpoint: "/data/{job_id}", description: "Download scraped data" }
                    ].map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-3">
                          <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm">{endpoint.endpoint}</code>
                        </div>
                        <span className="text-xs text-muted-foreground">{endpoint.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    SDKs & Libraries
                  </CardTitle>
                  <CardDescription>
                    Official SDKs for popular programming languages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: "JavaScript", status: "Available" },
                      { name: "Python", status: "Available" },
                      { name: "PHP", status: "Available" },
                      { name: "Ruby", status: "Coming Soon" }
                    ].map((sdk, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-medium">{sdk.name}</span>
                        <Badge variant={sdk.status === 'Available' ? 'default' : 'secondary'}>
                          {sdk.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Building?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Everything you need is in our documentation. Start building your first scraper today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/signup">
                Get Started Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
          </div>
          <p className="text-sm opacity-75 mt-4">
            No credit card required. Full documentation access.
          </p>
        </div>
      </section>
    </div>
  );
}
