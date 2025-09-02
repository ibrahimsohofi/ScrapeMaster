import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Handshake, Zap, Globe, TrendingUp, Shield, Code, DollarSign } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partners - DataVault Pro',
  description: 'Join the DataVault Pro partner ecosystem and build solutions together.',
};

const partnerTypes = [
  {
    icon: Code,
    title: 'Technology Partners',
    description: 'Integrate DataVault Pro into your platform or build complementary solutions',
    benefits: ['API access', 'Technical support', 'Co-marketing opportunities'],
    ideal: 'SaaS platforms, development tools, data analytics companies',
  },
  {
    icon: Users,
    title: 'Solution Partners',
    description: 'Deliver DataVault Pro-powered solutions to your clients',
    benefits: ['Partner discounts', 'Training & certification', 'Sales support'],
    ideal: 'Consulting firms, agencies, system integrators',
  },
  {
    icon: DollarSign,
    title: 'Reseller Partners',
    description: 'Sell DataVault Pro services and earn recurring commissions',
    benefits: ['Up to 25% commission', 'Sales materials', 'Lead sharing'],
    ideal: 'Software resellers, consultants, agencies',
  },
];

const partners = [
  {
    name: 'DataFlow Analytics',
    type: 'Technology Partner',
    description: 'Advanced data visualization platform with DataVault Pro integration',
    logo: '📊',
  },
  {
    name: 'CloudOps Solutions',
    type: 'Solution Partner',
    description: 'Enterprise data extraction and automation services',
    logo: '☁️',
  },
  {
    name: 'DevTools Inc.',
    type: 'Technology Partner',
    description: 'Developer productivity suite with built-in scraping capabilities',
    logo: '🛠️',
  },
  {
    name: 'MarketIntel Pro',
    type: 'Reseller Partner',
    description: 'Competitive intelligence and market research platform',
    logo: '📈',
  },
  {
    name: 'AutoScale Systems',
    type: 'Solution Partner',
    description: 'Enterprise automation and data integration specialists',
    logo: '⚡',
  },
  {
    name: 'Analytics Hub',
    type: 'Technology Partner',
    description: 'Business intelligence platform with real-time data feeds',
    logo: '🧠',
  },
];

const partnerBenefits = [
  {
    icon: TrendingUp,
    title: 'Revenue Growth',
    description: 'Expand your offering and increase revenue with our proven solutions',
  },
  {
    icon: Shield,
    title: 'Enterprise Support',
    description: 'Dedicated partner success team and priority technical support',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Access to our worldwide customer base and marketing channels',
  },
  {
    icon: Zap,
    title: 'Fast Integration',
    description: 'Quick setup with comprehensive APIs and documentation',
  },
];

const requirements = [
  'Established business with relevant industry experience',
  'Technical team capable of integration or solution delivery',
  'Commitment to customer success and quality service',
  'Aligned business values and ethical practices',
];

export default function PartnersPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Partner with DataVault Pro
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Join our growing ecosystem of technology partners, solution providers, and resellers.
            Together, we're building the future of web data extraction and helping businesses
            unlock insights from the web.
          </p>
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              50+ Partners
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              30+ Countries
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              $2M+ Partner Revenue
            </div>
          </div>
        </div>

        {/* Partner Types */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Partnership Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partnerTypes.map((type, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <type.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <CardTitle>{type.title}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Benefits:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {type.benefits.map((benefit, i) => (
                        <li key={i}>• {benefit}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Ideal for:</h4>
                    <p className="text-sm text-muted-foreground">{type.ideal}</p>
                  </div>
                  <Button className="w-full">Learn More</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Partner Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why Partner with Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerBenefits.map((benefit, index) => (
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

        {/* Current Partners */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{partner.logo}</div>
                    <div>
                      <CardTitle className="text-lg">{partner.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {partner.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{partner.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Partner Requirements</h2>
            <Card>
              <CardHeader>
                <CardTitle>What We Look For</CardTitle>
                <CardDescription>
                  We partner with companies that share our commitment to quality and customer success.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Application Process */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">How to Become a Partner</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Apply', description: 'Submit your partnership application' },
              { step: '2', title: 'Review', description: 'We review your application and schedule a call' },
              { step: '3', title: 'Onboard', description: 'Complete training and certification' },
              { step: '4', title: 'Launch', description: 'Start selling and building solutions' },
            ].map((step, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    {step.step}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="text-center">
          <CardHeader>
            <Handshake className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>Ready to Partner with Us?</CardTitle>
            <CardDescription>
              Let's build something amazing together. Apply to become a DataVault Pro partner today.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">Apply to Partner Program</Button>
            <Button variant="outline" size="lg">Download Partner Kit</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
