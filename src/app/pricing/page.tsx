"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  X,
  Star,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Users,
  HeadphonesIcon,
  Crown,
  TrendingUp,
  DollarSign,
  Database,
  Rocket,
  Globe
} from "lucide-react";
import Link from "next/link";
import { SiteLayout } from "@/components/layout/site-layout";

const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for individuals and small projects getting started with data extraction.",
    monthlyPrice: 29,
    yearlyPrice: 290, // 2 months free
    popular: false,
    icon: Rocket,
    features: {
      requests: "10,000",
      scrapers: "5",
      proxies: "Standard",
      exports: ["JSON", "CSV", "Excel"],
      retention: "30 days",
      support: "Email support",
      scheduling: true,
      api: true,
      customScripts: false,
      premium: false,
      priority: false,
      sla: false,
      dedicated: false,
      custom: false
    },
    highlights: [
      "10,000 monthly requests",
      "5 active scrapers",
      "30-day data retention",
      "Standard proxy rotation",
      "Email support",
      "API access",
      "Scheduled scraping"
    ]
  },
  {
    id: "professional",
    name: "Professional",
    description: "Ideal for growing teams and businesses that need reliable data extraction at scale.",
    monthlyPrice: 99,
    yearlyPrice: 990, // 2 months free
    popular: true,
    icon: TrendingUp,
    features: {
      requests: "100,000",
      scrapers: "25",
      proxies: "Premium",
      exports: ["JSON", "CSV", "Excel", "Database"],
      retention: "90 days",
      support: "Priority support",
      scheduling: true,
      api: true,
      customScripts: true,
      premium: true,
      priority: true,
      sla: false,
      dedicated: false,
      custom: false
    },
    highlights: [
      "100,000 monthly requests",
      "25 active scrapers",
      "90-day data retention",
      "Premium proxy network",
      "Priority support",
      "Custom JavaScript injection",
      "Advanced scheduling",
      "Team collaboration"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations requiring enterprise-grade data infrastructure and support.",
    monthlyPrice: 299,
    yearlyPrice: 2990, // 2 months free
    popular: false,
    icon: Crown,
    features: {
      requests: "Unlimited",
      scrapers: "Unlimited",
      proxies: "Enterprise",
      exports: ["All formats", "Real-time webhooks"],
      retention: "1 year",
      support: "Dedicated support",
      scheduling: true,
      api: true,
      customScripts: true,
      premium: true,
      priority: true,
      sla: true,
      dedicated: true,
      custom: true
    },
    highlights: [
      "Unlimited requests",
      "Unlimited scrapers",
      "1-year data retention",
      "Enterprise proxy network",
      "Dedicated support manager",
      "99.9% SLA guarantee",
      "Custom integrations",
      "On-premise deployment",
      "SSO & advanced security"
    ]
  }
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium backdrop-blur-sm mb-6">
            <Database className="h-4 w-4" />
            Choose Your Data Extraction Plan
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent">
              DataVault Pro Pricing
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Scale your data extraction operations with transparent, value-driven pricing.
            No hidden fees, no surprises.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            <Badge variant="secondary" className="ml-2">
              Save 17%
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {pricingPlans.map((plan) => {
            const IconComponent = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const monthlyPrice = isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular
                    ? "border-primary shadow-lg scale-105 bg-gradient-to-b from-primary/5 to-transparent"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                  </div>

                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mb-4">
                    {plan.description}
                  </CardDescription>

                  <div className="text-center">
                    <div className="text-4xl font-bold mb-1">
                      ${monthlyPrice}
                      <span className="text-lg font-normal text-muted-foreground">
                        /month
                      </span>
                    </div>
                    {isYearly && plan.yearlyPrice > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Billed annually (${plan.yearlyPrice}/year)
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.highlights.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={`w-full ${
                      plan.popular
                        ? "bg-primary hover:bg-primary/90"
                        : "variant-outline"
                    }`}
                  >
                    <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2">
                      {plan.id === "enterprise" ? "Contact Sales" : "Start Free Trial"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    {plan.id === "enterprise" ? "Custom pricing available" : "14-day free trial • No credit card required"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Compare Features
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Features</th>
                  <th className="text-center p-4 font-medium">Starter</th>
                  <th className="text-center p-4 font-medium">Professional</th>
                  <th className="text-center p-4 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">Monthly Requests</td>
                  <td className="text-center p-4">10,000</td>
                  <td className="text-center p-4">100,000</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Active Scrapers</td>
                  <td className="text-center p-4">5</td>
                  <td className="text-center p-4">25</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Data Retention</td>
                  <td className="text-center p-4">30 days</td>
                  <td className="text-center p-4">90 days</td>
                  <td className="text-center p-4">1 year</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Support Level</td>
                  <td className="text-center p-4">Email</td>
                  <td className="text-center p-4">Priority</td>
                  <td className="text-center p-4">Dedicated</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">API Access</td>
                  <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Custom Scripts</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">SLA Guarantee</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><CheckCircle className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">What happens if I exceed my monthly limits?</h3>
              <p className="text-muted-foreground text-sm">
                We'll notify you when you're approaching your limits. You can upgrade your plan or purchase additional requests as needed.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Do you offer enterprise discounts?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, we offer volume discounts for enterprise customers. Contact our sales team for custom pricing.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept all major credit cards, PayPal, and wire transfers for enterprise accounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
