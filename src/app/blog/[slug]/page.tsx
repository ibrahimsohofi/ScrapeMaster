import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteLayout } from '@/components/layout/site-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  LucideCalendar,
  LucideUser,
  LucideArrowRight,
  LucideArrowLeft,
  LucideClock,
  LucideShare2,
  LucideBookmark,
  LucideTwitter,
  LucideLinkedin,
  LucideFacebook,
  LucideLink
} from 'lucide-react';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  featured: boolean;
  image: string;
  tags: string[];
}

const blogPosts: Record<string, BlogPost> = {
  'web-scraping-best-practices-2024': {
    slug: 'web-scraping-best-practices-2024',
    title: 'Web Scraping Best Practices for 2024: A Complete Guide',
    excerpt: 'Learn the essential techniques and ethical considerations for effective web scraping in 2024. From rate limiting to proxy rotation, discover how to scrape responsibly.',
    author: 'Sarah Chen',
    date: '2024-01-15',
    readTime: '8 min read',
    category: 'Best Practices',
    featured: true,
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=600&fit=crop',
    tags: ['web scraping', 'best practices', 'ethics', 'automation'],
    content: `
# Introduction

Web scraping has evolved significantly over the past few years. As we enter 2024, it's crucial to understand the latest best practices that ensure both effectiveness and ethical compliance. This comprehensive guide will walk you through the essential techniques every web scraper should know.

## 1. Respect robots.txt

Always check the website's robots.txt file before scraping. This file tells you which parts of the site the owner doesn't want automated tools to access.

\`\`\`
User-agent: *
Disallow: /private/
Disallow: /admin/
Allow: /public/
\`\`\`

## 2. Implement Rate Limiting

Never overwhelm a server with requests. Implement delays between requests to be respectful:

\`\`\`javascript
// Good practice: Add delays between requests
await new Promise(resolve => setTimeout(resolve, 1000));
\`\`\`

## 3. Use Proper Headers

Always identify your scraper with appropriate user agent strings and headers:

\`\`\`javascript
const headers = {
  'User-Agent': 'Mozilla/5.0 (compatible; YourBot/1.0; +https://yoursite.com/bot)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};
\`\`\`

## 4. Handle Errors Gracefully

Implement robust error handling and retry logic:

\`\`\`javascript
try {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Request failed');
} catch (error) {
  console.log('Retrying in 5 seconds...');
  await new Promise(resolve => setTimeout(resolve, 5000));
}
\`\`\`

## 5. Proxy Rotation

Use rotating proxies to distribute requests and avoid IP bans:

- Residential proxies for sensitive sites
- Datacenter proxies for general scraping
- Rotate IP addresses regularly

## 6. Data Storage Best Practices

- Use structured formats (JSON, CSV)
- Implement data validation
- Regular backups
- Consider GDPR compliance

## Conclusion

Following these best practices ensures your web scraping projects are both effective and responsible. Remember, the goal is to extract data without disrupting the website's normal operation.
    `
  },
  'scrapecloud-vs-traditional-scraping': {
    slug: 'scrapecloud-vs-traditional-scraping',
    title: 'DataVault Pro vs Traditional Web Scraping: Why No-Code Wins',
    excerpt: 'Compare the benefits of no-code scraping platforms against traditional programming approaches. See why businesses are switching to visual scraping tools.',
    author: 'Michael Rodriguez',
    date: '2024-01-12',
    readTime: '6 min read',
    category: 'Comparison',
    featured: false,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop',
    tags: ['no-code', 'comparison', 'productivity', 'datavaultpro'],
    content: `
# The Evolution of Web Scraping

Web scraping has traditionally required extensive programming knowledge. However, no-code platforms like DataVault Pro are revolutionizing how businesses extract web data.

## Traditional Scraping Challenges

### Programming Complexity
- Requires Python, JavaScript, or other programming languages
- Complex setup and configuration
- Steep learning curve for non-developers

### Maintenance Overhead
- Code breaks when websites change
- Requires developer time for updates
- Difficult to scale across teams

## The DataVault Pro Advantage

### Visual Interface
- Point-and-click element selection
- No coding required
- Instant preview of scraped data

### Automatic Handling
- Built-in proxy rotation
- CAPTCHA solving
- Anti-bot detection bypass

### Team Collaboration
- Share scrapers across teams
- Role-based access control
- Centralized data management

## Performance Comparison

| Feature | Traditional | DataVault Pro |
|---------|-------------|-------------|
| Setup Time | 2-4 hours | 5-10 minutes |
| Learning Curve | Weeks/Months | Minutes |
| Maintenance | High | Automatic |
| Scaling | Manual | Built-in |

## ROI Analysis

Companies using DataVault Pro report:
- 80% reduction in setup time
- 70% fewer maintenance issues
- 90% higher team adoption

## Conclusion

While traditional scraping has its place, no-code platforms offer compelling advantages for most business use cases.
    `
  },
  'handling-anti-bot-measures': {
    slug: 'handling-anti-bot-measures',
    title: 'How to Handle Anti-Bot Measures: A Technical Deep Dive',
    excerpt: 'Explore advanced techniques for bypassing CAPTCHAs, rate limiting, and other anti-scraping measures while maintaining ethical scraping practices.',
    author: 'David Park',
    date: '2024-01-10',
    readTime: '12 min read',
    category: 'Technical',
    featured: false,
    image: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1200&h=600&fit=crop',
    tags: ['anti-bot', 'captcha', 'technical', 'advanced'],
    content: `
# Understanding Anti-Bot Measures

Modern websites employ sophisticated anti-bot measures to protect their content and infrastructure. This guide explores ethical approaches to handling these challenges.

## Common Anti-Bot Techniques

### 1. Rate Limiting
Websites monitor request frequency from IP addresses:
- Implement exponential backoff
- Use multiple IP addresses
- Respect server capacity

### 2. CAPTCHA Systems
- reCAPTCHA v2/v3
- hCaptcha
- Custom image challenges

### 3. JavaScript Challenges
- Browser fingerprinting
- Mouse movement tracking
- Timing analysis

## Ethical Bypass Strategies

### Proxy Management
\`\`\`javascript
const proxyPool = [
  'proxy1:8080',
  'proxy2:8080',
  'proxy3:8080'
];

function getRandomProxy() {
  return proxyPool[Math.floor(Math.random() * proxyPool.length)];
}
\`\`\`

### Browser Automation
Use tools like Puppeteer or Selenium:
\`\`\`javascript
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({
  headless: false,
  args: ['--no-sandbox']
});
\`\`\`

### Header Rotation
Randomize browser headers:
\`\`\`javascript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
];
\`\`\`

## Legal and Ethical Considerations

Always ensure your scraping activities:
- Comply with terms of service
- Respect data privacy laws
- Don't overload servers
- Have legitimate business purposes

## Advanced Techniques

### Machine Learning Detection
Some sites use ML to detect bots:
- Behavioral mimicking
- Human-like patterns
- Variable timing

### Browser Fingerprinting Evasion
- Canvas fingerprint randomization
- WebGL parameter spoofing
- Screen resolution variation

## Conclusion

Successfully handling anti-bot measures requires a combination of technical skill and ethical responsibility. Always prioritize respectful scraping practices.
    `
  }
};

