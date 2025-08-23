"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Cloud,
  Code,
  Database,
  Zap,
  Shield,
  Clock,
  BarChart3,
  Globe,
  Cpu,
  Download,
  Webhook,
  Settings,
  CheckCircle,
  ArrowRight,
  Star
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: <Code className="h-8 w-8" />,
    title: "No-Code Scraper Builder",
    description: "Intuitive visual interface to select elements and define extraction rules without writing any code.",
    details: "Our revolutionary no-code builder allows anyone to create sophisticated web scrapers. Simply point, click, and extract data from any website using our visual element selector.",
    useCases: ["E-commerce price monitoring", "News article collection", "Lead generation", "Competitor analysis"],
    category: "core"
  },
  {
    icon: <Cloud className="h-8 w-8" />,
    title: "Cloud Infrastructure",
    description: "Fully managed scraping cluster with elastic scaling to handle projects of any size.",
    details: "Built on enterprise-grade cloud infrastructure with automatic scaling, load balancing, and global distribution for maximum reliability and performance.",
    useCases: ["High-volume data extraction", "Global content monitoring", "Enterprise data pipeline", "Scalable research projects"],
    category: "core"
  },
  {
    icon: <Database className="h-8 w-8" />,
    title: "Multiple Export Formats",
    description: "Export your data in JSON, CSV, Excel formats or access it via our RESTful API.",
    details: "Flexible data delivery options to integrate seamlessly with your existing workflows and systems. Real-time API access with comprehensive documentation.",
    useCases: ["Database integration", "Analytics pipelines", "Reporting systems", "Data warehousing"],
    category: "core"
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "Advanced Analytics",
    description: "Built-in data visualization and analysis tools to gain insights from your extracted data.",
    details: "Comprehensive analytics dashboard with customizable charts, trends analysis, and data quality metrics to help you make data-driven decisions.",
    useCases: ["Market research", "Trend analysis", "Performance tracking", "Business intelligence"],
    category: "analytics"
  },
  {
    icon: <Clock className="h-8 w-8" />,
    title: "Scheduling & Automation",
    description: "Set scraping jobs to run hourly, daily, or weekly with customizable triggers.",
    details: "Advanced scheduling engine with cron expressions, conditional triggers, and failure recovery mechanisms for fully automated data collection.",
    useCases: ["Daily price updates", "Weekly market reports", "Real-time monitoring", "Automated data feeds"],
    category: "automation"
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Anti-Bot Protection",
    description: "Rotating proxies, CAPTCHA solving, and request throttling to bypass anti-scraping measures.",
    details: "Military-grade anti-detection technology including residential proxies, browser fingerprint randomization, and AI-powered CAPTCHA solving.",
    useCases: ["Protected site access", "Large-scale scraping", "Stealth data collection", "Compliance monitoring"],
    category: "security"
  },
  {
    icon: <Webhook className="h-8 w-8" />,
    title: "Webhook Integration",
    description: "Real-time data delivery to your applications via customizable webhook endpoints.",
    details: "Instant data notifications with retry logic, custom headers, and payload formatting to integrate with any system or workflow.",
    useCases: ["Real-time alerts", "System integration", "Event-driven workflows", "Live data feeds"],
    category: "integration"
  },
  {
    icon: <Cpu className="h-8 w-8" />,
    title: "Custom Scripts",
    description: "Support for advanced users to inject custom Python or JavaScript scraping logic.",
    details: "Full programmatic control with support for complex interactions, custom data processing, and integration with popular libraries.",
    useCases: ["Complex data extraction", "Custom processing logic", "Advanced interactions", "Legacy system integration"],
    category: "advanced"
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: "Global Infrastructure",
    description: "Worldwide proxy network and data centers for optimal performance and compliance.",
    details: "Global presence with data centers in 15+ regions, ensuring fast response times and compliance with local data protection regulations.",
    useCases: ["Geo-targeted content", "Global monitoring", "Regional compliance", "Performance optimization"],
    category: "infrastructure"
  }
];

