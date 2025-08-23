"use client";

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import {
  LucideHome,
  LucideSparkles,
  LucideLayoutDashboard,
  LucideFileSpreadsheet,
  LucideSettings,
  LucideCreditCard,
  LucideCode,
  LucideLifeBuoy,
  LucideMenu,
  LucideX,
  Workflow,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface DashboardLayoutProps {
  children: ReactNode;
}

// Navigation items configuration
const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LucideLayoutDashboard },
  { href: '/dashboard/scrapers', label: 'Scrapers', icon: LucideCode },
  {
    href: '/dashboard/pipelines',
    label: 'Pipelines',
    icon: Workflow,
    badge: { text: 'New', color: 'from-blue-500 to-purple-500' }
  },
  { href: '/dashboard/browser-farm', label: 'Browser Farm', icon: Globe },
  {
    href: '/dashboard/browser-farm-advanced',
    label: 'Advanced Farm',
    icon: Globe,
    badge: { text: 'Phase 4', color: 'from-emerald-500 to-blue-500' }
  },
  {
    href: '/dashboard/enhanced-monitoring',
    label: 'Enhanced Monitoring',
    icon: LucideLayoutDashboard,
    badge: { text: 'Phase 3', color: 'from-purple-500 to-pink-500' }
  },
  {
    href: '/dashboard/enterprise-production',
    label: 'Enterprise Production',
    icon: LucideSparkles,
    badge: { text: 'Enterprise', color: 'from-orange-500 to-red-500' }
  },
  { href: '/dashboard/data', label: 'Data', icon: LucideFileSpreadsheet },
  { href: '/dashboard/billing', label: 'Billing', icon: LucideCreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: LucideSettings },
];

const footerItems = [
  { href: '/support', label: 'Support', icon: LucideLifeBuoy },
  { href: '/', label: 'Back to Home', icon: LucideHome },
];

// Navigation component that can be reused for both desktop and mobile
function Navigation({ onItemClick, isMobile = false }: { onItemClick?: () => void; isMobile?: boolean }) {
  return (
    <>
      <nav className={`flex-1 ${isMobile ? 'p-6 space-y-2' : 'p-4 space-y-1.5'}`}>
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={onItemClick}>
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                isMobile
                  ? 'h-14 text-base font-medium px-4 hover:bg-muted'
                  : 'h-10'
              }`}
            >
              <item.icon className={`${isMobile ? 'h-6 w-6 mr-4' : 'h-4 w-4 mr-3'}`} />
              <span className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`${isMobile ? 'truncate flex-1 text-left' : ''}`}>
                  {item.label}
                </span>
                {item.badge && (
                  <span className={`bg-gradient-to-r ${item.badge.color} text-white text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium`}>
                    {item.badge.text}
                  </span>
                )}
              </span>
            </Button>
          </Link>
        ))}
      </nav>

      <div className={`${isMobile ? 'p-6' : 'p-4'} border-t mt-auto bg-muted/30`}>
        {footerItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={onItemClick}>
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                isMobile ? 'h-12 text-base mb-2 last:mb-0' : 'h-10'
              }`}
            >
              <item.icon className={`${isMobile ? 'h-5 w-5 mr-3' : 'h-4 w-4 mr-2'}`} />
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
    </>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 border-r bg-background">
        <div className="p-4 border-b">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <LucideSparkles className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent font-bold">ScrapeMaster</span>
          </Link>
        </div>
        <Navigation isMobile={false} />
      </aside>

      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80 sm:w-96 p-0 flex flex-col">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b bg-background flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-3 text-xl font-bold text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LucideSparkles className="h-7 w-7 text-primary" />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent font-bold">
                  DataVault Pro
                </span>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Navigation onItemClick={() => setMobileMenuOpen(false)} isMobile={true} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 sm:h-18 border-b bg-background flex items-center px-4 sm:px-6 lg:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3 sm:gap-4 w-full">
            {/* Mobile/Tablet menu button */}
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden min-h-[44px] min-w-[44px]"
                onClick={() => setMobileMenuOpen(true)}
              >
                <LucideMenu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>

            {/* Mobile/Tablet logo */}
            <Link href="/dashboard" className="lg:hidden flex items-center gap-2 flex-1 min-w-0">
              <LucideSparkles className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="font-bold text-base sm:text-lg truncate bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                DataVault Pro
              </span>
            </Link>

            <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:gap-4">
              <ThemeToggle />
              <Link href="/dashboard/notifications">
                <Button variant="ghost" size="icon" className="relative min-h-[44px] min-w-[44px]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                  </svg>
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-background"></span>
                  <span className="sr-only">Notifications</span>
                </Button>
              </Link>

              <Link href="/dashboard/profile">
                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-base font-medium text-primary">U</span>
                  </div>
                  <span className="sr-only">User profile</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 pb-safe-bottom">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
