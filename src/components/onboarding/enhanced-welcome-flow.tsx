"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Play,
  Clock,
  Target,
  Zap,
  Shield,
  Globe,
  Code,
  Download,
  Users,
  Building,
  Rocket,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  required?: boolean;
}

interface UserProfile {
  role: string;
  industry: string;
  company: string;
  teamSize: string;
  useCase: string;
  goals: string[];
  experience: string;
  dataVolume: string;
}

const useCases = [
  {
    id: 'price-monitoring',
    title: 'Price Monitoring',
    description: 'Track competitor prices and market trends',
    icon: <Target className="h-6 w-6" />,
    popular: true
  },
  {
    id: 'lead-generation',
    title: 'Lead Generation',
    description: 'Collect contact information and business data',
    icon: <Users className="h-6 w-6" />,
    popular: true
  },
  {
    id: 'content-aggregation',
    title: 'Content Aggregation',
    description: 'Gather news, articles, and social media content',
    icon: <Globe className="h-6 w-6" />,
    popular: false
  },
  {
    id: 'research-analysis',
    title: 'Research & Analysis',
    description: 'Academic research and market analysis',
    icon: <Code className="h-6 w-6" />,
    popular: false
  },
  {
    id: 'inventory-tracking',
    title: 'Inventory Tracking',
    description: 'Monitor stock levels and product availability',
    icon: <Download className="h-6 w-6" />,
    popular: true
  }
];

const goals = [
  'Automate manual data collection',
  'Reduce operational costs',
  'Improve data accuracy',
  'Scale data operations',
  'Gain competitive intelligence',
  'Enhance decision making',
  'Increase team productivity',
  'Real-time monitoring'
];

