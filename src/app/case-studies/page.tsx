"use client";

import { SiteLayout } from '@/components/layout/site-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
  LucideArrowRight,
  LucideBarChart3,
  LucideBuilding2,
  LucideCode,
  LucideDatabase,
  LucideDollarSign,
  LucideGlobe,
  LucideShoppingCart,
  LucideTrendingUp,
  LucideUsers,
  LucideZap,
  LucideCheckCircle,
  LucideTarget,
} from 'lucide-react';

const caseStudies = [
  {
    id: 'ecommerce-monitoring',
    category: 'E-commerce',
    title: 'RetailEdge: Competitive Price Monitoring at Scale',
    subtitle: 'How a leading e-commerce company reduced pricing research time by 95%',
    company: 'RetailEdge',
    industry: 'E-commerce',
    size: '500+ employees',
    challenge: 'Manual price monitoring across 50,000+ products from 25 competitors was taking 40 hours per week',
    solution: 'Automated price scraping with real-time alerts and trend analysis',
    results: [
      { metric: '95%', description: 'Reduction in manual research time' },
      { metric: '80%', description: 'Cost reduction in data collection' },
      { metric: '50,000+', description: 'Products monitored daily' },
      { metric: '2.5x', description: 'Increase in pricing optimization speed' }
    ],
    features: ['AI Smart Selectors', 'Real-time Monitoring', 'Price Alerts', 'Trend Analysis'],
    icon: LucideShoppingCart,
    color: 'blue',
    testimonial: "ScrapeMaster transformed our competitive intelligence. We now monitor 50,000+ product listings daily and reduced our data collection costs by 80%. The ROI was immediate.",
    author: 'Sarah Chen',
    position: 'VP of Analytics',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&crop=faces'
  },
  {
    id: 'saas-lead-generation',
    category: 'SaaS',
    title: 'ScaleWorks: Scaling Lead Generation with Smart Data',
    subtitle: 'Marketing team saves 15 hours per week with automated prospect research',
    company: 'ScaleWorks',
    industry: 'SaaS',
    size: '150+ employees',
    challenge: 'Manual lead research across multiple platforms was consuming valuable marketing resources',
    solution: 'Automated prospect data collection with enrichment and qualification scoring',
    results: [
      { metric: '15 hours', description: 'Saved per week in manual research' },
      { metric: '300%', description: 'Increase in qualified leads' },
      { metric: '2M+', description: 'Data points processed monthly' },
      { metric: '40%', description: 'Improvement in conversion rates' }
    ],
    features: ['Data Enrichment', 'Smart Qualification', 'CRM Integration', 'Lead Scoring'],
    icon: LucideTrendingUp,
    color: 'green',
    testimonial: "The no-code scraper builder is a game-changer. Our marketing team can now gather market data independently, freeing up 15 hours per week of developer time.",
    author: 'Marcus Rodriguez',
    position: 'Growth Director',
    image: '/case-study-saas.jpg'
  },
  {
    id: 'real-estate-analytics',
    category: 'Real Estate',
    title: 'PropertyFlow: Market Intelligence Across 25 Markets',
    subtitle: 'Real-time property data gives competitive advantage in investments',
    company: 'PropertyFlow',
    industry: 'Real Estate',
    size: '75+ employees',
    challenge: 'Tracking property listings and market trends across multiple markets was time-intensive',
    solution: 'Comprehensive property data aggregation with market analysis and investment scoring',
    results: [
      { metric: '25 markets', description: 'Monitored simultaneously' },
      { metric: '10,000+', description: 'Properties tracked daily' },
      { metric: '60%', description: 'Faster investment decisions' },
      { metric: '$2.3M', description: 'Additional revenue from faster deals' }
    ],
    features: ['Market Analysis', 'Investment Scoring', 'Trend Prediction', 'Geographic Mapping'],
    icon: LucideBuilding2,
    color: 'purple',
    testimonial: "We use ScrapeMaster to track real estate listings across 25 markets. The data accuracy and real-time updates give us a significant competitive advantage in property investments.",
    author: 'Jennifer Liu',
    position: 'Data Science Lead',
    image: '/case-study-realestate.jpg'
  },
  {
    id: 'research-validation',
    category: 'Research',
    title: 'TechUniversity: Academic Research Data Validation',
    subtitle: '99.7% data accuracy supports reliable academic publications',
    company: 'TechUniversity',
    industry: 'Research',
    size: '1,000+ researchers',
    challenge: 'Ensuring data integrity and validation for academic publications was critical',
    solution: 'Automated data collection with advanced validation and error handling',
    results: [
      { metric: '99.7%', description: 'Data accuracy achieved' },
      { metric: '85%', description: 'Reduction in data validation time' },
      { metric: '50+', description: 'Research papers published' },
      { metric: '3x', description: 'Increase in research output' }
    ],
    features: ['Data Validation', 'Quality Assurance', 'Academic Integration', 'Compliance'],
    icon: LucideDatabase,
    color: 'indigo',
    testimonial: "As a research institution, data integrity is crucial. ScrapeMaster's validation and error handling have been exceptional, supporting our academic publications with reliable datasets.",
    author: 'Dr. Michael Thompson',
    position: 'Research Director',
    image: '/case-study-research.jpg'
  },
  {
    id: 'ai-ml-pipeline',
    category: 'AI/ML',
    title: 'DataInsight AI: Feeding ML Pipelines at Scale',
    subtitle: 'Seamless API integration processes 2M+ data points monthly',
    company: 'DataInsight AI',
    industry: 'AI/ML',
    size: '200+ engineers',
    challenge: 'Feeding machine learning models with consistent, high-quality data streams',
    solution: 'Automated data pipelines with ML-ready formatting and real-time processing',
    results: [
      { metric: '2M+', description: 'Data points processed monthly' },
      { metric: '99.9%', description: 'Pipeline uptime achieved' },
      { metric: '70%', description: 'Improvement in model accuracy' },
      { metric: '5x', description: 'Faster data processing' }
    ],
    features: ['ML Pipeline Integration', 'Real-time Processing', 'Data Formatting', 'Quality Control'],
    icon: LucideCode,
    color: 'cyan',
    testimonial: "The API integration was seamless. We're now processing 2M+ data points monthly and feeding them directly into our ML pipelines. The technical support team is outstanding.",
    author: 'Alex Kim',
    position: 'Chief Technology Officer',
    image: '/case-study-ai.jpg'
  },
  {
    id: 'marketing-campaigns',
    category: 'Marketing',
    title: 'LeadGen Pro: 3x More Effective Campaigns',
    subtitle: 'Complex JavaScript sites no longer a barrier to data collection',
    company: 'LeadGen Pro',
    industry: 'Marketing',
    size: '100+ marketers',
    challenge: 'Extracting data from complex JavaScript-heavy sites for campaign optimization',
    solution: 'Advanced browser automation with JavaScript rendering and dynamic content extraction',
    results: [
      { metric: '3x', description: 'Campaign effectiveness increase' },
      { metric: '90%', description: 'Improvement in data quality' },
      { metric: '25+', description: 'Complex sites now accessible' },
      { metric: '60%', description: 'Reduction in campaign setup time' }
    ],
    features: ['JavaScript Rendering', 'Dynamic Content', 'Campaign Optimization', 'A/B Testing'],
    icon: LucideTarget,
    color: 'orange',
    testimonial: "ScrapeMaster handles complex JavaScript-heavy sites that other tools couldn't touch. Our lead generation campaigns are now 3x more effective with higher quality data.",
    author: 'Emma Watson',
    position: 'Marketing Operations',
    image: '/case-study-marketing.jpg'
  }
];