const plans = [
  {
    name: "Free",
    price: "$0",
    features: ["1,000 requests/month", "1 concurrent scraper", "Standard proxies", "JSON & CSV exports", "Community support"]
  },
  {
    name: "Starter",
    price: "$19",
    features: ["50,000 requests/month", "3 concurrent scrapers", "Rotating proxies", "All export formats", "Email support"]
  },
  {
    name: "Pro",
    price: "$59",
    features: ["250,000 requests/month", "10 concurrent scrapers", "Premium proxies", "API access", "Priority support"]
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["Unlimited requests", "Unlimited scrapers", "Enterprise proxies", "Custom integrations", "Dedicated support"]
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            Comprehensive Feature Overview
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Everything You Need for
            <span className="text-primary"> Web Scraping</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Discover how DataVault Pro's powerful features can transform your data extraction workflow.
            From no-code builders to enterprise-grade infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-2xl grid-cols-5">
                <TabsTrigger value="all">All Features</TabsTrigger>
                <TabsTrigger value="core">Core</TabsTrigger>
                <TabsTrigger value="automation">Automation</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <FeatureCard key={index} feature={feature} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="core">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.filter(f => f.category === 'core').map((feature, index) => (
                  <FeatureCard key={index} feature={feature} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="automation">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.filter(f => f.category === 'automation').map((feature, index) => (
                  <FeatureCard key={index} feature={feature} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.filter(f => f.category === 'security').map((feature, index) => (
                  <FeatureCard key={index} feature={feature} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.filter(f => f.category === 'analytics').map((feature, index) => (
                  <FeatureCard key={index} feature={feature} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Feature Comparison</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that best fits your needs. All plans include core features with varying limits.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.name === 'Pro' ? 'ring-2 ring-primary' : ''}`}>
                {plan.name === 'Pro' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    {plan.price !== 'Custom' && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" variant={plan.name === 'Pro' ? 'default' : 'outline'}>
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Common Use Cases</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how businesses across industries use DataVault Pro to extract valuable data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "E-commerce Intelligence",
                description: "Monitor competitor prices, track product availability, and analyze market trends in real-time.",
                features: ["Price monitoring", "Stock tracking", "Review analysis", "Market research"]
              },
              {
                title: "Lead Generation",
                description: "Extract contact information, company data, and prospect details from directories and websites.",
                features: ["Contact extraction", "Company profiles", "Social media data", "Directory scraping"]
              },
              {
                title: "Content Aggregation",
                description: "Collect news articles, blog posts, and social media content for analysis and curation.",
                features: ["News monitoring", "Content curation", "Social listening", "Trend tracking"]
              },
              {
                title: "Financial Data",
                description: "Gather stock prices, market data, and financial reports for investment analysis.",
                features: ["Stock prices", "Market data", "Financial reports", "Economic indicators"]
              },
              {
                title: "Real Estate Monitoring",
                description: "Track property listings, price changes, and market trends across multiple platforms.",
                features: ["Property listings", "Price tracking", "Market analysis", "Investment insights"]
              },
              {
                title: "Academic Research",
                description: "Collect research papers, citations, and academic data for comprehensive analysis.",
                features: ["Paper collection", "Citation analysis", "Research trends", "Academic databases"]
              }
            ].map((useCase, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCase.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Extract Data Without the Hassle?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that use DataVault Pro to gather insights,
            monitor competitors, and make data-driven decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/signup">
                Start Your Free Trial
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/pricing">
                View Pricing Plans
              </Link>
            </Button>
          </div>
          <p className="text-sm opacity-75 mt-4">
            No credit card required. 14-day free trial.
          </p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ feature }: { feature: typeof features[0] }) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
          {feature.icon}
        </div>
        <CardTitle className="text-xl">{feature.title}</CardTitle>
        <CardDescription>{feature.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{feature.details}</p>
        <div>
          <h4 className="font-semibold text-sm mb-2">Common Use Cases:</h4>
          <ul className="space-y-1">
            {feature.useCases.map((useCase, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full" />
                {useCase}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
