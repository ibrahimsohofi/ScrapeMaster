import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Getting Started with Web Scraping - ScrapeCloud Tutorials',
  description: 'Learn the basics of web scraping and set up your first scraper in minutes with ScrapeCloud.',
};

export default function GettingStartedTutorial() {
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
            <Badge variant="default">Beginner</Badge>
            <Badge variant="secondary">Getting Started</Badge>
            <span className="text-sm text-muted-foreground">15 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-4">Getting Started with Web Scraping</h1>
          <p className="text-xl text-muted-foreground">
            Learn the basics of web scraping and set up your first scraper in minutes.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">

          {/* What You'll Learn */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                What You'll Learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  What web scraping is and when to use it
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  How to create your first scraper
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Understanding CSS selectors
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Running and monitoring your scrapers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Exporting your scraped data
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Step 1 */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
              Understanding Web Scraping
            </h2>

            <div className="bg-muted/50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3">What is Web Scraping?</h3>
              <p className="mb-4">
                Web scraping is the process of automatically extracting data from websites. Instead of manually copying and pasting information, you can use tools like ScrapeCloud to gather large amounts of data quickly and efficiently.
              </p>

              <h4 className="font-semibold mb-2">Common Use Cases:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Price monitoring and competitor analysis</li>
                <li>Lead generation and contact information collection</li>
                <li>Market research and trend analysis</li>
                <li>Product catalog management</li>
                <li>News and content aggregation</li>
                <li>Real estate listings and property data</li>
              </ul>
            </div>
          </section>

          {/* Step 2 */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
              Creating Your First Scraper
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">Step 2.1: Access the Dashboard</h3>
                <p className="mb-3">
                  First, log in to your ScrapeCloud account and navigate to the dashboard. If you don't have an account yet, you can sign up for free.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>💡 Tip:</strong> Use the test credentials: <code>admin@acme.com</code> / <code>password123</code>
                  </p>
                </div>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">Step 2.2: Create a New Scraper</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Click on "Scrapers" in the sidebar navigation</li>
                  <li>Click the "Create New Scraper" button</li>
                  <li>Enter a name for your scraper (e.g., "Product Price Monitor")</li>
                  <li>Add a description of what you want to scrape</li>
                </ol>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">Step 2.3: Configure Your Target URL</h3>
                <p className="mb-3">
                  Enter the URL of the website you want to scrape. For this tutorial, let's use a simple example:
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm">
                  https://quotes.toscrape.com/
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  This is a demo website specifically designed for learning web scraping.
                </p>
              </div>
            </div>
          </section>

          {/* Step 3 */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
              Understanding CSS Selectors
            </h2>

            <div className="bg-muted/50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3">What are CSS Selectors?</h3>
              <p className="mb-4">
                CSS selectors are patterns used to identify specific elements on a webpage. They tell the scraper exactly which data to extract.
              </p>

              <h4 className="font-semibold mb-2">Common Selector Types:</h4>
              <div className="space-y-3">
                <div>
                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">.class</code>
                  <span className="ml-2">Selects elements with a specific class</span>
                </div>
                <div>
                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">#id</code>
                  <span className="ml-2">Selects an element with a specific ID</span>
                </div>
                <div>
                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">tag</code>
                  <span className="ml-2">Selects all elements of a specific tag (h1, div, etc.)</span>
                </div>
                <div>
                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">[attribute]</code>
                  <span className="ml-2">Selects elements with a specific attribute</span>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-6">
              <h3 className="text-lg font-semibold mb-2">Practical Example</h3>
              <p className="mb-3">
                For our quotes website, let's extract quotes and authors:
              </p>
              <div className="space-y-3">
                <div>
                  <strong>Quote text:</strong>
                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded ml-2">.text</code>
                </div>
                <div>
                  <strong>Author name:</strong>
                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded ml-2">.author</code>
                </div>
                <div>
                  <strong>Tags:</strong>
                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded ml-2">.tag</code>
                </div>
              </div>
            </div>
          </section>

          {/* Step 4 */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
              Running Your First Scrape
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">Test Your Selectors</h3>
                <p className="mb-3">
                  Before running a full scrape, always test your selectors:
                </p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Click the "Test Selectors" button</li>
                  <li>Review the extracted data preview</li>
                  <li>Adjust selectors if needed</li>
                  <li>Repeat until you're satisfied with the results</li>
                </ol>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">Run the Scraper</h3>
                <p className="mb-3">
                  Once your selectors are working correctly:
                </p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Click "Run Scraper" to start the extraction</li>
                  <li>Monitor progress in the dashboard</li>
                  <li>Wait for completion (usually takes a few seconds to minutes)</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Step 5 */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">5</span>
              Viewing and Exporting Data
            </h2>

            <div className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Data Formats Available</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg mb-2">
                      <span className="font-mono font-semibold">JSON</span>
                    </div>
                    <p className="text-sm">For developers</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg mb-2">
                      <span className="font-mono font-semibold">CSV</span>
                    </div>
                    <p className="text-sm">For Excel/Sheets</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg mb-2">
                      <span className="font-mono font-semibold">XLSX</span>
                    </div>
                    <p className="text-sm">Native Excel</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg mb-2">
                      <span className="font-mono font-semibold">XML</span>
                    </div>
                    <p className="text-sm">Structured data</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Best Practices & Tips</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">⚡ Performance Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>• Start with small test runs</p>
                  <p>• Use specific selectors for better accuracy</p>
                  <p>• Avoid scraping too frequently</p>
                  <p>• Monitor your usage limits</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🔒 Ethical Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>• Respect robots.txt files</p>
                  <p>• Don't overload target servers</p>
                  <p>• Follow website terms of service</p>
                  <p>• Consider data privacy laws</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-primary" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Now that you've created your first scraper, here are some next steps to explore:
              </p>
              <div className="space-y-2">
                <Link href="/tutorials/css-selectors">
                  <Button variant="outline" className="w-full justify-start">
                    Advanced CSS Selector Techniques →
                  </Button>
                </Link>
                <Link href="/tutorials/scheduling">
                  <Button variant="outline" className="w-full justify-start">
                    Setting Up Automated Schedules →
                  </Button>
                </Link>
                <Link href="/dashboard/scrapers/new">
                  <Button className="w-full justify-start">
                    Create Your Real Scraper →
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
