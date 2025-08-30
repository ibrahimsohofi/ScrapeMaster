import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap, Globe, Code, AlertTriangle, CheckCircle, Timer } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Handling Dynamic Content & JavaScript - ScrapeCloud Tutorials',
  description: 'Extract data from modern SPAs and JavaScript-heavy websites with advanced techniques.',
};

export default function DynamicContentTutorial() {
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
            <Badge variant="secondary">Dynamic Content</Badge>
            <span className="text-sm text-muted-foreground">25 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-4">Handling Dynamic Content & JavaScript</h1>
          <p className="text-xl text-muted-foreground">
            Extract data from modern SPAs and JavaScript-heavy websites with advanced techniques.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">

          {/* Understanding Dynamic Content */}
          <Card className="mb-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Globe className="h-5 w-5" />
                What is Dynamic Content?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 dark:text-blue-200">
              <p className="mb-3">
                Dynamic content is data that's loaded or modified by JavaScript after the initial page load.
                This includes content from AJAX calls, infinite scroll, lazy loading, and Single Page Applications (SPAs).
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <strong>Examples:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Product prices updated via AJAX</li>
                    <li>Infinite scroll content</li>
                    <li>React/Vue/Angular apps</li>
                    <li>Modal dialogs</li>
                  </ul>
                </div>
                <div>
                  <strong>Signs of Dynamic Content:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Loading spinners</li>
                    <li>Empty page source</li>
                    <li>URL doesn't change on navigation</li>
                    <li>Content appears after delay</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detection Methods */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
              Detecting Dynamic Content
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5 text-purple-500" />
                    Browser DevTools Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal pl-4 space-y-2 text-sm">
                    <li>Right-click → "View Page Source"</li>
                    <li>Search for your target content</li>
                    <li>If not found → likely dynamic</li>
                    <li>Compare with "Inspect Element"</li>
                  </ol>
                  <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded mt-3">
                    <p className="text-xs">
                      <strong>Quick Test:</strong> If content appears in Inspector but not in page source, it's dynamic.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Timer className="h-5 w-5 text-green-500" />
                    Network Tab Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal pl-4 space-y-2 text-sm">
                    <li>Open DevTools → Network tab</li>
                    <li>Reload the page</li>
                    <li>Look for XHR/Fetch requests</li>
                    <li>Check responses for your data</li>
                  </ol>
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded mt-3">
                    <p className="text-xs">
                      <strong>Pro Tip:</strong> Filter by "XHR" to see AJAX calls that load dynamic content.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ScrapeCloud Solutions */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
              ScrapeCloud's Dynamic Content Solutions
            </h2>

            <div className="space-y-6">
              {/* JavaScript Engine */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    JavaScript Engine (Playwright)
                  </CardTitle>
                  <CardDescription>Full browser automation for complex SPAs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <strong>Best for:</strong>
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
                        <li>React, Vue, Angular applications</li>
                        <li>Sites with complex user interactions</li>
                        <li>Content requiring clicks or form submissions</li>
                        <li>Sites with anti-bot measures</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded">
                      <h4 className="font-semibold mb-2">Key Features:</h4>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div>• Full JavaScript execution</div>
                        <div>• Real browser rendering</div>
                        <div>• User interaction simulation</div>
                        <div>• Screenshot capabilities</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wait Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Timer className="h-5 w-5 text-orange-500" />
                    Smart Wait Conditions
                  </CardTitle>
                  <CardDescription>Wait for content to load before scraping</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Wait Types:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• <strong>Element Visible:</strong> Wait for specific element</li>
                          <li>• <strong>Network Idle:</strong> Wait for API calls to complete</li>
                          <li>• <strong>Text Content:</strong> Wait for specific text</li>
                          <li>• <strong>Custom Timeout:</strong> Fixed delay</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Example Conditions:</h4>
                        <div className="space-y-2">
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono">
                            waitFor: ".product-grid"
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono">
                            waitFor: "networkidle"
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono">
                            waitFor: 3000 // 3 seconds
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Common Scenarios */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
              Common Dynamic Content Scenarios
            </h2>

            <div className="space-y-8">
              {/* Infinite Scroll */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📱 Infinite Scroll Pages</CardTitle>
                  <CardDescription>Social media feeds, product listings, search results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Challenge:</h4>
                        <p className="text-sm">Content loads as user scrolls, traditional scrapers only see initial content.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Solution:</h4>
                        <p className="text-sm">Use scroll simulation + wait conditions to load all content.</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                      <h4 className="font-semibold mb-2">Setup Instructions:</h4>
                      <ol className="list-decimal pl-4 space-y-1 text-sm">
                        <li>Enable JavaScript engine</li>
                        <li>Add custom script for scrolling</li>
                        <li>Set wait condition for content loading</li>
                        <li>Configure selectors for new items</li>
                      </ol>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded">
                      <h4 className="font-semibold mb-2">Custom Script Example:</h4>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto"><code>{`// Scroll to load more content
let previousHeight = 0;
let currentHeight = document.body.scrollHeight;

while (previousHeight < currentHeight) {
  window.scrollTo(0, currentHeight);
  await new Promise(r => setTimeout(r, 2000));
  previousHeight = currentHeight;
  currentHeight = document.body.scrollHeight;
}`}</code></pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AJAX-Loaded Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">⚡ AJAX-Loaded Content</CardTitle>
                  <CardDescription>Product prices, stock levels, user comments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Challenge:</h4>
                        <p className="text-sm">Critical data loads after page via API calls, often with loading states.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Solution:</h4>
                        <p className="text-sm">Wait for specific elements or network activity before scraping.</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                      <h4 className="font-semibold mb-2">Wait Strategies:</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Element Appears:</strong>
                          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded ml-2">.price-loaded</code>
                        </div>
                        <div>
                          <strong>Loading Disappears:</strong>
                          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded ml-2">.loading-spinner:not([style*="display: none"])</code>
                        </div>
                        <div>
                          <strong>Network Idle:</strong>
                          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded ml-2">networkidle0</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modal Dialogs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🔲 Modal Dialogs & Popups</CardTitle>
                  <CardDescription>Product details, contact forms, cookie notices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Challenge:</h4>
                        <p className="text-sm">Content hidden behind user interactions like clicks or hovers.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Solution:</h4>
                        <p className="text-sm">Simulate user interactions to reveal hidden content.</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                      <h4 className="font-semibold mb-2">Interaction Scripts:</h4>
                      <div className="space-y-3">
                        <div>
                          <strong>Click to Open Modal:</strong>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1"><code>{`await page.click('.open-modal-btn');
await page.waitForSelector('.modal-content');`}</code></pre>
                        </div>
                        <div>
                          <strong>Handle Cookie Notice:</strong>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1"><code>{`await page.click('.accept-cookies');
await page.waitForTimeout(1000);`}</code></pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SPA Navigation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🔄 Single Page Applications</CardTitle>
                  <CardDescription>React, Vue, Angular apps with client-side routing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Challenge:</h4>
                        <p className="text-sm">URL doesn't change, content updates dynamically, complex state management.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Solution:</h4>
                        <p className="text-sm">Navigate within the app, wait for state changes and re-renders.</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                      <h4 className="font-semibold mb-2">SPA Scraping Strategy:</h4>
                      <ol className="list-decimal pl-4 space-y-1 text-sm">
                        <li>Load initial SPA page</li>
                        <li>Wait for app to initialize</li>
                        <li>Navigate to target section</li>
                        <li>Wait for data to load</li>
                        <li>Extract content</li>
                        <li>Repeat for other sections</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
              Troubleshooting Dynamic Content
            </h2>

            <div className="space-y-6">
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <AlertTriangle className="h-5 w-5" />
                    Common Issues & Solutions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-orange-800 dark:text-orange-200">❌ No Data Extracted</h4>
                      <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
                        <li>• Content hasn't loaded yet</li>
                        <li>• Wrong selector (dynamic IDs)</li>
                        <li>• Content in iframe</li>
                        <li>• Anti-bot protection</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-orange-800 dark:text-orange-200">✅ Solutions</h4>
                      <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
                        <li>• Increase wait time</li>
                        <li>• Use stable selectors</li>
                        <li>• Enable iframe handling</li>
                        <li>• Use stealth mode</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🔍 Debugging Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>1. Enable screenshots in scraper settings</p>
                    <p>2. Check execution logs for errors</p>
                    <p>3. Test with longer wait times</p>
                    <p>4. Verify selectors in browser</p>
                    <p>5. Check for iframe content</p>
                    <p>6. Monitor network requests</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">⚙️ Performance Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• Use minimum necessary wait times</p>
                    <p>• Disable images if not needed</p>
                    <p>• Block unnecessary resources</p>
                    <p>• Use headless mode</p>
                    <p>• Optimize custom scripts</p>
                    <p>• Monitor execution time</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Dynamic Content Best Practices</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">✅ Do</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Use specific wait conditions</p>
                  <p>• Test with different load times</p>
                  <p>• Handle loading states</p>
                  <p>• Use stable selectors</p>
                  <p>• Enable error handling</p>
                  <p>• Monitor performance</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">❌ Don't</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Use fixed long delays</p>
                  <p>• Ignore loading indicators</p>
                  <p>• Rely on element position</p>
                  <p>• Skip error handling</p>
                  <p>• Assume instant loading</p>
                  <p>• Ignore mobile views</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-blue-600">💡 Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Start simple, add complexity</p>
                  <p>• Use browser DevTools</p>
                  <p>• Leverage ScrapeCloud's AI</p>
                  <p>• Document wait conditions</p>
                  <p>• Test across devices</p>
                  <p>• Monitor success rates</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Ready for Advanced Scraping?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Now you can handle complex, dynamic websites! What's next?</p>
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
                <Link href="/dashboard/scrapers/new">
                  <Button className="w-full justify-start">
                    Create Dynamic Scraper →
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
