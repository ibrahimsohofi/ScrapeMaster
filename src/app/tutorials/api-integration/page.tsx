import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Code, Webhook, Key, Database, Zap, Copy, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'API Integration & Webhooks - ScrapeCloud Tutorials',
  description: 'Integrate scraped data with your applications using our API and webhooks for seamless automation.',
};

export default function APIIntegrationTutorial() {
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
            <Badge variant="destructive">Advanced</Badge>
            <Badge variant="secondary">Integration</Badge>
            <span className="text-sm text-muted-foreground">35 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-4">API Integration & Webhooks</h1>
          <p className="text-xl text-muted-foreground">
            Integrate scraped data with your applications using our API and webhooks for seamless automation.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">

          {/* API Overview */}
          <Card className="mb-8 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                <Code className="h-5 w-5" />
                ScrapeCloud API Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="text-purple-800 dark:text-purple-200">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <strong>RESTful API Features:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Create and manage scrapers</li>
                    <li>Trigger scraping jobs</li>
                    <li>Retrieve scraped data</li>
                    <li>Monitor job status</li>
                  </ul>
                </div>
                <div>
                  <strong>Webhook Capabilities:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Real-time notifications</li>
                    <li>Automatic data delivery</li>
                    <li>Custom event triggers</li>
                    <li>Retry mechanisms</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Authentication */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
              API Authentication
            </h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5 text-yellow-500" />
                    Getting Your API Key
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal pl-4 space-y-2">
                    <li>Navigate to Dashboard → Settings → API Keys</li>
                    <li>Click "Generate New API Key"</li>
                    <li>Give your key a descriptive name</li>
                    <li>Select appropriate scopes/permissions</li>
                    <li>Copy and store your key securely</li>
                  </ol>

                  <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg mt-4">
                    <h4 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Security Best Practices:</h4>
                    <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
                      <li>• Store keys in environment variables</li>
                      <li>• Use different keys for dev/prod</li>
                      <li>• Rotate keys regularly</li>
                      <li>• Never commit keys to version control</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Authentication Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Bearer Token (Recommended)</h4>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto"><code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.scrapecloud.io/v1/jobs`}</code></pre>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Header-based Authentication</h4>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto"><code>{`curl -H "X-API-Key: YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.scrapecloud.io/v1/jobs`}</code></pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Core API Endpoints */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
              Core API Endpoints
            </h2>

            <div className="space-y-6">
              {/* Jobs Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    Jobs Management
                  </CardTitle>
                  <CardDescription>Create, trigger, and monitor scraping jobs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">GET</Badge>
                        <code className="text-sm">/v1/jobs</code>
                        <span className="text-sm text-muted-foreground">List all jobs</span>
                      </div>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.scrapecloud.io/v1/jobs`}</code></pre>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">POST</Badge>
                        <code className="text-sm">/v1/jobs</code>
                        <span className="text-sm text-muted-foreground">Create new job</span>
                      </div>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`curl -X POST \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{
       "name": "Product Price Monitor",
       "url": "https://example.com/products",
       "selectors": {
         "title": ".product-name",
         "price": ".price-current"
       },
       "schedule": "0 */6 * * *"
     }' \\
     https://api.scrapecloud.io/v1/jobs`}</code></pre>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">POST</Badge>
                        <code className="text-sm">/v1/jobs/{"{id}"}/run</code>
                        <span className="text-sm text-muted-foreground">Trigger job execution</span>
                      </div>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`curl -X POST \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.scrapecloud.io/v1/jobs/job_123/run`}</code></pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Retrieval */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-500" />
                    Data Retrieval
                  </CardTitle>
                  <CardDescription>Access and export your scraped data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">GET</Badge>
                        <code className="text-sm">/v1/jobs/{"{id}"}/results</code>
                        <span className="text-sm text-muted-foreground">Get job results</span>
                      </div>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.scrapecloud.io/v1/jobs/job_123/results`}</code></pre>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">GET</Badge>
                        <code className="text-sm">/v1/data/export</code>
                        <span className="text-sm text-muted-foreground">Export data in various formats</span>
                      </div>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     "https://api.scrapecloud.io/v1/data/export?job_id=job_123&format=csv"`}</code></pre>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Response Example:</h4>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`{
  "status": "success",
  "job_id": "job_123",
  "data": [
    {
      "title": "Premium Laptop",
      "price": "$999.99",
      "scraped_at": "2024-01-15T10:30:00Z"
    },
    {
      "title": "Gaming Mouse",
      "price": "$79.99",
      "scraped_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total_records": 2,
  "execution_time": "5.2s"
}`}</code></pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Webhooks */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
              Webhook Integration
            </h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Webhook className="h-5 w-5 text-purple-500" />
                    Setting Up Webhooks
                  </CardTitle>
                  <CardDescription>Get real-time notifications when jobs complete</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">1. Create Webhook Endpoint</h4>
                      <p className="text-sm mb-3">First, create an endpoint in your application to receive webhook data:</p>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`// Node.js Express Example
app.post('/webhooks/scrapecloud', (req, res) => {
  const { job_id, status, data } = req.body;

  if (status === 'completed') {
    // Process the scraped data
    console.log(\`Job \${job_id} completed with \${data.length} records\`);

    // Store in database, send notifications, etc.
    processScrapedData(data);
  }

  res.status(200).send('OK');
});`}</code></pre>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">2. Register Webhook via API</h4>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`curl -X POST \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{
       "name": "Job Completion Handler",
       "url": "https://yourapp.com/webhooks/scrapecloud",
       "events": ["job.completed", "job.failed"],
       "secret": "your_webhook_secret"
     }' \\
     https://api.scrapecloud.io/v1/webhooks`}</code></pre>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">3. Webhook Payload Example</h4>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`{
  "event": "job.completed",
  "job_id": "job_123",
  "job_name": "Product Price Monitor",
  "status": "completed",
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:35:30Z",
  "execution_time": "5.5s",
  "data_points": 150,
  "data": [
    {
      "title": "Premium Laptop",
      "price": "$999.99"
    }
  ],
  "metadata": {
    "url": "https://example.com/products",
    "user_agent": "ScrapeCloud/1.0"
  }
}`}</code></pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Webhook Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🔐 Webhook Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Signature Verification</h4>
                      <p className="text-sm mb-3">Always verify webhook signatures to ensure authenticity:</p>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === \`sha256=\${expectedSignature}\`;
}

// In your webhook handler
const signature = req.headers['x-scrapecloud-signature'];
const isValid = verifyWebhookSignature(
  JSON.stringify(req.body),
  signature,
  'your_webhook_secret'
);

if (!isValid) {
  return res.status(401).send('Invalid signature');
}`}</code></pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* SDK Examples */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
              Language-Specific Examples
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Python */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🐍 Python</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`import requests
import json

class ScrapeCloudClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.scrapecloud.io/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def create_job(self, name, url, selectors):
        payload = {
            "name": name,
            "url": url,
            "selectors": selectors
        }

        response = requests.post(
            f"{self.base_url}/jobs",
            headers=self.headers,
            json=payload
        )

        return response.json()

    def get_results(self, job_id):
        response = requests.get(
            f"{self.base_url}/jobs/{job_id}/results",
            headers=self.headers
        )

        return response.json()

# Usage
client = ScrapeCloudClient("your_api_key")

# Create a job
job = client.create_job(
    name="Price Monitor",
    url="https://example.com",
    selectors={"price": ".price"}
)

# Get results
results = client.get_results(job["id"])`}</code></pre>
                </CardContent>
              </Card>

              {/* JavaScript */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">⚡ JavaScript/Node.js</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`class ScrapeCloudClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.scrapecloud.io/v1';
  }

  async createJob(name, url, selectors) {
    const response = await fetch(\`\${this.baseUrl}/jobs\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        url,
        selectors
      })
    });

    return await response.json();
  }

  async getResults(jobId) {
    const response = await fetch(
      \`\${this.baseUrl}/jobs/\${jobId}/results\`,
      {
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`
        }
      }
    );

    return await response.json();
  }

  async runJob(jobId) {
    const response = await fetch(
      \`\${this.baseUrl}/jobs/\${jobId}/run\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`
        }
      }
    );

    return await response.json();
  }
}

