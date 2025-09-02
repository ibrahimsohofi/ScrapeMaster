import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap, Globe, TrendingUp, Shield, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Handling Large Scale Scraping - ScrapeCloud Tutorials',
  description: 'Best practices for enterprise-level data extraction and performance optimization.',
};

export default function LargeScaleTutorial() {
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
            <Badge variant="outline">Expert</Badge>
            <Badge variant="secondary">Scale & Performance</Badge>
            <span className="text-sm text-muted-foreground">45 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-4">Handling Large Scale Scraping</h1>
          <p className="text-xl text-muted-foreground">
            Best practices for enterprise-level data extraction and performance optimization.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">

          {/* Scale Definition */}
          <Card className="mb-8 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                <TrendingUp className="h-5 w-5" />
                What Defines "Large Scale"?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-indigo-800 dark:text-indigo-200">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <strong>Data Volume:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Millions of pages</li>
                    <li>Terabytes of data</li>
                    <li>Thousands of sites</li>
                    <li>Real-time processing</li>
                  </ul>
                </div>
                <div>
                  <strong>Infrastructure:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Distributed systems</li>
                    <li>Auto-scaling</li>
                    <li>Load balancing</li>
                    <li>Global deployment</li>
                  </ul>
                </div>
                <div>
                  <strong>Challenges:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Rate limiting</li>
                    <li>IP blocking</li>
                    <li>Data consistency</li>
                    <li>Cost optimization</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Architecture Planning */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
              Architecture & Planning
            </h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Capacity Planning
                  </CardTitle>
                  <CardDescription>Estimate resources before you scale</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Key Metrics to Calculate:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• <strong>Pages per day:</strong> Target volume</li>
                          <li>• <strong>Data per page:</strong> Average size</li>
                          <li>• <strong>Processing time:</strong> Per page</li>
                          <li>• <strong>Concurrent jobs:</strong> Parallelization</li>
                          <li>• <strong>Storage needs:</strong> Data retention</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Capacity Formula:</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                          <div className="space-y-1">
                            <div><strong>Daily Volume:</strong> 1M pages</div>
                            <div><strong>Avg. Time:</strong> 3 seconds/page</div>
                            <div><strong>Total Time:</strong> 3M seconds</div>
                            <div><strong>Required Workers:</strong> 35 concurrent</div>
                            <div><strong>With Buffer:</strong> 50 workers</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded">
                      <h4 className="font-semibold mb-2">ScrapeCloud Enterprise Features:</h4>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div>• Auto-scaling workers</div>
                        <div>• Global proxy pools</div>
                        <div>• Priority queuing</div>
                        <div>• Usage analytics</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-500" />
                    Distributed Architecture
                  </CardTitle>
                  <CardDescription>Design for scale from day one</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                      <h4 className="font-semibold mb-2">Recommended Architecture:</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>Load Balancer</strong></span>
                          <span className="text-muted-foreground">Distribute requests</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>Job Queue</strong></span>
                          <span className="text-muted-foreground">Manage work distribution</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>Worker Cluster</strong></span>
                          <span className="text-muted-foreground">Parallel processing</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>Data Store</strong></span>
                          <span className="text-muted-foreground">Results & metadata</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                          <span><strong>Monitoring</strong></span>
                          <span className="text-muted-foreground">Health & performance</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Performance Optimization */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
              Performance Optimization
            </h2>

            <div className="space-y-6">
              {/* Concurrent Processing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">⚡ Concurrent Processing</CardTitle>
                  <CardDescription>Maximize throughput with parallel execution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Optimal Concurrency:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Start with 5-10 concurrent jobs</li>
                          <li>• Monitor success rates</li>
                          <li>• Gradually increase limits</li>
                          <li>• Watch for diminishing returns</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">ScrapeCloud Settings:</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                          <div>Max Concurrent: <strong>50 jobs</strong></div>
                          <div>Queue Priority: <strong>High</strong></div>
                          <div>Worker Pool: <strong>Auto-scale</strong></div>
                          <div>Retry Logic: <strong>Smart backoff</strong></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded">
                      <h4 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Performance Tips:</h4>
                      <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
                        <li>• Batch similar URLs together</li>
                        <li>• Use connection pooling</li>
                        <li>• Optimize selector complexity</li>
                        <li>• Cache DNS lookups</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Proxy Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🌐 Proxy Pool Management</CardTitle>
                  <CardDescription>Avoid IP blocks with smart proxy rotation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Proxy Types:</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span><strong>Residential:</strong></span>
                            <span>High success, expensive</span>
                          </div>
                          <div className="flex justify-between">
                            <span><strong>Datacenter:</strong></span>
                            <span>Fast, may be blocked</span>
                          </div>
                          <div className="flex justify-between">
                            <span><strong>Mobile:</strong></span>
                            <span>Best for mobile sites</span>
                          </div>
                          <div className="flex justify-between">
                            <span><strong>Rotating:</strong></span>
                            <span>Automatic rotation</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Smart Rotation:</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs">
                          <div className="space-y-1">
                            <div>✅ Success rate: 95%+</div>
                            <div>🔄 Auto-rotation: Enabled</div>
                            <div>🌍 Geographic spread: Global</div>
                            <div>⚡ Failover time: {"<"} 2s</div>
                            <div>📊 Health monitoring: Active</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded">
                      <h4 className="font-semibold mb-2">Enterprise Proxy Features:</h4>
                      <div className="grid md:grid-cols-3 gap-2 text-sm">
                        <div>• 10M+ IP addresses</div>
                        <div>• 99.9% uptime SLA</div>
                        <div>• Geographic targeting</div>
                        <div>• Real-time failover</div>
                        <div>• Usage analytics</div>
                        <div>• Custom rules</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Pipeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🔄 Data Pipeline Optimization</CardTitle>
                  <CardDescription>Stream processing for real-time results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                      <h4 className="font-semibold mb-2">Pipeline Stages:</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">1</div>
                          <div>
                            <div className="font-medium">Data Extraction</div>
                            <div className="text-sm text-muted-foreground">Raw HTML/JSON extraction</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">2</div>
                          <div>
                            <div className="font-medium">Data Transformation</div>
                            <div className="text-sm text-muted-foreground">Cleaning, validation, formatting</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">3</div>
                          <div>
                            <div className="font-medium">Data Loading</div>
                            <div className="text-sm text-muted-foreground">Storage, indexing, delivery</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Streaming Benefits:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Real-time processing</li>
                          <li>• Lower memory usage</li>
                          <li>• Faster time to insight</li>
                          <li>• Better error isolation</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Batch vs Stream:</h4>
                        <div className="space-y-1 text-sm">
                          <div><strong>Batch:</strong> High volume, scheduled</div>
                          <div><strong>Stream:</strong> Real-time, continuous</div>
                          <div><strong>Hybrid:</strong> Best of both worlds</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Anti-Bot Measures */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
              Handling Anti-Bot Measures
            </h2>

            <div className="space-y-6">
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <Shield className="h-5 w-5" />
                    Common Protection Methods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-orange-800 dark:text-orange-200">Detection Methods:</h4>
                      <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
                        <li>• Rate limiting (requests/minute)</li>
                        <li>• IP reputation checking</li>
                        <li>• Browser fingerprinting</li>
                        <li>• JavaScript challenges</li>
                        <li>• CAPTCHA systems</li>
                        <li>• Behavioral analysis</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-orange-800 dark:text-orange-200">Response Actions:</h4>
                      <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
                        <li>• IP blocking (temporary/permanent)</li>
                        <li>• Increased delays</li>
                        <li>• Content restrictions</li>
                        <li>• Legal challenges</li>
                        <li>• Account termination</li>
                        <li>• Honeypot traps</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🕵️ Stealth Techniques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div><strong>Browser Mimicking:</strong></div>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Real browser engines</li>
                        <li>Human-like patterns</li>
                        <li>Natural delays</li>
                        <li>Mouse movements</li>
                      </ul>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><strong>Fingerprint Spoofing:</strong></div>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>User agent rotation</li>
                        <li>Screen resolution</li>
                        <li>Language settings</li>
                        <li>Plugin detection</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🔄 Adaptive Strategies</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div><strong>Dynamic Adjustment:</strong></div>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Success rate monitoring</li>
                        <li>Auto-throttling</li>
                        <li>Proxy switching</li>
                        <li>Session management</li>
                      </ul>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><strong>Intelligence Gathering:</strong></div>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Pattern recognition</li>
                        <li>A/B testing approaches</li>
                        <li>Baseline establishment</li>
                        <li>Anomaly detection</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Data Quality */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
              Data Quality & Consistency
            </h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">✅ Validation Pipeline</CardTitle>
                  <CardDescription>Ensure data quality at scale</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                      <h4 className="font-semibold mb-2">Multi-Level Validation:</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</div>
                          <div>
                            <div className="font-medium">Schema Validation</div>
                            <div className="text-sm text-muted-foreground">Check data structure and types</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">2</div>
                          <div>
                            <div className="font-medium">Business Rules</div>
                            <div className="text-sm text-muted-foreground">Apply domain-specific validation</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">3</div>
                          <div>
                            <div className="font-medium">Anomaly Detection</div>
                            <div className="text-sm text-muted-foreground">Identify outliers and unusual patterns</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs">4</div>
                          <div>
                            <div className="font-medium">Completeness Check</div>
                            <div className="text-sm text-muted-foreground">Verify all required fields are present</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Quality Metrics:</h4>
                        <div className="space-y-2 text-sm">
                          <div>✅ <strong>Completeness:</strong> 95%+ fields populated</div>
                          <div>✅ <strong>Accuracy:</strong> 99%+ valid data</div>
                          <div>✅ <strong>Consistency:</strong> Format compliance</div>
                          <div>✅ <strong>Timeliness:</strong> Fresh data delivery</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Error Handling:</h4>
                        <div className="space-y-2 text-sm">
                          <div>🔄 <strong>Retry Logic:</strong> Exponential backoff</div>
                          <div>📝 <strong>Error Logging:</strong> Detailed tracking</div>
                          <div>🚨 <strong>Alerts:</strong> Quality threshold breaches</div>
                          <div>🔧 <strong>Auto-fix:</strong> Common data issues</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Monitoring & Analytics</CardTitle>
                  <CardDescription>Track performance and identify issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="p-4">
                        <h4 className="font-semibold text-center mb-2">Success Rate</h4>
                        <div className="text-3xl font-bold text-green-600 text-center">97.8%</div>
                        <div className="text-sm text-center text-muted-foreground">Last 24h</div>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-semibold text-center mb-2">Avg Response</h4>
                        <div className="text-3xl font-bold text-blue-600 text-center">2.3s</div>
                        <div className="text-sm text-center text-muted-foreground">Per request</div>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-semibold text-center mb-2">Data Quality</h4>
                        <div className="text-3xl font-bold text-purple-600 text-center">99.2%</div>
                        <div className="text-sm text-center text-muted-foreground">Valid records</div>
                      </Card>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded">
                      <h4 className="font-semibold mb-2">Real-time Dashboards:</h4>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div>• Job execution status</div>
                        <div>• Error rate tracking</div>
                        <div>• Proxy health monitoring</div>
                        <div>• Resource utilization</div>
                        <div>• Cost optimization insights</div>
                        <div>• Performance benchmarks</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Cost Optimization */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">5</span>
              Cost Optimization Strategies
            </h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">💰 Cost Reduction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• Optimize scraping schedules</p>
                    <p>• Use cheaper proxy tiers when possible</p>
                    <p>• Implement smart caching</p>
                    <p>• Batch similar requests</p>
                    <p>• Monitor and cap usage</p>
                    <p>• Use spot instances for batch jobs</p>
                    <p>• Implement data deduplication</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">📈 ROI Maximization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• Focus on high-value data sources</p>
                    <p>• Automate manual processes</p>
                    <p>• Reduce time-to-market</p>
                    <p>• Scale successful patterns</p>
                    <p>• Eliminate redundant data collection</p>
                    <p>• Optimize for business KPIs</p>
                    <p>• Measure impact on revenue</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Usage Analytics</CardTitle>
                  <CardDescription>Track costs and optimize spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                      <h4 className="font-semibold mb-2">Cost Breakdown:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Compute Resources</span>
                          <span className="font-mono">$2,450/month</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Proxy Services</span>
                          <span className="font-mono">$1,200/month</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Storage & Bandwidth</span>
                          <span className="font-mono">$350/month</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2 font-semibold">
                          <span>Total Monthly Cost</span>
                          <span className="font-mono">$4,000/month</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Optimization Opportunities:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>💡 Switch to datacenter proxies: -30%</li>
                          <li>💡 Optimize peak hours: -15%</li>
                          <li>💡 Implement caching: -20%</li>
                          <li>💡 Batch processing: -10%</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Potential Savings:</h4>
                        <div className="space-y-1 text-sm">
                          <div>Monthly: <strong className="text-green-600">-$1,400</strong></div>
                          <div>Annual: <strong className="text-green-600">-$16,800</strong></div>
                          <div>ROI Improvement: <strong className="text-blue-600">+42%</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Enterprise Patterns */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Enterprise Deployment Patterns</h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🏢 Multi-Tenant</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Use Case:</strong> Multiple teams/clients</p>
                    <p><strong>Benefits:</strong> Resource sharing, cost efficiency</p>
                    <p><strong>Considerations:</strong> Data isolation, access control</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🔒 On-Premise</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Use Case:</strong> Security/compliance requirements</p>
                    <p><strong>Benefits:</strong> Full control, data sovereignty</p>
                    <p><strong>Considerations:</strong> Higher maintenance, scaling complexity</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">☁️ Hybrid Cloud</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Use Case:</strong> Flexible workload distribution</p>
                    <p><strong>Benefits:</strong> Best of both worlds</p>
                    <p><strong>Considerations:</strong> Network latency, complexity</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Success Checklist */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Large Scale Success Checklist</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">✅ Technical Readiness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Architecture designed for scale</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Monitoring and alerting in place</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Error handling and retries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Data validation pipeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Security and compliance measures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Performance benchmarks established</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-blue-600">🎯 Business Readiness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Clear ROI metrics defined</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Budget and cost controls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Legal and ethical compliance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Team training completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Data governance policies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Stakeholder buy-in secured</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                Ready for Enterprise Scale?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">You now have the knowledge to deploy large-scale scraping solutions!</p>
              <div className="space-y-2">
                <Link href="/contact">
                  <Button className="w-full justify-start">
                    💼 Contact Enterprise Sales →
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full justify-start">
                    📊 Access Advanced Analytics →
                  </Button>
                </Link>
                <Link href="/documentation">
                  <Button variant="outline" className="w-full justify-start">
                    📚 Enterprise Documentation →
                  </Button>
                </Link>
                <Link href="/tutorials">
                  <Button variant="outline" className="w-full justify-start">
                    ← Back to All Tutorials
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
