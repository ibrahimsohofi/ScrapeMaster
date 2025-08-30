"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LucideHome,
  LucideSettings,
  LucideBot,
  LucideDatabase,
  LucideBarChart3,
  LucideServer,
  LucideShield,
  LucideUsers,
  LucideMenu,
  LucideBell,
  LucideLogOut,
  LucideUser,
  LucideSearch,
  LucidePlus
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LucideHome,
    description: 'Overview and analytics'
  },
  {
    name: 'Scrapers',
    href: '/dashboard/scrapers',
    icon: LucideBot,
    description: 'Manage web scrapers',
    badge: 'Hot'
  },
  {
    name: 'Data',
    href: '/dashboard/data',
    icon: LucideDatabase,
    description: 'View and export data'
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: LucideBarChart3,
    description: 'Performance insights'
  },
  {
    name: 'Browser Farm',
    href: '/dashboard/browser-farm',
    icon: LucideServer,
    description: 'Manage browser instances'
  },
  {
    name: 'Proxy Management',
    href: '/dashboard/proxy-management',
    icon: LucideShield,
    description: 'Configure proxy settings'
  },
  {
    name: 'Pipelines',
    href: '/dashboard/pipelines',
    icon: LucideDatabase,
    description: 'Data processing pipelines'
  },
  {
    name: 'Templates',
    href: '/dashboard/templates',
    icon: LucideBot,
    description: 'Scraper templates'
  },
  {
    name: 'Monitoring',
    href: '/dashboard/enhanced-monitoring',
    icon: LucideBarChart3,
    description: 'System monitoring'
  }
];

const bottomNavigation = [
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: LucideSettings,
    description: 'Account settings'
  },
  {
    name: 'Team',
    href: '/dashboard/team',
    icon: LucideUsers,
    description: 'Team management'
  }
];

function NavItem({ item, isActive }: { item: any; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
      )}
    >
      <item.icon className="h-4 w-4" />
      <span className="flex-1">{item.name}</span>
      {item.badge && (
        <Badge variant="secondary" className="ml-auto text-xs">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
          <LucideBot className="h-6 w-6" />
          <span>DataVault Pro</span>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="border-b p-4">
        <Button asChild className="w-full" size="sm">
          <Link href="/dashboard/scrapers/new">
            <LucidePlus className="mr-2 h-4 w-4" />
            New Scraper
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto p-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t p-4">
        <nav className="space-y-1">
          {bottomNavigation.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <LucideMenu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <LucideSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search scrapers, data..."
                className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <LucideBell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 text-xs"></span>
              <span className="sr-only">Notifications</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/01.png" alt="User" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      admin@acme.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <LucideUser className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <LucideSettings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LucideLogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