// Usage
const client = new ScrapeCloudClient('your_api_key');

// Create and run a job
const job = await client.createJob(
  'Price Monitor',
  'https://example.com',
  { price: '.price' }
);

const execution = await client.runJob(job.id);
console.log('Job started:', execution);`}</code></pre>
                </CardContent>
              </Card>

              {/* PHP */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🐘 PHP</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`<?php

class ScrapeCloudClient {
    private $apiKey;
    private $baseUrl = 'https://api.scrapecloud.io/v1';

    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }

    public function createJob($name, $url, $selectors) {
        $data = [
            'name' => $name,
            'url' => $url,
            'selectors' => $selectors
        ];

        $response = $this->makeRequest('POST', '/jobs', $data);
        return json_decode($response, true);
    }

    public function getResults($jobId) {
        $response = $this->makeRequest('GET', "/jobs/$jobId/results");
        return json_decode($response, true);
    }

    private function makeRequest($method, $endpoint, $data = null) {
        $url = $this->baseUrl . $endpoint;

        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        curl_close($ch);

        return $response;
    }
}

// Usage
$client = new ScrapeCloudClient('your_api_key');

$job = $client->createJob(
    'Price Monitor',
    'https://example.com',
    ['price' => '.price']
);

echo "Job created: " . $job['id'];
?>`}</code></pre>
                </CardContent>
              </Card>

              {/* Ruby */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💎 Ruby</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`require 'net/http'
require 'json'

