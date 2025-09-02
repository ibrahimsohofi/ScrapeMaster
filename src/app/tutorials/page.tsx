import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, BookOpen, Play } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tutorials - ScrapeCloud',
  description: 'Learn how to use ScrapeCloud with our comprehensive tutorials and guides',
};

const tutorials = [
  {
    id: 1,
    title: 'Getting Started with Web Scraping',
    description: 'Learn the basics of web scraping and set up your first scraper in minutes.',
    level: 'Beginner',
    duration: '15 min',
    category: 'Getting Started',
    link: '/tutorials/getting-started',
  },
  {
    id: 2,
    title: 'Advanced CSS Selector Techniques',
    description: 'Master complex data extraction with advanced CSS selectors and XPath.',
    level: 'Advanced',
    duration: '30 min',
    category: 'Data Extraction',
    link: '/tutorials/css-selectors',
  },
  {
    id: 3,
    title: 'Handling Dynamic Content & JavaScript',
    description: 'Extract data from modern SPAs and JavaScript-heavy websites.',
    level: 'Intermediate',
    duration: '25 min',
    category: 'Dynamic Content',
    link: '/tutorials/dynamic-content',
  },
  {
    id: 4,
    title: 'Setting Up Automated Schedules',
    description: 'Learn how to schedule your scrapers and automate data collection.',
    level: 'Intermediate',
    duration: '20 min',
    category: 'Automation',
    link: '/tutorials/scheduling',
  },
  {
    id: 5,
    title: 'API Integration & Webhooks',
    description: 'Integrate scraped data with your applications using our API and webhooks.',
    level: 'Advanced',
    duration: '35 min',
    category: 'Integration',
    link: '/tutorials/api-integration',
  },
  {
    id: 6,
    title: 'Handling Large Scale Scraping',
    description: 'Best practices for enterprise-level data extraction and performance optimization.',
    level: 'Expert',
    duration: '45 min',
    category: 'Scale & Performance',
    link: '/tutorials/large-scale',
  },
];

const categories = ['All', 'Getting Started', 'Data Extraction', 'Dynamic Content', 'Automation', 'Integration', 'Scale & Performance'];

export default function TutorialsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Learn ScrapeCloud</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Master web scraping with our comprehensive tutorials, guides, and best practices.
            From beginner basics to advanced techniques.
          </p>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === 'All' ? 'default' : 'outline'}
              size="sm"
              className="text-sm"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Tutorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {tutorials.map((tutorial) => (
            <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {tutorial.category}
                  </Badge>
                  <Badge
                    variant={tutorial.level === 'Beginner' ? 'default' :
                            tutorial.level === 'Intermediate' ? 'secondary' :
                            tutorial.level === 'Advanced' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {tutorial.level}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                <CardDescription>{tutorial.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {tutorial.duration}
                    </div>
                  </div>
                  <Link href={tutorial.link}>
                    <Button size="sm" className="gap-2">
                      <Play className="h-4 w-4" />
                      Start
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="border-t pt-12">
          <h2 className="text-2xl font-semibold mb-8 text-center">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Comprehensive API reference and detailed guides
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/documentation">
                  <Button variant="outline">Read Docs</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle>Community</CardTitle>
                <CardDescription>
                  Join discussions and get help from other users
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/community">
                  <Button variant="outline">Join Community</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle>Blog</CardTitle>
                <CardDescription>
                  Latest tips, tricks, and industry insights
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/blog">
                  <Button variant="outline">Read Blog</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
