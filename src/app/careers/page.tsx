import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Users, Briefcase, Heart, Coffee, Laptop, Plane } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Careers - DataVault Pro',
  description: 'Join the DataVault Pro team and help build the future of web data extraction.',
};

const benefits = [
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Comprehensive health insurance and wellness programs',
  },
  {
    icon: Laptop,
    title: 'Remote-First',
    description: 'Work from anywhere with flexible hours and home office stipend',
  },
  {
    icon: Coffee,
    title: 'Learning Budget',
    description: '$2000 annual budget for courses, conferences, and books',
  },
  {
    icon: Plane,
    title: 'Unlimited PTO',
    description: 'Take the time you need to recharge and stay productive',
  },
];

const openPositions = [
  {
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    level: 'Senior',
    description: 'Build and scale our core scraping platform using TypeScript, React, and Node.js.',
    requirements: [
      '5+ years of full-stack development experience',
      'Strong TypeScript/JavaScript skills',
      'Experience with React, Node.js, and databases',
      'Knowledge of distributed systems',
    ],
  },
  {
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    level: 'Mid-Senior',
    description: 'Design and maintain our cloud infrastructure to handle millions of scraping requests.',
    requirements: [
      '3+ years of DevOps/Infrastructure experience',
      'Strong AWS/GCP knowledge',
      'Experience with Kubernetes, Docker',
      'Infrastructure as Code (Terraform)',
    ],
  },
  {
    title: 'Product Manager',
    department: 'Product',
    location: 'Remote',
    type: 'Full-time',
    level: 'Mid-Senior',
    description: 'Drive product strategy and roadmap for our developer-focused platform.',
    requirements: [
      '3+ years of product management experience',
      'Experience with developer tools/APIs',
      'Strong analytical and communication skills',
      'Technical background preferred',
    ],
  },
  {
    title: 'Customer Success Manager',
    department: 'Success',
    location: 'Remote',
    type: 'Full-time',
    level: 'Mid',
    description: 'Help our customers succeed with DataVault Pro and drive expansion revenue.',
    requirements: [
      '2+ years in customer success or sales',
      'Technical aptitude and problem-solving skills',
      'Experience with SaaS/API products',
      'Excellent communication skills',
    ],
  },
];

const departments = [
  { name: 'Engineering', count: 8, color: 'bg-blue-100 text-blue-700' },
  { name: 'Product', count: 3, color: 'bg-green-100 text-green-700' },
  { name: 'Success', count: 4, color: 'bg-purple-100 text-purple-700' },
  { name: 'Marketing', count: 2, color: 'bg-orange-100 text-orange-700' },
];

export default function CareersPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Join Our Mission
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            We're building the future of web data extraction. Join a team of passionate engineers,
            product managers, and data enthusiasts who are democratizing access to web data.
          </p>
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              25+ Team Members
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Remote-First
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Rapid Growth
            </div>
          </div>
        </div>

        {/* Why Join Us */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why DataVault Pro?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Meaningful Work</CardTitle>
                <CardDescription>
                  Build products that empower developers and businesses worldwide
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Amazing Team</CardTitle>
                <CardDescription>
                  Work with talented engineers from top tech companies
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Growth Opportunity</CardTitle>
                <CardDescription>
                  Rapid career growth in a fast-scaling startup environment
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Benefits & Perks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <benefit.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Teams</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {departments.map((dept, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold mb-2">{dept.count}</div>
                  <Badge variant="secondary" className={dept.color}>
                    {dept.name}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Open Positions</h2>
          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">{position.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="gap-1">
                          <Briefcase className="h-3 w-3" />
                          {position.department}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <MapPin className="h-3 w-3" />
                          {position.location}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {position.type}
                        </Badge>
                        <Badge variant="secondary">
                          {position.level}
                        </Badge>
                      </div>
                    </div>
                    <Button>Apply Now</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{position.description}</p>
                  <div>
                    <h4 className="font-medium mb-2">Requirements:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {position.requirements.map((req, reqIndex) => (
                        <li key={reqIndex}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* No Perfect Match */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Don't See a Perfect Match?</CardTitle>
            <CardDescription>
              We're always looking for talented people to join our team. Send us your resume and let us know how you'd like to contribute.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="lg">
              Send Us Your Resume
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