const relatedPosts = [
  {
    slug: 'ecommerce-price-monitoring',
    title: 'E-commerce Price Monitoring: Competitive Intelligence Made Simple',
    category: 'E-commerce'
  },
  {
    slug: 'scraping-javascript-heavy-sites',
    title: 'Scraping JavaScript-Heavy Websites: Modern Solutions',
    category: 'Technical'
  },
  {
    slug: 'gdpr-compliance-web-scraping',
    title: 'GDPR Compliance in Web Scraping: Legal Guidelines',
    category: 'Legal'
  }
];

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const resolvedParams = await params;
  const post = blogPosts[resolvedParams.slug];

  if (!post) {
    notFound();
  }

  return (
    <SiteLayout>
      <article className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/blog" className="text-primary hover:underline flex items-center">
            <LucideArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>

        {/* Header */}
        <header className="mb-8">
          <div className="mb-4">
            <Badge variant="outline">{post.category}</Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">{post.title}</h1>
          <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>

          {/* Meta information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <LucideUser className="w-4 h-4" />
              <span>By {post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <LucideCalendar className="w-4 h-4" />
              <span>{new Date(post.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <LucideClock className="w-4 h-4" />
              <span>{post.readTime}</span>
            </div>
          </div>

          {/* Social sharing */}
          <div className="flex items-center gap-3 mb-8">
            <span className="text-sm font-medium">Share:</span>
            <Button variant="outline" size="sm">
              <LucideTwitter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <LucideLinkedin className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <LucideFacebook className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <LucideLink className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <LucideBookmark className="w-4 h-4" />
            </Button>
          </div>

          {/* Featured image */}
          <div className="aspect-video overflow-hidden rounded-lg mb-8">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="prose prose-lg max-w-none">
              {post.content.split('\n').map((paragraph, index) => {
                if (paragraph.startsWith('# ')) {
                  return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{paragraph.slice(2)}</h1>;
                }
                if (paragraph.startsWith('## ')) {
                  return <h2 key={index} className="text-2xl font-bold mt-6 mb-3">{paragraph.slice(3)}</h2>;
                }
                if (paragraph.startsWith('### ')) {
                  return <h3 key={index} className="text-xl font-bold mt-4 mb-2">{paragraph.slice(4)}</h3>;
                }
                if (paragraph.startsWith('```')) {
                  return null; // Handle code blocks separately
                }
                if (paragraph.startsWith('- ')) {
                  return <li key={index} className="ml-4">{paragraph.slice(2)}</li>;
                }
                if (paragraph.startsWith('| ')) {
                  return null; // Handle tables separately
                }
                if (paragraph.trim() === '') {
                  return <br key={index} />;
                }
                return <p key={index} className="mb-4 text-muted-foreground leading-relaxed">{paragraph}</p>;
              })}
            </div>

            {/* Tags */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Author info */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">About the Author</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <LucideUser className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{post.author}</div>
                      <div className="text-sm text-muted-foreground">Senior Developer</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Expert in web scraping and data extraction with over 5 years of experience
                    helping businesses automate their data collection processes.
                  </p>
                </CardContent>
              </Card>

              {/* Related posts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Articles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <div key={relatedPost.slug}>
                      <Link
                        href={`/blog/${relatedPost.slug}`}
                        className="block hover:text-primary transition-colors"
                      >
                        <h4 className="font-medium text-sm leading-tight mb-1">
                          {relatedPost.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {relatedPost.category}
                        </Badge>
                      </Link>
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <Card className="mt-12 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle>Ready to try DataVault Pro?</CardTitle>
            <CardDescription>
              Start scraping data without writing code. Get your free account today.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/signup">
              <Button size="lg">
                Get Started Free
                <LucideArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </article>
    </SiteLayout>
  );
}

export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({
    slug,
  }));
}
