import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SiteLayout } from '@/components/layout/site-layout';
import { LucideHome, LucideSearch, LucideArrowLeft, LucideHelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <SiteLayout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <span className="text-4xl font-bold text-primary">404</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Page Not Found</h1>
            <p className="text-muted-foreground text-lg">
              Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or the URL might be incorrect.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button className="w-full sm:w-auto">
                  <LucideHome className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full sm:w-auto">
                  <LucideSearch className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>

            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Need help? Here are some useful links:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <Link href="/documentation" className="flex items-center text-primary hover:underline">
                  <LucideHelpCircle className="w-4 h-4 mr-1" />
                  Documentation
                </Link>
                <Link href="/features" className="flex items-center text-primary hover:underline">
                  <LucideSearch className="w-4 h-4 mr-1" />
                  Features
                </Link>
                <Link href="/pricing" className="flex items-center text-primary hover:underline">
                  <LucideArrowLeft className="w-4 h-4 mr-1" />
                  Pricing
                </Link>
                <Link href="/auth/login" className="flex items-center text-primary hover:underline">
                  <LucideHome className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
