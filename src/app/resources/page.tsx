"use client";

import { SiteLayout } from '@/components/layout/site-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  LucideBook,
  LucideCode,
  LucideDownload,
  LucideExternalLink,
  LucideFileText,
  LucideGraduationCap,
  LucideHeart,
  LucidePlayCircle,
  LucideRocket,
  LucideShield,
  LucideTarget,
  LucideTrendingUp,
  LucideUsers,
  LucideZap,
  LucideBookOpen,
  LucideCodepen,
  LucideGithub,
  LucideArrowRight,
} from 'lucide-react';

interface Resource {
  title: string;
  description: string;
  type: string;
  readTime: string;
  href: string;
  featured?: boolean;
  external?: boolean;
}

const resourceCategories = [
  {
    title: "Getting Started",
    description: "Essential guides to begin your web scraping journey",
    icon: LucideRocket,
    color: "emerald",
    resources: [
      {
        title: "Complete Beginner's Guide to Web Scraping",
        description: "Learn the fundamentals of web scraping from scratch",
        type: "Guide",
        readTime: "15 min",
        href: "/resources/beginners-guide",
        featured: true
      } as Resource,
      {
        title: "Setting Up Your First Scraper",
        description: "Step-by-step tutorial to create your first scraping project",
        type: "Tutorial",
        readTime: "10 min",
        href: "/tutorials/getting-started"
      } as Resource,
      {
        title: "ScrapeMaster Quick Start Video",
        description: "5-minute video walkthrough of the platform",
        type: "Video",
        readTime: "5 min",
        href: "/resources/quickstart-video"
      } as Resource
    ]
  },
  {
    title: "Technical Documentation",
    description: "In-depth technical guides and API references",
    icon: LucideCode,
    color: "blue",
    resources: [
      {
        title: "API Reference Documentation",
        description: "Complete REST API documentation with examples",
        type: "Documentation",
        readTime: "30 min",
        href: "/api-reference",
        featured: true
      },
      {
        title: "CSS Selector Advanced Guide",
        description: "Master complex selectors for dynamic content",
        type: "Guide",
        readTime: "20 min",
        href: "/tutorials/css-selectors"
      },
      {
        title: "Handling JavaScript-Heavy Sites",
        description: "Strategies for scraping SPAs and dynamic content",
        type: "Tutorial",
        readTime: "25 min",
        href: "/tutorials/dynamic-content"
      },
      {
        title: "Anti-Detection Best Practices",
        description: "Techniques to avoid getting blocked",
        type: "Guide",
        readTime: "18 min",
        href: "/resources/anti-detection"
      }
    ]
  },
  {
    title: "Industry Use Cases",
    description: "Real-world applications across different industries",
    icon: LucideTarget,
    color: "purple",
    resources: [
      {
        title: "E-commerce Price Monitoring",
        description: "Competitive pricing strategies and implementation",
        type: "Case Study",
        readTime: "12 min",
        href: "/case-studies"
      },
      {
        title: "Real Estate Data Collection",
        description: "Property listings and market analysis",
        type: "Use Case",
        readTime: "15 min",
        href: "/resources/real-estate-scraping"
      },
      {
        title: "Social Media Sentiment Analysis",
        description: "Brand monitoring and reputation management",
        type: "Case Study",
        readTime: "18 min",
        href: "/resources/social-media-monitoring"
      },
      {
        title: "Financial Data Aggregation",
        description: "Stock prices, news, and market indicators",
        type: "Use Case",
        readTime: "20 min",
        href: "/resources/financial-data"
      }
    ]
  },
  {
    title: "Best Practices & Ethics",
    description: "Legal guidelines and ethical scraping practices",
    icon: LucideShield,
    color: "green",
    resources: [
      {
        title: "Web Scraping Legal Guide",
        description: "Understanding robots.txt, terms of service, and compliance",
        type: "Legal Guide",
        readTime: "25 min",
        href: "/resources/legal-guide",
        featured: true
      },
      {
        title: "Ethical Scraping Principles",
        description: "Best practices for responsible data collection",
        type: "Guide",
        readTime: "12 min",
        href: "/resources/ethical-scraping"
      },
      {
        title: "Rate Limiting and Respectful Scraping",
        description: "How to scrape without overwhelming target servers",
        type: "Best Practice",
        readTime: "10 min",
        href: "/resources/rate-limiting"
      }
    ]
  },
  {
    title: "Tools & Templates",
    description: "Ready-to-use scrapers and development tools",
    icon: LucideZap,
    color: "orange",
    resources: [
      {
        title: "Pre-built Scraper Templates",
        description: "Common scraping patterns for popular sites",
        type: "Templates",
        readTime: "5 min",
        href: "/dashboard/templates"
      },
      {
        title: "Chrome Extension for Selector Testing",
        description: "Debug and test CSS selectors in your browser",
        type: "Tool",
        readTime: "2 min",
        href: "/resources/chrome-extension"
      },
      {
        title: "Python SDK and Libraries",
        description: "Integrate ScrapeMaster with your Python applications",
        type: "SDK",
        readTime: "15 min",
        href: "/resources/python-sdk"
      },
      {
        title: "Postman Collection",
        description: "API testing collection for developers",
        type: "Tool",
        readTime: "5 min",
        href: "/resources/postman-collection"
      }
    ]
  },
  {
    title: "Community & Support",
    description: "Connect with other developers and get help",
    icon: LucideUsers,
    color: "pink",
    resources: [
      {
        title: "Developer Community Forum",
        description: "Ask questions and share knowledge with peers",
        type: "Community",
        readTime: "",
        href: "/community"
      },
      {
        title: "GitHub Examples Repository",
        description: "Open-source examples and code snippets",
        type: "Code",
        readTime: "",
        href: "https://github.com/scrapemaster/examples",
        external: true
      } as Resource,
      {
        title: "Monthly Webinar Series",
        description: "Live demos and Q&A sessions with experts",
        type: "Event",
        readTime: "60 min",
        href: "/resources/webinars"
      },
      {
        title: "24/7 Technical Support",
        description: "Get help when you need it most",
        type: "Support",
        readTime: "",
        href: "/contact"
      }
    ]
  }
];

