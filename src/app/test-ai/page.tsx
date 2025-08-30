"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle,
  Code,
  Sparkles,
  Target,
  Database,
  Mail,
  Phone,
  Building,
  User,
  MapPin,
  Linkedin,
  ExternalLink
} from 'lucide-react';
import { aiSelectorGenerator } from '@/lib/ai/selector-generation';
import { toast } from 'sonner';

interface GeneratedSelector {
  key: string;
  cssSelector: string;
  xpathSelector?: string;
  confidence: number;
  description: string;
  alternatives: string[];
  warnings: string[];
}

export default function AITestPage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedSelector[]>([]);
  const [selectedExample, setSelectedExample] = useState('');

  const examplePrompts = [
    {
      title: 'Extract Contact Information',
      prompt: 'Find email addresses, phone numbers, and contact names from a business website',
      description: 'Perfect for lead generation and contact discovery'
    },
    {
      title: 'Company & Organization Data',
      prompt: 'Extract company names, business addresses, and organization details',
      description: 'Ideal for business directory scraping'
    },
    {
      title: 'Social Media Profiles',
      prompt: 'Find LinkedIn, Twitter, and other social media profile links',
      description: 'Great for social media research'
    },
    {
      title: 'Job Titles & Positions',
      prompt: 'Extract job titles, positions, and professional roles',
      description: 'Useful for HR and recruitment'
    },
    {
      title: 'Product Information',
      prompt: 'Find product titles, prices, descriptions, and images',
      description: 'E-commerce and product research'
    }
  ];

  const generateSelectors = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt describing what you want to extract');
      return;
    }

    setIsGenerating(true);
    setResults([]);

    try {
      const result = await aiSelectorGenerator.generateSelectors({
        prompt: prompt,
        outputFormat: 'both',
        complexity: 'advanced'
      });

      if (result.success && result.selectors) {
        setResults(result.selectors);
        toast.success(`Generated ${result.selectors.length} selectors using ${result.model}`);
      } else {
        toast.error(result.error || 'Failed to generate selectors');
      }
    } catch (error) {
      console.error('Selector generation error:', error);
      toast.error('An error occurred while generating selectors');
    } finally {
      setIsGenerating(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.7) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSelectorIcon = (key: string) => {
    if (key.includes('email')) return <Mail className="h-4 w-4" />;
    if (key.includes('phone')) return <Phone className="h-4 w-4" />;
    if (key.includes('company') || key.includes('business')) return <Building className="h-4 w-4" />;
    if (key.includes('name') || key.includes('contact')) return <User className="h-4 w-4" />;
    if (key.includes('address') || key.includes('location')) return <MapPin className="h-4 w-4" />;
    if (key.includes('social') || key.includes('linkedin')) return <Linkedin className="h-4 w-4" />;
    return <Target className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Selector Generation Test
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Test the AI-powered CSS selector generation with intelligent pattern recognition
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              ✓ Demo Mode Active
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              🤖 GPT-4 Powered
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              ⚡ Instant Generation
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Describe What You Want to Extract
                </CardTitle>
                <CardDescription>
                  Use natural language to describe the data you want to scrape from websites
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Extraction Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Find email addresses, phone numbers, and contact names from a business directory website"
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={generateSelectors}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Selectors...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate AI Selectors
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setPrompt('');
                      setResults([]);
                    }}
                    disabled={isGenerating}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Example Prompts */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-500" />
                  Quick Examples
                </CardTitle>
                <CardDescription>
                  Try these example prompts to see the AI in action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {examplePrompts.map((example, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer transition-all hover:shadow-md hover:scale-105 border-2 hover:border-primary/50"
                      onClick={() => setPrompt(example.prompt)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-medium text-sm mb-1">{example.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{example.description}</p>
                        <div className="text-xs text-blue-600 font-mono truncate">
                          {example.prompt}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {results.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Generated Selectors ({results.length})
                  </CardTitle>
                  <CardDescription>
                    AI-generated CSS and XPath selectors ready for web scraping
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.map((selector, index) => (
                      <Card key={index} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getSelectorIcon(selector.key)}
                              <h4 className="font-medium">{selector.key}</h4>
                              <Badge
                                variant="outline"
                                className={getConfidenceColor(selector.confidence)}
                              >
                                {Math.round(selector.confidence * 100)}% confidence
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">{selector.description}</p>

                          <Tabs defaultValue="css" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="css">CSS Selector</TabsTrigger>
                              <TabsTrigger value="xpath">XPath</TabsTrigger>
                            </TabsList>
                            <TabsContent value="css" className="space-y-2">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <code className="text-sm font-mono text-blue-600">
                                  {selector.cssSelector}
                                </code>
                              </div>
                            </TabsContent>
                            <TabsContent value="xpath" className="space-y-2">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <code className="text-sm font-mono text-purple-600">
                                  {selector.xpathSelector || 'XPath not generated'}
                                </code>
                              </div>
                            </TabsContent>
                          </Tabs>

                          {selector.alternatives.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium mb-2">Alternatives:</h5>
                              <div className="flex flex-wrap gap-1">
                                {selector.alternatives.map((alt, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {alt}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {selector.warnings.length > 0 && (
                            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                <div>
                                  <h5 className="text-sm font-medium text-amber-800">Warnings:</h5>
                                  <ul className="text-sm text-amber-700 mt-1">
                                    {selector.warnings.map((warning, i) => (
                                      <li key={i}>• {warning}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-500" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <h4 className="font-medium">Natural Language Processing</h4>
                      <p className="text-muted-foreground">AI understands your extraction requirements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <h4 className="font-medium">Pattern Recognition</h4>
                      <p className="text-muted-foreground">Identifies common web patterns and semantic elements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <h4 className="font-medium">Selector Generation</h4>
                      <p className="text-muted-foreground">Creates robust CSS and XPath selectors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <div>
                      <h4 className="font-medium">Confidence Scoring</h4>
                      <p className="text-muted-foreground">Evaluates selector reliability and provides alternatives</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-green-500" />
                  Integration Ready
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  These selectors can be used directly in your scrapers:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Copy to scraper builder</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Test with live websites</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Deploy in production</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
