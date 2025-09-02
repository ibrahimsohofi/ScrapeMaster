import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, Code, Lightbulb, AlertTriangle } from 'lucide-react';

// Import new interactive components
import SelectorTester from '@/components/tutorials/selector-tester';
import { ChapterTracker, TutorialNavigation } from '@/components/tutorials/progress-indicator';
import { QuickFeedback, FeedbackStats } from '@/components/tutorials/feedback-system';
import { VideoSection, sampleVideos } from '@/components/tutorials/video-placeholder';

export const metadata: Metadata = {
  title: 'Advanced CSS Selector Techniques - ScrapeCloud Tutorials',
  description: 'Master complex data extraction with advanced CSS selectors and XPath techniques.',
};

export default function CSSSelectorssTutorial() {
  const tutorialId = 'css-selectors';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <Link href="/tutorials">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tutorials
                </Button>
              </Link>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant="destructive">Advanced</Badge>
                <Badge variant="secondary">Data Extraction</Badge>
                <span className="text-sm text-muted-foreground">30 min read</span>
              </div>

              <h1 className="text-4xl font-bold mb-4">Advanced CSS Selector Techniques</h1>
              <p className="text-xl text-muted-foreground">
                Master complex data extraction with advanced CSS selectors and XPath techniques.
              </p>
            </div>

            {/* Interactive Video Section */}
            <div className="mb-12">
              <VideoSection
                title="Video Tutorials"
                videos={sampleVideos['css-selectors'] || []}
              />
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none space-y-12">

              {/* Prerequisites */}
              <Card className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <AlertTriangle className="h-5 w-5" />
                    Prerequisites
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-orange-800 dark:text-orange-200">
                  <p>This tutorial assumes you've completed the "Getting Started" tutorial and understand basic CSS selectors.</p>
                </CardContent>
              </Card>

              {/* Chapter 1: Advanced Selector Patterns */}
              <ChapterTracker
                tutorialId={tutorialId}
                chapterId="advanced-patterns"
                title="Advanced Selector Patterns"
              >
                <section className="space-y-6">
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Attribute Selectors</h3>
                    <div className="space-y-4">
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">[data-id]</code>
                        <span className="ml-2">Elements with any data-id attribute</span>
                      </div>
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">[data-id="123"]</code>
                        <span className="ml-2">Elements where data-id equals "123"</span>
                      </div>
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">[class*="product"]</code>
                        <span className="ml-2">Elements where class contains "product"</span>
                      </div>
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">[href^="https"]</code>
                        <span className="ml-2">Links starting with "https"</span>
                      </div>
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">[src$=".jpg"]</code>
                        <span className="ml-2">Images ending with ".jpg"</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Pseudo-Selectors</h3>
                    <div className="space-y-4">
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">li:first-child</code>
                        <span className="ml-2">First list item</span>
                      </div>
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">tr:nth-child(2n)</code>
                        <span className="ml-2">Even table rows</span>
                      </div>
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">p:not(.excluded)</code>
                        <span className="ml-2">Paragraphs without "excluded" class</span>
                      </div>
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">input:checked</code>
                        <span className="ml-2">Checked checkboxes/radio buttons</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Selector Tester */}
                  <div className="my-8">
                    <SelectorTester />
                  </div>

                  <QuickFeedback tutorialId={tutorialId} chapterId="advanced-patterns" />
                </section>
              </ChapterTracker>

              {/* Chapter 2: Combinator Selectors */}
              <ChapterTracker
                tutorialId={tutorialId}
                chapterId="combinators"
                title="Combinator Selectors"
              >
                <section className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-500" />
                          Descendant Selectors
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">div p</code>
                          <p className="text-sm mt-1">All paragraphs inside divs</p>
                        </div>
                        <div>
                          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">.container .price</code>
                          <p className="text-sm mt-1">Price elements inside containers</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5 text-green-500" />
                          Child Selectors
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">ul {">"} li</code>
                          <p className="text-sm mt-1">Direct list item children</p>
                        </div>
                        <div>
                          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">.menu {">"} a</code>
                          <p className="text-sm mt-1">Direct link children of menu</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5 text-purple-500" />
                          Adjacent Sibling
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">h2 + p</code>
                          <p className="text-sm mt-1">Paragraph immediately after h2</p>
                        </div>
                        <div>
                          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">.label + .value</code>
                          <p className="text-sm mt-1">Value immediately after label</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5 text-orange-500" />
                          General Sibling
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">h2 ~ p</code>
                          <p className="text-sm mt-1">All paragraphs after h2</p>
                        </div>
                        <div>
                          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">.title ~ .content</code>
                          <p className="text-sm mt-1">All content after title</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <QuickFeedback tutorialId={tutorialId} chapterId="combinators" />
                </section>
              </ChapterTracker>

              {/* Chapter 3: Real-World Examples */}
              <ChapterTracker
                tutorialId={tutorialId}
                chapterId="real-world"
                title="Real-World Examples"
              >
                <section className="space-y-8">
                  {/* E-commerce */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🛒 E-commerce Product Data</CardTitle>
                      <CardDescription>Extracting product information from online stores</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Product Title</h4>
                          <code className="text-sm">h1.product-title, .product-name h1, [data-testid="product-title"]</code>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Price (Current)</h4>
                          <code className="text-sm">.price-current, .sale-price, [class*="price"]:not([class*="original"])</code>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Original Price</h4>
                          <code className="text-sm">.price-original, .was-price, [class*="original-price"]</code>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Availability</h4>
                          <code className="text-sm">.stock-status, .availability, [data-stock], .in-stock, .out-of-stock</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Media */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">📱 Social Media Posts</CardTitle>
                      <CardDescription>Extracting post content and engagement metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Post Content</h4>
                          <code className="text-sm">[data-testid="tweetText"], .post-content, .entry-content</code>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Author Name</h4>
                          <code className="text-sm">.username, .author-name, [data-testid="User-Name"]</code>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Engagement Metrics</h4>
                          <code className="text-sm">[data-testid*="like"], [data-testid*="reply"], .engagement-count</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <QuickFeedback tutorialId={tutorialId} chapterId="real-world" />
                </section>
              </ChapterTracker>

              {/* Chapter 4: XPath Introduction */}
              <ChapterTracker
                tutorialId={tutorialId}
                chapterId="xpath"
                title="Introduction to XPath"
              >
                <section className="space-y-6">
                  <div className="bg-muted/50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">When to Use XPath vs CSS</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Use CSS When:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Selecting by class, ID, or tag</li>
                          <li>• Simple attribute matching</li>
                          <li>• Most web scraping scenarios</li>
                          <li>• Better performance</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-600 mb-2">Use XPath When:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Selecting by text content</li>
                          <li>• Complex traversal patterns</li>
                          <li>• Parent element selection</li>
                          <li>• Advanced text matching</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Common XPath Patterns</h3>
                    <div className="space-y-4">
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">//div[@class="product"]</code>
                        <span className="ml-2">Div with class "product" anywhere</span>
                      </div>
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">//span[contains(text(), "Price")]</code>
                        <span className="ml-2">Span containing "Price" text</span>
                      </div>
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">//a[starts-with(@href, "https")]</code>
                        <span className="ml-2">Links starting with "https"</span>
                      </div>
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">//td[2]</code>
                        <span className="ml-2">Second table cell</span>
                      </div>
                      <div>
                        <code className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded">//button[contains(@class, "submit")]/parent::form</code>
                        <span className="ml-2">Form containing submit button</span>
                      </div>
                    </div>
                  </div>

                  <QuickFeedback tutorialId={tutorialId} chapterId="xpath" />
                </section>
              </ChapterTracker>

              {/* Chapter 5: Testing and Debugging */}
              <ChapterTracker
                tutorialId={tutorialId}
                chapterId="testing"
                title="Testing and Debugging Selectors"
              >
                <section className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Code className="h-5 w-5 text-blue-500" />
                          Browser DevTools
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm">
                          <strong>Chrome/Firefox:</strong>
                          <ol className="list-decimal pl-4 mt-2 space-y-1">
                            <li>Right-click element → Inspect</li>
                            <li>Console tab → Type: <code>$$('your-selector')</code></li>
                            <li>View results and refine</li>
                          </ol>
                        </div>
                        <div className="text-sm">
                          <strong>XPath Testing:</strong>
                          <ol className="list-decimal pl-4 mt-2 space-y-1">
                            <li>Console tab → Type: <code>$x('your-xpath')</code></li>
                            <li>Verify element selection</li>
                          </ol>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-yellow-500" />
                          ScrapeCloud Testing
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm">
                          <strong>Built-in Tester:</strong>
                          <ol className="list-decimal pl-4 mt-2 space-y-1">
                            <li>Use "Test Selectors" button</li>
                            <li>Preview extracted data</li>
                            <li>Iterate until perfect</li>
                            <li>Check multiple pages</li>
                          </ol>
                        </div>
                        <div className="text-sm">
                          <strong>AI Assistance:</strong>
                          <p className="mt-2">Use our AI selector generator for complex cases!</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <QuickFeedback tutorialId={tutorialId} chapterId="testing" />
                </section>
              </ChapterTracker>

              {/* Performance Tips */}
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Performance & Best Practices</h2>

                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-green-600">✅ Do</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>• Use specific selectors</p>
                      <p>• Combine multiple selectors</p>
                      <p>• Test on multiple pages</p>
                      <p>• Use classes over complex paths</p>
                      <p>• Prefer CSS over XPath when possible</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600">❌ Don't</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>• Use overly complex selectors</p>
                      <p>• Rely on position only</p>
                      <p>• Hardcode index numbers</p>
                      <p>• Ignore fallback selectors</p>
                      <p>• Skip testing edge cases</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-600">💡 Tips</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>• Start broad, then narrow</p>
                      <p>• Use multiple fallback selectors</p>
                      <p>• Leverage AI assistance</p>
                      <p>• Document your selectors</p>
                      <p>• Monitor selector health</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Next Steps */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>🚀 Continue Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Ready to put your advanced selector skills to work?</p>
                  <div className="space-y-2">
                    <Link href="/tutorials/dynamic-content">
                      <Button variant="outline" className="w-full justify-start">
                        Handling Dynamic Content & JavaScript →
                      </Button>
                    </Link>
                    <Link href="/tutorials/scheduling">
                      <Button variant="outline" className="w-full justify-start">
                        Setting Up Automated Schedules →
                      </Button>
                    </Link>
                    <Link href="/dashboard/scrapers/new">
                      <Button className="w-full justify-start">
                        Create Advanced Scraper →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Tutorial Navigation */}
              <TutorialNavigation
                tutorialId={tutorialId}
                currentChapter="testing"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Progress Indicator will be added here in layout */}

              {/* Community Feedback */}
              <FeedbackStats tutorialId={tutorialId} />

              {/* Quick Resources */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    📋 CSS Reference
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    🔧 Selector Generator
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    💬 Community Forum
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    📚 Documentation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
