'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  Square,
  Download,
  Settings,
  Calendar,
  Clock,
  Database,
  Code,
  Zap,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface LiveScraperDemoProps {
  title?: string;
}

export function LiveScraperDemo({ title = "Live Scraper Simulation" }: LiveScraperDemoProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [results, setResults] = useState<any[]>([]);
  const [config, setConfig] = useState({
    url: 'https://quotes.toscrape.com/',
    engine: 'playwright',
    selectors: {
      quote: '.text',
      author: '.author',
      tags: '.tag'
    }
  });

  const simulateRun = () => {
    setIsRunning(true);
    setStatus('running');
    setProgress(0);
    setResults([]);

    // Simulate scraping progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setStatus('completed');

          // Simulate results
          setResults([
            {
              quote: "The world as we have created it is a process of our thinking.",
              author: "Albert Einstein",
              tags: ["change", "deep-thoughts", "thinking", "world"]
            },
            {
              quote: "It is our choices that show what we truly are.",
              author: "J.K. Rowling",
              tags: ["abilities", "choices"]
            },
            {
              quote: "There are only two ways to live your life.",
              author: "Albert Einstein",
              tags: ["inspirational", "life", "live", "miracle", "miracles"]
            }
          ]);

          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 300);
  };

  const stopScraper = () => {
    setIsRunning(false);
    setStatus('idle');
    setProgress(0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>
          Try our scraping engine with real-time feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="url">Target URL</Label>
                <Input
                  id="url"
                  value={config.url}
                  onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="engine">Scraping Engine</Label>
                <Select
                  value={config.engine}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, engine: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="playwright">Playwright (JavaScript)</SelectItem>
                    <SelectItem value="httrack">HTTrack (Full Site)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="selectors">CSS Selectors (JSON)</Label>
              <Textarea
                id="selectors"
                value={JSON.stringify(config.selectors, null, 2)}
                onChange={(e) => {
                  try {
                    const selectors = JSON.parse(e.target.value);
                    setConfig(prev => ({ ...prev, selectors }));
                  } catch {}
                }}
                className="font-mono text-sm"
                rows={5}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={simulateRun}
                disabled={isRunning}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                {isRunning ? 'Running...' : 'Start Scraper'}
              </Button>
              {isRunning && (
                <Button variant="outline" onClick={stopScraper} className="gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Scraping Progress</span>
                <Badge variant={status === 'completed' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>

              <Progress value={progress} className="h-3" />

              <div className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </div>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span>Loading page: {config.url}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Code className="h-4 w-4 text-green-500" />
                    <span>Executing selectors...</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-purple-500" />
                    <span>Extracting data...</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {results.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Scraped Data ({results.length} items)</span>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>

                <div className="space-y-3">
                  {results.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Quote:</span>
                            <p className="text-sm mt-1">{item.quote}</p>
                          </div>
                          <div>
                            <span className="font-medium">Author:</span>
                            <p className="text-sm mt-1">{item.author}</p>
                          </div>
                          <div>
                            <span className="font-medium">Tags:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.tags.map((tag: string, tagIndex: number) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2" />
                <p>Run the scraper to see results here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface CronBuilderDemoProps {
  title?: string;
}

export function CronBuilderDemo({ title = "Interactive Cron Schedule Builder" }: CronBuilderDemoProps) {
  const [cronExpression, setCronExpression] = useState('0 9 * * 1-5');
  const [description, setDescription] = useState('');
  const [nextRuns, setNextRuns] = useState<string[]>([]);

  const cronPresets = [
    { name: 'Every 15 minutes', cron: '*/15 * * * *', desc: 'Runs every 15 minutes' },
    { name: 'Every hour', cron: '0 * * * *', desc: 'Runs at the top of every hour' },
    { name: 'Daily at 9 AM', cron: '0 9 * * *', desc: 'Runs once daily at 9:00 AM' },
    { name: 'Weekdays at 9 AM', cron: '0 9 * * 1-5', desc: 'Runs Monday through Friday at 9:00 AM' },
    { name: 'Weekly on Monday', cron: '0 9 * * 1', desc: 'Runs every Monday at 9:00 AM' },
    { name: 'Monthly on 1st', cron: '0 9 1 * *', desc: 'Runs on the 1st of every month at 9:00 AM' },
  ];

  useEffect(() => {
    // Simulate cron parsing and next run calculation
    const getDescription = (cron: string) => {
      const preset = cronPresets.find(p => p.cron === cron);
      return preset?.desc || 'Custom schedule';
    };

    const getNextRuns = (cron: string) => {
      // Mock next run times - in real app, use a cron parser library
      const now = new Date();
      const runs = [];
      for (let i = 0; i < 5; i++) {
        const nextRun = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
        runs.push(nextRun.toLocaleString());
      }
      return runs;
    };

    setDescription(getDescription(cronExpression));
    setNextRuns(getNextRuns(cronExpression));
  }, [cronExpression]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>
          Build and test cron expressions for scheduling your scrapers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cron Builder */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cron">Cron Expression</Label>
              <Input
                id="cron"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 9 * * 1-5"
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-1 gap-2">
                {cronPresets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setCronExpression(preset.cron)}
                    className="justify-start text-left h-auto p-3"
                  >
                    <div>
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {preset.cron}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Schedule Preview</Label>
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Expression:</span>
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                        {cronExpression}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="text-sm mt-1">{description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label>Next 5 Runs</Label>
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {nextRuns.map((run, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span>{run}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Cron Format Reference
          </h4>
          <div className="text-sm space-y-1">
            <div className="font-mono">* * * * *</div>
            <div className="text-muted-foreground">│ │ │ │ │</div>
            <div className="text-muted-foreground">│ │ │ │ └─ Day of Week (0-7, Sunday=0 or 7)</div>
            <div className="text-muted-foreground">│ │ │ └─── Month (1-12)</div>
            <div className="text-muted-foreground">│ │ └───── Day of Month (1-31)</div>
            <div className="text-muted-foreground">│ └─────── Hour (0-23)</div>
            <div className="text-muted-foreground">└───────── Minute (0-59)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface APITestPlaygroundProps {
  title?: string;
}

export function APITestPlayground({ title = "API Testing Playground" }: APITestPlaygroundProps) {
  const [endpoint, setEndpoint] = useState('/v1/jobs');
  const [method, setMethod] = useState('GET');
  const [apiKey, setApiKey] = useState('sk_test_...');
  const [requestBody, setRequestBody] = useState('{}');
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const endpoints = [
    { method: 'GET', path: '/v1/jobs', desc: 'List all jobs' },
    { method: 'POST', path: '/v1/jobs', desc: 'Create new job' },
    { method: 'GET', path: '/v1/jobs/{id}/results', desc: 'Get job results' },
    { method: 'POST', path: '/v1/jobs/{id}/run', desc: 'Trigger job execution' },
  ];

  const simulateAPICall = async () => {
    setIsLoading(true);

    // Simulate API response
    setTimeout(() => {
      const mockResponse = {
        status: 200,
        data: method === 'GET' ? {
          jobs: [
            { id: 'job_123', name: 'Product Monitor', status: 'completed', created_at: '2024-01-15T10:30:00Z' },
            { id: 'job_456', name: 'Price Tracker', status: 'running', created_at: '2024-01-15T11:00:00Z' }
          ],
          total: 2
        } : {
          id: 'job_789',
          name: 'New Scraper Job',
          status: 'created',
          created_at: new Date().toISOString()
        },
        headers: {
          'content-type': 'application/json',
          'x-ratelimit-remaining': '999'
        }
      };

      setResponse(mockResponse);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>
          Test ScrapeCloud API endpoints with real-time responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Builder */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Endpoint</Label>
              <div className="flex gap-2">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/v1/jobs"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk_live_..."
                type="password"
                className="font-mono"
              />
            </div>

            {(method === 'POST' || method === 'PUT') && (
              <div className="space-y-2">
                <Label>Request Body (JSON)</Label>
                <Textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder='{"name": "My Scraper", "url": "https://example.com"}'
                  className="font-mono text-sm"
                  rows={5}
                />
              </div>
            )}

            <Button
              onClick={simulateAPICall}
              disabled={isLoading}
              className="w-full gap-2"
            >
              <Zap className="h-4 w-4" />
              {isLoading ? 'Sending Request...' : 'Send Request'}
            </Button>

            <div className="space-y-2">
              <Label>Quick Examples</Label>
              <div className="space-y-1">
                {endpoints.map((ep, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMethod(ep.method);
                      setEndpoint(ep.path);
                    }}
                    className="w-full justify-start text-left h-auto p-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {ep.method}
                        </Badge>
                        <code className="text-xs">{ep.path}</code>
                      </div>
                      <div className="text-xs text-muted-foreground">{ep.desc}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Response */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Response</Label>
              {response ? (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={response.status === 200 ? 'default' : 'destructive'}>
                          {response.status}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4" />
                          <span>Success</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Response Body:</Label>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded mt-1 overflow-auto">
                          {JSON.stringify(response.data, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <Label className="text-xs">Headers:</Label>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded mt-1">
                          {JSON.stringify(response.headers, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Code className="h-8 w-8 mx-auto mb-2" />
                  <p>Send a request to see the response</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
