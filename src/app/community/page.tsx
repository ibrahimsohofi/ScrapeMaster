import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, HelpCircle, Star, Github, BookOpen, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community - DataVault Pro',
  description: 'Join the DataVault Pro community. Get help, share knowledge, and connect with other developers.',
};

const communityStats = [
  { label: 'Community Members', value: '12,500+', icon: Users },
  { label: 'Questions Answered', value: '8,300+', icon: HelpCircle },
  { label: 'GitHub Stars', value: '2,100+', icon: Star },
  { label: 'Active Contributors', value: '150+', icon: Zap },
];

const forumCategories = [
  {
    name: 'General Discussion',
    description: 'General questions and discussions about web scraping',
    posts: 1250,
    color: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'API & Integration',
    description: 'Questions about API usage and integrating DataVault Pro',
    posts: 890,
    color: 'bg-green-100 text-green-700',
  },
  {
    name: 'Technical Support',
    description: 'Get help with technical issues and troubleshooting',
    posts: 650,
    color: 'bg-orange-100 text-orange-700',
  },
  {
    name: 'Feature Requests',
    description: 'Suggest new features and improvements',
    posts: 420,
    color: 'bg-purple-100 text-purple-700',
  },
  {
    name: 'Show & Tell',
    description: 'Share your projects and success stories',
    posts: 340,
    color: 'bg-pink-100 text-pink-700',
  },
  {
    name: 'Best Practices',
    description: 'Share tips, tricks, and best practices',
    posts: 280,
    color: 'bg-indigo-100 text-indigo-700',
  },
];

export default function CommunityPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join Our Community</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with developers, share knowledge, and get help from the DataVault Pro community.
            Together we're building the future of web data extraction.
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {communityStats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Community Platforms */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Discord Community</CardTitle>
              <CardDescription>
                Join our Discord server for real-time discussions, quick help, and community events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                Join Discord
              </Button>
              <p className="text-sm text-muted-foreground mt-2">5,200+ active members</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Github className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>GitHub Discussions</CardTitle>
              <CardDescription>
                Participate in GitHub discussions, report issues, and contribute to our open-source projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" size="lg">
                View on GitHub
              </Button>
              <p className="text-sm text-muted-foreground mt-2">2,100+ stars</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Community Forum</CardTitle>
              <CardDescription>
                Browse our comprehensive forum with categories for every topic and skill level.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" size="lg">
                Visit Forum
              </Button>
              <p className="text-sm text-muted-foreground mt-2">8,300+ questions answered</p>
            </CardContent>
          </Card>
        </div>

        {/* Forum Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Forum Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forumCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge variant="secondary" className={category.color}>
                      {category.posts}
                    </Badge>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Community Guidelines */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Community Guidelines</CardTitle>
            <CardDescription>
              Help us maintain a welcoming and productive community for everyone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3 text-green-600">✅ Do</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Be respectful and constructive in discussions</li>
                  <li>• Search before posting to avoid duplicates</li>
                  <li>• Provide clear details when asking for help</li>
                  <li>• Share your knowledge and help others</li>
                  <li>• Use appropriate categories and tags</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-3 text-red-600">❌ Don't</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Post spam or self-promotional content</li>
                  <li>• Share scrapers for illegal or harmful purposes</li>
                  <li>• Use offensive language or harassment</li>
                  <li>• Share API keys or sensitive information</li>
                  <li>• Post off-topic discussions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events & Webinars */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Community Call</CardTitle>
                <CardDescription>January 25, 2024 • 2:00 PM UTC</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Join our monthly community call to discuss new features, roadmap updates, and Q&A.
                </p>
                <Button variant="outline" size="sm">Add to Calendar</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Web Scraping Workshop</CardTitle>
                <CardDescription>February 8, 2024 • 10:00 AM UTC</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn advanced web scraping techniques in our hands-on workshop.
                </p>
                <Button variant="outline" size="sm">Register Now</Button>
              </CardContent>
            </Card>
          </div>

          <Link href="/contact">
            <Button variant="outline" size="lg">
              Have Questions? Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
