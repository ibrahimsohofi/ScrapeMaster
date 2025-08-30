import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PricingTierProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant?: 'default' | 'outline' | 'gradient' | 'emerald' | 'emerald-outline';
  popular?: boolean;
  className?: string;
}

function PricingTier({
  title,
  price,
  description,
  features,
  buttonText,
  buttonVariant = 'default',
  popular = false,
  className,
}: PricingTierProps) {
  return (
    <Card
      className={cn(
        "flex flex-col relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
        popular
          ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-2 border-emerald-200 dark:border-emerald-800 scale-105"
          : "bg-card hover:bg-gradient-to-br hover:from-emerald-50/30 hover:to-teal-50/30 dark:hover:from-emerald-950/10 dark:hover:to-teal-950/10",
        className
      )}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Most Popular
          </div>
        </div>
      )}
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
        <CardDescription className="pt-2 text-muted-foreground leading-relaxed">{description}</CardDescription>
        <div className="mt-6 flex items-baseline text-foreground">
          <span className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {price}
          </span>
          {price !== 'Custom' && <span className="ml-1 text-sm font-medium text-muted-foreground">/month</span>}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 text-emerald-600 mt-0.5">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-6">
        <Link href="/auth/signup" className="w-full">
          <Button
            variant={buttonVariant}
            className="w-full"
            size="lg"
          >
            {buttonText}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export function Pricing() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-emerald-50/20 dark:from-emerald-950/10 to-background" id="pricing">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Pricing Plans
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Simple, Transparent
            </span>
            <br />
            <span className="text-foreground">
              Pricing
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Choose the perfect plan for your web scraping needs. All plans include a
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold"> 14-day free trial</span>
            with no credit card required.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <PricingTier
            title="Starter"
            price="$0"
            description="Perfect for testing ScrapeMaster and small personal projects."
            features={[
              '1,000 requests/month',
              '1 concurrent scraper',
              'Basic proxy rotation',
              'JSON & CSV exports',
              'Community support',
              '7-day data retention',
              'Standard rate limits'
            ]}
            buttonText="Start Free"
            buttonVariant="emerald-outline"
          />
          <PricingTier
            title="Professional"
            price="$29"
            description="For individuals and small teams requiring reliable data extraction."
            features={[
              '50,000 requests/month',
              '5 concurrent scrapers',
              'Premium proxy network',
              'All export formats',
              'Email support',
              '30-day data retention',
              'Smart scheduling',
              'API access'
            ]}
            buttonText="Start Trial"
            buttonVariant="emerald"
          />
          <PricingTier
            title="Business"
            price="$79"
            description="For growing businesses with advanced web scraping requirements."
            features={[
              '250,000 requests/month',
              '15 concurrent scrapers',
              'Enterprise proxy network',
              'Real-time monitoring',
              'Priority support',
              '90-day data retention',
              'Advanced pipelines',
              'Custom scripts',
              'Webhook integrations'
            ]}
            buttonText="Start Trial"
            buttonVariant="gradient"
            popular={true}
          />
          <PricingTier
            title="Enterprise"
            price="Custom"
            description="For large organizations with high-volume and specialized needs."
            features={[
              'Unlimited requests',
              'Unlimited scrapers',
              'Dedicated infrastructure',
              'CAPTCHA solving',
              'Dedicated support manager',
              'Custom data retention',
              'Custom integrations',
              'SLA guarantees',
              'White-label options'
            ]}
            buttonText="Contact Sales"
            buttonVariant="emerald-outline"
          />
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Need a custom solution?</span>
            </div>
            <Link href="/contact">
              <Button variant="emerald" size="sm">
                Contact Our Sales Team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