const stats = [
  { metric: '500+', description: 'Companies worldwide', icon: LucideBuilding2 },
  { metric: '99.9%', description: 'Uptime guarantee', icon: LucideZap },
  { metric: '2M+', description: 'Data points daily', icon: LucideDatabase },
  { metric: '15+', description: 'Industries served', icon: LucideGlobe }
];

export default function CaseStudiesPage() {
  return (
    <SiteLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <Badge className="mb-6 bg-emerald-500/10 text-emerald-700 border-emerald-300">
              📊 Customer Success Stories
            </Badge>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent mb-6">
              Real Results from Real Companies
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              See how organizations across industries are transforming their data operations with ScrapeMaster's
              AI-powered web scraping platform. From startups to enterprise, discover the measurable impact.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 mb-4">
                    <stat.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">{stat.metric}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Case Studies Grid */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-12">
              {caseStudies.map((study, index) => (
                <Card key={study.id} className="overflow-hidden border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                  <div className="grid lg:grid-cols-2 gap-0">
                    {/* Content */}
                    <div className="p-8 lg:p-12">
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2 rounded-lg bg-${study.color}-500/10`}>
                          <study.icon className={`h-6 w-6 text-${study.color}-600`} />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {study.category}
                        </Badge>
                      </div>

                      <h2 className="text-3xl font-bold text-foreground mb-3">
                        {study.title}
                      </h2>
                      <p className="text-lg text-muted-foreground mb-6">
                        {study.subtitle}
                      </p>

                      {/* Company Info */}
                      <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{study.company}</div>
                          <div className="text-xs text-muted-foreground">Company</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{study.industry}</div>
                          <div className="text-xs text-muted-foreground">Industry</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{study.size}</div>
                          <div className="text-xs text-muted-foreground">Size</div>
                        </div>
                      </div>

                      {/* Challenge & Solution */}
                      <div className="space-y-6 mb-8">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">Challenge</h3>
                          <p className="text-muted-foreground">{study.challenge}</p>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">Solution</h3>
                          <p className="text-muted-foreground">{study.solution}</p>
                        </div>
                      </div>

                      {/* Features Used */}
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-foreground mb-3">Features Used</h3>
                        <div className="flex flex-wrap gap-2">
                          {study.features.map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <LucideCheckCircle className="h-3 w-3 mr-1" />
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Testimonial */}
                      <blockquote className="border-l-4 border-emerald-500 pl-4 mb-6">
                        <p className="text-muted-foreground italic mb-3">"{study.testimonial}"</p>
                        <footer className="text-sm">
                          <strong className="text-foreground">{study.author}</strong>
                          <br />
                          <span className="text-muted-foreground">{study.position} • {study.company}</span>
                        </footer>
                      </blockquote>
                    </div>

                    {/* Results */}
                    <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-8 lg:p-12 flex flex-col justify-center">
                      <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
                        Key Results
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        {study.results.map((result, idx) => (
                          <div key={idx} className="text-center">
                            <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                              {result.metric}
                            </div>
                            <div className="text-sm text-muted-foreground leading-tight">
                              {result.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Join These Success Stories?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Start your free trial today and see how ScrapeMaster can transform your data operations.
              No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold"
                asChild
              >
                <Link href="/auth/signup">
                  🚀 Start Free Trial
                  <LucideArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/demo">
                  📞 Schedule Demo
                </Link>
              </Button>
            </div>
            <p className="text-sm opacity-75 mt-4">
              14-day free trial • No setup fees • Cancel anytime
            </p>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
