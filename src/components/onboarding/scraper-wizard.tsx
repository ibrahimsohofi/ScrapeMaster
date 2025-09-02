'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronRight,
  ChevronLeft,
  Globe,
  Zap,
  Target,
  Download,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Play,
  Settings
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScraperWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (scraperData: ScraperConfig) => void;
}

interface ScraperConfig {
  name: string;
  url: string;
  description: string;
  engine: 'PLAYWRIGHT' | 'HTTRACK';
  selectors: Record<string, string>;
  schedule?: string;
  outputFormat: 'JSON' | 'CSV' | 'EXCEL';
}

const wizardSteps = [
  {
    id: 'basics',
    title: 'Scraper Basics',
    description: 'Give your scraper a name and target URL',
    icon: <Globe className="h-5 w-5" />
  },
  {
    id: 'selectors',
    title: 'Data Selection',
    description: 'Choose what data to extract',
    icon: <Target className="h-5 w-5" />
  },
  {
    id: 'settings',
    title: 'Configuration',
    description: 'Set up scheduling and output format',
    icon: <Settings className="h-5 w-5" />
  },
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Review your configuration and create the scraper',
    icon: <CheckCircle className="h-5 w-5" />
  }
];

const commonSelectors = [
  { name: 'Title', selector: 'h1, .title, [data-title]', description: 'Page or article title' },
  { name: 'Price', selector: '.price, [data-price], .cost', description: 'Product or service price' },
  { name: 'Description', selector: '.description, .summary, p', description: 'Content description' },
  { name: 'Image', selector: 'img[src], .image img', description: 'Main images' },
  { name: 'Link', selector: 'a[href]', description: 'Links to other pages' },
  { name: 'Date', selector: '.date, time, [datetime]', description: 'Publication or update date' }
];

