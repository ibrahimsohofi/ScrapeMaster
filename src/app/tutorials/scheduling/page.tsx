import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Calendar, Zap, AlertCircle, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Setting Up Automated Schedules - ScrapeCloud Tutorials',
  description: 'Learn how to schedule your scrapers and automate data collection for hands-free operation.',
};

export default function SchedulingTutorial() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/tutorials">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tutorials
            </Button>
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">Intermediate</Badge>
            <Badge variant="secondary">Automation</Badge>
            <span className="text-sm text-muted-foreground">20 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-4">Setting Up Automated Schedules</h1>
          <p className="text-xl text-muted-foreground">
            Learn how to schedule your scrapers and automate data collection for hands-free operation.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">

          {/* Why Schedule? */}
          <Card className="mb-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Zap className="h-5 w-5" />
                Why Automate Your Scrapers?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 dark:text-blue-200">
              <ul className="space-y-2">
                <li>• <strong>Consistent Data:</strong> Never miss important updates</li>
                <li>• <strong>Save Time:</strong> Set it once, run it forever</li>
                <li>• <strong>Real-time Monitoring:</strong> Track changes as they happen</li>
                <li>• <strong>Competitive Advantage:</strong> Stay ahead with fresh data</li>
              </ul>
            </CardContent>
          </Card>

          {/* Schedule Types */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
              Types of Schedules
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-500" />
                    Interval-Based
                  </CardTitle>
                  <CardDescription>Run every X minutes/hours/days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Best for:</strong>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li>Price monitoring</li>
                        <li>Stock level checks</li>
                        <li>Social media updates</li>
                      </ul>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono">
                      Every 30 minutes<br/>
                      Every 2 hours<br/>
                      Every 1 day
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Cron-Based
                  </CardTitle>
                  <CardDescription>Complex scheduling patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Best for:</strong>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li>Business hours only</li>
                        <li>Weekly reports</li>
                        <li>End-of-month data</li>
                      </ul>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono">
                      0 9 * * 1-5<br/>
                      <span className="text-xs">(Weekdays at 9 AM)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    Manual/On-Demand
                  </CardTitle>
                  <CardDescription>Run when needed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Best for:</strong>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li>Testing new scrapers</li>
                        <li>One-time data exports</li>
                        <li>Emergency updates</li>
                      </ul>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono">
                      API trigger<br/>
                      Dashboard button<br/>
                      Webhook event
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Setting Up Schedules */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
              Setting Up Your First Schedule
            </h2>

            <div className="space-y-8">
              {/* Step 1 */}
              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">Step 2.1: Access Scheduler</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Go to your scraper's detail page</li>
                  <li>Click the "Schedule" tab</li>
                  <li>Choose "Create New Schedule"</li>
                </ol>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mt-3">
                  <p className="text-sm">
                    <strong>💡 Pro Tip:</strong> Start with manual runs to ensure your scraper works perfectly before automating.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">Step 2.2: Choose Schedule Type</h3>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Simple Interval Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <label className="font-medium">Frequency:</label>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-center text-sm">Every 15 min</div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-center text-sm">Every 1 hour</div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-center text-sm">Every 6 hours</div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Perfect for price monitoring, stock levels, or social media updates.
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Advanced Cron Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <label className="font-medium">Cron Expression:</label>
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm mt-1">
                            0 9,17 * * 1-5
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Runs at 9 AM and 5 PM, Monday through Friday
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">Step 2.3: Configure Advanced Options</h3>
                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Timezone</span>
                          <Badge variant="outline">UTC-5 (EST)</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Max Runtime</span>
                          <Badge variant="outline">30 minutes</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Retry on Failure</span>
                          <Badge variant="outline">3 attempts</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Notifications</span>
                          <Badge variant="outline">Email + Webhook</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Cron Expression Guide */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
              Cron Expression Guide
            </h2>

            <div className="bg-muted/50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3">Cron Format</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded font-mono text-center mb-4">
                * * * * *<br/>
                <span className="text-xs">
                  │ │ │ │ │<br/>
                  │ │ │ │ └─ Day of Week (0-7, Sunday=0 or 7)<br/>
                  │ │ │ └─── Month (1-12)<br/>
                  │ │ └───── Day of Month (1-31)<br/>
                  │ └─────── Hour (0-23)<br/>
                  └───────── Minute (0-59)
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Common Patterns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">0 */6 * * *</code>
                    <div className="text-sm mt-1">Every 6 hours</div>
                  </div>
                  <div>
                    <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">0 9 * * 1-5</code>
                    <div className="text-sm mt-1">9 AM, weekdays only</div>
                  </div>
                  <div>
                    <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">0 0 1 * *</code>
                    <div className="text-sm mt-1">First day of month</div>
                  </div>
                  <div>
                    <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">30 14 * * 0</code>
                    <div className="text-sm mt-1">Sunday at 2:30 PM</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Use Cases</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <strong>Daily Reports:</strong>
                    <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded ml-2">0 8 * * *</code>
                  </div>
                  <div>
                    <strong>Business Hours:</strong>
                    <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded ml-2">0 9-17 * * 1-5</code>
                  </div>
                  <div>
                    <strong>Weekly Summary:</strong>
                    <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded ml-2">0 10 * * 1</code>
                  </div>
                  <div>
                    <strong>End of Month:</strong>
                    <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded ml-2">0 23 28-31 * *</code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Real-World Scenarios */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
              Real-World Scheduling Scenarios
            </h2>

            <div className="space-y-6">
              {/* E-commerce Price Monitoring */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🛒 E-commerce Price Monitoring
                  </CardTitle>
                  <CardDescription>Track competitor pricing and inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Recommended Schedule:</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                          <div className="font-mono text-sm">Every 2 hours</div>
                          <div className="text-xs text-muted-foreground mt-1">During business hours</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Why This Works:</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Catches price changes quickly</li>
                          <li>• Not too aggressive for servers</li>
                          <li>• Aligns with business decisions</li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                      <strong className="text-sm">Pro Setup:</strong>
                      <div className="text-sm mt-1">Combine with webhooks to trigger alerts when prices drop below your target.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* News Monitoring */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📰 News & Content Monitoring
                  </CardTitle>
                  <CardDescription>Stay updated with industry news and mentions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Recommended Schedule:</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                          <div className="font-mono text-sm">Every 15 minutes</div>
                          <div className="text-xs text-muted-foreground mt-1">For breaking news</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Alternative:</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                          <div className="font-mono text-sm">Every 1 hour</div>
                          <div className="text-xs text-muted-foreground mt-1">For regular updates</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📱 Social Media Monitoring
                  </CardTitle>
                  <CardDescription>Track mentions, engagement, and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">High-Priority Accounts:</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                          <div className="font-mono text-sm">Every 10 minutes</div>
                          <div className="text-xs text-muted-foreground mt-1">Competitors, influencers</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">General Monitoring:</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                          <div className="font-mono text-sm">Every 30 minutes</div>
                          <div className="text-xs text-muted-foreground mt-1">Industry hashtags</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Real Estate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🏠 Real Estate Listings
                  </CardTitle>
                  <CardDescription>Monitor new properties and price changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">New Listings:</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                          <div className="font-mono text-sm">Every 30 minutes</div>
                          <div className="text-xs text-muted-foreground mt-1">Peak hours: 8 AM - 8 PM</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Price Updates:</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                          <div className="font-mono text-sm">Daily at 9 AM</div>
                          <div className="text-xs text-muted-foreground mt-1">Less frequent, but consistent</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Monitoring and Alerts */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">5</span>
              Monitoring and Alerts
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Failure Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <strong>Email Alerts:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>Scraper failed to run</li>
                      <li>No data extracted</li>
                      <li>Unusual data patterns</li>
                    </ul>
                  </div>
                  <div className="text-sm">
                    <strong>Webhook Integration:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>Slack notifications</li>
                      <li>SMS alerts</li>
                      <li>Custom integrations</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Success Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <strong>Dashboard Metrics:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>Success rate over time</li>
                      <li>Average execution time</li>
                      <li>Data points collected</li>
                    </ul>
                  </div>
                  <div className="text-sm">
                    <strong>Data Quality Checks:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>Expected vs actual results</li>
                      <li>Data format validation</li>
                      <li>Completeness scoring</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Best Practices */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Scheduling Best Practices</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">✅ Do This</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Test manually before scheduling</p>
                  <p>• Start with longer intervals</p>
                  <p>• Set up failure notifications</p>
                  <p>• Monitor your usage quotas</p>
                  <p>• Use appropriate timezones</p>
                  <p>• Document your schedules</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">❌ Avoid This</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Over-aggressive scheduling</p>
                  <p>• Ignoring robots.txt</p>
                  <p>• No error handling</p>
                  <p>• Forgetting timezone settings</p>
                  <p>• Multiple overlapping jobs</p>
                  <p>• No monitoring setup</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>🚀 Start Automating</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Ready to set up your automated scrapers?</p>
              <div className="space-y-2">
                <Link href="/tutorials/api-integration">
                  <Button variant="outline" className="w-full justify-start">
                    API Integration & Webhooks →
                  </Button>
                </Link>
                <Link href="/tutorials/large-scale">
                  <Button variant="outline" className="w-full justify-start">
                    Handling Large Scale Scraping →
                  </Button>
                </Link>
                <Link href="/dashboard/scrapers">
                  <Button className="w-full justify-start">
                    Schedule Your Scrapers →
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
