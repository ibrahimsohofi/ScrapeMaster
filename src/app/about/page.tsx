"use client";

import { SiteLayout } from '@/components/layout/site-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  LucideUsers,
  LucideGlobe,
  LucideShield,
  LucideZap,
  LucideAward,
  LucideHeart,
  LucideTarget,
  LucideTrendingUp,
  LucideLinkedin,
  LucideTwitter,
  LucideGithub,
  LucideMail,
} from 'lucide-react';

export default function AboutPage() {
  const team = [
    {
      name: "Alex Rodriguez",
      role: "CEO & Co-Founder",
      bio: "Former engineering leader at major tech companies. Passionate about making data extraction accessible to everyone.",
      image: "/team/alex.jpg",
      linkedin: "#",
      twitter: "#"
    },
    {
      name: "Sarah Chen",
      role: "CTO & Co-Founder",
      bio: "PhD in Computer Science, expert in distributed systems and web technologies. Architected our enterprise-grade platform.",
      image: "/team/sarah.jpg",
      linkedin: "#",
      github: "#"
    },
    {
      name: "Marcus Johnson",
      role: "Head of Engineering",
      bio: "15+ years in scalable backend systems. Led engineering teams at unicorn startups and Fortune 500 companies.",
      image: "/team/marcus.jpg",
      linkedin: "#",
      github: "#"
    },
    {
      name: "Elena Volkov",
      role: "Head of Product",
      bio: "Product strategy expert with deep understanding of enterprise workflows and user experience design.",
      image: "/team/elena.jpg",
      linkedin: "#",
      twitter: "#"
    }
  ];

  const stats = [
    { label: "Data Points Processed", value: "50B+", icon: LucideZap },
    { label: "Enterprise Customers", value: "500+", icon: LucideUsers },
    { label: "Countries Served", value: "50+", icon: LucideGlobe },
    { label: "Uptime Guarantee", value: "99.9%", icon: LucideShield }
  ];

  const values = [
    {
      icon: LucideTarget,
      title: "Mission-Driven",
      description: "We democratize data access by making enterprise-grade web scraping accessible to businesses of all sizes."
    },
    {
      icon: LucideShield,
      title: "Security First",
      description: "Built with enterprise security, compliance, and privacy as core principles from day one."
    },
    {
      icon: LucideHeart,
      title: "Customer-Centric",
      description: "Every feature we build is driven by real customer needs and feedback from our community."
    },
    {
      icon: LucideTrendingUp,
      title: "Innovation",
      description: "Continuously pushing the boundaries of what's possible with AI-powered automation and technology."
    }
  ];

  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900">
        <div className="absolute inset-0 bg-grid-slate-100/50 dark:bg-grid-slate-800/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-4">About ScrapeMaster</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Transforming How Businesses
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Extract Data</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Founded in 2023, ScrapeMaster has become the leading enterprise web scraping platform,
            trusted by Fortune 500 companies and innovative startups to extract actionable insights from the web at scale.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center p-6 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-0">
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">Our Story</Badge>
              <h2 className="text-3xl font-bold mb-6">Built by Developers, for Developers</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  ScrapeMaster was born from a simple frustration: existing web scraping tools were either
                  too simplistic for enterprise needs or too complex for rapid deployment. Our founders,
                  having spent years building data extraction systems at scale, knew there had to be a better way.
                </p>
                <p>
                  We started with a vision to create a platform that combines the power of enterprise-grade
                  infrastructure with the simplicity of no-code tools. Today, we're proud to serve hundreds
                  of companies worldwide, from innovative startups to Fortune 500 enterprises.
                </p>
                <p>
                  Our journey is just beginning. With AI-powered automation, global proxy networks, and
                  advanced CAPTCHA solving, we're not just building a scraping tool—we're building the
                  future of data extraction.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <LucideZap className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold mb-2">Innovation at Scale</h3>
                  <p className="text-muted-foreground">Processing billions of data points with cutting-edge technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-slate-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Our Values</Badge>
            <h2 className="text-3xl font-bold mb-4">What Drives Us Forward</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our core values shape every decision we make and every feature we build.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="p-6 text-center border-0 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-0">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 w-fit mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Leadership Team</Badge>
            <h2 className="text-3xl font-bold mb-4">Meet the People Behind ScrapeMaster</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our experienced team combines deep technical expertise with a passion for solving complex data challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                      <LucideUsers className="h-10 w-10 text-blue-600" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                  <p className="text-blue-600 text-sm font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>
                  <div className="flex gap-2">
                    {member.linkedin && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <LucideLinkedin className="h-4 w-4" />
                      </Button>
                    )}
                    {member.twitter && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <LucideTwitter className="h-4 w-4" />
                      </Button>
                    )}
                    {member.github && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <LucideGithub className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Recognition */}
      <section className="py-20 bg-slate-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Recognition</Badge>
            <h2 className="text-3xl font-bold mb-4">Awards & Achievements</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Industry recognition for our innovation and commitment to excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center border-0 bg-white dark:bg-gray-800">
              <LucideAward className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-lg font-semibold mb-2">Tech Innovation Award 2024</h3>
              <p className="text-sm text-muted-foreground">Enterprise Software Category</p>
            </Card>
            <Card className="p-8 text-center border-0 bg-white dark:bg-gray-800">
              <LucideUsers className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">Best B2B SaaS Platform</h3>
              <p className="text-sm text-muted-foreground">Data & Analytics Summit 2024</p>
            </Card>
            <Card className="p-8 text-center border-0 bg-white dark:bg-gray-800">
              <LucideTrendingUp className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Fastest Growing Startup</h3>
              <p className="text-sm text-muted-foreground">TechCrunch Disrupt 2023</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Data Extraction?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join hundreds of companies who trust ScrapeMaster with their mission-critical data needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">
                <LucideMail className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
