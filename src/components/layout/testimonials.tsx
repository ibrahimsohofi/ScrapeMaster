import { Card, CardContent } from '@/components/ui/card';
import { Building, Target, Zap, Globe, ShoppingCart, TrendingUp } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  industry: string;
  metric: string;
  icon: any;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "ScrapeMaster transformed our competitive intelligence. We now monitor 50,000+ product listings daily and reduced our data collection costs by 80%. The ROI was immediate.",
    author: "Sarah Chen",
    role: "VP of Analytics",
    company: "RetailEdge",
    industry: "E-commerce",
    metric: "80% cost reduction",
    icon: ShoppingCart,
  },
  {
    quote:
      "The no-code scraper builder is a game-changer. Our marketing team can now gather market data independently, freeing up 15 hours per week of developer time.",
    author: "Marcus Rodriguez",
    role: "Growth Director",
    company: "ScaleWorks",
    industry: "SaaS",
    metric: "15 hours/week saved",
    icon: TrendingUp,
  },
  {
    quote:
      "We use ScrapeMaster to track real estate listings across 25 markets. The data accuracy and real-time updates give us a significant competitive advantage in property investments.",
    author: "Jennifer Liu",
    role: "Data Science Lead",
    company: "PropertyFlow",
    industry: "Real Estate",
    metric: "25 markets monitored",
    icon: Building,
  },
  {
    quote:
      "As a research institution, data integrity is crucial. ScrapeMaster's validation and error handling have been exceptional, supporting our academic publications with reliable datasets.",
    author: "Dr. Michael Thompson",
    role: "Research Director",
    company: "TechUniversity",
    industry: "Research",
    metric: "99.7% data accuracy",
    icon: Target,
  },
  {
    quote:
      "The API integration was seamless. We're now processing 2M+ data points monthly and feeding them directly into our ML pipelines. The technical support team is outstanding.",
    author: "Alex Kim",
    role: "Chief Technology Officer",
    company: "DataInsight AI",
    industry: "AI/ML",
    metric: "2M+ data points/month",
    icon: Zap,
  },
  {
    quote:
      "ScrapeMaster handles complex JavaScript-heavy sites that other tools couldn't touch. Our lead generation campaigns are now 3x more effective with higher quality data.",
    author: "Emma Watson",
    role: "Marketing Operations",
    company: "LeadGen Pro",
    industry: "Marketing",
    metric: "3x campaign effectiveness",
    icon: Globe,
  },
];

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-emerald-50/20 dark:to-emerald-950/10">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <TrendingUp className="h-4 w-4" />
            Customer Success Stories
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            <span className="text-blue-600 dark:text-blue-400">
              Trusted by Data-Driven Teams
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            See how companies across industries are transforming their data operations with ScrapeMaster
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => {
            const Icon = testimonial.icon;
            return (
              <Card
                key={index}
                className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20"
              >
                <CardContent className="space-y-4 p-0">
                  {/* Industry Badge */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {testimonial.industry}
                    </span>
                  </div>

                  {/* Quote */}
                  <blockquote className="text-muted-foreground leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Key Result */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      Key Result: {testimonial.metric}
                    </span>
                  </div>

                  {/* Author */}
                  <div className="pt-2 border-t border-border">
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Stats */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-8">Trusted by 500+ companies worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            <span className="text-2xl font-bold text-muted-foreground">RetailEdge</span>
            <span className="text-2xl font-bold text-muted-foreground">ScaleWorks</span>
            <span className="text-2xl font-bold text-muted-foreground">PropertyFlow</span>
            <span className="text-2xl font-bold text-muted-foreground">TechUniversity</span>
            <span className="text-2xl font-bold text-muted-foreground">DataInsight</span>
            <span className="text-2xl font-bold text-muted-foreground">LeadGen Pro</span>
          </div>
        </div>
      </div>
    </section>
  );
}