class ScrapeCloudClient
  def initialize(api_key)
    @api_key = api_key
    @base_url = 'https://api.scrapecloud.io/v1'
  end

  def create_job(name, url, selectors)
    payload = {
      name: name,
      url: url,
      selectors: selectors
    }

    make_request('POST', '/jobs', payload)
  end

  def get_results(job_id)
    make_request('GET', "/jobs/#{job_id}/results")
  end

  private

  def make_request(method, endpoint, payload = nil)
    uri = URI("#{@base_url}#{endpoint}")

    case method
    when 'POST'
      req = Net::HTTP::Post.new(uri)
      req.body = payload.to_json if payload
    when 'GET'
      req = Net::HTTP::Get.new(uri)
    end

    req['Authorization'] = "Bearer #{@api_key}"
    req['Content-Type'] = 'application/json'

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(req)
    end

    JSON.parse(response.body)
  end
end

# Usage
client = ScrapeCloudClient.new('your_api_key')

job = client.create_job(
  'Price Monitor',
  'https://example.com',
  { price: '.price' }
)

puts "Job created: #{job['id']}"

results = client.get_results(job['id'])
puts "Found #{results['data'].length} records"`}</code></pre>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Common Integration Patterns */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">5</span>
              Common Integration Patterns
            </h2>

            <div className="space-y-6">
              {/* Database Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💾 Database Integration</CardTitle>
                  <CardDescription>Automatically store scraped data in your database</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`// Webhook handler that saves to database
app.post('/webhooks/scrapecloud', async (req, res) => {
  const { job_id, status, data } = req.body;

  if (status === 'completed') {
    for (const record of data) {
      await db.products.create({
        title: record.title,
        price: parseFloat(record.price.replace('$', '')),
        scraped_at: new Date(),
        source_job: job_id
      });
    }

    console.log(\`Saved \${data.length} records to database\`);
  }

  res.status(200).send('OK');
});`}</code></pre>
                  </div>
                </CardContent>
              </Card>

              {/* Slack Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💬 Slack Integration</CardTitle>
                  <CardDescription>Send notifications to Slack when jobs complete</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`const { WebClient } = require('@slack/web-api');
const slack = new WebClient(process.env.SLACK_TOKEN);

app.post('/webhooks/scrapecloud', async (req, res) => {
  const { job_name, status, data_points, execution_time } = req.body;

  if (status === 'completed') {
    await slack.chat.postMessage({
      channel: '#data-alerts',
      text: \`✅ Job "\${job_name}" completed successfully!\`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: \`*Job:* \${job_name}\\n*Records:* \${data_points}\\n*Time:* \${execution_time}\`
          }
        }
      ]
    });
  }

  res.status(200).send('OK');
});`}</code></pre>
                  </div>
                </CardContent>
              </Card>

              {/* Email Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📧 Email Alerts</CardTitle>
                  <CardDescription>Send email notifications for important changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto"><code>{`const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/webhooks/scrapecloud', async (req, res) => {
  const { job_name, data } = req.body;

  // Check for significant price drops
  const significantChanges = data.filter(item => {
    const currentPrice = parseFloat(item.price.replace('$', ''));
    const previousPrice = getPreviousPrice(item.title);
    return currentPrice < previousPrice * 0.9; // 10% drop
  });

  if (significantChanges.length > 0) {
    await transporter.sendMail({
      from: 'alerts@yourcompany.com',
      to: 'team@yourcompany.com',
      subject: \`Price Alert: \${significantChanges.length} items on sale!\`,
      html: \`
        <h2>Price Drops Detected</h2>
        <ul>
          \${significantChanges.map(item =>
            \`<li>\${item.title}: \${item.price}</li>\`
          ).join('')}
        </ul>
      \`
    });
  }

  res.status(200).send('OK');
});`}</code></pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Error Handling */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Error Handling & Best Practices</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">✅ Best Practices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Always verify webhook signatures</p>
                  <p>• Implement proper error handling</p>
                  <p>• Use retry mechanisms for API calls</p>
                  <p>• Store API keys securely</p>
                  <p>• Log all API interactions</p>
                  <p>• Implement rate limiting</p>
                  <p>• Use idempotent operations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-orange-600">⚠️ Common Pitfalls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Exposing API keys in client code</p>
                  <p>• Not handling webhook retries</p>
                  <p>• Ignoring rate limits</p>
                  <p>• Missing error responses</p>
                  <p>• Not validating webhook payloads</p>
                  <p>• Synchronous processing of large datasets</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-green-500" />
                Start Building Your Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Ready to integrate ScrapeCloud with your applications?</p>
              <div className="space-y-2">
                <Link href="/api-reference">
                  <Button variant="outline" className="w-full justify-start">
                    <Code className="h-4 w-4 mr-2" />
                    Full API Reference →
                  </Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button variant="outline" className="w-full justify-start">
                    <Key className="h-4 w-4 mr-2" />
                    Generate API Key →
                  </Button>
                </Link>
                <Link href="/tutorials/large-scale">
                  <Button variant="outline" className="w-full justify-start">
                    Handling Large Scale Scraping →
                  </Button>
                </Link>
                <Link href="/dashboard/scrapers/new">
                  <Button className="w-full justify-start">
                    <Zap className="h-4 w-4 mr-2" />
                    Create Your First API Job →
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
