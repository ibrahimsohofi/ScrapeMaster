import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LucideSearch, LucideArrowRight, LucideShield, LucideZap, LucideSparkles, LucideBot, LucideGlobe } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-emerald-50/30 dark:to-emerald-950/20">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-pattern" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/15 to-cyan-500/10 blur-[140px] w-full h-full max-w-5xl max-h-5xl rounded-full opacity-40" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-emerald-400/60 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-teal-400/60 rounded-full animate-ping" />
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-pulse" />
        <div className="absolute top-60 right-1/3 w-1 h-1 bg-emerald-500/60 rounded-full animate-ping" />
      </div>

      <div className="relative container mx-auto px-4 py-24 md:py-32 lg:py-40">
        <div className="flex flex-col items-center text-center space-y-10 max-w-5xl mx-auto">
          {/* Enhanced Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium backdrop-blur-sm shadow-lg">
            <div className="relative">
              <LucideBot className="h-5 w-5" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <span className="font-semibold">AI-Powered Data Extraction Platform</span>
            <LucideSparkles className="h-4 w-4 text-emerald-500" />
          </div>

          {/* Enhanced Heading */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-none">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                ScrapeMaster
              </span>
              <br />
              <span className="text-foreground mt-2 block">
                Intelligent Web
              </span>
              <br />
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                Data Extraction
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform any website into structured data with our cutting-edge AI technology.
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold"> No coding required</span> –
              just point, click, and extract.
            </p>
          </div>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md">
            <Button
              asChild
              size="xl"
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
            >
              <Link href="/auth/signup" className="inline-flex items-center gap-3">
                <LucideZap className="h-5 w-5" />
                Start Free Trial
                <LucideArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="w-full sm:w-auto border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300"
            >
              <Link href="/demo" className="inline-flex items-center gap-3">
                <LucideGlobe className="h-5 w-5" />
                View Live Demo
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <LucideShield className="h-4 w-4 text-emerald-600" />
              <span>Enterprise Security</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-muted-foreground/40 rounded-full" />
            <div className="flex items-center gap-2">
              <LucideZap className="h-4 w-4 text-emerald-600" />
              <span>99.9% Uptime</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-muted-foreground/40 rounded-full" />
            <div className="flex items-center gap-2">
              <LucideBot className="h-4 w-4 text-emerald-600" />
              <span>AI-Powered</span>
            </div>
          </div>

          {/* Enhanced Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 w-full max-w-4xl">
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                  <LucideBot className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">AI Smart Selectors</h3>
                <p className="text-sm text-muted-foreground">Automatically detect and extract data with machine learning intelligence</p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/50 dark:to-cyan-950/50 border-teal-200/50 dark:border-teal-800/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
                  <LucideZap className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Process millions of pages with our high-performance infrastructure</p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-cyan-50 to-emerald-50 dark:from-cyan-950/50 dark:to-emerald-950/50 border-cyan-200/50 dark:border-cyan-800/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center">
                  <LucideGlobe className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">Global Scale</h3>
                <p className="text-sm text-muted-foreground">Extract data from any website, anywhere in the world</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