export function ScraperWizard({ isOpen, onClose, onComplete }: ScraperWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<ScraperConfig>({
    name: '',
    url: '',
    description: '',
    engine: 'PLAYWRIGHT',
    selectors: {},
    outputFormat: 'JSON'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUrlValid, setIsUrlValid] = useState<boolean | null>(null);

  const progress = ((currentStep + 1) / wizardSteps.length) * 100;

  const validateUrl = async (url: string) => {
    try {
      new URL(url);
      // In a real app, you might want to ping the URL
      setIsUrlValid(true);
      return true;
    } catch {
      setIsUrlValid(false);
      return false;
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 0: // Basics
        if (!config.name.trim()) {
          newErrors.name = 'Scraper name is required';
        }
        if (!config.url.trim()) {
          newErrors.url = 'Target URL is required';
        } else if (!isUrlValid) {
          newErrors.url = 'Please enter a valid URL';
        }
        break;
      case 1: // Selectors
        if (Object.keys(config.selectors).length === 0) {
          newErrors.selectors = 'At least one selector is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < wizardSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  };

  const handleComplete = () => {
    onComplete(config);
    onClose();
  };

  const addSelector = (name: string, selector: string) => {
    setConfig(prev => ({
      ...prev,
      selectors: {
        ...prev.selectors,
        [name]: selector
      }
    }));
  };

  const removeSelector = (name: string) => {
    setConfig(prev => ({
      ...prev,
      selectors: Object.fromEntries(
        Object.entries(prev.selectors).filter(([key]) => key !== name)
      )
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basics
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Scraper Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Product Price Monitor"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="url">Target URL *</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={config.url}
                  onChange={(e) => {
                    const url = e.target.value;
                    setConfig(prev => ({ ...prev, url }));
                    if (url) validateUrl(url);
                  }}
                  className={errors.url ? 'border-red-500' : ''}
                />
                {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url}</p>}
                {isUrlValid === true && (
                  <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Valid URL
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what this scraper does..."
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                Choose a descriptive name that helps you identify this scraper later.
                Make sure the URL is accessible and doesn't require authentication.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 1: // Selectors
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Data Selectors</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Choose what data to extract from the target website. You can use our common selectors or add custom ones.
              </p>
            </div>

            {/* Common Selectors */}
            <div>
              <h4 className="font-medium mb-3">Common Data Types</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {commonSelectors.map((item) => (
                  <Card
                    key={item.name}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      config.selectors[item.name] ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      if (config.selectors[item.name]) {
                        removeSelector(item.name);
                      } else {
                        addSelector(item.name, item.selector);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                        {config.selectors[item.name] && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Custom Selector */}
            <div>
              <h4 className="font-medium mb-3">Custom Selector</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Field name (e.g., Brand)"
                  className="flex-1"
                  id="custom-name"
                />
                <Input
                  placeholder="CSS selector (e.g., .brand-name)"
                  className="flex-1"
                  id="custom-selector"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const nameInput = document.getElementById('custom-name') as HTMLInputElement;
                    const selectorInput = document.getElementById('custom-selector') as HTMLInputElement;

                    if (nameInput.value && selectorInput.value) {
                      addSelector(nameInput.value, selectorInput.value);
                      nameInput.value = '';
                      selectorInput.value = '';
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Selected Selectors */}
            {Object.keys(config.selectors).length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Selected Data Fields</h4>
                <div className="space-y-2">
                  {Object.entries(config.selectors).map(([name, selector]) => (
                    <div key={name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-sm text-muted-foreground font-mono">{selector}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSelector(name)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.selectors && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.selectors}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 2: // Settings
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Scraper Configuration</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Configure how your scraper runs and outputs data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="engine">Scraping Engine</Label>
                  <Select
                    value={config.engine}
                    onValueChange={(value: 'PLAYWRIGHT' | 'HTTRACK') =>
                      setConfig(prev => ({ ...prev, engine: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLAYWRIGHT">
                        <div>
                          <div className="font-medium">Playwright</div>
                          <div className="text-sm text-muted-foreground">Best for dynamic content</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="HTTRACK">
                        <div>
                          <div className="font-medium">HTTrack</div>
                          <div className="text-sm text-muted-foreground">Fast for static content</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="schedule">Schedule (Optional)</Label>
                  <Select onValueChange={(value) => setConfig(prev => ({ ...prev, schedule: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Run manually" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0 9 * * *">Daily at 9 AM</SelectItem>
                      <SelectItem value="0 9 * * 1">Weekly (Mondays at 9 AM)</SelectItem>
                      <SelectItem value="0 9 1 * *">Monthly (1st at 9 AM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="output">Output Format</Label>
                  <Select
                    value={config.outputFormat}
                    onValueChange={(value: 'JSON' | 'CSV' | 'EXCEL') =>
                      setConfig(prev => ({ ...prev, outputFormat: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JSON">JSON (Recommended)</SelectItem>
                      <SelectItem value="CSV">CSV</SelectItem>
                      <SelectItem value="EXCEL">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <strong>Tip:</strong> Playwright is recommended for modern websites with JavaScript,
                while HTTrack is faster for simple static content. You can always change these settings later.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 3: // Review
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Review Your Scraper</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Review the configuration and create your scraper.
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                  {config.description && (
                    <CardDescription>{config.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Target URL:</span>
                      <p className="text-muted-foreground break-all">{config.url}</p>
                    </div>
                    <div>
                      <span className="font-medium">Engine:</span>
                      <p className="text-muted-foreground">{config.engine}</p>
                    </div>
                    <div>
                      <span className="font-medium">Output Format:</span>
                      <p className="text-muted-foreground">{config.outputFormat}</p>
                    </div>
                    <div>
                      <span className="font-medium">Schedule:</span>
                      <p className="text-muted-foreground">{config.schedule || 'Manual only'}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Data Fields ({Object.keys(config.selectors).length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(config.selectors).map((name) => (
                        <Badge key={name} variant="secondary">{name}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your scraper is ready to be created! You can run it immediately or set it to run on the configured schedule.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold">Create Your First Scraper</DialogTitle>
          <p className="text-muted-foreground">
            Follow these steps to set up your web scraper in minutes
          </p>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {wizardSteps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="flex items-center gap-4 mt-4">
            {wizardSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className={`
                  flex items-center gap-2 px-3 py-1 rounded-full text-sm
                  ${index === currentStep ? 'bg-primary text-primary-foreground' :
                    index < currentStep ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}
                `}>
                  {step.icon}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
                {index < wizardSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {renderStepContent()}
        </div>

        <div className="border-t pt-4 px-6 pb-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleNext}>
                {currentStep === wizardSteps.length - 1 ? (
                  <>
                    <Zap className="h-4 w-4 mr-1" />
                    Create Scraper
                  </>
                ) : (
                  <>
                    Next Step
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
