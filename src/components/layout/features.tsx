import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  LucideCode,
  LucideDatabase,
  LucideCloudLightning,
  LucideLineChart,
  LucideCalendarClock,
  LucideShield,
  LucideSettings,
  LucideHistory,
  LucideBot,
  LucideZap,
  LucideGlobe,
  LucideSearch,
  LucideTarget,
  LucideFilter,
  LucideBrain,
  LucideCloud,
  LucideFileText
} from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  gradient?: string;
}

function FeatureCard({ title, description, icon, className, gradient }: FeatureCardProps) {
  return (
    <Card className={cn(
      "h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer",
      gradient || "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-xl shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-110">
            {icon}
          </div>
        </div>
        <CardTitle className="text-lg font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function Features() {
  const features = [
    {
      title: "AI Smart Selectors",
      description: "Advanced machine learning automatically detects and extracts data patterns from any website structure.",
      icon: <LucideBrain className="h-6 w-6 text-white" />,
      gradient: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40"
    },
    {
      title: "Lightning Performance",
      description: "Process millions of pages with our high-performance, distributed scraping infrastructure.",
      icon: <LucideZap className="h-6 w-6 text-white" />,
      gradient: "bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40"
    },
    {
      title: "Global Scale",
      description: "Extract data from websites worldwide with automatic proxy rotation and geo-targeting.",
      icon: <LucideGlobe className="h-6 w-6 text-white" />,
      gradient: "bg-gradient-to-br from-cyan-50 to-emerald-50 dark:from-cyan-950/40 dark:to-emerald-950/40"
    },
    {
      title: "Visual Pipelines",
      description: "Build complex data workflows with our intuitive drag-and-drop pipeline editor.",
      icon: <LucideSettings className="h-6 w-6 text-white" />,
      gradient: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40"
    },
    {
      title: "Real-time Monitoring",
      description: "Monitor scraping jobs in real-time with advanced analytics and alerting systems.",
      icon: <LucideLineChart className="h-6 w-6 text-white" />,
      gradient: "bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40"
    },
    {
      title: "Smart Scheduling",
      description: "Automated scheduling with intelligent retry logic and failure recovery mechanisms.",
      icon: <LucideCalendarClock className="h-6 w-6 text-white" />,
      gradient: "bg-gradient-to-br from-cyan-50 to-emerald-50 dark:from-cyan-950/40 dark:to-emerald-950/40"
    },
    {
      title: "Data Transformation",
      description: "Clean, format, and transform extracted data with built-in processing tools.",
      icon: <LucideFilter className="h-6 w-6 text-white" />,
      gradient: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40"
    },
    {
      title: "Enterprise Security",
      description: "Bank-grade security with encrypted storage, audit logs, and compliance controls.",
      icon: <LucideShield className="h-6 w-6 text-white" />,
      gradient: "bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-emerald-50/20 dark:to-emerald-950/10" id="features">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
            <LucideSearch className="h-4 w-4" />
            Platform Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Intelligent Web Scraping
            </span>
            <br />
            <span className="text-foreground">
              Built for Enterprise Scale
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            ScrapeMaster combines cutting-edge AI with enterprise-grade infrastructure to extract,
            process, and deliver web data at unprecedented scale and accuracy.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              gradient={feature.gradient}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-800">
            <LucideBot className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Ready to transform your data extraction workflow?
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