export function EnhancedWelcomeFlow({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    goals: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to ScrapeMaster',
      description: 'Let\'s get you set up for success',
      component: <WelcomeStep />
    },
    {
      id: 'role',
      title: 'Tell us about yourself',
      description: 'Help us personalize your experience',
      component: <RoleStep profile={profile} setProfile={setProfile} />,
      required: true
    },
    {
      id: 'use-case',
      title: 'What will you use ScrapeMaster for?',
      description: 'Choose your primary use case',
      component: <UseCaseStep profile={profile} setProfile={setProfile} />,
      required: true
    },
    {
      id: 'goals',
      title: 'What are your goals?',
      description: 'Select what you want to achieve',
      component: <GoalsStep profile={profile} setProfile={setProfile} />
    },
    {
      id: 'setup',
      title: 'Let\'s create your first scraper',
      description: 'Choose a template to get started',
      component: <SetupStep profile={profile} />
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    const step = steps[currentStep];
    if (step.required && !isStepValid()) {
      toast.error('Please complete all required fields');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      onComplete(profile as UserProfile);
      toast.success('Welcome to ScrapeMaster! Your account is ready.');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    const step = steps[currentStep];
    switch (step.id) {
      case 'role':
        return profile.role && profile.industry && profile.company;
      case 'use-case':
        return profile.useCase;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-50/20 dark:to-emerald-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-2 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">ScrapeMaster Setup</h1>
                <p className="text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
              </div>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              {Math.round(progress)}% Complete
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
            <CardDescription className="text-lg">
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {steps[currentStep].component}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Setting up...
              </>
            ) : currentStep === steps.length - 1 ? (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center py-12">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full mb-6">
          <Globe className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-4">
          Welcome to <span className="text-emerald-600">ScrapeMaster</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The most advanced web scraping platform for professionals and enterprises.
          Let's set up your account and create your first scraper in just a few minutes.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="text-center p-6 rounded-lg bg-muted/50">
          <Zap className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">No-Code Builder</h3>
          <p className="text-sm text-muted-foreground">Create scrapers without coding</p>
        </div>
        <div className="text-center p-6 rounded-lg bg-muted/50">
          <Shield className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Enterprise Security</h3>
          <p className="text-sm text-muted-foreground">Bank-grade security & compliance</p>
        </div>
        <div className="text-center p-6 rounded-lg bg-muted/50">
          <Target className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">99.7% Accuracy</h3>
          <p className="text-sm text-muted-foreground">Reliable data extraction</p>
        </div>
      </div>
    </div>
  );
}

function RoleStep({ profile, setProfile }: { profile: Partial<UserProfile>; setProfile: (p: Partial<UserProfile>) => void }) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <Label htmlFor="role" className="text-base font-semibold mb-3 block">
          What's your role? *
        </Label>
        <Select value={profile.role} onValueChange={(value) => setProfile({ ...profile, role: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="data-analyst">Data Analyst</SelectItem>
            <SelectItem value="product-manager">Product Manager</SelectItem>
            <SelectItem value="researcher">Researcher</SelectItem>
            <SelectItem value="marketing">Marketing Professional</SelectItem>
            <SelectItem value="cto">CTO / Technical Lead</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="industry" className="text-base font-semibold mb-3 block">
          Industry *
        </Label>
        <Select value={profile.industry} onValueChange={(value) => setProfile({ ...profile, industry: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ecommerce">E-commerce</SelectItem>
            <SelectItem value="fintech">Financial Technology</SelectItem>
            <SelectItem value="real-estate">Real Estate</SelectItem>
            <SelectItem value="marketing">Marketing & Advertising</SelectItem>
            <SelectItem value="research">Research & Academia</SelectItem>
            <SelectItem value="consulting">Consulting</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="company" className="text-base font-semibold mb-3 block">
          Company Name *
        </Label>
        <Input
          id="company"
          value={profile.company || ''}
          onChange={(e) => setProfile({ ...profile, company: e.target.value })}
          placeholder="Enter your company name"
        />
      </div>

      <div>
        <Label htmlFor="teamSize" className="text-base font-semibold mb-3 block">
          Team Size
        </Label>
        <Select value={profile.teamSize} onValueChange={(value) => setProfile({ ...profile, teamSize: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select team size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solo">Just me</SelectItem>
            <SelectItem value="small">2-10 people</SelectItem>
            <SelectItem value="medium">11-50 people</SelectItem>
            <SelectItem value="large">51-200 people</SelectItem>
            <SelectItem value="enterprise">200+ people</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function UseCaseStep({ profile, setProfile }: { profile: Partial<UserProfile>; setProfile: (p: Partial<UserProfile>) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {useCases.map((useCase) => (
          <Card
            key={useCase.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              profile.useCase === useCase.id
                ? 'ring-2 ring-emerald-600 bg-emerald-50 dark:bg-emerald-950'
                : 'hover:shadow-md'
            }`}
            onClick={() => setProfile({ ...profile, useCase: useCase.id })}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${
                  profile.useCase === useCase.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {useCase.icon}
                </div>
                {useCase.popular && (
                  <Badge className="ml-2 bg-orange-100 text-orange-700">Popular</Badge>
                )}
              </div>
              <h3 className="font-semibold mb-2">{useCase.title}</h3>
              <p className="text-sm text-muted-foreground">{useCase.description}</p>
              {profile.useCase === useCase.id && (
                <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mt-3" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Label htmlFor="custom-use-case" className="text-base font-semibold mb-3 block">
          Additional Details (Optional)
        </Label>
        <Textarea
          id="custom-use-case"
          placeholder="Tell us more about your specific use case..."
          value={profile.useCase === 'other' ? profile.useCase : ''}
          onChange={(e) => setProfile({ ...profile, useCase: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}

function GoalsStep({ profile, setProfile }: { profile: Partial<UserProfile>; setProfile: (p: Partial<UserProfile>) => void }) {
  const toggleGoal = (goal: string) => {
    const currentGoals = profile.goals || [];
    const updatedGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    setProfile({ ...profile, goals: updatedGoals });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <div key={goal} className="flex items-center space-x-3">
            <Checkbox
              id={goal}
              checked={(profile.goals || []).includes(goal)}
              onCheckedChange={() => toggleGoal(goal)}
            />
            <Label htmlFor={goal} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {goal}
            </Label>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t">
        <Label htmlFor="experience" className="text-base font-semibold mb-3 block">
          Previous Experience with Web Scraping
        </Label>
        <Select value={profile.experience} onValueChange={(value) => setProfile({ ...profile, experience: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select your experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner - New to web scraping</SelectItem>
            <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
            <SelectItem value="advanced">Advanced - Extensive experience</SelectItem>
            <SelectItem value="expert">Expert - Professional web scraper</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SetupStep({ profile }: { profile: Partial<UserProfile> }) {
  const templates = [
    {
      id: 'ecommerce-price',
      title: 'E-commerce Price Monitor',
      description: 'Track product prices across multiple retailers',
      difficulty: 'Easy',
      time: '5 minutes',
      popular: true
    },
    {
      id: 'news-aggregator',
      title: 'News Aggregator',
      description: 'Collect articles from news websites',
      difficulty: 'Easy',
      time: '3 minutes',
      popular: true
    },
    {
      id: 'social-mentions',
      title: 'Social Media Mentions',
      description: 'Monitor brand mentions across platforms',
      difficulty: 'Medium',
      time: '8 minutes',
      popular: false
    },
    {
      id: 'job-listings',
      title: 'Job Listings Scraper',
      description: 'Collect job postings from career sites',
      difficulty: 'Easy',
      time: '4 minutes',
      popular: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold mb-2">Choose a Template to Get Started</h3>
        <p className="text-muted-foreground">
          Based on your use case ({profile.useCase?.replace('-', ' ')}), here are some recommended templates:
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{template.title}</CardTitle>
                {template.popular && (
                  <Badge className="bg-emerald-100 text-emerald-700">Recommended</Badge>
                )}
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {template.difficulty}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {template.time}
                  </div>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Use This Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button variant="ghost" className="text-emerald-600">
          <Code className="h-4 w-4 mr-2" />
          Start from Scratch Instead
        </Button>
      </div>
    </div>
  );
}
