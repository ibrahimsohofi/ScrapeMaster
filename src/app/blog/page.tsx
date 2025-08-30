import Link from 'next/link';
import { SiteLayout } from '@/components/layout/site-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LucideCalendar,
  LucideUser,
  LucideArrowRight,
  LucideSearch,
  LucideTrendingUp,
  LucideCode2,
  LucideShield,
  LucideZap
} from 'lucide-react';

const blogPosts = [
  {
    slug: 'web-scraping-best-practices-2024',
    title: 'Web Scraping Best Practices for 2024: A Complete Guide',
    excerpt: 'Learn the essential techniques and ethical considerations for effective web scraping in 2024. From rate limiting to proxy rotation, discover how to scrape responsibly.',
    author: 'Sarah Chen',
    date: '2024-01-15',
    readTime: '8 min read',
    category: 'Best Practices',
    featured: true,
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop'
  },
  {
    slug: 'scrapecloud-vs-traditional-scraping',
    title: 'DataVault Pro vs Traditional Web Scraping: Why No-Code Wins',
    excerpt: 'Compare the benefits of no-code scraping platforms against traditional programming approaches. See why businesses are switching to visual scraping tools.',
    author: 'Michael Rodriguez',
    date: '2024-01-12',
    readTime: '6 min read',
    category: 'Comparison',
    featured: false,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'
  },
  {
    slug: 'handling-anti-bot-measures',
    title: 'How to Handle Anti-Bot Measures: A Technical Deep Dive',
    excerpt: 'Explore advanced techniques for bypassing CAPTCHAs, rate limiting, and other anti-scraping measures while maintaining ethical scraping practices.',
    author: 'David Park',
    date: '2024-01-10',
    readTime: '12 min read',
    category: 'Technical',
    featured: false,
    image: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&h=400&fit=crop'
  },
  {
    slug: 'ecommerce-price-monitoring',
    title: 'E-commerce Price Monitoring: Competitive Intelligence Made Simple',
    excerpt: 'Set up automated price monitoring for your e-commerce business. Track competitors, optimize pricing strategies, and boost your profit margins.',
    author: 'Lisa Thompson',
    date: '2024-01-08',
    readTime: '10 min read',
    category: 'E-commerce',
    featured: true,
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop'
  },
  {
    slug: 'scraping-javascript-heavy-sites',
    title: 'Scraping JavaScript-Heavy Websites: Modern Solutions',
    excerpt: 'Learn how to scrape dynamic content from single-page applications and JavaScript-rendered websites using headless browsers and modern techniques.',
    author: 'Alex Kim',
    date: '2024-01-05',
    readTime: '7 min read',
    category: 'Technical',
    featured: false,
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop'
  },
  {
    slug: 'gdpr-compliance-web-scraping',
    title: 'GDPR Compliance in Web Scraping: Legal Guidelines',
    excerpt: 'Navigate the legal landscape of web scraping under GDPR. Understand data protection requirements and ensure your scraping activities are compliant.',
    author: 'Emma Watson',
    date: '2024-01-03',
    readTime: '9 min read',
    category: 'Legal',
    featured: false,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop'
  }
];

const categories = ['All', 'Best Practices', 'Technical', 'E-commerce', 'Comparison', 'Legal'];

const featuredPost = blogPosts.find(post => post.featured);
const regularPosts = blogPosts.filter(post => !post.featured);

export default function BlogPage() {
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">DataVault Pro Blog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Insights, tutorials, and best practices for modern web scraping.
            Stay updated with the latest trends and techniques.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <LucideSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === 'All' ? 'default' : 'outline'}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Article */}
        {featuredPost && (
          <Card className="mb-12 overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="h-64 md:h-full w-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <LucideTrendingUp className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                  <Badge variant="outline">{featuredPost.category}</Badge>
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  <Link href={`/blog/${featuredPost.slug}`} className="hover:text-primary transition-colors">
                    {featuredPost.title}
                  </Link>
                </h2>
                <p className="text-muted-foreground mb-4">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <LucideUser className="w-4 h-4" />
                    {featuredPost.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <LucideCalendar className="w-4 h-4" />
                    {new Date(featuredPost.date).toLocaleDateString()}
                  </div>
                  <span>{featuredPost.readTime}</span>
                </div>
                <Link href={`/blog/${featuredPost.slug}`}>
                  <Button>
                    Read Article
                    <LucideArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {regularPosts.map((post) => (
            <Card key={post.slug} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {post.category === 'Technical' && <LucideCode2 className="w-3 h-3 mr-1" />}
                    {post.category === 'E-commerce' && <LucideTrendingUp className="w-3 h-3 mr-1" />}
                    {post.category === 'Legal' && <LucideShield className="w-3 h-3 mr-1" />}
                    {post.category === 'Best Practices' && <LucideZap className="w-3 h-3 mr-1" />}
                    {post.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight">
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription>{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <LucideUser className="w-3 h-3" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <LucideCalendar className="w-3 h-3" />
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{post.readTime}</span>
                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="ghost" size="sm">
                      Read More
                      <LucideArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter Signup */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle>Stay Updated</CardTitle>
            <CardDescription>
              Get the latest web scraping insights delivered to your inbox weekly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input placeholder="Enter your email" className="flex-1" />
              <Button>Subscribe</Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              No spam. Unsubscribe at any time.
            </p>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
