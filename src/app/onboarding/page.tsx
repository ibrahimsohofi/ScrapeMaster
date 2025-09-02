'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Play,
  Zap,
  ArrowRight,
  BookOpen,
  Target,
  Users,
  BarChart3
} from 'lucide-react';
import { WelcomeTour } from '@/components/onboarding/welcome-tour';
import { ScraperWizard } from '@/components/onboarding/scraper-wizard';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action: () => void;
  actionLabel: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [showTour, setShowTour] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [userData, setUserData] = useState<{ name?: string; email?: string }>({});

  // Load user data and onboarding progress
  useEffect(() => {
    // In a real app, you'd fetch this from your auth system
    const mockUserData = {
      name: 'John Doe',
      email: 'john@example.com'
    };
    setUserData(mockUserData);

    // Load completed steps from localStorage
    const saved = localStorage.getItem('onboarding-progress');
    if (saved) {
      setCompletedSteps(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('onboarding-progress', JSON.stringify([...completedSteps]));
  }, [completedSteps]);

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const handleTourComplete = () => {
    markStepCompleted('tour');
    setShowTour(false);
  };

  const handleScraperComplete = (scraperData: any) => {
    markStepCompleted('first-scraper');
    setShowWizard(false);
    // In a real app, you'd create the scraper via API
    console.log('Creating scraper:', scraperData);
    // Redirect to dashboard
    router.push('/dashboard');
  };

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'tour',
      title: 'Take the Platform Tour',
      description: 'Get familiar with DataVault Pro features and navigation',
      icon: <BookOpen className="h-6 w-6 text-blue-500" />,
      completed: completedSteps.has('tour'),
      action: () => setShowTour(true),
      actionLabel: 'Start Tour'
    },
    {
      id: 'first-scraper',
      title: 'Create Your First Scraper',
      description: 'Build a web scraper with our step-by-step wizard',
      icon: <Target className="h-6 w-6 text-green-500" />,
      completed: completedSteps.has('first-scraper'),
      action: () => setShowWizard(true),
      actionLabel: 'Create Scraper'
    },
    {
      id: 'explore-dashboard',
      title: 'Explore the Dashboard',
      description: 'View analytics, monitor performance, and manage your scrapers',
      icon: <BarChart3 className="h-6 w-6 text-purple-500" />,
      completed: completedSteps.has('explore-dashboard'),
      action: () => {
        markStepCompleted('explore-dashboard');
        router.push('/dashboard');
      },
      actionLabel: 'Go to Dashboard'
    },
    {
      id: 'join-community',
      title: 'Join the Community',
      description: 'Connect with other users, get tips, and share experiences',
      icon: <Users className="h-6 w-6 text-orange-500" />,
      completed: completedSteps.has('join-community'),
      action: () => {
        markStepCompleted('join-community');
        window.open('/community', '_blank');
      },
      actionLabel: 'Join Community'
    }
  ];

  const completedCount = completedSteps.size;
  const totalSteps = onboardingSteps.length;
  const progressPercent = (completedCount / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-4">
                Welcome to DataVault Pro! 🎉
              </h1>
              {userData.name && (
                <p className="text-xl text-muted-foreground">
                  Hi {userData.name}, let's get you started
                </p>
              )}
            </div>

            {/* Progress Overview */}
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Getting Started Progress</span>
                  <Badge variant={completedCount === totalSteps ? 'default' : 'secondary'}>
                    {completedCount}/{totalSteps} Complete
                  </Badge>
                </div>
                <Progress value={progressPercent} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {completedCount === totalSteps
                    ? 'Congratulations! You\'re all set up!'
                    : `${totalSteps - completedCount} steps remaining`
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Onboarding Steps */}
          <div className="grid gap-6 mb-12">
            {onboardingSteps.map((step, index) => (
              <Card
                key={step.id}
                className={`transition-all duration-200 ${
                  step.completed
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'hover:shadow-md'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Step Number/Icon */}
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-full shrink-0
                      ${step.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {step.completed ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        step.icon
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0">
                      {step.completed ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Button onClick={step.action} variant="outline">
                          {step.actionLabel}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          {completedCount === totalSteps ? (
            <Card className="border-2 border-primary bg-primary/5">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">You're All Set! 🚀</CardTitle>
                <CardDescription>
                  Congratulations on completing the onboarding. You're ready to start scraping!
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center gap-4">
                <Button onClick={() => router.push('/dashboard')} size="lg">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => router.push('/dashboard/scrapers/new')} size="lg">
                  <Zap className="h-5 w-5 mr-2" />
                  Create Another Scraper
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>
                  We're here to help you get the most out of DataVault Pro
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => router.push('/documentation')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
                <Button variant="outline" onClick={() => router.push('/support')}>
                  Get Support
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">5 min</div>
                <p className="text-sm text-muted-foreground">Average setup time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">10,000+</div>
                <p className="text-sm text-muted-foreground">Websites supported</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
                <p className="text-sm text-muted-foreground">Uptime guarantee</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WelcomeTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
        userName={userData.name}
      />

      <ScraperWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleScraperComplete}
      />
    </div>
  );
}
