'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle,
  Play,
  Settings,
  BarChart3,
  Globe,
  Zap,
  Shield,
  Database
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  highlight?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface WelcomeTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userName?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DataVault Pro! 🎉',
    description: 'Get ready to transform web data into actionable insights. This quick tour will show you the key features and help you create your first scraper.',
    icon: <Zap className="h-6 w-6 text-primary" />,
  },
  {
    id: 'dashboard',
    title: 'Your Command Center',
    description: 'The dashboard provides real-time analytics, performance metrics, and an overview of all your scrapers. Monitor success rates, data extraction volume, and system health.',
    icon: <BarChart3 className="h-6 w-6 text-blue-500" />,
    action: {
      label: 'View Dashboard',
      href: '/dashboard'
    }
  },
  {
    id: 'scrapers',
    title: 'Create Powerful Scrapers',
    description: 'Build no-code scrapers with our visual editor. Point, click, and extract data from any website. AI-powered selector generation makes it even easier.',
    icon: <Globe className="h-6 w-6 text-green-500" />,
    action: {
      label: 'Create First Scraper',
      href: '/dashboard/scrapers/new'
    }
  },
  {
    id: 'monitoring',
    title: 'Enterprise Monitoring',
    description: 'Track performance, monitor uptime, and get real-time alerts. Our advanced monitoring ensures your data collection never misses a beat.',
    icon: <Shield className="h-6 w-6 text-orange-500" />,
    action: {
      label: 'View Monitoring',
      href: '/dashboard/enhanced-monitoring'
    }
  },
  {
    id: 'data',
    title: 'Export & Analyze',
    description: 'Access your scraped data in multiple formats (JSON, CSV, Excel). Set up automated exports and integrate with your existing data pipeline.',
    icon: <Database className="h-6 w-6 text-purple-500" />,
    action: {
      label: 'Manage Data',
      href: '/dashboard/data'
    }
  },
  {
    id: 'settings',
    title: 'Customize Your Experience',
    description: 'Configure API keys, webhooks, notifications, and team settings. Set up integrations with your favorite tools and platforms.',
    icon: <Settings className="h-6 w-6 text-gray-500" />,
    action: {
      label: 'Open Settings',
      href: '/dashboard/settings'
    }
  }
];

export function WelcomeTour({ isOpen, onClose, onComplete, userName }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  useEffect(() => {
    // Mark current step as viewed
    if (currentStepData) {
      setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
    }
  }, [currentStep, currentStepData]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {userName ? `Welcome, ${userName}!` : 'Welcome to DataVault Pro!'}
              </DialogTitle>
              <p className="text-muted-foreground mt-1">
                Let's get you started with a quick tour of the platform
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip Tour <X className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {tourSteps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          {/* Step Navigation Sidebar */}
          <div className="w-64 shrink-0">
            <h3 className="font-semibold mb-4">Tour Steps</h3>
            <div className="space-y-2">
              {tourSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                    ${index === currentStep
                      ? 'bg-primary/10 border border-primary/20 text-primary'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <div className="shrink-0">
                    {completedSteps.has(step.id) ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{step.title}</div>
                    <div className="text-xs opacity-70">
                      {index === currentStep ? 'Current' : completedSteps.has(step.id) ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {currentStepData.icon}
                  <div>
                    <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {currentStepData.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between">
                {/* Step-specific content */}
                <div className="mb-6">
                  {currentStep === 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold">What You'll Learn:</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Navigate the dashboard
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Create your first scraper
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Monitor performance
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Export and analyze data
                          </li>
                        </ul>
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Quick Stats:</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Tour Duration:</span>
                            <Badge variant="secondary">~3 minutes</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Steps:</span>
                            <Badge variant="secondary">{tourSteps.length} steps</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Difficulty:</span>
                            <Badge variant="secondary">Beginner</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep > 0 && currentStepData.action && (
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Try it now:</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Click the button below to explore this feature
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (currentStepData.action?.href) {
                            window.open(currentStepData.action.href, '_blank');
                          }
                          currentStepData.action?.onClick?.();
                        }}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {currentStepData.action.label}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={handleSkip}>
                      Skip Tour
                    </Button>
                    <Button onClick={handleNext}>
                      {currentStep === tourSteps.length - 1 ? 'Complete Tour' : 'Next Step'}
                      {currentStep < tourSteps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
