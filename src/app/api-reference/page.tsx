import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Key, Database, Webhook } from 'lucide-react';

export const metadata: Metadata = {
  title: 'API Reference - DataVault Pro',
  description: 'Complete API documentation for DataVault Pro web scraping platform',
};

export default function APIReferencePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">API Reference</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete documentation for integrating DataVault Pro into your applications.
            RESTful API with comprehensive endpoints for all scraping operations.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Get started with the DataVault Pro API in minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Base URL</h3>
                <code className="bg-muted px-3 py-1 rounded text-sm">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000'}/api
                </code>
              </div>

              <div>
                <h3 className="font-medium mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Include your API key in the Authorization header:
                </p>
                <code className="bg-muted px-3 py-1 rounded text-sm block">
                  Authorization: Bearer YOUR_API_KEY
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Get your API key from the <a href="/dashboard/settings" className="text-primary hover:underline">Settings page</a>
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Example Request</h3>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`curl -X GET \\
  ${typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000'}/api/scrapers \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                </pre>
              </div>

              <div>
                <h3 className="font-medium mb-2">Rate Limiting</h3>
                <p className="text-sm text-muted-foreground">
                  API requests are limited to 1000 requests per hour per API key.
                  Rate limit information is included in response headers.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Error Handling</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  All errors return a consistent format:
                </p>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "User-friendly error message",
    "details": {
      "field": "Additional error details"
    },
    "retryable": false
  }
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="scrapers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scrapers">Scrapers</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          {/* Scrapers Tab */}
          <TabsContent value="scrapers" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Create Scraper</CardTitle>
                    <Badge variant="default">POST</Badge>
                  </div>
                  <CardDescription>/api/scrapers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Request Body</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Required fields are marked with *</p>
                        <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`{
  "name": "Product Price Monitor", // * String (1-100 chars)
  "url": "https://example.com/products", // * Valid URL
  "description": "Monitor product prices daily", // Optional
  "engine": "PLAYWRIGHT", // PLAYWRIGHT | HTTRACK (default: PLAYWRIGHT)
  "selectors": { // CSS selectors for data extraction
    "title": "h1.product-title",
    "price": ".price-current",
    "availability": ".stock-status",
    "description": ".product-description"
  },
  "schedule": "0 9 * * *", // Cron expression (optional)
  "settings": {
    "userAgent": "Custom User Agent", // Optional
    "delay": 1000, // Delay between requests (0-60000ms)
    "timeout": 30000, // Request timeout (1000-300000ms)
    "retries": 3, // Retry attempts (0-10)
    "respectRobots": true, // Follow robots.txt
    "followRedirects": true // Follow HTTP redirects
  },
  "outputFormat": "JSON", // JSON | CSV | EXCEL (default: JSON)
  "isActive": true // Enable/disable scraper
}`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Success Response (201)</h4>
                      <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "id": "clp1234567890",
    "name": "Product Price Monitor",
    "url": "https://example.com/products",
    "description": "Monitor product prices daily",
    "status": "ACTIVE",
    "engine": "PLAYWRIGHT",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "selectors": {
      "title": "h1.product-title",
      "price": ".price-current",
      "availability": ".stock-status"
    },
    "settings": {
      "delay": 1000,
      "timeout": 30000,
      "retries": 3
    },
    "schedule": "0 9 * * *",
    "outputFormat": "JSON",
    "isActive": true
  },
  "message": "Scraper created successfully"
}`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Error Responses</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">400 - Validation Error</p>
                          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Please check your input and correct any errors.",
    "details": {
      "issues": [
        {
          "field": "url",
          "message": "Invalid URL format"
        }
      ]
    },
    "retryable": false
  }
}`}
                          </pre>
                        </div>
                        <div>
                          <p className="text-sm font-medium">401 - Authentication Error</p>
                          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "error": {
    "type": "AUTHENTICATION_ERROR",
    "message": "Please log in to continue.",
    "retryable": false
  }
}`}
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">cURL Example</h4>
                      <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`curl -X POST \\
  ${typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000'}/api/scrapers \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Product Price Monitor",
    "url": "https://example.com/products",
    "selectors": {
      "title": "h1.product-title",
      "price": ".price-current"
    }
  }'`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>List Scrapers</CardTitle>
                    <Badge variant="secondary">GET</Badge>
                  </div>
                  <CardDescription>/scrapers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Query Parameters</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li><code>page</code> - Page number (default: 1)</li>
                        <li><code>limit</code> - Items per page (default: 20, max: 100)</li>
                        <li><code>status</code> - Filter by status (active, paused, error)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Run Scraper</CardTitle>
                    <Badge variant="default">POST</Badge>
                  </div>
                  <CardDescription>/scrapers/{`{id}`}/run</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Response</h4>
                      <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`{
  "job_id": "job_456",
  "status": "running",
  "started_at": "2024-01-15T10:30:00Z",
  "estimated_completion": "2024-01-15T10:35:00Z"
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Get Job Status</CardTitle>
                    <Badge variant="secondary">GET</Badge>
                  </div>
                  <CardDescription>/jobs/{`{id}`}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Response</h4>
                      <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`{
  "id": "job_456",
  "status": "completed",
  "progress": 100,
  "records_extracted": 1250,
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:34:23Z",
  "download_url": "https://api.datavaultpro.com/v1/jobs/job_456/download"
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Export Data</CardTitle>
                    <Badge variant="secondary">GET</Badge>
                  </div>
                  <CardDescription>/jobs/{`{id}`}/export</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Query Parameters</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li><code>format</code> - Export format (json, csv, xlsx)</li>
                        <li><code>filter</code> - Filter data by field values</li>
                        <li><code>fields</code> - Comma-separated field names to include</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Create Webhook</CardTitle>
                    <Badge variant="default">POST</Badge>
                  </div>
                  <CardDescription>/webhooks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Request Body</h4>
                      <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`{
  "url": "https://your-app.com/webhook",
  "events": ["job.completed", "job.failed"],
  "secret": "your-webhook-secret"
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* HTTP Status Codes */}
        <div className="border-t pt-12 mt-12">
          <h2 className="text-2xl font-semibold mb-8 text-center">HTTP Status Codes</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Success Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <code className="font-semibold">200 OK</code>
                    <span className="text-sm text-muted-foreground">Request successful</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-semibold">201 Created</code>
                    <span className="text-sm text-muted-foreground">Resource created successfully</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-semibold">204 No Content</code>
                    <span className="text-sm text-muted-foreground">Successful deletion</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Client Error Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <code className="font-semibold">400 Bad Request</code>
                    <span className="text-sm text-muted-foreground">Invalid request data</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-semibold">401 Unauthorized</code>
                    <span className="text-sm text-muted-foreground">Authentication required</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-semibold">403 Forbidden</code>
                    <span className="text-sm text-muted-foreground">Insufficient permissions</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-semibold">404 Not Found</code>
                    <span className="text-sm text-muted-foreground">Resource not found</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-semibold">409 Conflict</code>
                    <span className="text-sm text-muted-foreground">Resource already exists</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-semibold">429 Too Many Requests</code>
                    <span className="text-sm text-muted-foreground">Rate limit exceeded</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Server Error Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <code className="font-semibold">500 Internal Server Error</code>
                    <span className="text-sm text-muted-foreground">Server error occurred</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-semibold">502 Bad Gateway</code>
                    <span className="text-sm text-muted-foreground">External service error</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-semibold">503 Service Unavailable</code>
                    <span className="text-sm text-muted-foreground">Service temporarily down</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Error Response Format</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`{
  "error": {
    "type": "ERROR_TYPE",
    "message": "Human-readable message",
    "details": {
      "field": "Additional context"
    },
    "retryable": boolean
  }
}`}
                </pre>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p><strong>type:</strong> Error classification for programmatic handling</p>
                  <p><strong>message:</strong> User-friendly error message</p>
                  <p><strong>details:</strong> Additional context and validation errors</p>
                  <p><strong>retryable:</strong> Whether the request can be retried</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="border-t pt-12 mt-12">
          <h2 className="text-2xl font-semibold mb-8 text-center">Rate Limiting</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Rate Limit Headers</h3>
                  <div className="space-y-2 text-sm">
                    <div><code>X-RateLimit-Limit</code>: Total requests allowed per hour</div>
                    <div><code>X-RateLimit-Remaining</code>: Remaining requests in current window</div>
                    <div><code>X-RateLimit-Reset</code>: Unix timestamp when the rate limit resets</div>
                    <div><code>Retry-After</code>: Seconds to wait before retrying (when rate limited)</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Rate Limits by Plan</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Free Plan</span>
                      <span className="font-medium">100 requests/hour</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pro Plan</span>
                      <span className="font-medium">1,000 requests/hour</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enterprise Plan</span>
                      <span className="font-medium">10,000 requests/hour</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SDKs and Libraries */}
        <div className="border-t pt-12 mt-12">
          <h2 className="text-2xl font-semibold mb-8 text-center">SDKs & Libraries</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { name: 'Node.js', icon: '🟢' },
              { name: 'Python', icon: '🐍' },
              { name: 'PHP', icon: '🐘' },
              { name: 'Go', icon: '🐹' },
            ].map((sdk) => (
              <Card key={sdk.name} className="text-center">
                <CardHeader>
                  <div className="text-3xl mb-2">{sdk.icon}</div>
                  <CardTitle>{sdk.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm">
                    View SDK
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
