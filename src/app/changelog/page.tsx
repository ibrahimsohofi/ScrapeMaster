import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog - DataVault Pro',
  description: 'Latest updates and improvements to DataVault Pro',
};

export default function ChangelogPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Changelog</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Stay up to date with the latest features, improvements, and bug fixes.
        </p>

        <div className="space-y-12">
          {/* Version 2.1.0 */}
          <div className="border-l-2 border-primary pl-6">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-semibold">Version 2.1.0</h2>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                Latest
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">January 15, 2024</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-green-600 mb-2">🎉 New Features</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>AI-powered CSS selector generation for improved accuracy</li>
                  <li>Advanced proxy rotation with multiple provider support</li>
                  <li>Real-time scraping progress monitoring</li>
                  <li>Custom webhook integration for job completion</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-blue-600 mb-2">✨ Improvements</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>50% faster data extraction performance</li>
                  <li>Enhanced dashboard analytics and insights</li>
                  <li>Improved error handling and retry mechanisms</li>
                  <li>Better mobile responsive design</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-orange-600 mb-2">🐛 Bug Fixes</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Fixed timeout issues with large datasets</li>
                  <li>Resolved memory leaks in long-running scrapers</li>
                  <li>Fixed CSV export formatting issues</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 2.0.5 */}
          <div className="border-l-2 border-muted pl-6">
            <h2 className="text-2xl font-semibold mb-2">Version 2.0.5</h2>
            <p className="text-sm text-muted-foreground mb-4">December 20, 2023</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-blue-600 mb-2">✨ Improvements</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Enhanced data validation and cleaning</li>
                  <li>Improved API rate limiting</li>
                  <li>Better documentation and examples</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-orange-600 mb-2">🐛 Bug Fixes</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Fixed pagination handling for large sites</li>
                  <li>Resolved authentication token refresh issues</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 2.0.0 */}
          <div className="border-l-2 border-muted pl-6">
            <h2 className="text-2xl font-semibold mb-2">Version 2.0.0</h2>
            <p className="text-sm text-muted-foreground mb-4">November 15, 2023</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-green-600 mb-2">🎉 Major Release</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Complete platform redesign with modern UI</li>
                  <li>Introduced team collaboration features</li>
                  <li>Advanced scheduling and automation</li>
                  <li>Enterprise-grade security and compliance</li>
                  <li>New pricing tiers and billing system</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