const featuredResources = [
  {
    title: "The Complete Web Scraping Handbook 2025",
    description: "Comprehensive 100-page guide covering everything from basics to advanced techniques",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop",
    downloadSize: "12 MB PDF",
    downloads: "15,000+",
    rating: 4.9,
    href: "/resources/handbook-2025"
  },
  {
    title: "Industry Benchmarks Report",
    description: "2024 web scraping industry trends, performance metrics, and best practices",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
    downloadSize: "8 MB PDF",
    downloads: "8,500+",
    rating: 4.8,
    href: "/resources/industry-report-2024"
  },
  {
    title: "ScrapeMaster Mastery Course",
    description: "Free 10-hour video course covering platform features and advanced strategies",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop",
    downloadSize: "Video Series",
    downloads: "12,000+",
    rating: 4.9,
    href: "/resources/mastery-course"
  }
];

export default function ResourcesPage() {
  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-background via-background to-emerald-50/30 dark:to-emerald-950/20">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-pattern" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Knowledge Hub
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Learn. Build. Scale.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Everything you need to master web scraping with ScrapeMaster. From beginner guides to advanced techniques,
              legal compliance, and industry best practices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <LucideRocket className="mr-2 h-5 w-5" />
                Start Learning
              </Button>
              <Button size="lg" variant="outline">
                <LucideDownload className="mr-2 h-5 w-5" />
                Download Resources
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Resources</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our most popular guides and tools, trusted by thousands of developers worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {featuredResources.map((resource, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={resource.image}
                    alt={resource.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{resource.downloadSize}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <LucideHeart className="h-4 w-4 text-red-500 mr-1" />
                      {resource.rating}
                    </div>
                  </div>
                  <CardTitle className="group-hover:text-emerald-600 transition-colors">
                    {resource.title}
                  </CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{resource.downloads} downloads</span>
                    <Link href={resource.href}>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <LucideDownload className="mr-2 h-4 w-4" />
                        Get Free
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find exactly what you're looking for with our organized resource library
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {resourceCategories.map((category, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-3 rounded-lg bg-${category.color}-100 dark:bg-${category.color}-900/20`}>
                    <category.icon className={`h-6 w-6 text-${category.color}-600 dark:text-${category.color}-400`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                    <p className="text-muted-foreground">{category.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {category.resources.map((resource, resourceIndex) => (
                    <div key={resourceIndex} className="flex items-center justify-between p-3 bg-background rounded-lg border group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium group-hover:text-emerald-600 transition-colors">{resource.title}</h4>
                          {resource.featured && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{resource.type}</span>
                          {resource.readTime && <span>{resource.readTime} read</span>}
                        </div>
                      </div>
                      <Link href={resource.href}>
                        <Button size="sm" variant="ghost" className="ml-4">
                          {resource.external ? <LucideExternalLink className="h-4 w-4" /> : <LucideArrowRight className="h-4 w-4" />}
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Scraping?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of developers who trust ScrapeMaster for their data extraction needs.
                Start with our free tier and scale as you grow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                    <LucideRocket className="mr-2 h-5 w-5" />
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    <LucideUsers className="mr-2 h-5 w-5" />
                    Talk to Expert
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </SiteLayout>
  );
}
